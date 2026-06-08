export const apiBase = () => (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const mediaBase = () => import.meta.env.VITE_MEDIA_URL?.replace(/\/$/, '') || '';

export const streamUrl = (hash, params) => {
  const query = new URLSearchParams(params).toString();
  return `${mediaBase()}${apiBase()}/video/stream/${hash}?${query}`;
};

export const subtitleUrl = (filePath) => `${mediaBase()}/subtitles/${filePath}`;
