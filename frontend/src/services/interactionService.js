import api from './api'

export const interactionService = {
  list: (params = {}) => api.get('/api/interactions/', { params }).then(r => r.data),
  getById: (id) => api.get(`/api/interactions/${id}`).then(r => r.data),
  create: (data) => api.post('/api/interactions/', data).then(r => r.data),
  update: (id, data) => api.put(`/api/interactions/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/api/interactions/${id}`),
}
