import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  completeOnboarding: (formData) => api.post('/auth/onboarding', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  updateProfile: (formData) => api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (online) => api.post('/users/status', { online })
};

export const conversationAPI = {
  getOrCreate: (participantId) => api.post('/conversations', { participantId }),
  getAll: () => api.get('/conversations'),
  update: (id, data) => api.put(`/conversations/${id}`, data),
  markAllRead: (id) => api.post(`/conversations/${id}/mark-read`)
};

export const messageAPI = {
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (formData) => api.post('/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  addReaction: (id, emoji) => api.post(`/messages/${id}/react`, { emoji })
};

export const memoryAPI = {
  getMemories: (conversationId) => api.get(`/memories/${conversationId}`),
  createMemory: (formData) => api.post('/memories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteMemory: (id) => api.delete(`/memories/${id}`)
};

export const surpriseAPI = {
  getSurprises: () => api.get('/surprises'),
  unlockSurprise: (id) => api.put(`/surprises/${id}/unlock`),
  createSurprise: (formData) => api.post('/surprises', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const complimentAPI = {
  getRandom: () => api.get('/compliments/random'),
  getAll: () => api.get('/compliments'),
  create: (text) => api.post('/compliments', { text }),
  delete: (id) => api.delete(`/compliments/${id}`)
};

export const questionAPI = {
  getToday: () => api.get('/questions/today'),
  answer: (questionId, answer) => api.post('/questions/answer', { questionId, answer }),
  create: (data) => api.post('/questions', data)
};

export const gameAPI = {
  getQuestions: (gameType) => api.get(`/games/${gameType}`),
  createQuestion: (data) => api.post('/games', data)
};

export const openWhenAPI = {
  getAll: () => api.get('/open-when'),
  open: (id) => api.put(`/open-when/${id}/open`),
  create: (formData) => api.post('/open-when', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};


export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getCompliments: () => api.get('/admin/compliments'),
  getQuestions: () => api.get('/admin/questions'),
  getGameQuestions: () => api.get('/admin/game-questions'),
  getAlmostSaid: () => api.get('/admin/almost-said'),
  createAlmostSaid: (text) => api.post('/admin/almost-said', { text }),
  getSurprises: () => api.get('/admin/surprises'),
  getOpenWhen: () => api.get('/admin/open-when')
};

export const specialUserAPI = {
  getAll: () => api.get('/special-users'),
  add: (userId, experiences) => api.post('/special-users', { userId, experiences }),
  update: (id, data) => api.put(`/special-users/${id}`, data),
  remove: (id) => api.delete(`/special-users/${id}`)
};


export default api;