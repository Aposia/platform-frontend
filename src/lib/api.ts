import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

const api: AxiosInstance = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('no refresh token')
        const { data } = await axios.post(`${BASE}/api/v1/auth/refresh`, { refresh_token: refresh })
        localStorage.setItem('access_token', data.access_token)
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiRegister(email: string, password: string, full_name: string) {
  const { data } = await api.post('/auth/register', { email, password, full_name })
  return data
}

export async function apiLogin(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function apiMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function apiRequestPasswordReset(email: string) {
  const { data } = await api.post('/auth/password-reset/request', { email })
  return data
}

export async function apiConfirmPasswordReset(token: string, new_password: string) {
  const { data } = await api.post('/auth/password-reset/confirm', { token, new_password })
  return data
}

// ── Courses ───────────────────────────────────────────────────────────────────

export async function apiMyCourses() {
  const { data } = await api.get('/my/courses')
  return data
}

export async function apiGetProducts() {
  const { data } = await api.get('/products')
  return data
}

export async function apiGetCourseContent(slug: string) {
  const { data } = await api.get(`/courses/${slug}/learn`)
  return data
}

export async function apiMarkLessonComplete(lessonId: string) {
  const { data } = await api.post(`/my/lessons/${lessonId}/complete`)
  return data
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export async function apiCreateStripeSession(product_slug: string) {
  const { data } = await api.post('/checkout/stripe/create-session', { product_slug })
  return data // { checkout_url, session_id }
}

export default api
