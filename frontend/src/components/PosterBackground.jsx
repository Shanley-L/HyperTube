import { useState, useEffect } from 'react';
import api from '../services/api';

function PosterBackground({ children }) {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const res = await api.get('/movies/posters');
        const list = Array.isArray(res.data) ? res.data : [];
        setPosters(list);
      } catch {
        setPosters([]);
      }
    };
    fetchPosters();
  }, []);

  const doubled = posters.length > 0 ? [...posters, ...posters] : [];

  return (
    <div className="auth-background">
      {posters.length > 0 && (
        <div className="poster-scroll">
          {doubled.map((url, i) => (
            <img key={i} src={url} alt="" loading={i < 12 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>
      )}
      <div className="auth-overlay" />
      <div className="auth-form-wrapper">
        {children}
      </div>
    </div>
  );
}

export default PosterBackground;
