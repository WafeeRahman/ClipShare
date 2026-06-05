import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const RAW_BUCKET_NAME = "clipshare-raw-videos";

export async function uploadToRawBucket(
  buffer: Buffer,
  fileName: string
): Promise<void> {
  const bucket = storage.bucket(RAW_BUCKET_NAME);
  const file = bucket.file(fileName);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: getContentType(fileName),
    },
  });

  console.log(`Uploaded ${fileName} to gs://${RAW_BUCKET_NAME}/${fileName}`);
}

export async function downloadFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",
  };
  return types[ext || ""] || "video/mp4";
}
