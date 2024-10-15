import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";
import { isVideoNew, setVideo } from "./firebase";

setupDirectories();

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
    let data;
    try {
        const message = Buffer.from(req.body.message.data, "base64").toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid Message Payload');
        }
    } catch (err) {
        console.error(err);
        return res.status(400).send('Invalid Message Payload');
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];

    if (!await isVideoNew(videoId)) {
        return res.status(400).send('Bad Request: Video has already been processed');
    } else {
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split("-")[0],
            status: 'processing',
        });
    }

    try {
        // Download Raw Video from Cloud
        await downloadRawVideo(inputFileName);

        // Convert video and generate thumbnail
        await convertVideo(inputFileName, outputFileName);

        // Upload processed video
        await uploadProcessedVideo(outputFileName);

        // Upload thumbnail
        const thumbnailFileName = `thumbnail-${outputFileName}.jpg`;
        await uploadProcessedVideo(thumbnailFileName);

        // Construct thumbnail URL
        const thumbnailUrl = `https://storage.googleapis.com/clipshare-processed-videos/${thumbnailFileName}`;

        // Update Firestore with video details and thumbnail URL
        await setVideo(videoId, {
            status: 'processed',
            filename: outputFileName,
            thumbnailUrl: thumbnailUrl,
        });

        // Clean up local files
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName),
            deleteProcessedVideo(thumbnailFileName),
        ]);

        return res.status(200).send('Video and Thumbnail Processed Successfully');
    } catch (err) {
        await Promise.all([deleteRawVideo(inputFileName), deleteProcessedVideo(outputFileName)]);
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
