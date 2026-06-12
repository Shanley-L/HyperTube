export function defaultAvatarUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}avatar-silhouette.svg`;
}

function uploadsOrigin() {
  const api = (import.meta.env.VITE_API_URL || '').trim();
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return api.replace(/\/api\/?$/, '').replace(/\/$/, '') || api.replace(/\/$/, '');
  }
  const backend = (import.meta.env.VITE_BACKEND_URL || '').trim();
  if (backend.startsWith('http://') || backend.startsWith('https://')) {
    return backend.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function resolveAvatarUrl(profilePictureUrl) {
  if (profilePictureUrl && String(profilePictureUrl).trim()) {
    const u = String(profilePictureUrl).split('?')[0];
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    let path = u.startsWith('/') ? u : `/${u}`;
    if (path.startsWith('/uploads/')) {
      path = `/api${path}`;
    }
    const base = uploadsOrigin();
    return `${base}${path}`;
  }
  return defaultAvatarUrl();
}

export function avatarSrcWithBust(profilePictureUrl, bust) {
  const base = resolveAvatarUrl(profilePictureUrl);
  if (!bust || base === defaultAvatarUrl()) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}v=${bust}`;
}
