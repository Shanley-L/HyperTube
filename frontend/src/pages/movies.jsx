import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/movies.css";
import api from "../services/api";

const GENRES_MAP = {
  28: "Action",
  12: "Aventure",
  16: "Animation",
  35: "Comédie",
  80: "Crime",
  99: "Documentaire",
  18: "Drame",
  10751: "Familial",
  14: "Fantastique",
  36: "Histoire",
  27: "Horreur",
  10402: "Musique",
  9648: "Mystère",
  10749: "Romance",
  878: "Science-Fiction",
  53: "Thriller",
  10752: "Guerre",
};

export default function MovieTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [sortBy, setSortBy] = useState("default");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreMovies = useRef(null);

  useEffect(() => {
    discoverMovies();
  }, []);

  useEffect(() => {
    if (location.state?.resetFilters) {
      setQuery("");
      setSortBy("default");
      setFilterGenre("");
      setFilterYear("");
      setMinRating("");
      discoverMovies();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const availableGenres = useMemo(() => {
    const ids = new Set();
    movies.forEach((m) => {
      (m.genre_ids || []).forEach((id) => ids.add(id));
    });
    return Array.from(ids)
      .filter((id) => GENRES_MAP[id])
      .map((id) => ({ id, name: GENRES_MAP[id] }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [movies]);

  const filteredAndSortedMovies = useMemo(() => {
    let list = [...movies];
    if (filterGenre) {
      const genreId = Number(filterGenre);
      list = list.filter((m) => (m.genre_ids || []).includes(genreId));
    }
    if (filterYear) {
      list = list.filter(
        (m) => (m.release_date || "").slice(0, 4) === filterYear,
      );
    }
    if (minRating !== "") {
      const threshold = Number(minRating);
      list = list.filter((m) => (m.vote_average ?? 0) >= threshold);
    }
    if (sortBy === "default") return list;
    return list.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "fr");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "fr");
        case "year-asc":
          return (a.release_date || "").localeCompare(b.release_date || "fr");
        case "year-desc":
          return (b.release_date || "").localeCompare(a.release_date || "fr");
        case "ratings-asc":
          return a.vote_average - b.vote_average;
        case "ratings-desc":
          return b.vote_average - a.vote_average;
        default:
          return 0;
      }
    });
  }, [movies, sortBy, filterGenre, filterYear, minRating]);

  const discoverMovies = async (pageParam = 1) => {
    if (isLoading) return;
    try {
      const watchedRes = await api.get(`movies/getwatchedmovies`);
      setWatchedMovies(watchedRes.data);
      setIsLoading(true);
      const res = await api.get(`movies/discover`, {
        params: { page: pageParam },
      });
      const { results, page: currentPage, total_pages } = res.data;
      setMovies((prev) =>
        pageParam === 1 ? results || [] : [...prev, ...(results || [])],
      );
      setPage(currentPage ?? pageParam);
      setHasMorePages(
        typeof total_pages === "number"
          ? (currentPage ?? pageParam) < total_pages
          : true,
      );
    } catch (err) {
      console.error("Erreur de découverte", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const movieList = loadMoreMovies.current;
    if (!movieList) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        if (query || !hasMorePages || isLoading) return;
        discoverMovies(page + 1);
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );
    observer.observe(movieList);
    return () => {
      observer.disconnect();
      observer.observe = () => {};
    };
  }, [query, hasMorePages, isLoading, page]);

  const onSearchSubmit = (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    handleSearch();
  };

  const handleSearch = async () => {
    try {
      const res = await api.get(`movies/search?q=${query}`);
      setMovies(res.data);
    } catch (err) {
      console.error("Erreur de recherche", err);
    }
  };

  const handleMovieClick = async (movieId) => {
    try {
      const response = await api.post("movies/select", {
        selectMovieid: movieId, // L'ID passe dans le body
      });
      const addWatched = await api.post("movies/watched", {
        selectMovieid: movieId, // L'ID passe dans le body
      });

      setWatchedMovies((prev) => [...prev, movieId.toString()]);
      navigate(`/movie/${movieId}`);
    } catch (error) {
      console.error("Error while fetching movie");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <form className="search-bar" onSubmit={onSearchSubmit}>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un film..."
        />
        <button type="submit" className="search-btn">
          Rechercher
        </button>
      </form>

      <div
        className="sort-bar"
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <label htmlFor="sort-select" style={{ color: "#aaa" }}>
          Trier par :
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "20px",
            border: "none",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="default">Ordre par défaut</option>
          <option value="title-asc">Titre (A → Z)</option>
          <option value="title-desc">Titre (Z → A)</option>
          <option value="year-desc">Année (récent → ancien)</option>
          <option value="year-asc">Année (ancien → récent)</option>
          <option value="ratings-desc">Note (haute → basse)</option>
          <option value="ratings-asc">Note (basse → haute)</option>
        </select>
      </div>

      <div
        className="filters-bar"
        style={{
          marginBottom: "16px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <label htmlFor="filter-genre" style={{ color: "#aaa" }}>
          Genre :
        </label>
        <select
          id="filter-genre"
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "20px",
            border: "none",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">Tous les genres</option>
          {availableGenres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <label htmlFor="filter-year" style={{ color: "#aaa" }}>
          Année :
        </label>
        <input
          id="filter-year"
          type="text"
          inputMode="numeric"
          placeholder="ex: 2023"
          value={filterYear}
          onChange={(e) =>
            setFilterYear(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          style={{
            padding: "8px 14px",
            borderRadius: "20px",
            border: "none",
            background: "#222",
            color: "#fff",
            outline: "none",
            width: "80px",
          }}
        />
        <label htmlFor="filter-rating" style={{ color: "#aaa" }}>
          Note min :
        </label>
        <input
          id="filter-rating"
          type="text"
          inputMode="decimal"
          placeholder="0-10"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "20px",
            border: "none",
            background: "#222",
            color: "#fff",
            outline: "none",
            width: "60px",
          }}
        />
      </div>

      <ul className="movie-grid" style={{ padding: 0, marginTop: "20px" }}>
        {filteredAndSortedMovies.map((movie) => {
          // Déclaration de la constante pour chaque film
          const isWatched = watchedMovies.includes(movie.id.toString());

          return (
            <li
              key={movie.id}
              className={`movie-card ${isWatched ? "watched" : ""}`}
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
                  <span>{movie.release_date?.split("-")[0]}</span>
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
        <div
          ref={loadMoreMovies}
          style={{ height: 20, width: "100%" }}
          aria-hidden="true"
        />
      )}
      {isLoading && (
        <p style={{ color: "#aaa", marginTop: 8 }}>Chargement...</p>
      )}
    </div>
  );
}
