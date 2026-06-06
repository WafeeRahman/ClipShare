import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { Storage } from "@google-cloud/storage";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();
const rawVideoBucketName = "clipshare-raw-videos";

const videoCollectionId = "videos";
const whitelistCollectionId = "whitelist";
const namespacesCollectionId = "namespaces";

export interface Video {
  id?: string;
  uid?: string;
  filename?: string;
  status?: "processing" | "processed";
  title?: string;
  description?: string;
  key?: string;
  thumbnailUrl?: string;
  namespace?: string;
  shareId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isWhitelisted(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const doc = await firestore
    .collection(whitelistCollectionId)
    .doc(email)
    .get();
  return doc.exists;
}

async function requireWhitelistedUser(request: any) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  const email = request.auth.token?.email;
  if (!(await isWhitelisted(email))) {
    throw new HttpsError(
      "permission-denied",
      "Your account is not approved. Contact an admin."
    );
  }
  return request.auth;
}

// ---------------------------------------------------------------------------
// Whitelist management
// ---------------------------------------------------------------------------

export const checkWhitelist = onCall({ maxInstances: 1 }, async (request) => {
  if (!request.auth) {
    return { allowed: false };
  }
  const email = request.auth.token?.email;
  const allowed = await isWhitelisted(email);
  return { allowed };
});

export const addToWhitelist = onCall({ maxInstances: 1 }, async (request) => {
  await requireWhitelistedUser(request);
  const email: string = request.data?.email;
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "A valid email is required.");
  }
  await firestore.collection(whitelistCollectionId).doc(email).set({
    email,
    addedBy: request.auth!.token?.email,
    addedAt: Date.now(),
  });
  return { success: true };
});

export const removeFromWhitelist = onCall(
  { maxInstances: 1 },
  async (request) => {
    await requireWhitelistedUser(request);
    const email: string = request.data?.email;
    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }
    await firestore.collection(whitelistCollectionId).doc(email).delete();
    return { success: true };
  }
);

export const getWhitelist = onCall({ maxInstances: 1 }, async (request) => {
  await requireWhitelistedUser(request);
  const snapshot = await firestore.collection(whitelistCollectionId).get();
  return snapshot.docs.map((d) => d.data());
});

// ---------------------------------------------------------------------------
// Namespace / Library management
// ---------------------------------------------------------------------------

export const createNamespace = onCall({ maxInstances: 1 }, async (request) => {
  const auth = await requireWhitelistedUser(request);
  const name: string = request.data?.name?.trim();
  if (!name || name.length < 2 || name.length > 40) {
    throw new HttpsError(
      "invalid-argument",
      "Namespace name must be 2-40 characters."
    );
  }

  const id = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const existing = await firestore
    .collection(namespacesCollectionId)
    .doc(id)
    .get();
  if (existing.exists) {
    throw new HttpsError("already-exists", "Namespace already exists.");
  }

  const ns = {
    id,
    name,
    ownerUid: auth.uid,
    ownerEmail: auth.token?.email,
    members: [auth.token?.email],
    createdAt: Date.now(),
  };
  await firestore.collection(namespacesCollectionId).doc(id).set(ns);
  return ns;
});

export const addNamespaceMember = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const { namespaceId, email } = request.data ?? {};
    if (!namespaceId || !email) {
      throw new HttpsError(
        "invalid-argument",
        "namespaceId and email are required."
      );
    }
    const nsRef = firestore
      .collection(namespacesCollectionId)
      .doc(namespaceId);
    const nsDoc = await nsRef.get();
    if (!nsDoc.exists) {
      throw new HttpsError("not-found", "Namespace not found.");
    }
    if (nsDoc.data()?.ownerUid !== auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Only the owner can add members."
      );
    }
    const members: string[] = nsDoc.data()?.members ?? [];
    if (!members.includes(email)) {
      members.push(email);
      await nsRef.update({ members });
    }
    return { success: true, members };
  }
);

