const { videoQueue } = require("../queue_workers/queue");
const path = require("path");

const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    // Make it absolute
    const filepath = path.resolve(req.file.path);
    console.log(filepath)

    console.log("Uploading file:", filepath);

    const formats = ["mp4", "360p", "720p", "1080p"];

    const job = await videoQueue.add("transcode", { filepath, formats });

    res.json({ jobId: job.id, message: "Video uploaded and queued" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

module.exports = { uploadVideo };
