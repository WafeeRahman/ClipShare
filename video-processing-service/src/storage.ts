import { Storage } from '@google-cloud/storage';
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg';


const storage = new Storage();
const rawVideoBucketName = 'clipshare-raw-videos';
const processedVideoBucketName = 'clipshare-processed-videos';

const localRawVideoPath = './raw-videos';
const localProcessedVideoPath = './processed-videos';


/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string) {
    // Check if a dir exists, create it if it doesn't
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // recursive: true enables creating nested directories
        console.log(`Directory created at ${dirPath}`);
    }
}

/**
 * Creates local directories for raw videos and processed videos respectively
 */
export function setupDirectories() {

    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);

}


/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const inputPath = `${localRawVideoPath}/${rawVideoName}`;
        const outputPath = `${localProcessedVideoPath}/${processedVideoName}`;
        const thumbnailName = `thumbnail-${processedVideoName}.jpg`;
        const thumbnailPath = `${localProcessedVideoPath}/${thumbnailName}`;

        // Process video
        ffmpeg(inputPath)
            .outputOptions("-vf", "scale=-1:360") // output files at 360p
            .on("end", () => {
                console.log("Video processed successfully.");

                // Generate thumbnail after video processing
                ffmpeg(inputPath)
                    .screenshots({
                        timestamps: ['00:00:01'],  // Capture at 1 second
                        filename: thumbnailName,
                        folder: localProcessedVideoPath,
                        size: '320x240',
                    })
                    .on('end', () => {
                        console.log('Thumbnail generated successfully.');
                        resolve();
                    })
                    .on('error', (err) => {
                        console.log(`Error generating thumbnail: ${err.message}`);
                        reject(`Error generating thumbnail: ${err.message}`);
                    });
            })
            .on("error", (err) => {
                console.log(`Error processing video: ${err.message}`);
                reject(`Internal server error: ${err.message}`);
            })
            .save(outputPath);
    });
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

    // Upload the file
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName,
    });

    console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`);

    // Make the file public
    await bucket.file(fileName).makePublic();
}





/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {

    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Error deleting file: ${err.message}`);
                    reject(err);
                }
                else {
                    console.log(`File deleted: ${filePath}`);
                    resolve();
                }
            });
        }
        else {
            console.log(`File not found at: ${filePath}, discarding request`)
            resolve();
        }


    });

}



/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 * 
 */
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}


/**
* @param fileName - The name of the file to delete from the
* {@link localProcessedVideoPath} folder.
* @returns A promise that resolves when the file has been deleted.
* 
*/
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}



