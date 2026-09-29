const API_BASE = '/api';

// Identical create/update/delete requests that are already in flight share
// one network call. This makes a double-tap on a slow phone connection
// harmless, instead of creating the same record twice.
const inFlight = new Map();

async function sendRequest(path, options) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  // A rejected token on any non-login request means the session has
  // expired (tokens last 7 days), so send the person back to log in.
  if ((response.status === 401 || response.status === 403) && !path.startsWith('/auth/')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
    throw new Error('Your session has expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET') return sendRequest(path, options);

  const key = `${method} ${path} ${options.body || ''}`;
  if (inFlight.has(key)) return inFlight.get(key);

  const request = sendRequest(path, options).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

// Shows a loading message inside an empty container. Does nothing when the
// container already has content, so reloads after an edit don't flash.
function showLoading(el, text) {
  if (el && el.innerHTML.trim() === '') {
    el.innerHTML = `<p class="empty-state">${text}</p>`;
  }
}
