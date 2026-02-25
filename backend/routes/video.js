import express from 'express';
import torrentStream from 'torrent-stream';
import ffmpeg from 'fluent-ffmpeg';
import { ApiRoutes } from '../config/resourceNames.js';

const router = express.Router();
const activeEngines = {};

router.get(ApiRoutes.Stream, (req, res) => {
    const magnetHash = req.params.id;
    const magnetLink = `magnet:?xt=urn:btih:${magnetHash}`;

    if (!activeEngines[magnetHash]) {
        activeEngines[magnetHash] = torrentStream(magnetLink, { path: './downloads' });
    }

    const engine = activeEngines[magnetHash];

    const startStreaming = () => {
        const file = engine.files.reduce((prev, curr) => prev.length > curr.length ? prev : curr);
        const isMp4 = file.name.endsWith('.mp4');
        
        console.log(`🎬 Target file: ${file.name} | Transcoding: ${!isMp4}`);

        if (isMp4) {
            const fileSize = file.length;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                });
                file.createReadStream({ start, end }).pipe(res);
            }
			else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                });
                file.createReadStream().pipe(res);
            }
        }
		else {
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Connection': 'keep-alive',
                'Transfer-Encoding': 'chunked'
            });

            ffmpeg(file.createReadStream())
                .videoCodec('libx264')
                .audioCodec('aac')
                .format('mp4')
                .outputOptions([
                    '-movflags frag_keyframe+empty_moov',
                    '-pix_fmt yuv420p',
                    '-preset ultrafast'
                ])
                .on('error', (err) => {
                    console.log('FFmpeg Error:', err.message);
                })
                .pipe(res, { end: true });
        }
    };

    // Use our helper but pass startStreaming as a callback
    setupEngineListeners(engine, startStreaming);

    if (engine.files && engine.files.length > 0) {
        startStreaming();
    } else {
        // We use .once to ensure it only fires once per request
        engine.once('ready', startStreaming);
    }
});

function setupEngineListeners(engine, callback) {
    // Check if we've already attached these to avoid log spam
    if (engine.hasCustomListeners) return;
    engine.hasCustomListeners = true;

    engine.on('torrent', () => {
        console.log("✅ Metadata received! Found files:", engine.files.map(f => f.name));
    });

    const interval = setInterval(() => {
        if (engine.swarm) {
            const connected = engine.swarm.wires.length;
            console.log(`📡 Connected peers: ${connected}`);
            if (connected > 0) clearInterval(interval); 
        }
    }, 3000);
}

export default router;