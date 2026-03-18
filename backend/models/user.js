import pool from '../config/database.js';
import bcrypt from 'bcrypt';

const SAFE_USER_COLUMNS = 'id, email, username, first_name, last_name, profile_picture_url, preferred_language, oauth_provider, oauth_id, email_verified, created_at, updated_at';

export const toSafeUser = (user) => {
  if (!user) return null;
  const { password_hash, reset_password_token, reset_password_expires, ...safe } = user;
  return safe;
};

export const createUser = async (user) => {
  const { email, username, first_name, last_name, password } = user;
  const hashed = await bcrypt.hash(password, 10);
  const query = `INSERT INTO users (email, username, first_name, last_name, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING ${SAFE_USER_COLUMNS}`;
  const values = [email, username, first_name, last_name, hashed];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

export const findByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

export const findById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateResetToken = async (userId, token, expires) => {
  const query = 'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3'
  const values = [token, expires, userId];
  await pool.query(query, values);
};

export const findByResetToken = async (token) => {
  const query = 'SELECT * FROM users where reset_password_token = $1'
  const result = await pool.query(query, [token]);
  return result.rows[0];
};

export const updatePassword = async (userId, newHash) => {
  const query = 'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2'
  const values = [newHash, userId];
  await pool.query(query, values);
};

export const findOrCreateOAuthUser =  async (provider, providerId, profile) => {
  const query = 'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2'
  const result = await pool.query(query, [provider, providerId]);
  if (result.rows.length > 0) {
    const row = result.rows[0];
    if (profile.picture_url && !row.profile_picture_url) {
      await pool.query(
        'UPDATE users SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [profile.picture_url, row.id]
      );
      row.profile_picture_url = profile.picture_url;
    }
    return row;
  }

  let username = profile.username || profile.email.split('@')[0];
  while (await findByUsername(username)) {
    username = username + '_' + Math.floor(Math.random() * 1000);
  }
  const insertQuery = `INSERT INTO users (email, username, first_name, last_name, profile_picture_url, oauth_provider, oauth_id, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${SAFE_USER_COLUMNS}`
  const values = [
    profile.email,
    username,
    profile.first_name,
    profile.last_name,
    profile.picture_url || null,
    provider,
    providerId,
    true,
  ];
  const insertResult = await pool.query(insertQuery, values);
  return insertResult.rows[0];
};

export const updateUserProfile = async (userId, { username, first_name, last_name, email, profile_picture_url }) => {
  const updates = [];
  const values = [];
  let n = 1;
  if (username !== undefined) { updates.push(`username = $${n++}`); values.push(username); }
  if (first_name !== undefined) { updates.push(`first_name = $${n++}`); values.push(first_name); }
  if (last_name !== undefined) { updates.push(`last_name = $${n++}`); values.push(last_name); }
  if (email !== undefined) { updates.push(`email = $${n++}`); values.push(email); }
  if (profile_picture_url !== undefined) { updates.push(`profile_picture_url = $${n++}`); values.push(profile_picture_url); }
  if (updates.length === 0) return findById(userId);
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);
  const q = `UPDATE users SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`;
  const result = await pool.query(q, values);
  return result.rows[0];
};

