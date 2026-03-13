import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Hls from "hls.js";

// Spinner component for loading
const Spinner = () => (
  <div
    style={{
      width: "12px",
      height: "12px",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }}
  />
);

const HealthBadge = ({ health, peers }) => {
  const colors = {
    excellent: "#4caf50",
    okay: "#ff9800",
    dead: "#f44336",
    loading: "#888",
  };
  const labels = {
    excellent: "Rapide",
    okay: "Lent",
    dead: "Mort",
    loading: "Vérification...",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginTop: "10px",
      }}
    >
      {health === "loading" ? (
        <Spinner />
      ) : (
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: colors[health],
          }}
        />
      )}
      <span
        style={{ fontSize: "0.9rem", color: colors[health], fontWeight: "500" }}
      >
        {labels[health]} {health !== "loading" && `(${peers} pairs)`}
      </span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const MoviePage = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [movieData, setMovieData] = useState(null);
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [torrentStatus, setTorrentStatus] = useState({
    health: "loading",
    peers: 0,
  });

  const getHash = (magnet) => {
    const match = magnet?.match(/btih:([a-zA-Z0-9]+)/);
    return match ? match[1].toLowerCase() : null;
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.post("movies/select", { selectMovieid: id });
        setMovieData(res.data);
        console.log("Données du film sélectionné :", res.data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchRealData();
  }, [id]);

  // 🛰️ Effect to handle HLS Playback
  useEffect(() => {
    if (!selectedTorrent || !videoRef.current) return;

    const hash = getHash(selectedTorrent.magnet);
    const durationInSeconds = movieData.info.runtime * 60;

    const hlsUrl = `http://localhost:3000/api/video/hls/${hash}/index.m3u8?url=${encodeURIComponent(selectedTorrent.magnet)}&duration=${durationInSeconds}`;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        // 🚀 This force-tells the player it's a fixed-length movie
        liveDurationInfinity: false,
        type: "vod",
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;
    }

    // Single health check after 3 seconds
    setTorrentStatus({ health: "loading", peers: 0 });
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/video/status/${hash}`);
        setTorrentStatus(res.data);
      } catch (e) {
        setTorrentStatus({ health: "dead", peers: 0 });
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [selectedTorrent]);

  if (loading || !movieData) return <div className="loader">Chargement...</div>;

  const { info, torrents } = movieData;

  const getCleanQuality = (title) => {
    const titleUpper = title?.toUpperCase() || "";
    let resolution = titleUpper.includes("4K")
      ? "4K"
      : titleUpper.includes("1080P")
        ? "1080p"
        : titleUpper.includes("720P")
          ? "720p"
          : "SD";
    return { resolution, isHeavy: /x265|hevc/i.test(title) };
  };

  const groupedByQuality = torrents.reduce((groups, t) => {
    const { resolution } = getCleanQuality(t.title);
    if (!groups[resolution]) groups[resolution] = [];
    groups[resolution].push(t);
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
            {["4K", "1080p", "720p", "SD"].map(
              (res) =>
                groupedByQuality[res] && (
                  <div key={res} style={{ marginBottom: "20px" }}>
                    <h3
                      style={{
                        borderLeft: "4px solid #e50914",
                        paddingLeft: "10px",
                      }}
                    >
                      {res} Options
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "10px",
                      }}
                    >
                      {groupedByQuality[res].map((t, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTorrent(t)}
                          style={{
                            padding: "10px 15px",
                            backgroundColor:
                              selectedTorrent?.magnet === t.magnet
                                ? "#e50914"
                                : "#222",
                            border:
                              selectedTorrent?.magnet === t.magnet
                                ? "2px solid white"
                                : "1px solid #444",
                            color: "white",
                            borderRadius: "6px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>
                            {t.source}{" "}
                            {getCleanQuality(t.title).isHeavy && (
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
                      ))}
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>
      </div>

      <div className="player-section" style={{ marginTop: "40px" }}>
        {selectedTorrent && (
          <HealthBadge
            health={torrentStatus.health}
            peers={torrentStatus.peers}
          />
        )}
        <div style={{ maxWidth: "1000px", margin: "20px auto" }}>
          <video
            ref={videoRef}
            controls
            width="100%"
            crossOrigin="anonymous"
            style={{
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MoviePage;
