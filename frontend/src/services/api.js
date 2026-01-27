import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  googleAuth: () => `${API_URL}/auth/google`,
};

// Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  completeOnboarding: () => api.post('/profile/complete-onboarding'),
  getStrength: () => api.get('/profile/strength'),
};

// AI API
export const aiAPI = {
  chat: (message, conversationId) => 
    api.post('/ai/chat', { message, conversationId }),
  onboardingChat: (message, section) => 
    api.post('/ai/onboarding', { message, section }),
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id) => api.get(`/ai/conversations/${id}`),
};

// University API
export const universityAPI = {
  getAll: (params) => api.get('/universities', { params }),
  getRecommendations: () => api.get('/universities/recommendations'),
  getShortlist: () => api.get('/universities/shortlist'),
  addToShortlist: (data) => api.post('/universities/shortlist', data),
  removeFromShortlist: (id) => api.delete(`/universities/shortlist/${id}`),
  lock: (id) => api.post(`/universities/shortlist/${id}/lock`),
  unlock: (id) => api.post(`/universities/shortlist/${id}/unlock`),
};

// Task API
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  toggle: (id) => api.post(`/tasks/${id}/toggle`),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/user/dashboard'),
  updateStage: (stage) => api.put('/user/stage', { stage }),
};

export default api;
