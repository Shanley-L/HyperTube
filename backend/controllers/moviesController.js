import { response } from "express";

const GENRES_MAP = {
    28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie", 80: "Crime",
    99: "Documentaire", 18: "Drame", 10751: "Familial", 14: "Fantastique",
    36: "Histoire", 27: "Horreur", 10402: "Musique", 9648: "Mystère",
    10749: "Romance", 878: "Science-Fiction", 53: "Thriller", 10752: "Guerre"
};

const moviesController = {
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
    // 1. Correction du nom (doit matcher ton Axios : selectMovieid)
    const { selectMovieid } = req.body; 
    console.log("ID reçu :", selectMovieid);
    
    if (!selectMovieid) return res.status(400).json({ error: "ID manquant" });

    try {
        // 2. RECUPERER LES INFOS DU FILM (car tu n'as que l'ID)
        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${selectMovieid}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR`);
        const movieData = await movieRes.json();

        // 3. Récupérer l'ID IMDb
        const idRes = await fetch(`https://api.themoviedb.org/3/movie/${selectMovieid}/external_ids?api_key=${process.env.TMDB_API_KEY}`);
        const ids = await idRes.json();

        // 4. Lancer Jackett (On utilise le titre propre de TMDB)
        const searchQuery = `${movieData.title} ${movieData.release_date?.split('-')[0]}`;
        const jackettUrl = `http://localhost:9117/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${encodeURIComponent(searchQuery)}`;
        const jackettRes = await fetch(jackettUrl);
        const jackettData = await jackettRes.json();

        // 5. Réponse propre
        return res.json({
            info: {
                title: movieData.title,
                poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                year: movieData.release_date?.split('-')[0],
                rating: Math.round(movieData.vote_average * 10) / 10,
                genres: movieData.genres.map(g => g.name), // TMDB donne déjà les noms ici !
                overview: movieData.overview
            },
            torrents: jackettData.Results.slice(0, 10).map(t => ({
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
}
}

export default moviesController;