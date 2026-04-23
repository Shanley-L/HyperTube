import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 🚀 Pull from .env (make sure dotenv.config() is called in your main index.js/app.js)
const API_KEY = process.env.OPENSUBTITLES_API_KEY;

const convertSrtToVtt = (srtData) => {
    if (!srtData) return "";
    if (srtData.startsWith("WEBVTT")) return srtData;
    return "WEBVTT\n\n" + srtData.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
};

export const fetchAndSaveSubtitles = async (imdbId, tmdbId, languages = ['en', 'fr']) => {
  if (!imdbId || imdbId === 'undefined' || !tmdbId || tmdbId === 'undefined') {
    console.error("Subtitle Service: Missing IDs", { imdbId, tmdbId });
    return [];
  }

  // Safety check for the API key
  if (!API_KEY) {
    console.error("Subtitle Service: OPENSUBTITLES_API_KEY is missing in .env");
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
        'User-Agent': 'Hypertubesub v1.0.0'
      }
    });

    const results = searchRes.data.data;
    if (!results || results.length === 0) return [];

    const savedSubs = [];

    for (const lang of languages) {
      const sub = results.find(s => s.attributes.language.toLowerCase() === lang.toLowerCase());

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

          const fileResponse = await axios.get(downloadRes.data.link, { responseType: 'text' });
          const vttContent = convertSrtToVtt(fileResponse.data);

          fs.writeFileSync(fullPath, vttContent, 'utf-8');
          
          // 🚀 Match the keys your frontend is looking for: language and file_path
          savedSubs.push({ 
            language: lang, 
            file_path: fileName 
          });
        }
      }
    }
    return savedSubs;
  } catch (err) {
    console.error("New Subtitle API Error Detail:", err.response?.data || err.message);
    return [];
  }
};