const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const connection = new Redis();
connection.options.maxRetriesPerRequest = null;


// --- Helper to run ffmpeg with live logs ---
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args, { shell: true });

    // ff.stdout.on("data", (data) => {
    //   console.log(`[ffmpeg stdout]: ${data}`);
    // });

    // ff.stderr.on("data", (data) => {
    //   console.error(`[ffmpeg stderr]: ${data}`);
    // });

    ff.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

const worker = new Worker(
  "video_queue",
  async (job) => {
    const { filepath, formats } = job.data;

    if (!filepath) throw new Error("Job data missing filepath");

    // Absolute, normalized input file
    const inputFile = path.resolve(filepath).replace(/\\/g, "/");

    // Make output dir for this job
    const outputDir = path.join(process.cwd(), "outputs", job.id.toString());
    fs.mkdirSync(outputDir, { recursive: true });

    const outputFiles = [];

    // --- Generate MP4 if requested ---
    if (formats.includes("mp4")) {
      const mp4File = path.join(outputDir, "output.mp4");
      await job.updateProgress({ step: "Transcoding to mp4" })
      await runFFmpeg([
        "-i", inputFile,
        "-c:v", "libx264",
        "-c:a", "aac",
        mp4File
      ]);
      outputFiles.push({ format: "mp4", path: mp4File });
    }

    // --- Generate HLS renditions ---
    const hlsFormats = formats.filter((f) => f.endsWith("p"));
    for (const res of hlsFormats) {
      const height = res.replace("p", "");
      const hlsDir = path.join(outputDir, `hls_${res}`);
      fs.mkdirSync(hlsDir, { recursive: true });

      const hlsFile = path.join(hlsDir, "index.m3u8");
      await job.updateProgress({ step: `starting transcoding of ${res} resolution` })
      await runFFmpeg([
        "-i", inputFile,
        "-vf", `scale=-2:${height}`,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        hlsFile
      ]);

      outputFiles.push({ format: `hls_${res}`, path: hlsDir });
    }

    // --- Generate Master Playlist ---
    if (hlsFormats.length > 0) {
      await job.updateProgress({ step: "Transcoding completed generating .m3u8 playlist" })
      const masterPlaylistPath = path.join(outputDir, "master.m3u8");
      let masterContent = "#EXTM3U\n";

      for (const res of hlsFormats) {
        const height = res.replace("p", "");
        let bandwidth;

        switch (height) {
          case "360": bandwidth = 800000; break;
          case "480": bandwidth = 1000000; break;
          case "720": bandwidth = 1400000; break;
          case "1080": bandwidth = 2800000; break;
          case "2160": bandwidth = 8000000; break; // 4K
          default: bandwidth = 500000;
        }

        masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=1280x${height}\n`;
        masterContent += `hls_${res}/index.m3u8\n`;
      }

      fs.writeFileSync(masterPlaylistPath, masterContent, "utf8");
      outputFiles.push({ format: "hls_master", path: masterPlaylistPath });
    }

    // console.log(outputDir)
    // console.log(outputFiles)
    return { outputDir, outputFiles };
  },
  { connection }
);

console.log("running worker.js script")