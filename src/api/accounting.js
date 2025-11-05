import api from './axios';

export const accountingAPI = {
  getAll: () => api.get('/accounting'),
  getById: (id) => api.get(`/accounting/${id}`),
  create: (data) => api.post('/accounting', data),
  update: (id, data) => api.put(`/accounting/${id}`, data),
  delete: (id) => api.delete(`/accounting/${id}`),
};

