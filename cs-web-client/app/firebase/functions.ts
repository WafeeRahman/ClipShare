import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
const getVideosFunction = httpsCallable(functions, 'getVideos');
const getVideoByKeyFunction = httpsCallable(functions, 'getVideoByKey');
const saveVideoDetailsFunction = httpsCallable(functions, 'saveVideoDetails'); // Import saveVideoDetails

export interface Video {
  id?: string;
  uid?: string;
  filename?: string;
  status?: 'processing' | 'processed';
  title?: string;
  description?: string;
  key?: string;
}

export async function uploadVideo(file: File, title: string, description: string, key: string) {
  const response: any = await generateUploadUrlFunction({
    fileExtension: file.name.split('.').pop(),
  });

  const fileName = response?.data?.fileName;

  // Include 'fileName' in the data sent to the backend

  // Upload the file to the signed URL
  const uploadResult = await fetch(response?.data?.url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  await saveVideoDetailsFunction({
    filename: fileName,
    title,
    description,
    key,
  });

  return uploadResult;
}


export async function getVideos() {
  const response = await getVideosFunction();
  return response.data as Video[];
}

// New function to search videos by key
export async function getVideoByKey(key: string) {
  const response = await getVideoByKeyFunction({ key });
  return response.data as Video[];
}
