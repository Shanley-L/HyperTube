import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../pages/movies.css'
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const GENRE_IDS = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752];

export default function MovieTest() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreMovies = useRef(null);

  useEffect(() => {
    discoverMovies();
  }, []);

  useEffect(() => {
    if (location.state?.resetFilters) {
      setQuery('');
      setSortBy('default');
      setFilterGenre('');
      setFilterYear('');
      setMinRating('');
      discoverMovies();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const availableGenres = useMemo(() => {
    const ids = new Set();
    movies.forEach((m) => {
      (m.genre_ids || []).forEach((id) => ids.add(id));
    });
    const locale = i18n.language.startsWith('fr') ? 'fr' : 'en';
    return Array.from(ids)
      .filter((id) => GENRE_IDS.includes(id))
      .map((id) => ({ id, name: t(`genres.${id}`) }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [movies, t, i18n.language]);

  const filteredAndSortedMovies = useMemo(() => {
    let list = [...movies];
    if (filterGenre) {
      const genreId = Number(filterGenre);
      list = list.filter((m) => (m.genre_ids || []).includes(genreId));
    }
    if (filterYear) {
      list = list.filter((m) => (m.release_date || '').slice(0, 4) === filterYear);
    }
    if (minRating !== '') {
      const threshold = Number(minRating);
      list = list.filter((m) => (m.vote_average ?? 0) >= threshold);
    }
    if (sortBy === 'default') return list;
    const locale = i18n.language.startsWith('fr') ? 'fr' : 'en';
    return list.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.title || '').localeCompare(b.title || '', locale);
        case "title-desc":
          return (b.title || '').localeCompare(a.title || '', locale);
        case "year-asc":
          return (a.release_date || '').localeCompare(b.release_date || '', locale);
        case "year-desc":
          return (b.release_date || '').localeCompare(a.release_date || '', locale);
        case "ratings-asc":
          return a.vote_average - b.vote_average;
        case "ratings-desc":
          return b.vote_average - a.vote_average;
        default:
          return 0;
      }
    });
  }, [movies, sortBy, filterGenre, filterYear, minRating, i18n.language]);

  const discoverMovies = async (pageParam = 1) => {
    if (isLoading) return;
    try {
      if (isAuthenticated) {
        const watchedRes = await api.get(`movies/getwatchedmovies`);
        setWatchedMovies(watchedRes.data);
      } else {
        setWatchedMovies([]);
      }
      setIsLoading(true);
      const res = await api.get(`movies/discover`, { params: { page: pageParam } });
      const { results, page: currentPage, total_pages } = res.data;
      setMovies((prev) => pageParam === 1 ? (results || []) : [...prev, ...(results || [])]);
      setPage(currentPage ?? pageParam);
      setHasMorePages(typeof total_pages === "number" ? (currentPage ?? pageParam) < total_pages : true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const movieList = loadMoreMovies.current;
    if (!movieList) return;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      if (query || !hasMorePages || isLoading) return;
      discoverMovies(page + 1);
    },
    { root: null, rootMargin: '100px', threshold: 0 });
    observer.observe(movieList);
    return () => observer.disconnect();
  }, [query, hasMorePages, isLoading, page]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSearch = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/movies' } });
      return;
    }
    try {
      const res = await api.get(`movies/search?q=${query}`);
      setMovies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovieClick = async (movieId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/movies' } });
      return;
    }
    try {
      await api.post('movies/select', { selectMovieid: movieId });
      await api.post('movies/watched', { selectMovieid: movieId });
      setWatchedMovies((prev) => [...prev, movieId.toString()]);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <form className="search-bar" onSubmit={onSearchSubmit}>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('movies.searchPlaceholder')}
        />
        <button type="submit" className="search-btn">{t('movies.search')}</button>
      </form>

      <div className="sort-bar" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="sort-select" style={{ color: '#aaa' }}>{t('movies.sortBy')}</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            background: '#222',
            color: '#fff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="default">{t('movies.sortDefault')}</option>
          <option value="title-asc">{t('movies.sortTitleAsc')}</option>
          <option value="title-desc">{t('movies.sortTitleDesc')}</option>
          <option value="year-desc">{t('movies.sortYearDesc')}</option>
          <option value="year-asc">{t('movies.sortYearAsc')}</option>
          <option value="ratings-desc">{t('movies.sortRatingDesc')}</option>
          <option value="ratings-asc">{t('movies.sortRatingAsc')}</option>
        </select>
      </div>

      <div className="filters-bar" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="filter-genre" style={{ color: '#aaa' }}>{t('movies.genre')}</label>
        <select
          id="filter-genre"
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#222', color: '#fff', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">{t('movies.allGenres')}</option>
          {availableGenres.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <label htmlFor="filter-year" style={{ color: '#aaa' }}>{t('movies.year')}</label>
        <input
          id="filter-year"
          type="text"
          inputMode="numeric"
          placeholder={t('movies.yearPlaceholder')}
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#222', color: '#fff', outline: 'none', width: '80px' }}
        />
        <label htmlFor="filter-rating" style={{ color: '#aaa' }}>{t('movies.minRating')}</label>
        <input
          id="filter-rating"
          type="text"
          inputMode="decimal"
          placeholder={t('movies.ratingPlaceholder')}
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#222', color: '#fff', outline: 'none', width: '60px' }}
        />
      </div>

      <ul className="movie-grid" style={{ padding: 0, marginTop: '20px' }}>
        {filteredAndSortedMovies.map((movie) => {
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
                  alt=""
                  onClick={() => handleMovieClick(movie.id)}
                />
                {isWatched && <span className="watched-badge">✔ {t('movies.watched')}</span>}
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
      {!query && (
        <div ref={loadMoreMovies} style={{ height: 20, width: '100%' }} aria-hidden="true" />
      )}
      {isLoading && <p style={{ color: '#aaa', marginTop: 8 }}>{t('movies.loading')}</p>}
    </div>
  );
}
