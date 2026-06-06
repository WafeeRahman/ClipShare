import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const generateUploadUrlFunction = httpsCallable(functions, "generateUploadUrl");
const getVideosFunction = httpsCallable(functions, "getVideos");
const getVideoByKeyFunction = httpsCallable(functions, "getVideoByKey");
const saveVideoDetailsFunction = httpsCallable(functions, "saveVideoDetails");
const checkWhitelistFunction = httpsCallable(functions, "checkWhitelist");
const addToWhitelistFunction = httpsCallable(functions, "addToWhitelist");
const removeFromWhitelistFunction = httpsCallable(functions, "removeFromWhitelist");
const getWhitelistFunction = httpsCallable(functions, "getWhitelist");
const createNamespaceFunction = httpsCallable(functions, "createNamespace");
const addNamespaceMemberFunction = httpsCallable(functions, "addNamespaceMember");
const removeNamespaceMemberFunction = httpsCallable(functions, "removeNamespaceMember");
const getMyNamespacesFunction = httpsCallable(functions, "getMyNamespaces");
const getNamespaceVideosFunction = httpsCallable(functions, "getNamespaceVideos");
const getVideoByShareIdFunction = httpsCallable(functions, "getVideoByShareId");
const generateNamespaceInviteFunction = httpsCallable(functions, "generateNamespaceInvite");
const joinNamespaceByInviteFunction = httpsCallable(functions, "joinNamespaceByInvite");
const requestWhitelistAccessFunction = httpsCallable(functions, "requestWhitelistAccess");
const getWhitelistRequestsFunction = httpsCallable(functions, "getWhitelistRequests");
const approveWhitelistRequestFunction = httpsCallable(functions, "approveWhitelistRequest");
const denyWhitelistRequestFunction = httpsCallable(functions, "denyWhitelistRequest");

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

export interface Namespace {
  id: string;
  name: string;
  ownerUid: string;
  ownerEmail: string;
  members: string[];
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Whitelist
// ---------------------------------------------------------------------------

export async function checkWhitelist(): Promise<boolean> {
  const response: any = await checkWhitelistFunction();
  return response.data?.allowed === true;
}

export async function addToWhitelist(email: string) {
  await addToWhitelistFunction({ email });
}

export async function removeFromWhitelist(email: string) {
  await removeFromWhitelistFunction({ email });
}

export async function getWhitelistEntries(): Promise<{ email: string; addedBy: string; addedAt: number }[]> {
  const response: any = await getWhitelistFunction();
  return response.data as any[];
}

export async function requestWhitelistAccess(): Promise<void> {
  await requestWhitelistAccessFunction();
}

export async function getWhitelistRequests(): Promise<{ email: string; uid: string; requestedAt: number; status: string }[]> {
  const response: any = await getWhitelistRequestsFunction();
  return response.data as any[];
}

export async function approveWhitelistRequest(email: string): Promise<void> {
  await approveWhitelistRequestFunction({ email });
}

export async function denyWhitelistRequest(email: string): Promise<void> {
  await denyWhitelistRequestFunction({ email });
}

// ---------------------------------------------------------------------------
// Namespaces
// ---------------------------------------------------------------------------

export async function createNamespace(name: string): Promise<Namespace> {
  const response: any = await createNamespaceFunction({ name });
  return response.data as Namespace;
}

export async function addNamespaceMember(namespaceId: string, email: string) {
  const response: any = await addNamespaceMemberFunction({ namespaceId, email });
  return response.data;
}

export async function removeNamespaceMember(namespaceId: string, email: string) {
  const response: any = await removeNamespaceMemberFunction({ namespaceId, email });
  return response.data;
}

export async function getMyNamespaces(): Promise<Namespace[]> {
  const response: any = await getMyNamespacesFunction();
  return response.data as Namespace[];
}

export async function getNamespaceVideos(namespaceId: string): Promise<Video[]> {
  const response: any = await getNamespaceVideosFunction({ namespaceId });
  return response.data as Video[];
}

export async function generateNamespaceInvite(namespaceId: string): Promise<{ inviteCode: string }> {
  const response: any = await generateNamespaceInviteFunction({ namespaceId });
  return response.data as { inviteCode: string };
}

export async function joinNamespaceByInvite(inviteCode: string): Promise<{ success: boolean; namespaceName: string }> {
  const response: any = await joinNamespaceByInviteFunction({ inviteCode });
  return response.data as { success: boolean; namespaceName: string };
}

// ---------------------------------------------------------------------------
// Shareable links
// ---------------------------------------------------------------------------

export async function getVideoByShareId(shareId: string): Promise<Video> {
  const response: any = await getVideoByShareIdFunction({ shareId });
  return response.data as Video;
}

// ---------------------------------------------------------------------------
// Core video functions
// ---------------------------------------------------------------------------

export async function uploadVideo(
  file: File,
  title: string,
  description: string,
  key: string,
  namespace?: string
) {
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split(".").pop(),
  });

  const fileName = response?.data?.fileName;

  await fetch(response?.data?.url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  const saveResponse: any = await saveVideoDetailsFunction({
    filename: fileName,
    title,
    description,
    key,
    namespace: namespace || null,
  });

  return { fileName, shareId: saveResponse?.data?.shareId };
}

export async function getVideos(): Promise<Video[]> {
  const response = await getVideosFunction();
  return response.data as Video[];
}

export async function getVideoByKey(key: string): Promise<Video[]> {
  const response = await getVideoByKeyFunction({ key });
  return response.data as Video[];
}
