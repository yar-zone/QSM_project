export const TOKEN_KEY = 'qsm_token'
export const USER_KEY = 'qsm_user'
export const ROLE_LABELS: Record<string, string> = { admin: 'Admin', organizer: 'Organizer', teacher: 'Teacher', student: 'Student' }
export const ATTENDANCE_LABELS: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused' }
export const EXAM_STATUS_LABELS: Record<string, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', completed: 'Completed' }
export const MEETING_STATUS_LABELS: Record<string, string> = { scheduled: 'Scheduled', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' }
export const ANNOUNCEMENT_CATEGORIES: Record<string, string> = { general: 'General', exams: 'Exams', events: 'Events', meetings: 'Meetings', urgent: 'Urgent' }
export const REVISION_LABELS: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', mastered: 'Mastered' }
