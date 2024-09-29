import express from "express";
import ffmpeg from "fluent-ffmpeg";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";
import { isVideoNew, setVideo } from "./firebase";

setupDirectories();

const app = express();
app.use(express.json());


app.post("/process-video", async (req, res) => {

  //Take bucket and filename from Cloud Pub/Sub message, Check if the message is valid
  //If the message is valid, download the raw video from the Cloud Storage bucket

  let data;
  try {
    const message = Buffer.from(req.body.message.data, "base64").toString('utf8');
    data = JSON.parse(message);
    if (!data.name) {
      //Throw an error if theres no file name
      throw new Error('Invalid Message Payload')
    }
  } catch (err) {
    console.error(err);
    return res.status(400).send('Invalid Message Payload');
  }

  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`;
  const videoId = inputFileName.split('.')[0];
  if (!isVideoNew(videoId)) {
    return res.status(400).send('Bad Request: Video has already been processed');
  } else {
    await setVideo(videoId, {
      id: videoId,
      uid: videoId.split("-")[0],
      status: 'processing'
    });
  }

  await setVideo(videoId,
    {
      status: 'processed',
      filename: outputFileName
    });


  // Download Raw Video from Cloud
  await downloadRawVideo(inputFileName);

  //Upload the processed vixdeo to Cloud Storage
  try {
    await convertVideo(inputFileName, outputFileName);
  } catch (err) {
    await Promise.all([deleteRawVideo(inputFileName), deleteProcessedVideo(outputFileName)])
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }


  await uploadProcessedVideo(outputFileName);
  await Promise.all([deleteRawVideo(inputFileName), deleteProcessedVideo(outputFileName)]);

  return res.status(200).send('Video Processed Successfully');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});