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

export async function apiUpdateMe(payload: { full_name?: string; current_password?: string; new_password?: string }) {
  const { data } = await api.patch('/auth/me', payload)
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
  const { data } = await api.post(`/checkout/stripe/create-session?product_slug=${encodeURIComponent(product_slug)}`)
  return data // { checkout_url, session_id }
}

export async function apiVerifyPurchase(sessionId: string) {
  const { data } = await api.get(`/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
  return data as { verified: boolean; product_slug?: string; product_name?: string }
}

// ── Studio / AI Creator ───────────────────────────────────────────────────────

export async function apiStudioBalance() {
  const { data } = await api.get('/studio/credits/balance')
  return data  // { balance, subscription }
}

export async function apiStudioGallery() {
  const { data } = await api.get('/studio/gallery')
  return data  // Avatar[]
}

export interface WizardRequest {
  description: string
  archetype: string
  avatar_name: string
  business_context?: string
}

export async function apiStartWizard(req: WizardRequest) {
  const { data } = await api.post('/studio/wizard', req)
  return data  // { wizard_id, status, progress, message }
}

export async function apiWizardStatus(wizardId: string) {
  const { data } = await api.get(`/studio/wizard/${wizardId}/status`)
  return data  // { wizard_id, status, progress, message }
}

export async function apiWizardResult(wizardId: string) {
  const { data } = await api.get(`/studio/wizard/${wizardId}/result`)
  return data  // { wizard_id, avatar_id, portrait_b64, photos, archetype_tip }
}

export async function apiGeneratePortraits(description: string, refine?: string) {
  const { data } = await api.post("/studio/portraits", { description, refine })
  return data as { portraits_id: string; portraits: string[]; portrait_prompt: string }
}

export async function apiGenerateCharacterSheet(photosB64: string[], silhouetteDesc?: string) {
  const { data } = await api.post("/studio/character-sheet", { photos_b64: photosB64, silhouette_desc: silhouetteDesc })
  return data as { sheet_images: string[] }
}

export async function apiSaveAvatar(name: string) {
  const { data } = await api.post("/studio/avatars", { name })
  return data as { avatar_id: string; name: string }
}

export async function apiListAvatars() {
  const { data } = await api.get("/studio/avatars")
  return data as { id: string; name: string; created_at: string }[]
}

export async function apiGenerateSelfiePortraits(photosB64: string[], refine?: string) {
  const { data } = await api.post("/studio/selfie-portraits", { photos_b64: photosB64, refine })
  return data as { portraits: string[] }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function apiAdminStudents() {
  const { data } = await api.get('/admin/students')
  return data as {
    id: string; email: string; full_name: string | null; is_active: boolean; created_at: string;
    access: { slug: string; name: string; granted_at: string }[]
  }[]
}

export async function apiAdminGrantAccess(user_email: string, product_slug: string) {
  const { data } = await api.post(`/admin/grant-access?user_email=${encodeURIComponent(user_email)}&product_slug=${encodeURIComponent(product_slug)}`)
  return data as { status: string; user: string; product: string }
}

export async function apiAdminRevokeAccess(user_email: string, product_slug: string) {
  const { data } = await api.delete(`/admin/revoke-access?user_email=${encodeURIComponent(user_email)}&product_slug=${encodeURIComponent(product_slug)}`)
  return data as { status: string }
}

export async function apiAdminBulkGrant(items: { email: string; product_slug: string }[], create_users = true) {
  const { data } = await api.post('/admin/bulk-grant', { items, create_users })
  return data as { results: { email: string; slug: string; status: string; user_created?: boolean; temp_password?: string; detail?: string }[]; total: number }
}

export async function apiAdminCoursesList() {
  const { data } = await api.get('/admin/courses-list')
  return data as {
    course_id: string; course_title: string; product_name: string; product_slug: string;
    is_published: boolean; total_modules: number; total_lessons: number;
    modules: { id: string; title: string; lessons: { id: string; title: string; type: string; duration_secs: number | null }[] }[]
  }[]
}

export async function apiAdminAddModule(course_id: string, title: string) {
  const { data } = await api.post(`/admin/courses/${course_id}/modules?title=${encodeURIComponent(title)}`)
  return data
}

export async function apiAdminAddLesson(module_id: string, title: string, type: string, bunny_video_id?: string, duration_secs?: number) {
  let url = `/admin/modules/${module_id}/lessons?title=${encodeURIComponent(title)}&type=${type}`
  if (bunny_video_id) url += `&bunny_video_id=${encodeURIComponent(bunny_video_id)}`
  if (duration_secs) url += `&duration_secs=${duration_secs}`
  const { data } = await api.post(url)
  return data
}

export async function apiAdminDeleteModule(id: string) {
  await api.delete(`/admin/modules/${id}`)
}

export async function apiAdminDeleteLesson(id: string) {
  await api.delete(`/admin/lessons/${id}`)
}

export async function apiAdminStats() {
  const { data } = await api.get('/admin/courses/stats')
  return data as { total_revenue_pln: number; total_sales: number; total_users: number }
}

export default api
