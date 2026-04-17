import api from './api'

export const hcpService = {
  list: (params = {}) => api.get('/api/hcps/', { params }).then(r => r.data),
  getById: (id) => api.get(`/api/hcps/${id}`).then(r => r.data),
  create: (data) => api.post('/api/hcps/', data).then(r => r.data),
  update: (id, data) => api.put(`/api/hcps/${id}`, data).then(r => r.data),
}
