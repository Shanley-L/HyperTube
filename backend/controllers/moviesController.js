import { response } from "express";
import {
  findById,
  addWatchedMovie,
  getWatchedMovies,
  checkIfMovieIsWatched,
} from "../models/user.js";

const CAM_REGEX = /\b(CAM|TS|TELESYNC|TC|SCREENER|SCR|HDCAM)\b/i;

const calculateScore = (t) => {
  let score = 0;
  const title = t.Title.toUpperCase();

  // Resolution Base Score
  if (title.includes("2160P") || title.includes("4K")) score += 1000;
  else if (title.includes("1080P")) score += 500;
  else if (title.includes("720P")) score += 200;

  // Codec Bonus (x265/HEVC is better for streaming efficiency)
  if (title.includes("X265") || title.includes("HEVC")) score += 150;

  // Health Score (Seeders) - Capped to avoid skewing too much from fake seeder counts
  score += Math.min(t.Seeders * 2, 100);

  return score;
};

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

const moviesController = {
  discover: async (req, res) => {
    const page = Number(req.query.page) || 1;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${page}`;
      const tmdbRes = await fetch(tmdbUrl);
      const tmdbData = await tmdbRes.json();
      return res.status(200).json({
        page: tmdbData.page,
        total_pages: tmdbData.total_pages,
        results: tmdbData.results || [],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur de découverte" });
    }
  },
  getPosters: async (req, res) => {
    try {
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        console.warn("getPosters: TMDB_API_KEY absente ou vide dans .env");
        return res.json([]);
      }
      const pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const fetchPage = (page) =>
        fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=${page}`,
        ).then((r) => r.json());
      const allData = await Promise.all(pages.map(fetchPage));
      const results = allData.flatMap((data) =>
        Array.isArray(data.results) ? data.results : [],
      );
      const posters = results
        .filter((movie) => movie && movie.poster_path)
        .map((movie) => `https://image.tmdb.org/t/p/w300${movie.poster_path}`);
      if (posters.length === 0) {
        console.warn(
          "getPosters: aucun poster (results:",
          results.length,
          ", keys reçues:",
          data ? Object.keys(data) : "null",
          ")",
        );
      }
      res.json(posters);
    } catch (error) {
      console.warn("getPosters:", error.message);
      res.json([]);
    }
  },
  search: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Recherche vide" });

    try {
      // 1. Trouver le film précis sur TMDB pour avoir l'ID IMDb et l'affiche
      const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=fr-FR`;

      console.log("URL TMDB testée :", tmdbUrl);

      const tmdbRes = await fetch(tmdbUrl);
      const tmdbData = await tmdbRes.json();

      // Vérification cruciale : est-ce qu'on a au moins un résultat ?
      if (!tmdbData.results || tmdbData.results.length === 0) {
        return res.status(404).json({ error: "Aucun film trouvé sur TMDB" });
      }

      // console.log(tmdbData.results);

      return res.status(200).json(tmdbData.results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur de recherche combinée" });
    }
  },
  select: async (req, res) => {
    const { selectMovieid } = req.body;
    if (!selectMovieid) return res.status(400).json({ error: "ID manquant" });

    try {
      const movieRes = await fetch(
        `https://api.themoviedb.org/3/movie/${selectMovieid}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`,
      );
      const movieData = await movieRes.json();

      const searchQuery = `${movieData.title} ${movieData.release_date?.split("-")[0]}`;
      const jackettUrl = `http://localhost:9117/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${encodeURIComponent(searchQuery)}`;
      const jackettRes = await fetch(jackettUrl);
      const jackettData = await jackettRes.json();

      const rawResults = jackettData.Results || [];

      const filtered = rawResults.filter((t) => !CAM_REGEX.test(t.Title));

      // 2. Score and Category Tiers
      const tiers = { "4K": [], "1080p": [], "720p": [] };

      filtered.forEach((t) => {
        const score = calculateScore(t);
        const item = {
          title: t.Title,
          seeders: t.Seeders,
          size: (t.Size / 1024 ** 3).toFixed(2) + " GB",
          magnet: t.MagnetUri || t.Link,
          source: t.Tracker || t.TrackerId || "Unknown",
          score,
        };

        const titleUpper = t.Title.toUpperCase();
        if (titleUpper.includes("2160P") || titleUpper.includes("4K"))
          tiers["4K"].push(item);
        else if (titleUpper.includes("1080P")) tiers["1080p"].push(item);
        else tiers["720p"].push(item);
      });

      // 3. 3x3 Strategy: Top 3 for each available tier
      const finalTorrents = [
        ...tiers["4K"].sort((a, b) => b.score - a.score).slice(0, 3),
        ...tiers["1080p"].sort((a, b) => b.score - a.score).slice(0, 3),
        ...tiers["720p"].sort((a, b) => b.score - a.score).slice(0, 3),
      ];

      return res.json({
        info: {
          title: movieData.title,
          poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
          year: movieData.release_date?.split("-")[0],
          rating: Math.round(movieData.vote_average * 10) / 10,
          genres: movieData.genres.map((g) => g.name),
          overview: movieData.overview,
          runtime: movieData.runtime,
        },
        torrents: finalTorrents,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de la sélection" });
    }
  },
  watched: async (req, res) => {
    const userId = req.user.userId;
    const { selectMovieid } = req.body;
    if (!selectMovieid) return res.status(400).json({ error: "ID manquant" });
    const user = await findById(userId);
    if (!user)
      return res
        .status(401)
        .json({ error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
    const isWatched = await checkIfMovieIsWatched(userId, selectMovieid);
    if (isWatched)
      return res.status(200).json({ message: "Film déjà marqué comme vu" });
    try {
      const watchedMovie = await addWatchedMovie(userId, selectMovieid);
      return res.json(watchedMovie);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de l'ajout du film" });
    }
  },
  getWatchedMovies: async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await findById(userId);
      if (!user)
        return res
          .status(401)
          .json({ error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
      const watchedMovies = await getWatchedMovies(userId);
      return res.json(watchedMovies);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des films" });
    }
  },
};

export default moviesController;
