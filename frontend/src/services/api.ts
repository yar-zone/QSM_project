import axios from 'axios'
import type { AuthResponse, RegisterData, LoginCredentials, ApiResponse, PaginatedResponse, User, Student, Teacher, Classe, Level, Subject, Surah, MemorizationTracking, ExamRequest, ExamResult, Certificate, Announcement, Meeting, Attendance, Notification, AuditLog, Organizer, DashboardStats, AttendanceClassReport } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/lib/constants'

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'data' in (data as any) && Array.isArray((data as any).data)) return (data as any).data
  return []
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Don't intercept login/register failures — let the form handle them
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        return Promise.reject(error)
      }
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: LoginCredentials) => api.post<AuthResponse>('/auth/login', data).then(r => ({ ...r.data, user: r.data.data.user, token: r.data.data.token })),
  register: (data: RegisterData) => api.post('/auth/register', data).then(r => r.data),
  verifyEmail: (email: string, code: string) => api.post('/auth/verify-email', { email, code }).then(r => r.data),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }).then(r => r.data),
  googleLogin: (idToken: string) => api.post<AuthResponse>('/auth/google', { id_token: idToken }).then(r => ({ ...r.data, user: r.data.data.user, token: r.data.data.token })),
  me: () => api.get<ApiResponse<User>>('/auth/me').then(r => r.data.data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) => api.post('/auth/change-password', data).then(r => r.data),
}

export const dashboardApi = {
  get: (params?: Record<string, string>) => api.get('/dashboard', { params }).then(r => r.data.data),
}

export const userApi = {
  pending: () => api.get('/users/pending').then(r => extractArray<User>(r.data.data)),
  approve: (id: number) => api.post<ApiResponse<User>>(`/users/${id}/approve`).then(r => r.data.data),
  reject: (id: number) => api.post<ApiResponse<User>>(`/users/${id}/reject`).then(r => r.data.data),
  deactivate: (id: number) => api.post<ApiResponse<User>>(`/users/${id}/deactivate`).then(r => r.data.data),
  reactivate: (id: number) => api.post<ApiResponse<User>>(`/users/${id}/reactivate`).then(r => r.data.data),
  list: () => api.get('/users').then(r => extractArray<User>(r.data.data)),
  update: (id: number, data: Record<string, unknown>) => api.put<ApiResponse<User>>(`/users/${id}`, data).then(r => r.data.data),
  resetPassword: (id: number, data: { password: string; password_confirmation: string }) => api.post(`/users/${id}/reset-password`, data).then(r => r.data),
}

