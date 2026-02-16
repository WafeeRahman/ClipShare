import { Metadata } from "next";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin for server-side metadata generation
// In production this uses Application Default Credentials
function getAdminFirestore() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: "clipshare-f3cec",
    });
  }
  return getFirestore();
}

const VIDEO_PREFIX =
  "https://storage.googleapis.com/clipshare-processed-videos/";

export async function generateMetadata({
  params,
}: {
  params: { shareId: string };
}): Promise<Metadata> {
  const shareId = params.shareId;

  try {
    const firestore = getAdminFirestore();
    const snapshot = await firestore
      .collection("videos")
      .where("shareId", "==", shareId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { title: "ClipShare - Video Not Found" };
    }

    const video = snapshot.docs[0].data();
    const videoUrl = VIDEO_PREFIX + (video.filename || "");
    const thumbUrl = video.thumbnailUrl || "";

    return {
      title: `${video.title || "Clip"} - ClipShare`,
      description: video.description || "Watch this clip on ClipShare",
      openGraph: {
        title: video.title || "ClipShare Clip",
        description: video.description || "Watch this clip on ClipShare",
        type: "video.other",
        siteName: "ClipShare",
        images: thumbUrl ? [{ url: thumbUrl, width: 320, height: 240 }] : [],
        videos: [
          {
            url: videoUrl,
            width: 640,
            height: 360,
            type: "video/mp4",
          },
        ],
      },
      twitter: {
        card: "player",
        title: video.title || "ClipShare Clip",
        description: video.description || "Watch this clip on ClipShare",
        images: thumbUrl ? [thumbUrl] : [],
      },
      other: {
        // Discord reads og: tags and also these for video embeds
        "og:video": videoUrl,
        "og:video:type": "video/mp4",
        "og:video:width": "640",
        "og:video:height": "360",
      },
    };
  } catch {
    return { title: "ClipShare" };
  }
}

export default function ClipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
