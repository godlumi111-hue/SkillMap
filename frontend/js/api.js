// Couche d'abstraction API — centralise tous les appels vers le backend SkillMap

const API_BASE = 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('skillmap_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  // ─── Auth ──────────────────────────────────────────────────
  auth: {
    register:       (body)  => request('POST', '/auth/register', body),
    login:          (body)  => request('POST', '/auth/login', body),
    me:             ()      => request('GET',  '/auth/me'),
    password:       (body)  => request('PUT',  '/auth/password', body),
    changePassword: (body)  => request('PUT',  '/auth/password', body),
  },

  // ─── Providers ─────────────────────────────────────────────
  providers: {
    list:       (params = {}) => request('GET', '/providers?' + new URLSearchParams(params)),
    get:        (id, params = {}) => request('GET', `/providers/${id}?` + new URLSearchParams(params)),
    updateProfile:     (body) => request('PUT',   '/providers/me/profile', body),
    toggleAvailability:(body) => request('PATCH', '/providers/me/availability', body),
  },

  // ─── Reviews ───────────────────────────────────────────────
  reviews: {
    list:   (providerId)        => request('GET',  `/providers/${providerId}/reviews`),
    create: (providerId, body)  => request('POST', `/providers/${providerId}/reviews`, body),
  },

  // ─── Services ──────────────────────────────────────────────
  services: {
    list:         (params = {}) => request('GET',   '/services?' + new URLSearchParams(params)),
    myRequests:   (params = {}) => request('GET',   '/services?' + new URLSearchParams(params)),
    create:       (body)        => request('POST',  '/services', body),
    updateStatus: (id, status)  => request('PATCH', `/services/${id}/status`, { status }),
  },

  // ─── Favorites ─────────────────────────────────────────────
  favorites: {
    list:   ()           => request('GET',    '/favorites'),
    add:    (id)         => request('POST',   `/favorites/${id}`),
    remove: (id)         => request('DELETE', `/favorites/${id}`),
    check:  (id)         => request('GET',    `/favorites/${id}/check`),
  },

  // ─── Categories ────────────────────────────────────────────
  categories: {
    list: () => request('GET', '/categories'),
  },

  // ─── Messages ──────────────────────────────────────────────
  messages: {
    conversations: ()       => request('GET',  '/messages/conversations'),
    thread:        (userId) => request('GET',  `/messages/${userId}`),
    send:          (userId, content) => request('POST', `/messages/${userId}`, { content }),
  },

  // ─── Admin ─────────────────────────────────────────────────
  admin: {
    stats:          ()        => request('GET',   '/admin/stats'),
    users:          (params)  => request('GET',   '/admin/users?' + new URLSearchParams(params)),
    updateUser:     (id, body) => request('PATCH', `/admin/users/${id}`, body),
    verifyProvider: (id, body) => request('PATCH', `/admin/providers/${id}/verify`, body),
    reports:        ()         => request('GET',   '/admin/reports'),
    handleReport:   (id, body) => request('PATCH', `/admin/reports/${id}`, body),
    reviews:        ()         => request('GET',   '/admin/reviews'),
    moderateReview: (id, body) => request('PATCH', `/admin/reviews/${id}`, body),
  },

  // ─── Report ────────────────────────────────────────────────
  report: (providerId, body) => request('POST', `/providers/${providerId}/report`, body),
};

window.api = api;
