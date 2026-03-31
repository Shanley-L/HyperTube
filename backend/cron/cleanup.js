import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';

// Run once a day
// TODO : try with '* * * * *' (every minute) for testing, once ../downloads stores torrent files
cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Running daily disk cleanup...');
    
    const ONE_MONTH_AGO = new Date();
    ONE_MONTH_AGO.setMonth(ONE_MONTH_AGO.getMonth() - 1);

    try {
        const oldMovies = await pool.query(
            "SELECT id, path FROM movies WHERE last_viewed < $1", 
            [ONE_MONTH_AGO]
        );

        oldMovies.rows.forEach(movie => {
            const filePath = path.join('./downloads', movie.path);
            
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath, { recursive: true, force: true });
                console.log(`Deleted old movie: ${movie.id}`);
            }
        });
    } catch (err) {
        console.error('Cleanup error:', err);
    }
});