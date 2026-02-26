import express from 'express';

const router = express.Router();

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Le paramètre 'q' est requis." });

    // Construction propre de l'URL pour Jackett
    const url = new URL('http://172.18.0.2:9117/api/v2.0/indexers/all/results');
    url.searchParams.append('apikey', process.env.JACKETT_API_KEY);
    url.searchParams.append('Query', q);
    [2000, 2010, 2040, 2045].forEach(c => url.searchParams.append('Category[]', c));

    try {
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`Jackett a répondu: ${response.status}`);
        
        const data = await response.json();
        
        const movies = data.Results.map(item => ({
            title: item.Title,
            size: item.Size,
            seeders: item.Seeders,
            magnet: item.MagnetUri || item.Link,
            imdbId: item.ImdbId ? `tt${item.ImdbId}` : null
        })).sort((a, b) => a.title.localeCompare(b.title));

        res.json(movies);
    } catch (error) {
        console.error("Erreur Jackett:", error.message);
        res.status(500).json({ error: "Erreur interne" });
    }
});

export default router;