import express from "express";
import torrentStream from "torrent-stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import axios from "axios";
import path from "path";
import fs from "fs";
import { ApiRoutes } from "../config/resourceNames.js";

const router = express.Router();
const activeEngines = {};
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Setup HLS storage directory
const hlsBaseDir = path.resolve("./hls_segments");
if (!fs.existsSync(hlsBaseDir)) fs.mkdirSync(hlsBaseDir);

async function resolveMagnet(input) {
  if (input.startsWith("magnet:?")) return input;
  try {
    const response = await axios.get(input, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.headers.location || response.data;
  } catch (error) {
    if (error.response?.data && error.response.data.startsWith("magnet:?"))
      return error.response.data;
    return null;
  }
}

router.get("/status/:id", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const magnetHash = req.params.id.toLowerCase();
  const engine = activeEngines[magnetHash];

  if (!engine) return res.json({ health: "loading", peers: 0 });

  const activePeers = engine.swarm.wires.length;
  const health =
    activePeers > 5 ? "excellent" : activePeers > 0 ? "okay" : "dead";

  res.json({
    health,
    peers: activePeers,
    status: "active",
  });
});

router.get("/hls/:id/index.m3u8", async (req, res) => {
  const magnetId = req.params.id;
  const jackettUrl = req.query.url;
  const movieDuration = req.query.duration;
  const magnetHash = magnetId.toLowerCase();
  const movieFolder = path.join(hlsBaseDir, magnetHash);

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (!fs.existsSync(movieFolder))
    fs.mkdirSync(movieFolder, { recursive: true });

  if (!activeEngines[magnetHash]) {
    let magnetLink = jackettUrl
      ? await resolveMagnet(jackettUrl)
      : `magnet:?xt=urn:btih:${magnetId}`;
    activeEngines[magnetHash] = torrentStream(magnetLink, {
      path: "./downloads",
    });
  }

  const engine = activeEngines[magnetHash];
  const playlistPath = path.join(movieFolder, "index.m3u8");

  const startHlsTranscoding = async () => {
    if (fs.existsSync(playlistPath)) return res.sendFile(playlistPath);

    const file = engine.files.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr,
    );
    file.select();

    // 🚀 THE FIX: Get duration before starting transcode

    let command = ffmpeg(file.createReadStream())
      .videoCodec("libx264")
      .audioCodec("aac")
      .addOptions([
        "-profile:v baseline",
        "-level 3.0",
        "-start_number 0",
        "-hls_time 10",
        "-hls_list_size 0",
        "-f hls",
        "-preset ultrafast",
        "-hls_playlist_type vod",
      ]);

    if (movieDuration && !isNaN(movieDuration)) {
      command.outputOptions([`-t ${movieDuration}`]);
    }

    command
      .output(playlistPath)
      .on("error", (err) => console.log("HLS Error:", err.message))
      .run();

    const interval = setInterval(() => {
      if (fs.existsSync(playlistPath)) {
        clearInterval(interval);
        res.sendFile(playlistPath);
      }
    }, 1000);
  };

  if (engine.files && engine.files.length > 0) startHlsTranscoding();
  else engine.once("ready", startHlsTranscoding);
});

// 📁 Route to serve the actual .ts segments
router.get("/hls/:id/:segment", (req, res) => {
  const { id, segment } = req.params;
  const segmentPath = path.join(hlsBaseDir, id.toLowerCase(), segment);

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (fs.existsSync(segmentPath)) {
    res.sendFile(segmentPath);
  } else {
    res.status(404).send("Segment not ready");
  }
});

export default router;
