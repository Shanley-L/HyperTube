import { useState, useEffect } from 'react';
import '../pages/movies.css'
import api from "../services/api";

export default function MovieTest() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);

  useEffect(() => {
    discoverMovies();
  }, []);

  const discoverMovies = async () => {
    try {
      const res = await api.get(`movies/discover`);
      setMovies(res.data);
      const watchedRes = await api.get(`movies/getwatchedmovies`);
      setWatchedMovies(watchedRes.data);
      console.log(watchedMovies);
    } catch (err) {
      console.error("Erreur de découverte", err);
    }
  }

  const onSearchSubmit = (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    handleSearch();
  };

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
      const addWatched = await api.post('movies/watched', {
            selectMovieid: movieId // L'ID passe dans le body
        });

      setWatchedMovies((prev) => [...prev, movieId.toString()]);
      
      console.log(response.data);
      console.log(addWatched.data);
      
    } catch (error) {
      console.error("Error while fetching movie")
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <form className="search-bar" onSubmit={onSearchSubmit}>
        <input 
          className="search-input" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Chercher un film..." 
        />
        <button type="submit" className="search-btn">Rechercher</button>
      </form>

      <ul className="movie-grid" style={{ padding: 0, marginTop: '20px' }}>
        {movies.map((movie) => {
          // Déclaration de la constante pour chaque film
          const isWatched = watchedMovies.includes(movie.id.toString());

          return (
            <li 
              key={movie.id} 
              className={`movie-card ${isWatched ? 'watched' : ''}`}
            >
              <div className="poster-container">
                <img 
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                  className="movie-poster" 
                  onClick={() => handleMovieClick(movie.id)} 
                />
                {isWatched && <span className="watched-badge">✔ Vu</span>}
              </div>
              
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                <div className="movie-meta">
                  <span>{movie.release_date?.split('-')[0]}</span>
                  <span className="movie-rating">
                    ⭐ {Math.round(movie.vote_average * 10) / 10}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
