import { useState } from 'react';
import api from "../services/api";

export default function MovieTest() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await api.get(`movies/search?q=${query}`);
      setMovies(res.data);
    } catch (err) {
      console.error("Erreur de recherche", err);
    }
  };

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
            <strong>{movie.title}</strong> - Source: {movie.tracker}
            <br />
            <small>Magnet: {movie.magnet?.substring(0, 50)}...</small>
          </li>
        ))}
      </ul>
    </div>
  );
}