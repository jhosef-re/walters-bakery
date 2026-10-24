import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && !error.config.__isRetry) {
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('access_token', data.access_token);
        error.config.__isRetry = true;
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return api.request(error.config);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
