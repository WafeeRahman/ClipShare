import {
  Client,
  GatewayIntentBits,
  Events,
  Attachment,
  Message,
  REST,
  Routes,
} from "discord.js";
import * as admin from "firebase-admin";
import http from "http";

import { uploadToRawBucket, downloadFromUrl } from "./storage";
import {
  initFirestore,
  saveVideoDetails,
  ensureNamespace,
  getNamespaceVideoCount,
} from "./firestore";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "clipshare-f3cec";
const PORT = parseInt(process.env.PORT || "8080", 10);
const BOT_EMAIL =
  process.env.BOT_EMAIL ||
  "clipbot-discord@clipshare-f3cec.iam.gserviceaccount.com";
const WEB_BASE_URL =
  process.env.WEB_BASE_URL || "https://clipshare-f3cec.web.app";

// Comma-separated list of channel IDs to watch. Empty = all channels.
const WATCH_CHANNELS = process.env.WATCH_CHANNELS
  ? new Set(process.env.WATCH_CHANNELS.split(",").map((c) => c.trim()))
  : null;

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
  if (
    attachment.contentType &&
    VIDEO_CONTENT_TYPES.has(attachment.contentType)
  ) {
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

function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext && VIDEO_EXTENSIONS.has(ext)) {
      return ext;
    }
  } catch {}
  return "mp4";
}

function generateShareId(documentId: string): string {
  return `${documentId.slice(-6)}-${Date.now().toString(36)}`;
}

// Regex to find video URLs in message text
const VIDEO_URL_REGEX =
  /https?:\/\/[^\s]+\.(?:mp4|mov|webm|avi|mkv|flv|wmv)(?:\?[^\s]*)?/gi;

async function handleVideoAttachment(
  attachment: Attachment,
  message: Message
): Promise<string> {
  const guildId = message.guildId!;
  const guildName = message.guild!.name;

  const ext = getExtension(attachment);
  const timestamp = Date.now();
  const fileName = `discord-${guildId}-${timestamp}.${ext}`;
  const documentId = `discord-${guildId}-${timestamp}`;

  console.log(
    `Processing attachment from ${message.author.tag} in ${guildName}: ${attachment.name}`
  );

  const buffer = await downloadFromUrl(attachment.url);
  await uploadToRawBucket(buffer, fileName);

  const namespaceId = await ensureNamespace(guildId, guildName, BOT_EMAIL);
  const shareId = generateShareId(documentId);

  await saveVideoDetails(documentId, {
    filename: fileName,
    title: attachment.name || `Discord clip ${timestamp}`,
    description: `Clipped by ${message.author.tag} in #${(message.channel as any).name || "unknown"}`,
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

  return shareId;
}

async function handleVideoUrl(
  url: string,
  message: Message
): Promise<string> {
  const guildId = message.guildId!;
  const guildName = message.guild!.name;

  const ext = getExtensionFromUrl(url);
  const timestamp = Date.now();
  const fileName = `discord-${guildId}-${timestamp}.${ext}`;
  const documentId = `discord-${guildId}-${timestamp}`;

  console.log(
    `Processing URL from ${message.author.tag} in ${guildName}: ${url}`
  );

  const buffer = await downloadFromUrl(url);
  await uploadToRawBucket(buffer, fileName);

  const namespaceId = await ensureNamespace(guildId, guildName, BOT_EMAIL);
  const shareId = generateShareId(documentId);

  await saveVideoDetails(documentId, {
    filename: fileName,
    title: `Clip from ${message.author.tag}`,
    description: `Clipped by ${message.author.tag} in #${(message.channel as any).name || "unknown"}`,
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

  return shareId;
}

async function registerSlashCommands(clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN!);

  const commands = [
    {
      name: "clipshare-link",
      description:
        "Get the ClipShare web URL for this server's video library",
    },
    {
      name: "clipshare-status",
      description: "Show how many clips have been saved from this server",
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
    if (!message.guildId || !message.guild) return;

    // Channel filtering
    if (WATCH_CHANNELS && !WATCH_CHANNELS.has(message.channelId)) return;

    const shareIds: string[] = [];

    // Handle file attachments
    const videoAttachments = message.attachments.filter(isVideoAttachment);
    for (const [, attachment] of videoAttachments) {
      try {
        const shareId = await handleVideoAttachment(attachment, message);
        shareIds.push(shareId);
      } catch (err) {
        console.error(
          `Failed to process attachment ${attachment.name}:`,
          err
        );
      }
    }

    // Handle video URLs in message text
    if (message.content) {
      const urls = message.content.match(VIDEO_URL_REGEX) || [];
      for (const url of urls) {
        try {
          const shareId = await handleVideoUrl(url, message);
          shareIds.push(shareId);
        } catch (err) {
          console.error(`Failed to process URL ${url}:`, err);
        }
      }
    }

    if (shareIds.length === 0) return;

    const links = shareIds
      .map((id) => `${WEB_BASE_URL}/clip/${id}`)
      .join("\n");

    const noun = shareIds.length === 1 ? "clip" : "clips";
    await message
      .reply(`Saved ${shareIds.length} ${noun} to ClipShare:\n${links}`)
      .catch(() => {});
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "clipshare-link") {
      const namespaceId = `discord-${guildId}`;
      const url = `${WEB_BASE_URL}/libraries?ns=${namespaceId}`;
      await interaction.reply(
        `ClipShare library for this server: ${url}`
      );
    }

    if (interaction.commandName === "clipshare-status") {
      const namespaceId = `discord-${guildId}`;
      try {
        const count = await getNamespaceVideoCount(namespaceId);
        await interaction.reply(
          `This server has **${count}** clips saved to ClipShare.`
        );
      } catch {
        await interaction.reply({
          content: "No clips saved yet from this server.",
          ephemeral: true,
        });
      }
    }
  });

  startHealthCheckServer();
  await client.login(DISCORD_BOT_TOKEN);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
