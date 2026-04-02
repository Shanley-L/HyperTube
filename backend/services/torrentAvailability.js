const JACKETT_BASE_URL = "http://localhost:9117/api/v2.0/indexers/all/results";
const CACHE_TTL_MS = 10 * 60 * 1000;
const torrentAvailabilityCache = new Map();

const parseJsonSafe = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const getMovieYear = (movie) =>
  movie?.release_date?.split?.("-")?.[0] || movie?.year?.toString?.() || "";

const buildTorrentSearchQueries = (movie) => {
  const year = getMovieYear(movie);
  const titles = [
    movie?.original_title, // This is usually the most reliable for seeds
    movie?.title           // This is the translated version (FR or EN)
  ]
    .map((title) => title?.trim?.())
    .filter(Boolean);
  const uniqueTitles = Array.from(new Set(titles));

  return uniqueTitles.flatMap((title) => {
    const queries = [title];
    if (year) {
      queries.unshift(`${title} ${year}`);
    }
    return queries;
  });
};

const hasUsableTorrentResult = (result) => Boolean(result?.MagnetUri || result?.Link);

export const hasTorrentForMovie = async (movie) => {
  const apiKey = process.env.JACKETT_API_KEY;
  const movieId = movie?.id?.toString?.() || movie?.tmdb_id?.toString?.();
  if (!movieId) return false;
  if (!apiKey) return null;

  const cached = torrentAvailabilityCache.get(movieId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const searchQueries = buildTorrentSearchQueries(movie);
  if (searchQueries.length === 0) {
    torrentAvailabilityCache.set(movieId, {
      value: false,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return false;
  }

  let hasTorrent = false;
  try {
    for (const searchQuery of searchQueries) {
      const jackettUrl = `${JACKETT_BASE_URL}?apikey=${encodeURIComponent(apiKey)}&Query=${encodeURIComponent(searchQuery)}`;
      const jackettRes = await fetch(jackettUrl);
      if (!jackettRes.ok) {
        torrentAvailabilityCache.set(movieId, {
          value: null,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return null;
      }

      const jackettData = await parseJsonSafe(jackettRes);
      if (!Array.isArray(jackettData?.Results)) {
        torrentAvailabilityCache.set(movieId, {
          value: null,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return null;
      }

      if (jackettData.Results.some(hasUsableTorrentResult)) {
        hasTorrent = true;
        break;
      }
    }
  } catch {
    torrentAvailabilityCache.set(movieId, {
      value: null,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return null;
  }

  torrentAvailabilityCache.set(movieId, {
    value: hasTorrent,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return hasTorrent;
};

export const filterMoviesWithTorrents = async (movies = []) => {
  const uniqueMovies = [];
  const seenIds = new Set();

  for (const movie of movies) {
    const movieId = movie?.id?.toString?.() || movie?.tmdb_id?.toString?.();
    if (!movieId || seenIds.has(movieId)) continue;
    seenIds.add(movieId);
    uniqueMovies.push(movie);
  }

  const checks = await Promise.all(
    uniqueMovies.map(async (movie) => ({
      movie,
      hasTorrent: await hasTorrentForMovie(movie),
    })),
  );

  const hasKnownResults = checks.some(({ hasTorrent }) => hasTorrent !== null);
  if (!hasKnownResults) {
    return uniqueMovies;
  }

  return checks.filter(({ hasTorrent }) => hasTorrent !== false).map(({ movie }) => movie);
};
