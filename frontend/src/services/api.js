import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/user/me'),
};

// User
export const userAPI = {
  updateProfile: (data) => api.put('/user/profile', data),
  upgradeToNoteMaker: (data) => api.post('/user/upgrade/notemaker', data),
};

// Notes
export const notesAPI = {
  create: (data) => api.post('/notes/create', data),
  getMine: () => api.get('/notes/mine'),
  update: (id, data) => api.put(`/notes/${id}/update`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  // Image upload and AI extraction
  uploadImages: (formData) => api.post('/notes/upload-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadBase64: (data) => api.post('/notes/upload-base64', data),
  extractText: (imageUrl) => api.post('/notes/extract-text', { imageUrl }),
  analyzeImages: (imageUrls, subject) => api.post('/notes/analyze-images', { imageUrls, subject }),
  createFromImages: (formData) => api.post('/notes/create-from-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Marketplace
export const marketplaceAPI = {
  getNotes: (params) => api.get('/marketplace/notes', { params }),
  getNote: (id) => api.get(`/marketplace/notes/${id}`),
  getSubjects: () => api.get('/marketplace/subjects'),
  generateSummary: (id, data) => api.post(`/marketplace/notes/${id}/ai/summary`, data),
  generateBriefSummary: (id) => api.post(`/marketplace/notes/${id}/ai/brief-summary`),
  generateQuiz: (id, data) => api.post(`/marketplace/notes/${id}/ai/quiz`, data),
  generateFlashcards: (id, data) => api.post(`/marketplace/notes/${id}/ai/flashcards`, data),
};

// Purchase
export const purchaseAPI = {
  purchaseNote: (noteId) => api.post(`/purchase/note/${noteId}`),
  purchaseSubscription: () => api.post('/purchase/subscription'),
  getMyPurchases: () => api.get('/purchase/my-purchases'),
  addAnnotation: (purchaseId, data) => api.post(`/purchase/${purchaseId}/annotate`, data),
  addComment: (purchaseId, data) => api.post(`/purchase/${purchaseId}/comment`, data),
};

// Wallet
export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  topup: (data) => api.post('/wallet/topup', data),
};

// Review
export const reviewAPI = {
  create: (noteId, data) => api.post(`/review/notes/${noteId}`, data),
  getReviews: (noteId, params) => api.get(`/review/notes/${noteId}`, { params }),
};

// Tutoring
export const tutoringAPI = {
  createRequest: (data) => api.post('/tutoring/request', data),
  getMyRequests: () => api.get('/tutoring/my-requests'),
  getRequestsForMe: () => api.get('/tutoring/requests-for-me'),
  respond: (id, data) => api.post(`/tutoring/${id}/respond`, data),
  pay: (id) => api.post(`/tutoring/${id}/pay`),
};

// Admin
export const adminAPI = {
  getSimilarityQueue: () => api.get('/admin/similarity-queue'),
  approveNote: (id) => api.post(`/admin/note/${id}/approve`),
  rejectNote: (id, data) => api.post(`/admin/note/${id}/reject`, data),
  getStats: () => api.get('/admin/stats'),
};

export default api;
