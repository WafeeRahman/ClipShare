import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { Storage } from "@google-cloud/storage";
import { onCall } from "firebase-functions/v2/https";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();
const rawVideoBucketName = 'clipshare-raw-videos';

const videoCollectionId = "videos";

export interface Video {
  id?: string;
  uid?: string;
  filename?: string;
  status?: "processing" | "processed";
  title?: string;
  description?: string;
  key?: string;
}

// Fetch the latest videos
export const getVideos = onCall({ maxInstances: 1 }, async () => {
  const querySnapshot = await firestore.collection(videoCollectionId).limit(100).get();
  return querySnapshot.docs.map((doc) => doc.data());
});

export const getVideoByKey = onCall({ maxInstances: 1 }, async (request) => {
  const searchKey = request.data.key;

  if (!searchKey) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The search key is required."
    );
  }

  const querySnapshot = await firestore
    .collection(videoCollectionId)
    .where("key", "==", searchKey)
    .get();

  if (querySnapshot.empty) {
    return { videos: [] }; // Return an empty array if no videos are found
  }

  const videos = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()  // Include the id and video data in the response
  }));

  return { videos }; // Return videos array in the response
});

// Create a new user on Firebase Auth creation
export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
    keys: [],
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

// Generate a signed URL for video upload
export const generateUploadUrl = onCall({ maxInstances: 1 }, async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  // Generate a unique filename for upload
  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  // Get a v4 signed URL for uploading the file
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return { url, fileName };
});

export const saveVideoDetails = onCall({ maxInstances: 1 }, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const videoData = request.data;

  // Validate required fields
  if (!videoData.filename) {
    throw new functions.https.HttpsError('invalid-argument', 'Filename is required');
  }

  // Extract the document ID from the filename
  const filename = videoData.filename;
  const dotIndex = filename.lastIndexOf(".");
  const documentId = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;

  // Create a reference to the Firestore document using the document ID
  const videoRef = firestore.collection(videoCollectionId).doc(documentId);

  // Set or merge video details in Firestore
  await videoRef.set(
    {
      ...videoData,
    },
    { merge: true }
  );

  return { success: true, id: videoRef.id }; // Return success and the document ID
});
