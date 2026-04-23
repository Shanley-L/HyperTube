import express from "express";
import torrentStream from "torrent-stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import axios from "axios";
import path from "path";
import pool from "../config/database.js";
import { ApiRoutes } from "../config/resourceNames.js";
import { fetchAndSaveSubtitles } from "../services/subtitleService.js";

const router = express.Router();
const activeEngines = {};
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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

router.get("/subtitles/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;

  try {
    const subs = await pool.query(
      "SELECT language, file_path FROM subtitles WHERE movie_id = $1",
      [tmdbId]
    );

    res.json(subs.rows);
  } catch (err) {
    console.error("Error fetching subtitles from DB:", err);
    res.status(500).json({ error: "Could not fetch subtitles" });
  }
});

router.get("/status/:id", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const magnetHash = req.params.id.toLowerCase();
  const engine = activeEngines[magnetHash];

  if (!engine || !engine.swarm) {
    return res.json({
      status: "searching",
      health: "loading",
      peers: 0,
      speed: "0",
      progress: "0 MB",
    });
  }

  const speedBytes = engine.swarm.downloadSpeed();
  const speedMB = (speedBytes / (1024 * 1024)).toFixed(2);
  const activePeers = engine.swarm.wires.length;
  const downloadedMB = (engine.swarm.downloaded / (1024 * 1024)).toFixed(2);

  let health = "dead";
  if (activePeers > 8) health = "excellent";
  else if (activePeers > 0) health = "okay";

  res.json({
    status: engine.swarm.downloaded > 5 * 1024 * 1024 ? "streaming" : "buffering",
    peers: activePeers,
    health: health,
    speed: speedMB,
    progress: downloadedMB + " MB",
  });
});

function handleMp4Streaming(file, req, res) {
  if (res.headersSent) return;

  const range = req.headers.range;
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.setHeader("Accept-Ranges", "bytes");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${file.length}`,
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    });

    const stream = file.createReadStream({ start, end });
    stream.pipe(res);
    res.on("close", () => stream.destroy());
  } else {
    res.writeHead(200, {
      "Content-Length": file.length,
      "Content-Type": "video/mp4",
    });
    const stream = file.createReadStream();
    stream.pipe(res);
    res.on("close", () => stream.destroy());
  }
}

router.get(ApiRoutes.Stream, async (req, res) => {
  const magnetId = req.params.id;
  const jackettUrl = req.query.url;
  const movieDuration = req.query.duration;
  const tmdbId = req.query.tmdbId;
  const imdbId = req.query.imdbId;

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  let magnetLink = jackettUrl
    ? await resolveMagnet(jackettUrl)
    : `magnet:?xt=urn:btih:${magnetId}`;

  if (!magnetLink) return res.status(400).send("Source introuvable");

  const magnetHashMatch = magnetLink.match(/btih:([a-zA-Z0-9]+)/);
  if (!magnetHashMatch) return res.status(400).send("Magnet invalide");
  const magnetHash = magnetHashMatch[1].toLowerCase();

  if (!activeEngines[magnetHash]) {
    activeEngines[magnetHash] = torrentStream(magnetLink, {
      path: "./downloads",
      port: 6881,
      trackers: [
        "udp://tracker.leechers-paradise.org:6969",
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://9.rarbg.com:2810/announce",
        "udp://exodus.desync.com:6969",
      ],
    });
  }

  const engine = activeEngines[magnetHash];

  const startStreaming = async () => {
    if (res.headersSent) return;

    if (!engine.files || engine.files.length === 0) {
      console.error("No files found in torrent engine.");
      return res.status(404).send("Aucun fichier trouvé dans ce torrent.");
    }

    const file = engine.files.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr,
    );

    file.select();

    if (tmdbId) {
      try {
        const relativePath = path.join(engine.torrent.name, file.path);
        await pool.query(
          `INSERT INTO movies (tmdb_id, title, file_path, last_watched_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (tmdb_id) DO UPDATE SET file_path = EXCLUDED.file_path, last_watched_at = NOW()`,
          [tmdbId, file.name, relativePath]
        );

        if (imdbId) {
          const subtitles = await fetchAndSaveSubtitles(imdbId, tmdbId);

          for (const sub of subtitles) {
            await pool.query(
              `INSERT INTO subtitles (movie_id, language, file_path) 
              VALUES ($1, $2, $3) 
              ON CONFLICT DO NOTHING`,
              [
                tmdbId, 
                sub.language,
                sub.file_path
              ]
            );
          }
        }
      } catch (err) {
        console.error("Error updating movie/subs metadata:", err);
      }
    }

    if (file.name.endsWith(".mp4")) {
      return handleMp4Streaming(file, req, res);
    }

    const checkBuffer = setInterval(() => {
      if (res.writableEnded || res.finished) {
        clearInterval(checkBuffer);
        return;
      }

      if (engine.swarm.downloaded > 6 * 1024 * 1024) {
        clearInterval(checkBuffer);

        res.writeHead(200, {
          "Content-Type": "video/mp4",
          Connection: "keep-alive",
          "Cross-Origin-Resource-Policy": "cross-origin",
        });

        const command = ffmpeg(file.createReadStream())
          .inputOptions(["-probesize 32", "-analyzeduration 0"])
          .videoCodec("libx264")
          .audioCodec("aac")
          .format("mp4")
          .outputOptions([
            "-movflags frag_keyframe+empty_moov+default_base_moof+faststart",
            "-preset ultrafast",
            "-tune zerolatency",
            "-threads 0",
          ]);

        if (movieDuration && !isNaN(movieDuration) && movieDuration > 0) {
          command.outputOptions([`-t ${movieDuration}`]);
        }

        command
          .on("error", (err) => {
            if (err.message.includes("Output pipe closed") || err.message.includes("SIGKILL")) return;
            console.error("FFmpeg Error:", err.message);
            if (!res.headersSent) res.end();
          })
          .pipe(res);
      }
    }, 2000);

    res.on("close", () => clearInterval(checkBuffer));
  };

  if (engine.files && engine.files.length > 0) {
    startStreaming();
  } else {
    engine.once("ready", () => {
      if (engine.files && engine.files.length > 0) {
        startStreaming();
      } else {
        res.status(404).send("Metadata introuvable ou torrent vide.");
      }
    });
  }
});

export default router;