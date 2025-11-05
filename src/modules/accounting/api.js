import api from '../../api/axios';

export const accountingAPI = {
  getAll: (params) => api.get('/accounting', { params }),
  getById: (id) => api.get(`/accounting/${id}`),
  create: (data) => api.post('/accounting', data),
  update: (id, data) => api.put(`/accounting/${id}`, data),
  delete: (id) => api.delete(`/accounting/${id}`),
  getSummary: (params) => api.get('/accounting/summary', { params }),
  getFlights: (params) => api.get('/accounting/flights', { params }),
  getFlightById: (id) => api.get(`/accounting/flights/${id}`),
  createFlight: (data) => api.post('/accounting/flights', data),
  updateFlight: (id, data) => api.put(`/accounting/flights/${id}`, data),
  deleteFlight: (id) => api.delete(`/accounting/flights/${id}`),
  getFlightByFlightId: (flightId) => api.get(`/accounting/flights/by-flight/${flightId}`),
  upsertFlightByFlightId: (flightId, data) => api.put(`/accounting/flights/by-flight/${flightId}`, data),
};

