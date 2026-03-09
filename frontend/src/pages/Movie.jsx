import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from "../services/api";

const MoviePage = () => {
  const { id } = useParams();
  const [movieData, setMovieData] = useState(null);
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ peers: 0, speed: 0 });

	useEffect(() => {
		const interval = setInterval(async () => {
			if (selectedTorrent) {
				const hash = getHash(selectedTorrent.magnet);
				try {
					const res = await axios.get(`http://localhost:3000/api/video/status/${hash}`);
					setStatus(res.data);
				}
				catch (e) { }
			}
		}, 2000);
		return () => clearInterval(interval);
	}, [selectedTorrent]);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.post('movies/select', { selectMovieid: id });
        setMovieData(res.data);
        
        // Default to the first torrent in the list
        if (res.data.torrents && res.data.torrents.length > 0) {
          setSelectedTorrent(res.data.torrents[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Erreur chargement film:", err);
        setLoading(false);
      }
    };
    fetchRealData();
  }, [id]);

  if (loading || !movieData) return <div className="loader">Chargement...</div>;

  const { info, torrents } = movieData;

  // Function to extract the hash from the magnet link
  const getHash = (magnet) => {
    const match = magnet.match(/btih:([a-zA-Z0-9]+)/);
    return match ? match[1].toLowerCase() : null;
  };

  const videoUrl = selectedTorrent 
    ? `http://localhost:3000/api/video/stream/${getHash(selectedTorrent.magnet)}`
    : null;

  return (
    <div className="movie-page" style={{ 
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.9), #141414), url(${info.poster})`,
      backgroundSize: 'cover', minHeight: '100vh', color: 'white', padding: '40px'
    }}>
      <div className="content-container" style={{ display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Left: Poster */}
        <div style={{ flex: '1' }}>
          <img src={info.poster} alt={info.title} style={{ width: '100%', borderRadius: '8px', boxShadow: '0 10px 30px black' }} />
        </div>

        {/* Right: Info */}
        <div style={{ flex: '2' }}>
          <h1 style={{ fontSize: '3.5rem', margin: 0 }}>{info.title} ({info.year})</h1>
          <p style={{ color: '#f5c518', fontSize: '1.5rem' }}>★ {info.rating}</p>
          <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
            {info.genres.map(g => <span key={g} style={{ border: '1px solid #555', padding: '2px 10px', borderRadius: '15px' }}>{g}</span>)}
          </div>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{info.overview}</p>

          {/* TORRENT SELECTOR */}
          <div style={{ marginTop: '30px' }}>
            <h3>Qualité disponible :</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {torrents.map((t, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedTorrent(t)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: selectedTorrent?.magnet === t.magnet ? '#e50914' : '#333',
                    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  {t.size} - {t.seeders} seeds
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VIDEO PLAYER */}
      <div className="player-section" style={{ marginTop: '50px', textAlign: 'center' }}>
        {selectedTorrent ? (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {selectedTorrent && (
  <div className="video-wrapper">
    {/* Adding a simple message so the user knows to wait */}
    <div style={{ padding: '10px', color: '#f5c518', textAlign: 'center' }}>
      Initialisation du flux... (Connexion aux pairs en cours)
    </div>
    
    <video 
      key={selectedTorrent.magnet} 
      controls 
      width="100%" 
      preload="metadata" // Change from 'auto' to 'metadata' to be less aggressive
      crossOrigin="anonymous"
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  </div>
)}
            <p style={{ marginTop: '10px', color: '#888' }}>Lecture en cours : {selectedTorrent.title}</p>
						<p>Peers: {status.peers} | Speed: {(status.speed / 1024).toFixed(2)} KB/s</p>
          </div>
        ) : (
          <p>Aucun torrent sélectionné</p>
        )}
      </div>
    </div>
  );
};

export default MoviePage;