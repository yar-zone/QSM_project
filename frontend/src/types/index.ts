export type Role = 'admin' | 'organizer' | 'teacher' | 'student' | 'parent'
export type UserStatus = 'pending' | 'active' | 'inactive'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type ExamStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
export type AnnouncementCategory = 'general' | 'exams' | 'events' | 'meetings' | 'urgent'
export type RevisionLevel = 'beginner' | 'intermediate' | 'advanced' | 'mastered'

export interface User {
  id: number; name: string; email: string; role: Role; status: UserStatus
  phone?: string; avatar?: string; is_active: boolean; last_login_at?: string
  email_verified_at?: string; created_at: string; updated_at: string
  teacher?: Teacher; student?: Student; organizer?: Organizer
}

export interface Teacher {
  id: number; user_id: number; user: User; qualification?: string
  specialization?: string; join_date?: string; is_active: boolean; created_at: string; updated_at: string
}

export interface Organizer {
  id: number; user_id: number; user: User; phone?: string; qualifications?: string; is_active: boolean; created_at: string; updated_at: string
}

export interface Student {
  id: number; user_id: number; user: User; guardian_id?: number; guardian?: User
  enrollment_date?: string; date_of_birth?: string; gender?: string; address?: string
  phone?: string; emergency_contact?: string; is_active: boolean; created_at: string; updated_at: string
  enrollments?: Enrollment[]; attendances?: Attendance[]; memorizationTrackings?: MemorizationTracking[]
}

export interface Level {
  id: number; name: string; description?: string; order: number; is_active: boolean; created_at: string; updated_at: string
}

export interface Classe {
  id: number; level_id: number; level?: Level; teacher_id: number; teacher?: Teacher
  name: string; academic_year?: string; max_students?: number; description?: string; is_active: boolean; created_at: string; updated_at: string
}

export interface Subject {
  id: number; name: string; description?: string; is_active: boolean; created_at: string; updated_at: string
}

export interface Enrollment {
  id: number; student_id: number; student?: Student; class_id: number; class?: Classe
  enrolled_date: string; status: string; created_at: string; updated_at: string
}

export interface Surah {
  id: number; name: string; name_arabic?: string; juz?: number; hizb?: number
  verses_count?: number; revelation_type?: string; is_active: boolean; created_at: string; updated_at: string
}

export interface MemorizationTracking {
  id: number; student_id: number; student?: Student; teacher_id: number; teacher?: Teacher
  surah_id?: number; surah?: Surah; juz?: number; hizb?: number
  verses_memorized: number; verses_revised: number; start_date: string; completion_date?: string
  teacher_notes?: string; revision_level?: RevisionLevel; performance_score?: number
  week_start?: string; month?: string; year?: string; created_at: string; updated_at: string
}

export interface ExamRequest {
  id: number; student_id: number; student?: Student; hizb_count: number
  committee_notes?: string; status: ExamStatus; requested_date: string
  reviewed_by?: number; reviewer?: User; reviewed_at?: string; created_at: string; updated_at: string
  committee?: ExamCommittee[]; result?: ExamResult
}

export interface ExamCommittee {
  id: number; exam_request_id: number; teacher_id: number; teacher?: Teacher
  role: string; created_at: string; updated_at: string
}

export interface ExamResult {
  id: number; exam_request_id?: number; exam_request?: ExamRequest
  student_id?: number; student?: Student
  level_id?: number; level?: Level
  marks_obtained?: number; grade?: string; evaluator_notes?: string
  is_passed: boolean; evaluated_by?: number; evaluator?: User; evaluated_at?: string; created_at: string; updated_at: string
}

export interface Certificate {
  id: number; student_id: number; student?: Student; exam_result_id?: number; exam_result?: ExamResult
  certificate_number: string; student_name: string; hizb_count: number; grade?: string
  issued_date: string; qr_code?: string; certificate_type: string; is_verified: boolean
  metadata?: Record<string, unknown>; created_at: string; updated_at: string
}

