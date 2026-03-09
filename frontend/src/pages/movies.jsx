import { useState, useEffect } from 'react';
import '../pages/movies.css'
import api from "../services/api";
import { useNavigate } from 'react-router-dom';


export default function MovieTest() {
	const [query, setQuery] = useState('');
	const [movies, setMovies] = useState([]);
	
	const navigate = useNavigate();
	
  useEffect(() => {
    discoverMovies();
  }, []);

  const discoverMovies = async () => {
    try {
      const res = await api.get(`movies/discover`);
      setMovies(res.data);
    } catch (err) {
      console.error("Erreur de découverte", err);
    }
  }

  const handleSearch = async () => {
    try {
      const res = await api.get(`movies/search?q=${query}`);
      console.log(movies)
      setMovies(res.data);
    } catch (err) {
      console.error("Erreur de recherche", err);
    }
  };

  const handleMovieClick = async (movieId) => {
    try {
      const response = await api.post('movies/select', {
            selectMovieid: movieId // L'ID passe dans le body
        });
      console.log(response.data);
	  	navigate(`/movie/${movieId}`);
      
    } catch (error) {
      console.error("Error while fetching movie")
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div className="search-bar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher un film..." />
        <button className="search-btn" onClick={handleSearch}>Rechercher</button>
      </div>

      <ul className="movie-grid" style={{ padding: 0, marginTop: '20px' }}>
        {movies.map((movie) => (
          <li className="movie-card" key={movie.id}>
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
              onClick={() => handleMovieClick(movie.id)} 
              className="movie-poster" 
            />
            <div className="movie-info">
              <h3 className="movie-title">{movie.title}</h3>
              <div className="movie-meta">
                <span>{movie.release_date?.split('-')[0]}</span>
                <span className="movie-rating">⭐ {Math.round(movie.vote_average * 10) / 10}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
