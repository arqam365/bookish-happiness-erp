import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  withCredentials: true,
  timeout: 30_000,
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (res.ok) {
          const { accessToken } = await res.json()
          setApiToken(accessToken)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        }
      } catch {}
      clearApiToken()
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function setApiToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function setApiInstituteId(id: string) {
  api.defaults.headers.common['X-Institute-Id'] = id
}

export function clearApiToken() {
  delete api.defaults.headers.common['Authorization']
  delete api.defaults.headers.common['X-Institute-Id']
}

export default api