export const addWatchedMovie = async (userId, movieId) => {
  const query = 'INSERT INTO watched_movies (user_id, movie_id) VALUES ($1, $2) RETURNING *';
  const values = [userId, movieId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getWatchedMovies = async (userId) => {
  console.log(userId);
  const query = 'SELECT movie_id FROM watched_movies WHERE user_id = $1';
  const result = await pool.query(query, [userId]);
  return result.rows.map(row => row.movie_id) ;
};

export const checkIfMovieIsWatched = async (userId, movieId) => {
  const query = 'SELECT * FROM watched_movies WHERE user_id = $1 AND movie_id = $2';
  const result = await pool.query(query, [userId, movieId]);
  return result.rows.length > 0;
};

export const addFavoriteMovie = async (userId, movieId) => {
  const query = `
    INSERT INTO favorite_movies (user_id, movie_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, movie_id) DO NOTHING
    RETURNING movie_id
  `;
  const result = await pool.query(query, [userId, movieId]);
  return result.rows[0]?.movie_id ?? null;
};

export const removeFavoriteMovie = async (userId, movieId) => {
  const query = 'DELETE FROM favorite_movies WHERE user_id = $1 AND movie_id = $2 RETURNING movie_id';
  const result = await pool.query(query, [userId, movieId]);
  return result.rows[0]?.movie_id ?? null;
};

export const getFavoriteMovies = async (userId) => {
  const query = 'SELECT movie_id FROM favorite_movies WHERE user_id = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [userId]);
  return result.rows.map((row) => row.movie_id);
};

const upsertMovieFromTMDB = async (movieId) => {
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!tmdbKey) throw new Error('TMDB_API_KEY is not configured');

  const movieRes = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${encodeURIComponent(tmdbKey)}&language=fr-FR`
  );
  if (!movieRes.ok) throw new Error('TMDB movie request failed');
  const movieData = await movieRes.json();

  const year = movieData?.release_date?.split?.('-')?.[0] ? Number(movieData.release_date.split('-')[0]) : null;
  const genreIds = Array.isArray(movieData.genre_ids) ? movieData.genre_ids.join(',') : '';

  const query = `
    INSERT INTO movies (title, year, imdb_rating, tmdb_id, cover_image_url, summary, genre)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (tmdb_id) DO UPDATE SET
      title = EXCLUDED.title,
      year = EXCLUDED.year,
      imdb_rating = EXCLUDED.imdb_rating,
      cover_image_url = EXCLUDED.cover_image_url,
      summary = EXCLUDED.summary,
      genre = EXCLUDED.genre,
      updated_at = CURRENT_TIMESTAMP
    RETURNING tmdb_id
  `;

  await pool.query(query, [
    movieData?.title ?? '',
    year,
    movieData?.vote_average ? Math.round(movieData.vote_average * 10) / 10 : null,
    String(movieData?.id ?? movieId),
    movieData?.poster_path ?? null,
    movieData?.overview ?? null,
    genreIds,
  ]);
};

export const upsertFavoriteMovieAndMetadata = async (userId, movieId) => {
  await upsertMovieFromTMDB(movieId);

  const favQuery = `
    INSERT INTO favorite_movies (user_id, movie_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, movie_id) DO NOTHING
    RETURNING movie_id
  `;
  const result = await pool.query(favQuery, [userId, movieId]);
  return result.rows[0]?.movie_id ?? null;
};

export const getFavoriteMovieCardsFromDB = async (userId) => {
  const query = `
    SELECT
      f.movie_id,
      m.tmdb_id,
      m.title,
      m.cover_image_url,
      m.year,
      m.imdb_rating,
      m.genre
    FROM favorite_movies f
    LEFT JOIN movies m ON m.tmdb_id = f.movie_id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  const missing = result.rows
    .filter((row) => !row.title)
    .map((row) => String(row.movie_id))
    .filter((id) => id && id.length > 0);

  const uniqueMissing = Array.from(new Set(missing));
  for (const id of uniqueMissing) {
    await upsertMovieFromTMDB(id);
  }

  const query2 = `
    SELECT
      m.tmdb_id,
      m.title,
      m.cover_image_url,
      m.year,
      m.imdb_rating,
      m.genre
    FROM favorite_movies f
    JOIN movies m ON m.tmdb_id = f.movie_id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;

  const finalResult = await pool.query(query2, [userId]);

  return finalResult.rows.map((row) => {
    const genreIds =
      typeof row.genre === 'string' && row.genre.trim().length > 0
        ? row.genre.split(',').map((x) => Number(x)).filter((n) => Number.isFinite(n))
        : [];
    const year = row.year != null ? Number(row.year) : null;
    return {
      id: String(row.tmdb_id),
      title: row.title,
      poster_path: row.cover_image_url,
      release_date: year ? `${year}-01-01` : null,
      vote_average: row.imdb_rating != null ? Number(row.imdb_rating) : null,
      genre_ids: genreIds,
    };
  });
};

export const addComment = async (userId, userName, movieId, comment) => {
  const query = 'INSERT INTO comments (user_id, user_name, movie_id, content) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [userId, userName, movieId, comment];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getComments = async (movieId) => {
  const query = 'SELECT * FROM comments WHERE movie_id = $1';
  const result = await pool.query(query, [movieId]);
  return result.rows;
};

export const updateComment = async (id, userId, comment) => {
  const query = 'UPDATE comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *';
  const values = [comment, id, userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteComment = async (id, userId) => {
    const query = 'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *';
    const values = [id, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
};