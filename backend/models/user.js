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
  if (result.rows.length > 0) return result.rows[0];

  let username = profile.username || profile.email.split('@')[0];
  while (await findByUsername(username)) {
    username = username + '_' + Math.floor(Math.random() * 1000);
  }
  const insertQuery = `INSERT INTO users (email, username, first_name, last_name, oauth_provider, oauth_id, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${SAFE_USER_COLUMNS}`
  const values = [
    profile.email,
    username,
    profile.first_name,
    profile.last_name,
    provider,
    providerId,
  ];
  const insertResult = await pool.query(insertQuery, values);
  return insertResult.rows[0];
};