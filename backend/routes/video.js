import express from 'express';
import torrentStream from 'torrent-stream';
import ffmpeg from 'fluent-ffmpeg';
import { ApiRoutes } from '../config/resourceNames.js';
import authMiddleware from '../middlewares/auth.js'; 

const router = express.Router();
const activeEngines = {};

router.get(ApiRoutes.Stream, (req, res) => {
    const magnetHash = req.params.id;
    const magnetLink = `magnet:?xt=urn:btih:${magnetHash}`;

    if (!activeEngines[magnetHash])
        activeEngines[magnetHash] = torrentStream(magnetLink, {
		path: './downloads',
		trackers: [
			'udp://tracker.opentrackr.org:1337/announce',
			'udp://9.rarbg.com:2810/announce',
			'udp://tracker.openbittorrent.com:6969/announce'
		]
});

    const engine = activeEngines[magnetHash];

    const startStreaming = () => {
        const file = engine.files.reduce((prev, curr) =>
			prev.length > curr.length ? prev : curr);
        const isMp4 = file.name.endsWith('.mp4');

        console.log(`🎬 Target file: ${file.name} | Transcoding: ${!isMp4}`);

        if (isMp4)
            handleMp4Streaming(file, req, res);
		else {
			console.log("⏳ Waiting for initial buffer...");
			
			// We wait until we have at least 1MB or some pieces before starting FFmpeg
			const stream = file.createReadStream();

			res.writeHead(200, {
				'Content-Type': 'video/mp4',
				'Connection': 'keep-alive',
				'Transfer-Encoding': 'chunked'
			});

			ffmpeg(stream)
				.videoCodec('libx264')
				.audioCodec('aac')
				.format('mp4')
				.outputOptions([
					'-movflags frag_keyframe+empty_moov+default_base_moof+faststart', 
					'-pix_fmt yuv420p',
					'-preset ultrafast',
					'-tune zerolatency',
					'-probesize 32',
					'-analyzeduration 0',
					'-threads 0'

				])
				.on('start', (cmd) => console.log("🚀 FFmpeg started"))
				.on('error', (err) => {
					if (err.message !== 'Output stream closed') {
						console.log('FFmpeg Error:', err.message);
					}
				})
				.pipe(res, { end: true });
		}
    };

    setupEngineListeners(engine, startStreaming);

    if (engine.files && engine.files.length > 0)
        startStreaming();
	else
        engine.once('ready', startStreaming);

	res.on('close', () => {
		console.log("Client disconnected.");
		// engine.destroy(); // kills the engine immediately ()
	});
});

// Test only, remove in production
router.get('/status/:id', (req, res) => {
    const engine = activeEngines[req.params.id];
    if (!engine)
		return res.status(404).json({ message: "No active stream" });

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

// Listeners to log metadata and peer connections
// TEST ONLY
function setupEngineListeners(engine, callback) {
    if (engine.hasCustomListeners)
		return;
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