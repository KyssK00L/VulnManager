import axios from 'axios'

import { broadcastUnauthorized, notify } from './notifications'

const api = axios.create({
  baseURL: '', // Use relative URLs to leverage Vite proxy
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      notify('Your session has expired. Please sign in again.', 'warning')
      broadcastUnauthorized()
    } else if (status === 403) {
      notify('You do not have permission to perform this action.', 'error')
    } else if (!status) {
      notify('Network error. Please check your connection.', 'error')
    }
    return Promise.reject(error)
  },
)

// Auth
export const authApi = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  getCurrentUser: () => api.get('/api/auth/me'),
}

// Vulnerabilities
export const vulnsApi = {
  search: (params) => api.get('/api/vulns', { params }),
  get: (id) => api.get(`/api/vulns/${id}`),
  create: (data) => api.post('/api/vulns', data),
  update: (id, data) => api.put(`/api/vulns/${id}`, data),
  delete: (id) => api.delete(`/api/vulns/${id}`),
  getHistory: (id) => api.get(`/api/vulns/${id}/history`),
  importXml: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/vulns/import/xml', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportXml: (ids = null) =>
    api.post('/api/vulns/export/xml', ids ? { ids } : null, {
      responseType: 'blob',
    }),
}

// API Tokens (admin only)
export const tokensApi = {
  list: () => api.get('/api/tokens'),
  get: (id) => api.get(`/api/tokens/${id}`),
  create: (data) => api.post('/api/tokens', data),
  revoke: (id) => api.delete(`/api/tokens/${id}`),
  rotate: (id) => api.post(`/api/tokens/${id}/rotate`),
}

export default api
