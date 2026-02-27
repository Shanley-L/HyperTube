import { useState } from 'react';
import api from "../services/api";

export default function MovieTest() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);

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
      
    } catch (error) {
      console.error("Error while fetching movie")
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Chercher un film..." 
      />
      <button onClick={handleSearch}>Rechercher</button>

      <ul>
        {movies.map((movie, index) => (
          <li key={index}>
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
              alt={movie.title}
              onClick={() => handleMovieClick(movie.id)}
              className="rounded-lg shadow-md"
              style={{ maxWidth: '300px', width: '100%', height: 'auto' }}
            />
            <strong>{movie.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}