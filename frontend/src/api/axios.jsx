// src/api/axios.js

import axios from 'axios'

export const getBackendBaseUrl = () => {
  const defaultHost = `${window.location.protocol}//${window.location.hostname}:8000`
  return (import.meta.env.VITE_BACKEND_URL || defaultHost).replace(/\/$/, '')
}

export const backendBaseUrl = getBackendBaseUrl()

const api = axios.create({
  baseURL: `${backendBaseUrl}/api`,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refresh  = localStorage.getItem('refresh_token')
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/token/refresh/`,
          { refresh }
        )
        const newToken = response.data.access
        localStorage.setItem('access_token', newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
