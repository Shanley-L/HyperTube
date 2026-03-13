import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const getCleanQuality = (title) => {
  if (!title) return { resolution: "SD", isHeavy: false };
  const titleUpper = title.toUpperCase();
  let resolution = "SD";
  if (titleUpper.includes("2160P") || titleUpper.includes("4K"))
    resolution = "4K";
  else if (titleUpper.includes("1080P")) resolution = "1080p";
  else if (titleUpper.includes("720P")) resolution = "720p";

  return { resolution, isHeavy: /x265|hevc/i.test(title) };
};

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
        gap: "5px",
        marginTop: "5px",
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: colors[health] || colors.loading,
        }}
      />
      <span
        style={{ fontSize: "0.8rem", color: colors[health] || colors.loading }}
      >
        {labels[health] || labels.loading} ({peers} pairs)
      </span>
    </div>
  );
};

const MoviePage = () => {
  const { id } = useParams();
  const [movieData, setMovieData] = useState(null);
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [torrentStatus, setTorrentStatus] = useState({
    health: "loading",
    peers: 0,
  });

  const getHash = (magnet) => {
    if (!magnet) return null;
    const match = magnet.match(/btih:([a-zA-Z0-9]+)/);
    return match ? match[1].toLowerCase() : "loading";
  };

  // 🚀 FIXED: No more setInterval. One-shot check after a 4s delay.
  useEffect(() => {
    if (!selectedTorrent) return;

    // Reset status to loading immediately
    setTorrentStatus({ health: "loading", peers: 0 });
    const hash = getHash(selectedTorrent.magnet);

    // We give the backend 4 seconds to talk to trackers before asking for status
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/video/status/${hash}`);
        setTorrentStatus(res.data);
      } catch (e) {
        if (e.response?.status === 429) {
          console.error("Rate limit hit - reducing polling");
        }
        setTorrentStatus({ health: "dead", peers: 0 });
      }
    }, 4000);

    return () => clearTimeout(timer);
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
  const videoUrl = selectedTorrent
    ? `http://localhost:3000/api/video/stream/${currentHash}?url=${encodeURIComponent(selectedTorrent.magnet)}`
    : null;

  const groupedByQuality = torrents.reduce((groups, t) => {
    const { resolution } = getCleanQuality(t.title);
    if (!groups[resolution]) groups[resolution] = [];
    groups[resolution].push(t);
    return groups;
  }, {});

  const qualityOrder = ["4K", "1080p", "720p", "SD"];

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
            {qualityOrder.map(
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
                      {groupedByQuality[res].map((t, i) => {
                        const isSel = selectedTorrent?.magnet === t.magnet;
                        const q = getCleanQuality(t.title);
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedTorrent(t)}
                            style={{
                              padding: "10px 15px",
                              backgroundColor: isSel ? "#e50914" : "#222",
                              border: isSel
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
                              {q.isHeavy && (
                                <span
                                  style={{
                                    color: "#ffa000",
                                    fontSize: "0.7rem",
                                  }}
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
                  </div>
                ),
            )}
          </div>
        </div>
      </div>

      <div className="player-section" style={{ marginTop: "40px" }}>
        {selectedTorrent && (
          <div style={{ marginBottom: "10px", textAlign: "center" }}>
            <HealthBadge
              health={torrentStatus.health}
              peers={torrentStatus.peers}
            />
            {torrentStatus.health === "dead" && (
              <p style={{ color: "#f44336", fontSize: "0.9rem" }}>
                ⚠️ Ce torrent semble mort. Essayez-en un autre !
              </p>
            )}
          </div>
        )}
        {videoUrl ? (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <video
              key={videoUrl}
              controls
              width="100%"
              preload="auto"
              autoPlay
              crossOrigin="anonymous"
              style={{
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#888",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              Note: Le démarrage peut prendre 10-30s selon la santé du torrent.
            </p>
          </div>
        ) : (
          <p style={{ textAlign: "center" }}>Sélectionnez un torrent...</p>
        )}
      </div>
    </div>
  );
};

export default MoviePage;
