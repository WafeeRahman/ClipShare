import * as admin from "firebase-admin";

const VIDEOS_COLLECTION = "videos";
const NAMESPACES_COLLECTION = "namespaces";

let db: admin.firestore.Firestore;

export function initFirestore(): admin.firestore.Firestore {
  db = admin.firestore();
  return db;
}

export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    throw new Error("Firestore not initialized. Call initFirestore() first.");
  }
  return db;
}

export interface VideoDetails {
  filename: string;
  title: string;
  status: "processing" | "processed";
  namespace: string;
  shareId: string;
  uid: string;
  sourceType: "discord";
  discordGuildId: string;
  discordChannelId: string;
  discordMessageId: string;
  discordAuthor: string;
  createdAt: number;
}

export async function saveVideoDetails(
  videoId: string,
  data: Partial<VideoDetails>
): Promise<void> {
  const db = getFirestore();
  await db
    .collection(VIDEOS_COLLECTION)
    .doc(videoId)
    .set(data, { merge: true });

  console.log(`Saved video details for ${videoId}`);
}

export async function ensureNamespace(
  guildId: string,
  guildName: string,
  botEmail: string
): Promise<string> {
  const db = getFirestore();
  const namespaceId = `discord-${guildId}`;
  const nsRef = db.collection(NAMESPACES_COLLECTION).doc(namespaceId);
  const nsDoc = await nsRef.get();

  if (!nsDoc.exists) {
    await nsRef.set({
      id: namespaceId,
      name: guildName,
      ownerEmail: botEmail,
      members: [botEmail],
      createdAt: Date.now(),
      sourceType: "discord",
      discordGuildId: guildId,
    });
    console.log(`Created namespace ${namespaceId} for guild "${guildName}"`);
  }

  return namespaceId;
}

export async function addNamespaceMember(
  namespaceId: string,
  email: string
): Promise<void> {
  const db = getFirestore();
  const nsRef = db.collection(NAMESPACES_COLLECTION).doc(namespaceId);
  const nsDoc = await nsRef.get();

  if (!nsDoc.exists) {
    throw new Error(`Namespace ${namespaceId} not found`);
  }

  const members: string[] = nsDoc.data()?.members ?? [];
  if (!members.includes(email)) {
    members.push(email);
    await nsRef.update({ members });
    console.log(`Added ${email} to namespace ${namespaceId}`);
  }
}
