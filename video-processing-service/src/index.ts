import express from "express";
import ffmpeg from "fluent-ffmpeg";
const app = express();
app.use(express.json());


app.post("/process-video", (req, res) => { 
// Get path of the input video file from the req body
const inputFilePath = req.body.inputFilePath
const outputFilePath = req.body.outputFilePath;

if (!inputFilePath || !outputFilePath) {
  return res.status(400).send("BAD REQUEST: Input and output file paths are required");
}

ffmpeg(inputFilePath)
  .outputOptions("-vf", "scale=-1:360") // output files at 360p
  
  .on("end", () => {
    console.log("Processing finished");
    res.status(200).send("Video processed successfully.");
  })

  .on("error", (err) => {  
    console.log(`Error processing video: ${err.message}`);
    res.status(500).send(`Internal server error: ${err.message}`);

  })

  .save(outputFilePath);

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});