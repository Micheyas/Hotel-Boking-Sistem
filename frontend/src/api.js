import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests — staffToken takes absolute priority over customer token
api.interceptors.request.use((config) => {
  const staffToken = sessionStorage.getItem('staffToken');
  const customerToken = localStorage.getItem('token');
  // Never mix staff and customer tokens — use whichever is appropriate
  const token = staffToken || customerToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401/403 clear stale tokens so user is forced to re-login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const msg = error.response?.data?.error || '';
      // Only clear if it's a token issue, not a permissions issue
      if (msg.includes('Invalid token') || msg.includes('Access token required')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('staffToken');
        sessionStorage.removeItem('staffUser');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
