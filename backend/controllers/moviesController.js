const GENRES_MAP = {
    28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie", 80: "Crime",
    99: "Documentaire", 18: "Drame", 10751: "Familial", 14: "Fantastique",
    36: "Histoire", 27: "Horreur", 10402: "Musique", 9648: "Mystère",
    10749: "Romance", 878: "Science-Fiction", 53: "Thriller", 10752: "Guerre"
};

const moviesController = {
    getPosters: async (req, res) => {
        try {
            const apiKey = process.env.TMDB_API_KEY;
            if (!apiKey || apiKey.trim() === '') {
                console.warn("getPosters: TMDB_API_KEY absente ou vide dans .env");
                return res.json([]);
            }
            const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=1`;
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok) {
                console.warn("getPosters: TMDb erreur", response.status, data.status_message || data);
                return res.json([]);
            }
            const results = Array.isArray(data.results) ? data.results : [];
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

            const bestMatch = tmdbData.results[0];
            if (!bestMatch) return res.json([]);

            // 2. Récupérer l'ID IMDb (indispensable pour Jackett)
            const idUrl = `https://api.themoviedb.org/3/movie/${bestMatch.id}/external_ids?api_key=${process.env.TMDB_API_KEY}`;
            const idRes = await fetch(idUrl);
            const ids = await idRes.json();

            // 3. Lancer Jackett uniquement sur cet ID précis (Zéro erreur possible)
            const searchQuery = `${bestMatch.title} ${bestMatch.release_date?.split('-')[0]}`;
            const jackettUrl = `http://localhost:9117/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${encodeURIComponent(searchQuery)}`;
            const jackettRes = await fetch(jackettUrl);
            const jackettData = await jackettRes.json();

            // 4. On renvoie un objet propre : Infos TMDB + Torrents Jackett
            res.json({
                info: {
                    title: bestMatch.title,
                    poster: `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`,
                    year: bestMatch.release_date?.split('-')[0],
                    rating: Math.round(bestMatch.vote_average * 10) / 10,
                    genres: bestMatch.genre_ids.map(id => GENRES_MAP[id]).filter(Boolean),
                    overview: bestMatch.overview,
                    watched: null
                },
                torrents: jackettData.Results.slice(0, 10).map(t => ({
                    title: t.Title,
                    seeders: t.Seeders,
                    size: t.Size,
                    magnet: t.MagnetUri || t.Link
                }))
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur de recherche combinée" });
        }
    }
}

export default moviesController;