export interface Announcement {
  id: number; author_id: number; author?: User; title: string; content: string
  category: AnnouncementCategory; target_audience: string; is_pinned: boolean
  published_at: string; expires_at?: string; is_active: boolean; created_at: string; updated_at: string
  attachments?: AnnouncementAttachment[]; meeting_link?: string
}

export interface Meeting {
  id: number; organizer_id?: number; organizer?: User; teacher_id?: number; teacher?: Teacher
  title: string; description?: string; platform: string; meeting_link?: string; meeting_id?: string
  scheduled_at: string; duration_minutes: number; status: MeetingStatus; recording_url?: string
  created_at: string; updated_at: string; participants?: MeetingParticipant[]
  target_classes?: number[]; target_teachers?: number[]; target_organizers?: number[]
  targetClasses?: Classe[]; targetTeachers?: MeetingTargetTeacher[]; targetOrganizers?: MeetingTargetOrganizer[]
}

export interface MeetingTargetTeacher {
  id: number; meeting_id: number; teacher_id: number; teacher?: Teacher
}

export interface MeetingTargetOrganizer {
  id: number; meeting_id: number; organizer_id: number; organizer?: User
}

export interface AnnouncementAttachment {
  id: number; announcement_id: number; file_path: string; file_type?: string; file_name?: string; created_at: string; updated_at: string
}

export interface Meeting {
  id: number; organizer_id?: number; organizer?: User; teacher_id?: number; teacher?: Teacher
  title: string; description?: string; platform: string; meeting_link?: string; meeting_id?: string
  scheduled_at: string; duration_minutes: number; status: MeetingStatus; recording_url?: string
  created_at: string; updated_at: string; participants?: MeetingParticipant[]
}

export interface MeetingParticipant {
  id: number; meeting_id: number; user_id: number; user?: User; role?: string
  joined_at?: string; left_at?: string; created_at: string; updated_at: string
}

export interface Attendance {
  id: number; student_id: number; student?: Student; class_id: number; class?: Classe
  date: string; status: AttendanceStatus; notes?: string; marked_by?: number; markedBy?: User
  created_at: string; updated_at: string
}

export interface Notification {
  id: number; user_id: number; type: string; title: string; message: string
  data?: Record<string, unknown>; read_at?: string; created_at: string; updated_at: string
}

export interface AuditLog {
  id: number; user_id?: number; user?: User; action: string; model: string
  model_id?: string; old_values?: Record<string, unknown>; new_values?: Record<string, unknown>
  ip_address?: string; user_agent?: string; created_at: string; updated_at: string
}

export interface LoginCredentials { email: string; password: string }
export interface RegisterData { name: string; email: string; password: string; password_confirmation: string; role: Role; phone?: string }
export interface AuthResponse { success: boolean; data: { user: User; token: string }; message: string; user: User; token: string }
export interface ApiResponse<T> { success: boolean; data: T; message?: string }
export interface PaginatedResponse<T> { success: boolean; data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number }; message?: string }

export interface AttendanceBreakdown {
  present: number; absent: number; late: number; excused: number
}

export interface AttendanceClassReport {
  class_id: number; class_name: string
  present: number; absent: number; late: number; excused: number
  total: number; attendance_percentage: number
}

export interface DashboardStats {
  total_students?: number; total_teachers?: number; total_classes?: number; total_levels?: number
  pending_approvals?: number; active_enrollments?: number; attendance_rate?: number
  attendance_breakdown?: AttendanceBreakdown
  total_verses_memorized?: number; total_verses_revised?: number; average_performance_score?: number
  total_sessions?: number; my_classes?: number; my_students?: number
}

export interface ActivityItem {
  id: number; action: string; description: string; user_name: string; created_at: string
}

export interface ChildrenStats {
  child: Student
  memorization: { total_verses_memorized: number; total_verses_revised: number; average_performance_score: number; total_sessions: number }
  attendance: { present: number; absent: number; total: number; attendance_percentage: number }
  exam_results: { total: number; passed: number; pass_rate: number }
}
