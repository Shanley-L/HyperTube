import { response } from "express";
import {
  findById,
  addWatchedMovie,
  getWatchedMovies,
  checkIfMovieIsWatched,
} from "../models/user.js";
import { filterMoviesWithTorrents } from "../services/torrentAvailability.js";

const CAM_REGEX = /\b(CAM|TS|TELESYNC|TC|SCREENER|SCR|HDCAM)\b/i;

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

const BEST_TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://tracker.leechers-paradise.org:6969/announce",
  "udp://9.rarbg.to:2710/announce",
  "udp://p4p.arenabg.com:1337/announce",
  "udp://movies.zsw.ca:6969/announce",
  "udp://tracker.cyberia.is:6969/announce",
]
  .map((t) => `&tr=${encodeURIComponent(t)}`)
  .join("");

const calculateScore = (t) => {
  let score = 0;
  const title = t.Title.toUpperCase();
  const seeders = parseInt(t.Seeders) || 0;
  const leechers = parseInt(t.Peers) || 0;
  const source = (t.Tracker || t.TrackerId || "").toLowerCase();

  // Minimum Viable Swarm
  if (seeders < 3) score -= 1000;
  if (seeders > 10) score += 500;

  // Ratio Check
  if (seeders > 0 && leechers > 0) {
    const ratio = seeders / leechers;
    if (ratio > 0.5 && ratio < 5) score += 400;
  } else if (seeders > 0 && leechers === 0) score -= 200;

  score += Math.min(seeders, 500);

  if (source.includes("yts")) score += 300;
  if (source.includes("thepiratebay")) score += 300;

  // Size Check
  const sizeGB = t.Size / 1024 ** 3;
  if (sizeGB > 1.5 && sizeGB < 5) score += 300;
  else if (sizeGB > 10) score -= 150; // Too heavy to start quickly

  // Encoding Check
  if (title.includes("X265") || title.includes("HEVC")) score += 150;

  return score;
};

const moviesController = {
  discover: async (req, res) => {
    const page = Number(req.query.page) || 1;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${page}`;
      const tmdbRes = await fetch(tmdbUrl);
      const tmdbData = await tmdbRes.json();
      const results = await filterMoviesWithTorrents(tmdbData.results || []);
      return res.status(200).json({
        page: tmdbData.page,
        total_pages: tmdbData.total_pages,
        results,
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

      const tmdbRes = await fetch(tmdbUrl);
      const tmdbData = await tmdbRes.json();

      // Vérification cruciale : est-ce qu'on a au moins un résultat ?
      if (!tmdbData.results || tmdbData.results.length === 0) {
        return res.status(404).json({ error: "Aucun film trouvé sur TMDB" });
      }

      const results = await filterMoviesWithTorrents(tmdbData.results);
      return res.status(200).json(results);
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

      // 1. DEDUPLICATION LOOP
      const uniqueTorrents = new Map();

      filtered.forEach((t) => {
        const score = calculateScore(t);
        const originalMagnet = t.MagnetUri || t.Link;

        const hashMatch = originalMagnet.match(/btih:([a-zA-Z0-9]+)/i);
        let uniqueKey;
        if (hashMatch) {
          uniqueKey = hashMatch[1].toLowerCase();
        } else {
          const cleanTitle = t.Title.replace(/[^A-Z0-9]/gi, "").toUpperCase();
          uniqueKey = `proxy_${cleanTitle}_${t.Size}`;
        }

        const boostedMagnet = originalMagnet.startsWith("magnet:?")
          ? originalMagnet + BEST_TRACKERS
          : originalMagnet;

        const item = {
          title: t.Title,
          seeders: t.Seeders,
          size: (t.Size / 1024 ** 3).toFixed(2) + " GB",
          magnet: boostedMagnet,
          source: t.Tracker || t.TrackerId || "Unknown",
          score,
          hash: uniqueKey,
        };

        // 🚀 IMPORTANT: Actually save it to the Map!
        // If we see the same hash, we keep the one with more seeders
        if (
          !uniqueTorrents.has(uniqueKey) ||
          item.seeders > uniqueTorrents.get(uniqueKey).seeders
        ) {
          uniqueTorrents.set(uniqueKey, item);
        }
      });

      // 2. CATEGORIZATION LOOP (Outside the first loop!)
      const deduplicatedArray = Array.from(uniqueTorrents.values());
      const tiers = { "4K": [], "1080p": [], "720p": [] }; // 🚀 Defined here, accessible below!

      deduplicatedArray.forEach((item) => {
        const titleUpper = item.title.toUpperCase();
        if (titleUpper.includes("2160P") || titleUpper.includes("4K"))
          tiers["4K"].push(item);
        else if (titleUpper.includes("1080P")) tiers["1080p"].push(item);
        else tiers["720p"].push(item);
      });

      // 3. 3x3 Strategy
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