export const removeNamespaceMember = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const { namespaceId, email } = request.data ?? {};
    if (!namespaceId || !email) {
      throw new HttpsError(
        "invalid-argument",
        "namespaceId and email are required."
      );
    }
    const nsRef = firestore
      .collection(namespacesCollectionId)
      .doc(namespaceId);
    const nsDoc = await nsRef.get();
    if (!nsDoc.exists) {
      throw new HttpsError("not-found", "Namespace not found.");
    }
    if (nsDoc.data()?.ownerUid !== auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Only the owner can remove members."
      );
    }
    const members: string[] = (nsDoc.data()?.members ?? []).filter(
      (m: string) => m !== email
    );
    await nsRef.update({ members });
    return { success: true, members };
  }
);

export const getMyNamespaces = onCall({ maxInstances: 1 }, async (request) => {
  const auth = await requireWhitelistedUser(request);
  const email = auth.token?.email;
  const snapshot = await firestore
    .collection(namespacesCollectionId)
    .where("members", "array-contains", email)
    .get();
  return snapshot.docs.map((d) => d.data());
});

export const getNamespaceVideos = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const namespaceId: string = request.data?.namespaceId;
    if (!namespaceId) {
      throw new HttpsError("invalid-argument", "namespaceId is required.");
    }
    const nsDoc = await firestore
      .collection(namespacesCollectionId)
      .doc(namespaceId)
      .get();
    if (!nsDoc.exists) {
      throw new HttpsError("not-found", "Namespace not found.");
    }
    const members: string[] = nsDoc.data()?.members ?? [];
    const email = auth.token?.email;
    if (!email || !members.includes(email)) {
      throw new HttpsError(
        "permission-denied",
        "You are not a member of this namespace."
      );
    }
    const snapshot = await firestore
      .collection(videoCollectionId)
      .where("namespace", "==", namespaceId)
      .limit(200)
      .get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
);

// ---------------------------------------------------------------------------
// Shareable video link (public — no auth required)
// ---------------------------------------------------------------------------

export const getVideoByShareId = onCall(
  { maxInstances: 1 },
  async (request) => {
    const shareId: string = request.data?.shareId;
    if (!shareId) {
      throw new HttpsError("invalid-argument", "shareId is required.");
    }
    const snapshot = await firestore
      .collection(videoCollectionId)
      .where("shareId", "==", shareId)
      .limit(1)
      .get();
    if (snapshot.empty) {
      throw new HttpsError("not-found", "Video not found.");
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
);

// ---------------------------------------------------------------------------
// Core video functions (with whitelist gating)
// ---------------------------------------------------------------------------

export const getVideos = onCall({ maxInstances: 1 }, async (request) => {
  await requireWhitelistedUser(request);
  const querySnapshot = await firestore
    .collection(videoCollectionId)
    .limit(100)
    .get();
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const getVideoByKey = onCall({ maxInstances: 1 }, async (request) => {
  await requireWhitelistedUser(request);
  const searchKey = request.data.key;

  if (!searchKey) {
    throw new HttpsError("invalid-argument", "The search key is required.");
  }

  const querySnapshot = await firestore
    .collection(videoCollectionId)
    .where("key", "==", searchKey)
    .get();

  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
});

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadUrl = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const data = request.data;
    const bucket = storage.bucket(rawVideoBucketName);

    const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

    const [url] = await bucket.file(fileName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return { url, fileName };
  }
);

export const saveVideoDetails = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const videoData = request.data;

    if (!videoData.filename) {
      throw new HttpsError("invalid-argument", "Filename is required");
    }

    const filename = videoData.filename;
    const dotIndex = filename.lastIndexOf(".");
    const documentId =
      dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;

    // Generate a short shareId for shareable links
    const shareId = `${documentId.slice(-6)}-${Date.now().toString(36)}`;

    const videoRef = firestore.collection(videoCollectionId).doc(documentId);

    await videoRef.set(
      {
        ...videoData,
        uid: auth.uid,
        shareId,
        namespace: videoData.namespace || null,
      },
      { merge: true }
    );

    return { success: true, id: videoRef.id, shareId };
  }
);

// ---------------------------------------------------------------------------
// Namespace invites
// ---------------------------------------------------------------------------

export const generateNamespaceInvite = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const namespaceId: string = request.data?.namespaceId;
    if (!namespaceId) {
      throw new HttpsError("invalid-argument", "namespaceId is required.");
    }
    const nsDoc = await firestore
      .collection(namespacesCollectionId)
      .doc(namespaceId)
      .get();
    if (!nsDoc.exists) {
      throw new HttpsError("not-found", "Namespace not found.");
    }
    if (nsDoc.data()?.ownerUid !== auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Only the owner can generate invites."
      );
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let inviteCode = "";
    for (let i = 0; i < 8; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    await firestore.collection("namespace-invites").doc(inviteCode).set({
      inviteCode,
      namespaceId,
      createdBy: auth.token?.email,
      createdAt: Date.now(),
      uses: 0,
    });
    return { inviteCode };
  }
);

