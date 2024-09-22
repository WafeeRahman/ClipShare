import { Storage } from '@google-cloud/storage';
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg';


const storage = new Storage();
const rawVideoBucketName = 'clipshare-raw-videos';
const processedVideoBucketName = 'clipshare-processed-videos';

const localRawVideoPath = './raw-videos';
const localProcessedVideoPath = './processed-videos';


/**
 * Creates local directories for raw videos and processed videos respectively
 */
export function setupDirectories() {

}


/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {

    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360") // output files at 360p

            .on("end", () => {
                console.log("Processing finished");
                console.log("Video processed successfully.");
                resolve();
            })

            .on("error", (err) => {
                console.log(`Error processing video: ${err.message}`);
                reject(`Internal server error: ${err.message}`);

            })

            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    })

}

/**
 * @param fileName - The name of the file to download from the 
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}` });

    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
    );

}




/**
 * @param fileName - The name of the file to upload from the 
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */
export async function uploadProcessedVideo(fileName: string) {

    const bucket = storage.bucket(processedVideoBucketName);

    //Upload Video to Bucket
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName,
    });

    console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`)
    
    //Make Video Public
    await bucket.file(fileName).makePublic();



}

/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {

    return new Promise((resolve, reject) => {


        
    });

}