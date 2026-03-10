import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ROW_HEIGHT = 270;
const COL_WIDTH = 180;

function PosterBackground({ children }) {
  const [posters, setPosters] = useState([]);
  const [scrollHeight, setScrollHeight] = useState(null);
  const trackRef = useRef(null);

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

  useEffect(() => {
    if (posters.length === 0 || !trackRef.current) return;
    const el = trackRef.current;
    const updateScrollHeight = () => {
      const width = el.offsetWidth || el.clientWidth;
      const cols = Math.max(1, Math.floor(width / COL_WIDTH));
      const rowsPerCopy = Math.ceil(posters.length / cols);
      setScrollHeight(rowsPerCopy * ROW_HEIGHT);
    };
    updateScrollHeight();
    const ro = new ResizeObserver(updateScrollHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [posters.length]);

  const doubled = posters.length > 0 ? [...posters, ...posters] : [];
  const trackStyle = scrollHeight != null ? { '--scroll-height': `${scrollHeight}px` } : undefined;
  const trackClass = ['poster-scroll-track', scrollHeight != null && 'poster-scroll-track--ready'].filter(Boolean).join(' ');

  return (
    <div className="auth-background">
      {posters.length > 0 && (
        <div className="poster-scroll">
          <div ref={trackRef} className={trackClass} style={trackStyle}>
            {doubled.map((url, i) => (
              <img key={i} src={url} alt="" loading={i < 12 ? 'eager' : 'lazy'} decoding="async" />
            ))}
          </div>
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
