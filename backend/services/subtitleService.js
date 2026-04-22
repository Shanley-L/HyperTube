import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_KEY = 'pFQLpEQy7aEHdKn4ZWkmxlrFWpH7pbCR';

export const fetchAndSaveSubtitles = async (imdbId, tmdbId, languages = ['en', 'fr']) => {
  if (!imdbId || imdbId === 'undefined' || !tmdbId || tmdbId === 'undefined') {
    console.error("Subtitle Service: Missing IDs", { imdbId, tmdbId });
    return [];
  }

  const subFolder = path.resolve('./subtitles');
  if (!fs.existsSync(subFolder)) fs.mkdirSync(subFolder);

  try {
    const cleanImdbId = imdbId.startsWith('tt') ? imdbId.replace('tt', '') : imdbId;

    const searchRes = await axios.get('https://api.opensubtitles.com/api/v1/subtitles', {
      params: {
        imdb_id: cleanImdbId,
        languages: languages.join(',')
      },
      headers: {
        'Api-Key': API_KEY,
        'User-Agent': 'Hypertube_App_v1'
      }
    });

    const results = searchRes.data.data;
    if (!results || results.length === 0) return [];

    const savedSubs = [];

    for (const lang of languages) {
      const sub = results.find(s => s.attributes.language === lang);
      
      if (sub && sub.attributes.files && sub.attributes.files.length > 0) {
        const fileId = sub.attributes.files[0].file_id;

        const downloadRes = await axios.post('https://api.opensubtitles.com/api/v1/download', 
          { file_id: fileId },
          { 
            headers: { 
              'Api-Key': API_KEY, 
              'User-Agent': 'Hypertubesub v1.0.0',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            } 
          }
        );

        if (downloadRes.data.link) {
          const fileName = `${tmdbId}-${lang}.vtt`;
          const fullPath = path.join(subFolder, fileName);

          const fileResponse = await axios.get(downloadRes.data.link, { responseType: 'arraybuffer' });
          fs.writeFileSync(fullPath, fileResponse.data);
          
          savedSubs.push({ lang, filePath: fileName });
        }
      }
    }
    return savedSubs;
  } catch (err) {
    console.error("New Subtitle API Error Detail:", err.response?.data || err.message);
    return [];
  }
};