import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // MOCK DATA - Replace with Jim's API call DONC DEPECHE TOI SALE CHIEN
  useEffect(() => {
    const fetchMovieData = async () => {
      setTimeout(() => {
        setMovie({
          title: "Interstellar",
          year: "2014",
          rating: "8.7/10", //optionnel
          runtime: "2h 49min", 
          genres: ["Adventure", "Drama", "Sci-Fi"],
          director: "Christopher Nolan",
          cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
          summary: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
          poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80",
			backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80"
        });
        setLoading(false);
      }, 500);
    };
    fetchMovieData();
  }, [id]);

  if (loading)
	return <div className="loader">Loading Movie Details...</div>;

  const videoUrl = `http://localhost:3000/api/video/stream/${id}`;

  return (
    <div className="movie-page" style={{ 
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.8), #141414), url(${movie.backdrop})`,
      backgroundSize: 'cover',
      minHeight: '100vh',
      color: 'white',
      padding: '40px'
    }}>
      <div className="content-container" style={{ display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Left: Poster */}
        <div className="poster-side" style={{ flex: '1' }}>
          <img src={movie.poster} alt={movie.title} style={{ width: '100%', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
        </div>

        {/* Right: Info */}
        <div className="info-side" style={{ flex: '2' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>{movie.title}</h1>
          <div style={{ marginBottom: '20px', color: '#aaa' }}>
            <span>{movie.year}</span> • <span>{movie.runtime}</span> • <span style={{ color: '#f5c518' }}>★ {movie.rating}</span>
          </div>
          
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>{movie.summary}</p>
          
          <div className="metadata">
            <p><strong>Director:</strong> {movie.director}</p>
            <p><strong>Cast:</strong> {movie.cast}</p>
            <p><strong>Genres:</strong> {movie.genres.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Bottom: Player Area */}
      <div className="player-section" style={{ marginTop: '50px', maxWidth: '1000px', margin: '50px auto' }}>
        <h2 style={{ marginBottom: '20px' }}>Stream Now</h2>
        <div className="video-wrapper" style={{ backgroundColor: 'black', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
          <video 
            controls 
            width="100%" 
            crossOrigin="anonymous"
            poster={movie.backdrop}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default MoviePage;