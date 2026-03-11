import express from "express";
import torrentStream from "torrent-stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import axios from "axios";
import { ApiRoutes } from "../config/resourceNames.js";

const router = express.Router();
const activeEngines = {};
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

console.log("✅ FFmpeg path automatically set to:", ffmpegInstaller.path);

async function resolveMagnet(input) {
  if (input.startsWith("magnet:?")) return input;

  try {
    const response = await axios.get(input, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.headers.location || response.data;
  } catch (error) {
    if (error.response?.data && error.response.data.startsWith("magnet:?")) {
      return error.response.data;
    }
    console.error("❌ Magnet Resolution Error:", error.message);
    return null;
  }
}

router.get(ApiRoutes.Stream, async (req, res) => {
  const magnetId = req.params.id;
  const jackettUrl = req.query.url;

  let magnetLink = jackettUrl
    ? await resolveMagnet(jackettUrl)
    : `magnet:?xt=urn:btih:${magnetId}`;

  if (!magnetLink)
    return res.status(400).send("Could not resolve torrent source");

  const magnetHash = magnetLink.match(/btih:([a-zA-Z0-9]+)/)[1].toLowerCase();

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");

  if (!activeEngines[magnetHash]) {
    activeEngines[magnetHash] = torrentStream(magnetLink, {
      path: "./downloads",
      trackers: [
        "udp://tracker.leechers-paradise.org:6969",
        "udp://tracker.coppersurfer.tk:6969",
        "http://tracker.opentrackr.org:1337/announce",
        "udp://open.stealth.si:80/announce",
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

    const checkBuffer = setInterval(() => {
      if (engine.swarm.downloaded > 25 * 1024 * 1024) {
        // 25MB Buffer
        clearInterval(checkBuffer);

        if (file.name.endsWith(".mp4")) {
          handleMp4Streaming(file, req, res);
        } else {
          console.log(`🚀 Transcoding: ${file.name}`);
          res.writeHead(200, {
            "Content-Type": "video/mp4",
            "Cross-Origin-Resource-Policy": "cross-origin",
          });

          ffmpeg(file.createReadStream())
            .inputOptions(["-re"])
            .videoCodec("libx264")
            .audioCodec("aac")
            .format("mp4")
            .outputOptions([
              "-movflags frag_keyframe+empty_moov+default_base_moof+faststart",
              "-pix_fmt yuv420p",
              "-preset ultrafast",
              "-tune zerolatency",
              "-vf scale=1280:-1",
            ])
            .on("error", (err) => console.log("FFmpeg:", err.message))
            .pipe(res, { end: true });
        }
      }
    }, 2000);

    const progressLog = setInterval(() => {
      const percent = ((engine.swarm.downloaded / file.length) * 100).toFixed(
        2,
      );
      console.log(
        `📊 [${magnetHash.substring(0, 6)}] ${percent}% | Peers: ${engine.swarm.wires.length}`,
      );
    }, 5000);

    res.on("close", () => {
      clearInterval(checkBuffer);
      clearInterval(progressLog);
    });
  };

  if (engine.files?.length > 0) startStreaming();
  else engine.once("ready", startStreaming);
});

router.get("/status/:id", (req, res) => {
  const engine = activeEngines[req.params.id.toLowerCase()];
  if (!engine) return res.status(404).json({ message: "Not active" });
  res.json({
    peers: engine.swarm.wires.length,
    downloaded: engine.swarm.downloaded,
    speed: engine.swarm.downloadSpeed(),
  });
});

function handleMp4Streaming(file, req, res) {
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${file.length}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "video/mp4",
    });
    file.createReadStream({ start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": file.length,
      "Content-Type": "video/mp4",
    });
    file.createReadStream().pipe(res);
  }
}

export default router;
