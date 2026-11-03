// Centralized API client for PerformaCOS 3-Tier Architecture
// Communicates strictly with the FastAPI backend over HTTP

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('performa_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
    register: async (payload) => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.access_token) {
        localStorage.setItem('performa_token', res.access_token);
        localStorage.setItem('performa_user', JSON.stringify(res.user));
      }
      return res;
    },
    getMe: () => request('/auth/me'),
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyOtp: (email, otp_code) =>
      request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp_code }),
      }),
    resetPassword: (reset_token, new_password) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ reset_token, new_password }),
      }),
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
    update: (deptId, data) =>
      request(`/departments/${deptId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (deptId) =>
      request(`/departments/${deptId}`, {
        method: 'DELETE',
      }),
  },

  // Users & Personnel (UC-07)
  users: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.role) query.append('role', params.role);
      if (params.department_id) query.append('department_id', params.department_id);
      if (params.is_active !== undefined) query.append('is_active', params.is_active);
      if (params.is_archived !== undefined) query.append('is_archived', params.is_archived);
      if (params.search) query.append('search', params.search);
      const qs = query.toString();
      return request(`/users${qs ? `?${qs}` : ''}`);
    },
    get: (userId) => request(`/users/${userId}`),
    create: (data) =>
      request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateContact: (userId, data) =>
      request(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    adminUpdate: (userId, data) =>
      request(`/users/${userId}/admin-update`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    transferDepartment: (userId, departmentId) =>
      request(`/users/${userId}/department`, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: departmentId }),
      }),
    archive: (userId) =>
      request(`/users/${userId}/archive`, {
        method: 'PATCH',
      }),
    restore: (userId) =>
      request(`/users/${userId}/restore`, {
        method: 'PATCH',
      }),
    changePassword: (userId, current_password, new_password) =>
      request(`/users/${userId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ current_password, new_password }),
      }),
  },

  // Invitation Management
  invitations: {
    create: (data) =>
      request('/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => request('/invitations'),
    revoke: (id) =>
      request(`/invitations/${id}`, {
        method: 'DELETE',
      }),
    validate: (token) => request(`/invitations/validate?token=${encodeURIComponent(token)}`),
  },

  // Daily Accomplishment Reports (DAR) & Geofencing (UC-13, FR-29, FR-30)
  dar: {
    list: (userId = null, month = null, year = null) => {
      const query = new URLSearchParams();
      if (userId) query.append('user_id', userId);
      if (month) query.append('month', month);
      if (year) query.append('year', year);
      const qs = query.toString();
      return request(`/dar${qs ? `?${qs}` : ''}`);
    },
    monthly: (userId = null, monthName = null, year = null) => {
      const query = new URLSearchParams();
      if (userId) query.append('user_id', userId);
      if (monthName) query.append('month_name', monthName);
      if (year) query.append('year', year);
      const qs = query.toString();
      return request(`/dar/monthly${qs ? `?${qs}` : ''}`);
    },
    submit: (data) =>
      request('/dar', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // File Uploads (Supabase Storage via FastAPI)
  uploads: {
    uploadDarPhoto: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/uploads/dar-photo', {
        method: 'POST',
        body: formData,
      });
    },
    uploadAvatar: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/uploads/avatar', {
        method: 'POST',
        body: formData,
      });
    },
    uploadLoi: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/uploads/loi', {
        method: 'POST',
        body: formData,
      });
    },
    uploadFastTrack: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/uploads/fast-track', {
        method: 'POST',
        body: formData,
      });
    },
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

  // Audit Logs & Security Trail (Phase 4)
  audit: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      if (params.action) query.append('action', params.action);
      if (params.role) query.append('role', params.role);
      if (params.search) query.append('search', params.search);
      if (params.start_date) query.append('start_date', params.start_date);
      if (params.end_date) query.append('end_date', params.end_date);
      const qs = query.toString();
      return request(`/audit-logs${qs ? `?${qs}` : ''}`);
    },
  },

  // Dashboard Analytics (Phase 4)
  analytics: {
    getHRDashboard: () => request('/analytics/hr-dashboard'),
    getDeptHeadDashboard: () => request('/analytics/depthead-dashboard'),
    getEmployeeDashboard: () => request('/analytics/employee-dashboard'),
  },

  // In-App Notifications (Phase 4)
  notifications: {
    list: (unreadOnly = false) =>
      request(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
    markAsRead: (id) =>
      request(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllAsRead: () =>
      request('/notifications/read-all', {
        method: 'PATCH',
      }),
    delete: (id) =>
      request(`/notifications/${id}`, {
        method: 'DELETE',
      }),
  },

  // Concurrent User Sessions & Device Security (Phase 4)
  sessions: {
    list: () => request('/sessions'),
    revoke: (id) =>
      request(`/sessions/${id}`, {
        method: 'DELETE',
      }),
    revokeAllOthers: () =>
      request('/sessions/all/others', {
        method: 'DELETE',
      }),
  },
};

export default api;
