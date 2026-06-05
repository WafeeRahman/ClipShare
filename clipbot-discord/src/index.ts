import {
  Client,
  GatewayIntentBits,
  Events,
  Attachment,
  Message,
  REST,
  Routes,
  ChatInputCommandInteraction,
} from "discord.js";
import * as admin from "firebase-admin";
import http from "http";

import { uploadToRawBucket, downloadFromUrl } from "./storage";
import {
  initFirestore,
  saveVideoDetails,
  ensureNamespace,
} from "./firestore";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "clipshare-f3cec";
const PORT = parseInt(process.env.PORT || "8080", 10);
const BOT_EMAIL = "clipbot-discord@clipshare-f3cec.iam.gserviceaccount.com";
const WEB_BASE_URL = "https://clipshare-f3cec.web.app";

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "webm",
  "avi",
  "mkv",
  "flv",
  "wmv",
]);

const VIDEO_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-flv",
  "video/x-ms-wmv",
]);

function isVideoAttachment(attachment: Attachment): boolean {
  if (attachment.contentType && VIDEO_CONTENT_TYPES.has(attachment.contentType)) {
    return true;
  }
  const ext = attachment.name?.split(".").pop()?.toLowerCase();
  return ext !== undefined && VIDEO_EXTENSIONS.has(ext);
}

function getExtension(attachment: Attachment): string {
  const ext = attachment.name?.split(".").pop()?.toLowerCase();
  if (ext && VIDEO_EXTENSIONS.has(ext)) {
    return ext;
  }
  return "mp4";
}

function generateShareId(documentId: string): string {
  return `${documentId.slice(-6)}-${Date.now().toString(36)}`;
}

async function handleVideoAttachment(
  attachment: Attachment,
  message: Message
): Promise<void> {
  const guildId = message.guildId;
  const guildName = message.guild?.name;
  if (!guildId || !guildName) {
    console.log("Message is not from a guild, skipping.");
    return;
  }

  const ext = getExtension(attachment);
  const timestamp = Date.now();
  const fileName = `discord-${guildId}-${timestamp}.${ext}`;
  const documentId = `discord-${guildId}-${timestamp}`;

  console.log(
    `Processing video from ${message.author.tag} in ${guildName}: ${attachment.name}`
  );

  const buffer = await downloadFromUrl(attachment.url);

  await uploadToRawBucket(buffer, fileName);

  const namespaceId = await ensureNamespace(guildId, guildName, BOT_EMAIL);

  const shareId = generateShareId(documentId);

  await saveVideoDetails(documentId, {
    filename: fileName,
    title: attachment.name || `Discord clip ${timestamp}`,
    status: "processing",
    namespace: namespaceId,
    shareId,
    uid: `discord-bot-${guildId}`,
    sourceType: "discord",
    discordGuildId: guildId,
    discordChannelId: message.channelId,
    discordMessageId: message.id,
    discordAuthor: message.author.tag,
    createdAt: timestamp,
  });

  await message.reply(
    `Video uploaded to ClipShare. View it at: ${WEB_BASE_URL}/clip/${shareId}`
  );
}

async function registerSlashCommands(clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN!);

  const commands = [
    {
      name: "clipshare-link",
      description:
        "Get the ClipShare web URL for this server's video library",
    },
  ];

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log("Registered slash commands.");
}

function startHealthCheckServer(): void {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  });

  server.listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
  });
}

async function main(): Promise<void> {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN environment variable is required");
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: GCP_PROJECT_ID,
  });
  initFirestore();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    await registerSlashCommands(readyClient.user.id);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const videoAttachments = message.attachments.filter(isVideoAttachment);
    if (videoAttachments.size === 0) return;

    for (const [, attachment] of videoAttachments) {
      try {
        await handleVideoAttachment(attachment, message);
      } catch (err) {
        console.error(`Failed to process attachment ${attachment.name}:`, err);
        await message
          .reply("Failed to upload this video to ClipShare. Please try again.")
          .catch(() => {});
      }
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "clipshare-link") {
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply({
          content: "This command can only be used in a server.",
          ephemeral: true,
        });
        return;
      }

      const namespaceId = `discord-${guildId}`;
      const url = `${WEB_BASE_URL}/libraries?ns=${namespaceId}`;
      await interaction.reply(
        `ClipShare library for this server: ${url}`
      );
    }
  });

  startHealthCheckServer();
  await client.login(DISCORD_BOT_TOKEN);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
