import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Comment from "../components/Comment.jsx";
import "./comment.css";
import { useTranslation } from "react-i18next";

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

const HealthBadge = ({ health, peers, speed, status }) => {
  const { t } = useTranslation();
  const colors = {
    excellent: "#4caf50",
    okay: "#ff9800",
    dead: "#f44336",
    loading: "#888",
  };

  const statusLabel = {
    searching: t("moviePage.statusLabel.searching"),
    buffering: t("moviePage.statusLabel.buffering"),
    streaming: t("moviePage.statusLabel.readyToWatch"),
    idle: t("moviePage.statusLabel.idle"),
  };

  return (
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: colors[health] || colors.loading,
            boxShadow:
              health !== "dead" && health !== "loading"
                ? `0 0 10px ${colors[health]}`
                : "none",
          }}
        />
        <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
          {statusLabel[status] || statusLabel.idle}
        </span>
      </div>
      <div style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "5px" }}>
        {peers || 0} {t("moviePage.statusLabel.peersConnected")} •{" "}
        <span style={{ color: "#4caf50" }}>{speed || "0.00"} MB/s</span>
      </div>
    </div>
  );
};

const MoviePage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [movieData, setMovieData] = useState(null);
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subtitles, setSubtitles] = useState([]);
  const [torrentStatus, setTorrentStatus] = useState({
    health: "loading",
    peers: 0,
    speed: "0.00",
    status: "idle",
  });

  const getHash = (magnet) => {
    if (!magnet) return null;
    const match = magnet.match(/btih:([a-zA-Z0-9]+)/);
    return match ? match[1].toLowerCase() : "loading";
  };

  const info = movieData?.info || {};
  const durationInSeconds = info.runtime ? info.runtime * 60 : 0;

  // 🎬 Initial Data Fetch (Movie Info)
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.post("movies/select", { 
          selectMovieid: id,
          lang: i18n.language 
        });
        setMovieData(res.data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchRealData();
  }, [id, i18n.language]);

  useEffect(() => {
    if (!movieData?.info?.tmdb_id) return;

    const fetchSubtitles = async () => {
      try {
        const res = await api.get(`/video/subtitles/${movieData.info.tmdb_id}`);
        setSubtitles(res.data);
      } catch (err) {
        console.error("Failed to load subtitles");
      }
    };
    fetchSubtitles();
  }, [movieData]);

  useEffect(() => {
    if (!selectedTorrent) return;

    setTorrentStatus({
      health: "loading",
      peers: 0,
      speed: "0.00",
      status: "searching",
    });
    const hash = getHash(selectedTorrent.magnet);
    if (!hash) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/video/status/${hash}`);
        setTorrentStatus(res.data);
      } catch (e) {
        console.error("Status error");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedTorrent]);

  // 🛰️ Media Session Effect
  useEffect(() => {
    if (durationInSeconds > 0 && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: info.title,
        artist: "Hypertube",
        artwork: [{ src: info.poster, sizes: "512x512", type: "image/png" }],
      });
    }
  }, [movieData, durationInSeconds]);

  if (loading || !movieData) return <div className="loader">{t("moviePage.loading")}</div>;

  const currentHash = selectedTorrent ? getHash(selectedTorrent.magnet) : null;
  
  const videoUrl = selectedTorrent
    ? `http://localhost:3000/api/video/stream/${currentHash}?url=${encodeURIComponent(selectedTorrent.magnet)}&duration=${durationInSeconds}&tmdbId=${movieData.info.tmdb_id}&imdbId=${movieData.info.imdb_id}`
    : null;

  const qualityOrder = ["4K", "1080p", "720p", "SD"];
  const groupedByQuality = movieData.torrents.reduce((groups, t) => {
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
      <div style={{ display: "flex", gap: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ flex: "1" }}>
          <img src={info.poster} alt={info.title} style={{ width: "100%", borderRadius: "8px" }} />
        </div>
        <div style={{ flex: "2" }}>
          <h1>{info.title} ({info.year})</h1>
          <p style={{ color: "#f5c518", fontSize: "1.5rem" }}>★ {info.rating} • {info.runtime} mins</p>
          <p style={{ lineHeight: "1.6", paddingTop: "20px" }}>{info.overview}</p>
          
          <div style={{ marginTop: "30px" }}>
            {qualityOrder.map((res) => groupedByQuality[res] && (
              <div key={res} style={{ marginBottom: "20px" }}>
                <h3 style={{ borderLeft: "4px solid #e50914", paddingLeft: "10px" }}>
                  {res} {t("moviePage.statusLabel.options")}
                </h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                  {groupedByQuality[res].map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTorrent(t)}
                      style={{
                        padding: "10px 15px",
                        backgroundColor: selectedTorrent?.magnet === t.magnet ? "#e50914" : "#222",
                        border: selectedTorrent?.magnet === t.magnet ? "2px solid white" : "1px solid #444",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <strong>{t.source}</strong>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{t.size}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="player-section" style={{ marginTop: "40px" }}>
        {selectedTorrent && (
          <HealthBadge
            health={torrentStatus.health}
            peers={torrentStatus.peers}
            speed={torrentStatus.speed}
            status={torrentStatus.status}
          />
        )}

        {videoUrl ? (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <video
              key={videoUrl}
              controls
              width="100%"
              autoPlay
              crossOrigin="anonymous" 
              style={{ borderRadius: "8px" }}
            >
              <source src={videoUrl} type="video/mp4" />
              
              {subtitles && subtitles.length > 0 && subtitles.map((sub, i) => {
              const isEnglish = sub.language?.toLowerCase() === 'en';
              
              const label = isEnglish ? 'English' : 'French';

              return (
                <track 
                  key={`${sub.file_path}-${i}`} // Use file_path (snake_case)
                  label={label}
                  kind="subtitles"
                  srcLang={sub.language} // Use language
                  src={`http://localhost:3000/subtitles/${sub.file_path}`} // Use file_path
                  default={sub.language === i18n.language}
                />
              );
            })}
            </video>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            {movieData.torrents && movieData.torrents.length > 0 ? (
              <p>{t("moviePage.torrentSelection")}</p>
            ) : (
              <p style={{ color: "#f44336" }}>{t("moviePage.torrentNotFound")}</p>
            )}
          </div>
        )}
        <Comment movieId={id}/>
      </div>
    </div>
  );
};

export default MoviePage;