// Centralized API client for PerformaCOS 3-Tier Architecture
// Communicates strictly with the FastAPI backend over HTTP (No direct database/Supabase calls in frontend)

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('performa_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorDetail = 'An unexpected server error occurred.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // System Health
  checkHealth: () => request('/health'),

  // Auth Endpoints
  auth: {
    login: async (email, password) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.access_token) {
        localStorage.setItem('performa_token', res.access_token);
        localStorage.setItem('performa_user', JSON.stringify(res.user));
      }
      return res;
    },
    logout: () => {
      localStorage.removeItem('performa_token');
      localStorage.removeItem('performa_user');
    },
    getCurrentUser: () => {
      try {
        return JSON.parse(localStorage.getItem('performa_user'));
      } catch (e) {
        return null;
      }
    },
  },

  // Department Management (UC-10, FR-23)
  departments: {
    list: () => request('/departments'),
    create: (data) =>
      request('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (deptId) =>
      request(`/departments/${deptId}`, {
        method: 'DELETE',
      }),
  },

  // Users & Personnel (UC-07)
  users: {
    list: () => request('/users'),
  },

  // Daily Accomplishment Reports (DAR) & Geofencing (UC-13, FR-29, FR-30)
  dar: {
    list: (userId = null) =>
      request(`/dar${userId ? `?user_id=${userId}` : ''}`),
    submit: (data) =>
      request('/dar', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Multi-Level Evaluation (50/20/30) (UC-01, UC-04, UC-05, UC-06)
  evaluations: {
    list: () => request('/evaluations'),
    submitScore: (evalId, scoreData) =>
      request(`/evaluations/${evalId}/score`, {
        method: 'POST',
        body: JSON.stringify(scoreData),
      }),
    fastTrackReject: (evalId, rejectionData) =>
      request(`/evaluations/${evalId}/fast-track-reject`, {
        method: 'POST',
        body: JSON.stringify(rejectionData),
      }),
  },

  // Contract Renewals & LOI (UC-02)
  renewals: {
    list: () => request('/renewals'),
    submit: (data) =>
      request('/renewals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export default api;
