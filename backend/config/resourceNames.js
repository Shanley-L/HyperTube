const API_PREFIX = '/api';

export const ApiRoutes = {
  BaseUrl: "http://localhost:5173",
  API: API_PREFIX,
  Video: `${API_PREFIX}/video`,
  Auth: `${API_PREFIX}/auth`,
  Health: `${API_PREFIX}/health`,
  DBHealth: `${API_PREFIX}/db/health`,
  Stream: `${API_PREFIX}/video/stream/:id`,
};