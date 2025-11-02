import api from './axios';

export const flightsAPI = {
  getAll: (params) => api.get('/flights', { params }),
  getById: (id) => api.get(`/flights/${id}`),
  create: (data) => api.post('/flights', data),
  update: (id, data) => api.put(`/flights/${id}`, data),
  delete: (id) => api.delete(`/flights/${id}`),
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/flights/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getToday: () => api.get('/flights/today'),
  getSummary: (date) => api.get('/flights/summary', { params: { date } }),
};

