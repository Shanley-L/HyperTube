const API_PREFIX = '/api';

export const ApiRoutes = {
  BaseUrl: "http://localhost:5173",
  API: API_PREFIX,
  Video: `${API_PREFIX}/video`,
  Auth: `${API_PREFIX}/auth`,
  Health: `${API_PREFIX}/health`,
  DBHealth: `${API_PREFIX}/db/health`,
  Comments: `${API_PREFIX}/comments`,
  Uploads: `${API_PREFIX}/uploads`,
  Posters: '/movies/posters',

  Stream: '/stream/:id'


};

export const MoviesRoutes = {
  MOVIES: '/movies',
  MOVIES_DISCOVER: '/discover',
  MOVIES_SEARCH: '/search',
  MOVIES_SELECT: '/select',
  MOVIES_POSTERS: '/posters',
  MOVIES_WATCHED: '/watched',
  MOVIES_GET_WATCHED_MOVIES: '/getwatchedmovies'
};

export const UserRoutes = {
  USERS: '/users',
  ME: '/users/me',
  FAVORITES: `/users/me/favorites`,
  WATCHED_MOVIES: 'movies/getwatchedmovies'
};

export const Video = {
  SUBTITLES: '/video/subtitles',
  STATUS: '/video/status',
  SELECT: '/movies/select'
}