export const joinNamespaceByInvite = onCall(
  { maxInstances: 1 },
  async (request) => {
    const auth = await requireWhitelistedUser(request);
    const inviteCode: string = request.data?.inviteCode;
    if (!inviteCode) {
      throw new HttpsError("invalid-argument", "inviteCode is required.");
    }
    const inviteRef = firestore.collection("namespace-invites").doc(inviteCode);
    const inviteDoc = await inviteRef.get();
    if (!inviteDoc.exists) {
      throw new HttpsError("not-found", "Invite not found.");
    }
    const inviteData = inviteDoc.data()!;
    const nsRef = firestore
      .collection(namespacesCollectionId)
      .doc(inviteData.namespaceId);
    const nsDoc = await nsRef.get();
    if (!nsDoc.exists) {
      throw new HttpsError("not-found", "Namespace not found.");
    }
    const email = auth.token?.email;
    const members: string[] = nsDoc.data()?.members ?? [];
    if (!members.includes(email)) {
      members.push(email);
      await nsRef.update({ members });
    }
    await inviteRef.update({ uses: (inviteData.uses ?? 0) + 1 });
    return { success: true, namespaceName: nsDoc.data()?.name };
  }
);

// ---------------------------------------------------------------------------
// Whitelist access requests
// ---------------------------------------------------------------------------

export const requestWhitelistAccess = onCall(
  { maxInstances: 1 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    const email = request.auth.token?.email;
    if (!email) {
      throw new HttpsError("invalid-argument", "No email associated with account.");
    }
    await firestore.collection("whitelist-requests").doc(email).set({
      email,
      uid: request.auth.uid,
      requestedAt: Date.now(),
      status: "pending",
    });
    return { success: true };
  }
);

export const getWhitelistRequests = onCall(
  { maxInstances: 1 },
  async (request) => {
    await requireWhitelistedUser(request);
    const snapshot = await firestore
      .collection("whitelist-requests")
      .where("status", "==", "pending")
      .get();
    return snapshot.docs.map((d) => d.data());
  }
);

export const approveWhitelistRequest = onCall(
  { maxInstances: 1 },
  async (request) => {
    await requireWhitelistedUser(request);
    const email: string = request.data?.email;
    if (!email) {
      throw new HttpsError("invalid-argument", "email is required.");
    }
    const reqRef = firestore.collection("whitelist-requests").doc(email);
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) {
      throw new HttpsError("not-found", "Request not found.");
    }
    await firestore.collection(whitelistCollectionId).doc(email).set({
      email,
      addedBy: request.auth!.token?.email,
      addedAt: Date.now(),
    });
    await reqRef.update({ status: "approved" });
    return { success: true };
  }
);

export const denyWhitelistRequest = onCall(
  { maxInstances: 1 },
  async (request) => {
    await requireWhitelistedUser(request);
    const email: string = request.data?.email;
    if (!email) {
      throw new HttpsError("invalid-argument", "email is required.");
    }
    const reqRef = firestore.collection("whitelist-requests").doc(email);
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) {
      throw new HttpsError("not-found", "Request not found.");
    }
    await reqRef.update({ status: "denied" });
    return { success: true };
  }
);
