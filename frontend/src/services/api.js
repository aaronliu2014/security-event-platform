import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const eventService = {
  getEvents: (params) => apiClient.get('/events', { params }),
  getEventById: (id) => apiClient.get(`/events/${id}`),
  searchEvents: (query) => apiClient.get('/events/search', { params: { q: query } }),
};

export const userService = {
  register: (data) => apiClient.post('/users/register', data),
  login: (credentials) => apiClient.post('/users/login', credentials),
  getProfile: () => apiClient.get('/users/profile'),
  updatePreferences: (preferences) => apiClient.put('/users/preferences', preferences),
};

export default apiClient;
