import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

if (typeof window !== 'undefined') {
  console.log('[api] baseURL:', baseURL)
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  console.log('[api] →', config.method?.toUpperCase(), (config.baseURL ?? '') + (config.url ?? ''))
  return config
})

api.interceptors.response.use(
  (res) => {
    console.log('[api] ←', res.status, res.config.url)
    return res
  },
  (error) => {
    console.error('[api] error', error.response?.status, error.config?.url, error.response?.data)
    if (error.response?.status === 401) {
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