export const studentApi = {
  list: (params?: Record<string, string>) => api.get('/students', { params }).then(r => extractArray<Student>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Student>>(`/students/${id}`).then(r => r.data.data),
  create: (data: Partial<Student>) => api.post<ApiResponse<Student>>('/students', data).then(r => r.data.data),
  update: (id: number, data: Partial<Student>) => api.put<ApiResponse<Student>>(`/students/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/students/${id}`).then(r => r.data),
  progress: (id: number) => api.get<ApiResponse<unknown>>(`/students/${id}/progress`).then(r => r.data.data),
  attendance: (id: number) => api.get<ApiResponse<unknown>>(`/students/${id}/attendance`).then(r => r.data.data),
  results: (id: number) => api.get<ApiResponse<unknown>>(`/students/${id}/results`).then(r => r.data.data),
}

export const teacherApi = {
  list: (params?: Record<string, string>) => api.get('/teachers', { params }).then(r => extractArray<Teacher>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Teacher>>(`/teachers/${id}`).then(r => r.data.data),
  create: (data: Partial<Teacher>) => api.post<ApiResponse<Teacher>>('/teachers', data).then(r => r.data.data),
  update: (id: number, data: Partial<Teacher>) => api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/teachers/${id}`).then(r => r.data),
  performance: (id: number) => api.get<ApiResponse<unknown>>(`/teachers/${id}/performance`).then(r => r.data.data),
}

export const organizerApi = {
  list: (params?: Record<string, string>) => api.get('/organizers', { params }).then(r => extractArray<Organizer>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Organizer>>(`/organizers/${id}`).then(r => r.data.data),
  create: (data: Partial<Organizer>) => api.post<ApiResponse<Organizer>>('/organizers', data).then(r => r.data.data),
  update: (id: number, data: Partial<Organizer>) => api.put<ApiResponse<Organizer>>(`/organizers/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/organizers/${id}`).then(r => r.data),
}

export const levelApi = {
  list: () => api.get<ApiResponse<Level[]>>('/levels').then(r => r.data.data),
  get: (id: number) => api.get<ApiResponse<Level>>(`/levels/${id}`).then(r => r.data.data),
  create: (data: Partial<Level>) => api.post<ApiResponse<Level>>('/levels', data).then(r => r.data.data),
  update: (id: number, data: Partial<Level>) => api.put<ApiResponse<Level>>(`/levels/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/levels/${id}`).then(r => r.data),
}

export const classApi = {
  list: (params?: Record<string, string>) => api.get('/classes', { params }).then(r => extractArray<Classe>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Classe>>(`/classes/${id}`).then(r => r.data.data),
  create: (data: Partial<Classe>) => api.post<ApiResponse<Classe>>('/classes', data).then(r => r.data.data),
  update: (id: number, data: Partial<Classe>) => api.put<ApiResponse<Classe>>(`/classes/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/classes/${id}`).then(r => r.data),
  students: (id: number) => api.get<ApiResponse<Student[]>>(`/classes/${id}/students`).then(r => r.data.data),
  attendance: (id: number) => api.get<ApiResponse<unknown>>(`/classes/${id}/attendance`).then(r => r.data.data),
}

export const subjectApi = {
  list: () => api.get<ApiResponse<Subject[]>>('/subjects').then(r => r.data.data),
  get: (id: number) => api.get<ApiResponse<Subject>>(`/subjects/${id}`).then(r => r.data.data),
  create: (data: Partial<Subject>) => api.post<ApiResponse<Subject>>('/subjects', data).then(r => r.data.data),
  update: (id: number, data: Partial<Subject>) => api.put<ApiResponse<Subject>>(`/subjects/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/subjects/${id}`).then(r => r.data),
}

export const parentApi = {
  list: (params?: Record<string, string>) => api.get('/parents', { params }).then(r => extractArray<User>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<User>>(`/parents/${id}`).then(r => r.data.data),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<User>>('/parents', data).then(r => r.data.data),
  update: (id: number, data: Record<string, unknown>) => api.put<ApiResponse<User>>(`/parents/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/parents/${id}`).then(r => r.data),
}

export const surahApi = {
  list: () => api.get<ApiResponse<Surah[]>>('/surahs').then(r => r.data.data),
  get: (id: number) => api.get<ApiResponse<Surah>>(`/surahs/${id}`).then(r => r.data.data),
}

export const memorizationApi = {
  list: (params?: Record<string, string>) => api.get('/memorization-trackings', { params }).then(r => extractArray<MemorizationTracking>(r.data.data)),
  myList: () => api.get('/memorization-trackings/my').then(r => extractArray<MemorizationTracking>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<MemorizationTracking>>(`/memorization-trackings/${id}`).then(r => r.data.data),
  create: (data: Partial<MemorizationTracking>) => api.post<ApiResponse<MemorizationTracking>>('/memorization-trackings', data).then(r => r.data.data),
  update: (id: number, data: Partial<MemorizationTracking>) => api.put<ApiResponse<MemorizationTracking>>(`/memorization-trackings/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/memorization-trackings/${id}`).then(r => r.data),
}



export const examRequestApi = {
  list: (params?: Record<string, string>) => api.get('/exam-requests', { params }).then(r => extractArray<ExamRequest>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<ExamRequest>>(`/exam-requests/${id}`).then(r => r.data.data),
}

export const examResultApi = {
  list: (params?: Record<string, string>) => api.get('/exam-results', { params }).then(r => extractArray<ExamResult>(r.data.data)),
  myList: () => api.get('/exam-results/my').then(r => extractArray<ExamResult>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<ExamResult>>(`/exam-results/${id}`).then(r => r.data.data),
  create: (data: Partial<ExamResult>) => api.post<ApiResponse<ExamResult>>('/exam-results', data).then(r => r.data.data),
  update: (id: number, data: Partial<ExamResult>) => api.put<ApiResponse<ExamResult>>(`/exam-results/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/exam-results/${id}`).then(r => r.data),
}

export const certificateApi = {
  list: (params?: Record<string, string>) => api.get('/certificates', { params }).then(r => extractArray<Certificate>(r.data.data)),
  myList: () => api.get('/certificates/my').then(r => extractArray<Certificate>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Certificate>>(`/certificates/${id}`).then(r => r.data.data),
  create: (data: Partial<Certificate>) => api.post<ApiResponse<Certificate>>('/certificates', data).then(r => r.data.data),
  update: (id: number, data: Partial<Certificate>) => api.put<ApiResponse<Certificate>>(`/certificates/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/certificates/${id}`).then(r => r.data),
  verify: (id: number) => api.post<ApiResponse<Certificate>>(`/certificates/${id}/verify`).then(r => r.data.data),
  generatePdf: (data: Record<string, unknown>) => api.post('/certificates/generate-pdf', data).then(r => r.data),
  download: (id: number) => api.get(`/certificates/${id}/download`).then(r => r.data.data),
}

export const announcementApi = {
  list: (params?: Record<string, string>) => api.get('/announcements', { params }).then(r => extractArray<Announcement>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Announcement>>(`/announcements/${id}`).then(r => r.data.data),
  create: (data: Partial<Announcement>) => api.post<ApiResponse<Announcement>>('/announcements', data).then(r => r.data.data),
  update: (id: number, data: Partial<Announcement>) => api.put<ApiResponse<Announcement>>(`/announcements/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/announcements/${id}`).then(r => r.data),
}

export const meetingApi = {
  list: (params?: Record<string, string>) => api.get('/meetings', { params }).then(r => extractArray<Meeting>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Meeting>>(`/meetings/${id}`).then(r => r.data.data),
  create: (data: Partial<Meeting>) => api.post<ApiResponse<Meeting>>('/meetings', data).then(r => r.data.data),
  update: (id: number, data: Partial<Meeting>) => api.put<ApiResponse<Meeting>>(`/meetings/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/meetings/${id}`).then(r => r.data),
}

export const attendanceApi = {
  list: (params?: Record<string, string>) => api.get('/attendances', { params }).then(r => extractArray<Attendance>(r.data.data)),
  myList: () => api.get('/attendances/my').then(r => extractArray<Attendance>(r.data.data)),
  get: (id: number) => api.get<ApiResponse<Attendance>>(`/attendances/${id}`).then(r => r.data.data),
  create: (data: Partial<Attendance>) => api.post<ApiResponse<Attendance>>('/attendances', data).then(r => r.data.data),
  update: (id: number, data: Partial<Attendance>) => api.put<ApiResponse<Attendance>>(`/attendances/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/attendances/${id}`).then(r => r.data),
  bulk: (data: { class_id: number; date: string; attendances: { student_id: number; status: string; notes?: string }[] }) => api.post<ApiResponse<Attendance[]>>('/attendances/bulk', data).then(r => r.data.data),
  reports: (params?: Record<string, string>) => api.get('/attendances/reports', { params }).then(r => r.data.data),
  classReports: (params?: Record<string, string>) => api.get('/attendances/class-reports', { params }).then(r => extractArray<AttendanceClassReport>(r.data.data)),
}

export const notificationApi = {
  list: () => api.get<ApiResponse<Notification[]>>('/notifications').then(r => r.data.data),
  markRead: (id: number) => api.post<ApiResponse<Notification>>(`/notifications/${id}/read`).then(r => r.data.data),
  markAllRead: () => api.post<ApiResponse<null>>('/notifications/read-all').then(r => r.data),
}

export const auditLogApi = {
  list: (params?: Record<string, string>) => api.get('/audit-logs', { params }).then(r => extractArray<AuditLog>(r.data.data)),
}

export default api
