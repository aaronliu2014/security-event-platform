import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = process.env.NODE_ENV === 'production' ? 30000 : 10000;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
};

export const eventService = {
  getEvents: (params) => apiClient.get('/events', { params }),
  getEventById: (id) => apiClient.get(`/events/${id}`),
  searchEvents: (params) => apiClient.get('/events/search', { params }),
  getStats: () => apiClient.get('/events/stats'),
  getEventsBySource: (source, params) => apiClient.get(`/events/source/${source}`, { params }),
};

export const analysisService = {
  getClusters: () => apiClient.get('/analysis/clusters'),
  getTrends: (days = 30) => apiClient.get('/analysis/trends', { params: { days } }),
  getSeverityDistribution: () => apiClient.get('/analysis/severity-distribution'),
  addTag: (eventId, tagName, severity) =>
    apiClient.post(`/analysis/tags/${eventId}`, { tag_name: tagName, severity }),
  getTags: (eventId) => apiClient.get(`/analysis/tags/${eventId}`),
};

export const userService = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getPreferences: () => apiClient.get('/users/preferences'),
  updatePreferences: (preferences) => apiClient.put('/users/preferences', preferences),
};

export const notificationService = {
  getNotifications: (params) => apiClient.get('/users/notifications', { params }),
  markRead: (id) => apiClient.put(`/users/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/users/notifications/mark-all-read'),
  getHistory: (params) => apiClient.get('/users/notifications/history', { params }),
  deleteNotification: (id) => apiClient.delete(`/users/notifications/${id}`),
};

export const newsService = {
  getNews: (params) => apiClient.get('/news', { params }),
  getFeatured: (params) => apiClient.get('/news/featured', { params }),
  getTrendingTags: (params) => apiClient.get('/news/tags', { params }),
  searchNews: (params) => apiClient.get('/news/search', { params }),
};

export default apiClient;
