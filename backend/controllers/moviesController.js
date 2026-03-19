import { findById, addWatchedMovie, getWatchedMovies, checkIfMovieIsWatched } from "../models/user.js";

const parseJsonSafe = async (res) => {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const moviesController = {
    discover: async (req, res) => {
        const page = Number(req.query.page) || 1;
        try {
            const tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${page}`;
            const tmdbRes = await fetch(tmdbUrl);
            const tmdbData = await tmdbRes.json();
            return res.status(200).json({ page: tmdbData.page, total_pages: tmdbData.total_pages, results: tmdbData.results || [] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur de découverte" });
        }
    },
    getPosters: async (req, res) => {
        try {
            const apiKey = process.env.TMDB_API_KEY;
            if (!apiKey || apiKey.trim() === '') {
                console.warn("getPosters: TMDB_API_KEY absente ou vide dans .env");
                return res.json([]);
            }
            const pages = [1 ,2 ,3, 4, 5, 6, 7, 8, 9, 10];
            const fetchPage = (page) =>
                fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=${page}`
                ).then((r) => r.json());
            const allData = await Promise.all(pages.map(fetchPage));
            const results = allData.flatMap((data) => Array.isArray(data.results) ? data.results : []);
            const posters = results
                .filter((movie) => movie && movie.poster_path)
                .map((movie) => `https://image.tmdb.org/t/p/w300${movie.poster_path}`);
            if (posters.length === 0) {
                console.warn("getPosters: aucun poster (results:", results.length, ", keys reçues:", data ? Object.keys(data) : "null", ")");
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

            console.log(tmdbData.results)

            return res.status(200).json(tmdbData.results)

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur de recherche combinée" });
        }
    },
    select: async (req, res) => {
        const { selectMovieid } = req.body; 
        console.log("ID reçu :", selectMovieid);
        
        if (!selectMovieid) return res.status(400).json({ error: "ID manquant" });

        try {
            const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${selectMovieid}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`);
            const movieData = await parseJsonSafe(movieRes);
            if (!movieRes.ok || !movieData || !movieData.title) {
                return res.status(502).json({ error: "Réponse invalide de TMDB" });
            }

            const searchQuery = `${movieData.title} ${movieData.release_date?.split('-')[0]}`;
            const jackettUrl = `http://localhost:9117/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${encodeURIComponent(searchQuery)}`;
            let jackettResults = [];
            try {
                const jackettRes = await fetch(jackettUrl);
                const jackettData = await parseJsonSafe(jackettRes);
                if (jackettRes.ok && Array.isArray(jackettData?.Results)) {
                    jackettResults = jackettData.Results;
                }
            } catch {
                jackettResults = [];
            }

            return res.json({
                info: {
                    title: movieData.title,
                    poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                    year: movieData.release_date?.split('-')[0],
                    rating: Math.round(movieData.vote_average * 10) / 10,
                    genres: Array.isArray(movieData.genres) ? movieData.genres.map(g => g.name) : [],
                    overview: movieData.overview
                },
                torrents: jackettResults.slice(0, 10).map(t => ({
                    title: t.Title,
                    seeders: t.Seeders,
                    size: (t.Size / (1024**3)).toFixed(2) + " GB",
                    magnet: t.MagnetUri || t.Link
                }))
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
        if (!user) return res.status(401).json({ error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
        const isWatched = await checkIfMovieIsWatched(userId, selectMovieid);
        if (isWatched) return res.status(200).json({ message: "Film déjà ajouter" });
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
            if (!user) return res.status(401).json({ error: "Utilisateur introuvable", code: "USER_NOT_FOUND" });
            const watchedMovies = await getWatchedMovies(userId);
            return res.json(watchedMovies);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur lors de la récupération des films" });
        }
    }
}

export default moviesController;