export const TOKEN_KEY = 'qsm_token'
export const USER_KEY = 'qsm_user'
export const ROLE_LABELS: Record<string, string> = { admin: 'مدير', organizer: 'منظم', teacher: 'معلم', student: 'طالب' }
export const ATTENDANCE_LABELS: Record<string, string> = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'معذور' }
export const EXAM_STATUS_LABELS: Record<string, string> = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض', completed: 'مكتمل' }
export const MEETING_STATUS_LABELS: Record<string, string> = { scheduled: 'مجدول', ongoing: 'جاري', completed: 'منتهي', cancelled: 'ملغي' }
export const ANNOUNCEMENT_CATEGORIES: Record<string, string> = { general: 'عام', exams: 'امتحانات', events: 'فعاليات', meetings: 'اجتماعات', urgent: 'عاجل' }
export const REVISION_LABELS: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم', mastered: 'متقن' }
