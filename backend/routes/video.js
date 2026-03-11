import express from "express";
import torrentStream from "torrent-stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { ApiRoutes } from "../config/resourceNames.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();
const activeEngines = {};
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

console.log("✅ FFmpeg path automatically set to:", ffmpegInstaller.path);

router.get(ApiRoutes.Stream, (req, res) => {
  const magnetHash = req.params.id;
  const magnetLink = `magnet:?xt=urn:btih:${magnetHash}`;
  // const magnetLink =
  // ("magnet:?xt=urn:btih:6983084B663C9996F1905001E8C1033D22744799");

  // 1. Set Headers for CORS/CORP immediately
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");

  if (!activeEngines[magnetHash]) {
    activeEngines[magnetHash] = torrentStream(magnetLink, {
      path: "./downloads",
      trackers: [
        "udp://tracker.leechers-paradise.org:6969",
        "udp://tracker.coppersurfer.tk:6969",
        "udp://open.stealth.si:80/announce",
        "http://tracker.opentrackr.org:1337/announce",
        "udp://explodie.org:6969",
        "udp://zer0day.ch:1337",
      ],
    });
  }

  const engine = activeEngines[magnetHash];

  const startStreaming = () => {
    if (res.headersSent) return;

    const file = engine.files.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr,
    );

    file.select();

    // 2. Wait for 5MB Buffer
    const checkBuffer = setInterval(() => {
      const downloadedBytes = engine.swarm.downloaded;
      if (downloadedBytes > 5 * 1024 * 1024) {
        clearInterval(checkBuffer);

        const isMp4 = file.name.endsWith(".mp4");
        if (isMp4) {
          handleMp4Streaming(file, req, res);
        } else {
          console.log("🚀 Starting FFmpeg Transcode...");

          res.writeHead(200, {
            "Content-Type": "video/mp4",
            "Cross-Origin-Resource-Policy": "cross-origin",
          });

          ffmpeg(file.createReadStream())
            .videoCodec("libx264")
            .audioCodec("aac")
            .format("mp4")
            .outputOptions([
              "-movflags frag_keyframe+empty_moov+default_base_moof+faststart",
              "-pix_fmt yuv420p", // 👈 Crucial for HDR/10-bit compatibility
              "-preset ultrafast",
              "-tune zerolatency",
              "-vf scale=1280:-1", // 👈 Downscale 4K to 720p to save your CPU
            ])
            .on("error", (err) => {
              if (err.message !== "Output stream closed")
                console.log("FFmpeg Error:", err.message);
            })
            .pipe(res, { end: true });
        }
      }
    }, 2000);

    // 3. Simple Progress Log
    const progressLog = setInterval(() => {
      if (engine.swarm) {
        const percent = ((engine.swarm.downloaded / file.length) * 100).toFixed(
          2,
        );
        console.log(`📊 [${file.name}] Progress: ${percent}%`);
        console.log(
          `📊 Progress: ${percent}% | Peers: ${engine.swarm.wires.length}`,
        );
      }
    }, 5000);

    res.on("close", () => {
      clearInterval(checkBuffer);
      clearInterval(progressLog);
    });
  };

  if (engine.files && engine.files.length > 0) startStreaming();
  else engine.once("ready", startStreaming);
});

// Test only, remove in production
router.get("/status/:id", (req, res) => {
  const engine = activeEngines[req.params.id];
  if (!engine) return res.status(404).json({ message: "No active stream" });

  res.json({
    peers: engine.swarm.wires.length,
    downloaded: engine.swarm.downloaded,
    speed: engine.swarm.downloadSpeed(),
  });
});

function handleMp4Streaming(file, req, res) {
  const fileSize = file.length;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    });
    file.createReadStream({ start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });
    file.createReadStream().pipe(res);
  }
}

export default router;
