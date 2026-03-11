import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const getCleanQuality = (title) => {
  if (!title) return { resolution: "SD", isHeavy: false };
  const qualityMatch = title.match(/(4K|2160p|1080p|720p)/i);
  return {
    resolution: qualityMatch ? qualityMatch[0] : "SD",
    isHeavy: /x265|hevc/i.test(title),
  };
};

const MoviePage = () => {
  const { id } = useParams();
  const [movieData, setMovieData] = useState(null);
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ peers: 0, speed: 0, downloaded: 0 });

  const getHash = (magnet) => {
    if (!magnet) return null;
    const match = magnet.match(/btih:([a-zA-Z0-9]+)/);
    // If it's a Jackett URL, we'll use the URL itself as the key later
    return match ? match[1].toLowerCase() : "loading";
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (selectedTorrent) {
        const hash = getHash(selectedTorrent.magnet);
        if (hash === "loading") return;
        try {
          // Use your 'api' instance instead of raw axios
          const res = await api.get(`video/status/${hash}`);
          setStatus(res.data);
        } catch (e) {}
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedTorrent]);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.post("movies/select", { selectMovieid: id });
        setMovieData(res.data);
        if (res.data.torrents?.length > 0)
          setSelectedTorrent(res.data.torrents[0]);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchRealData();
  }, [id]);

  if (loading || !movieData) return <div className="loader">Chargement...</div>;

  const { info, torrents } = movieData;
  const currentHash = selectedTorrent ? getHash(selectedTorrent.magnet) : null;

  // Construct URL with the full magnet/Jackett link encoded
  const videoUrl = selectedTorrent
    ? `http://localhost:3000/api/video/stream/${currentHash}?url=${encodeURIComponent(selectedTorrent.magnet)}`
    : null;

  const isBuffering = status.downloaded < 25 * 1024 * 1024; // Matches backend 25MB

  const groupedTorrents = torrents.reduce((groups, torrent) => {
    const source = torrent.source || "Unknown Indexer";
    if (!groups[source]) groups[source] = [];
    groups[source].push(torrent);
    return groups;
  }, {});

  return (
    <div
      className="movie-page"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.9), #141414), url(${info.poster})`,
        backgroundSize: "cover",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "40px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ flex: "1" }}>
          <img
            src={info.poster}
            alt={info.title}
            style={{ width: "100%", borderRadius: "8px" }}
          />
        </div>

        <div style={{ flex: "2" }}>
          <h1>
            {info.title} ({info.year})
          </h1>
          <p style={{ color: "#f5c518", fontSize: "1.5rem" }}>
            ★ {info.rating}
          </p>

          <div style={{ marginTop: "30px" }}>
            <h3>Résultats par Indexer :</h3>
            {Object.entries(groupedTorrents).map(([source, items]) => (
              <details
                key={source}
                open
                style={{
                  marginBottom: "15px",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              >
                <summary
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    backgroundColor: "#222",
                    borderRadius: "8px",
                  }}
                >
                  {source} ({items.length} torrents)
                </summary>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {items.map((t, i) => {
                    const q = getCleanQuality(t.title);
                    const isSel = selectedTorrent?.magnet === t.magnet;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedTorrent(t);
                          setStatus({ peers: 0, speed: 0, downloaded: 0 });
                        }}
                        style={{
                          padding: "10px 15px",
                          backgroundColor: isSel ? "#e50914" : "#333",
                          border: isSel ? "2px solid white" : "1px solid #555",
                          color: "white",
                          borderRadius: "6px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {/* This restores the quality label you lost */}
                        <div style={{ fontWeight: "bold" }}>
                          {q.resolution}{" "}
                          {q.isHeavy && (
                            <span
                              style={{ color: "#ffa000", fontSize: "0.7rem" }}
                            >
                              [HEVC]
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                          {t.size} • {t.seeders} seeds
                        </div>
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div
        className="player-section"
        style={{ marginTop: "40px", position: "relative" }}
      >
        {videoUrl ? (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {isBuffering && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.8)",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div className="spinner"></div>
                <p>
                  Mise en mémoire tampon...{" "}
                  {((status.downloaded / (25 * 1024 * 1024)) * 100).toFixed(0)}%
                </p>
                <p style={{ fontSize: "0.8rem" }}>
                  Pairs: {status.peers} | {(status.speed / 1024).toFixed(2)}{" "}
                  KB/s
                </p>
              </div>
            )}
            <video key={videoUrl} controls width="100%" preload="metadata">
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        ) : (
          <p style={{ textAlign: "center" }}>
            Sélectionnez un torrent pour commencer...
          </p>
        )}
      </div>
    </div>
  );
};

export default MoviePage;
