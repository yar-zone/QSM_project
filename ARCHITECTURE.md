# 📐 QSM (نور القرآن) — Architecture Overview

> **QSM** = Quran School Management  
> A bilingual (Arabic/English) platform for managing a Quran memorization school — tracking students, teachers, classes, memorization progress, exams, certificates, attendance, meetings, and announcements.

---

## 1. High-Level Stack

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  TanStack Router · TanStack Query   │
│  Axios · shadcn/ui · Tailwind CSS   │
│  TypeScript · Vite                  │
└──────────────┬──────────────────────┘
               │  HTTP (JSON API)
               ▼
┌─────────────────────────────────────┐
│         Backend (Laravel)           │
│  PHP 8.3 · Sanctum Auth · MySQL    │
│  Laravel Mail · DOMPDF · Firebase  │
│  JWT (Google Sign-In)              │
└──────────────┬──────────────────────┘
               │
               ▼
          ┌─────────┐
          │  MySQL  │
          └─────────┘
```

### Frontend
| Library | Purpose |
|---------|---------|
| **TanStack Router** | Type-safe file-based routing |
| **TanStack Query** | Server state caching & fetching |
| **Axios** | HTTP client with interceptors (auth token injection, 401 handling) |
| **shadcn/ui** | Accessible, themed UI components |
| **Tailwind CSS** | Utility-first styling (RTL via `dir="rtl"`) |
| **lucide-react** | Icon library |
| **@react-oauth/google** | Google Sign-In button |

### Backend
| Library | Purpose |
|---------|---------|
| **Laravel 11** | PHP framework — REST API |
| **Sanctum** | Token-based authentication |
| **DOMPDF** | PDF certificate generation |
| **Firebase JWT** | Google ID token verification |
| **Laravel Mail** | SMTP email (Gmail via TLS 587) |

### Deployment
- **Frontend**: Static build → any host (Vercel, Docker)
- **Backend**: Docker container (PHP-FPM + artisan serve)
- **Database**: MySQL (Docker), SQLite fallback for development

---

## 2. Directory Structure

```
qsm_project/
├── ARCHITECTURE.md          ← You are here
├── docker-compose.yml       # Frontend + Backend + MySQL services
│
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # 20+ API controllers
│   │   │   └── Middleware/         # Role-based access middleware
│   │   ├── Mail/                   # Mailable classes (VerificationCodeMail)
│   │   ├── Models/                 # 25+ Eloquent models
│   │   └── Providers/              # Service providers
│   ├── config/                     # Laravel config (mail, cors, sanctum, etc.)
│   ├── database/
│   │   ├── migrations/             # 40+ migration files
│   │   └── seeders/                # DatabaseSeeder, SurahSeeder
│   ├── routes/
│   │   └── api.php                 # ALL API routes defined here
│   ├── .env.docker                 # Environment for Docker
│   └── Dockerfile
│
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/          # 6 role-specific dashboards + shared layout
│   │   │   ├── layout/             # AppShell, Sidebar, Header
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── use-auth.tsx        # Auth context provider + hook
│   │   ├── lib/
│   │   │   ├── constants.ts        # Static maps (status labels, keys)
│   │   │   ├── nav.ts              # Sidebar navigation config
│   │   │   ├── roles.ts            # Role definitions & helpers
│   │   │   └── utils.ts            # Tailwind class merge utility
│   │   ├── routes/
│   │   │   ├── _authenticated/     # 30+ protected route files
│   │   │   ├── auth.tsx            # Login/Register/Verify page
│   │   │   └── __root.tsx          # Root layout, 404, error boundary
│   │   ├── services/
│   │   │   └── api.ts              # Axios instance + API methods
│   │   ├── store/
│   │   │   └── auth.ts             # (reserved for future Zustand store)
│   │   ├── types/
│   │   │   └── index.ts            # All TypeScript interfaces
│   │   ├── main.tsx                # App entry point
│   │   └── styles.css              # Global styles + Tailwind
│   ├── Dockerfile
│   └── package.json
│
└── docker/                   # Docker supporting files
```

---

## 3. Role-Based Access Control (RBAC)

The platform has **5 user roles** with strict permission boundaries:

| Role     | Label   | Permissions |
|----------|---------|-------------|
| `admin`  | مدير    | Full system access — CRUD everything, view audit logs, manage organizers/users |
| `organizer` | منظم | Manage students, teachers, classes, levels, attendance, exams, announcements. No audit logs. |
| `teacher` | معلم   | View own classes/students. Record memorization, attendance, exam results. |
| `student` | طالب   | View own memorization, attendance, exam results, certificates. |
| `parent`  | ولي أمر | View children's progress, attendance, exam results, certificates. |

### How RBAC Works

**Backend** (`routes/api.php`):
```php
// Routes are grouped by role middleware:
Route::middleware('role:admin,organizer')->group(function () {
    Route::apiResource('levels', LevelController::class);
});
```

**Frontend** (`lib/nav.ts`):
```typescript
// Each nav item specifies which roles can see it:
{ title: "الموافقات", to: "/approvals", icon: UserCheck, roles: ["admin", "organizer"] },
```

**Dashboard dispatch** (`dashboard.tsx`):
```typescript
// The authenticated dashboard route switches on role:
if (primaryRole === "admin") return <AdminDashboard />
if (primaryRole === "organizer") return <OrganizerDashboard />
if (primaryRole === "teacher") return <TeacherDashboard />
if (primaryRole === "parent") return <ParentDashboard />
return <StudentDashboard />  // default
```

---

## 4. Frontend Architecture

### 4.1 Routing Flow

```
User visits /any-path
        │
        ▼
__root.tsx          ← Renders <Outlet /> + <Toaster />
   │
   ▼
auth.tsx            ← /auth (login/register/verify)
   OR
_authenticated/     ← Protected layout (checks token before load)
   │
   ├── route.tsx    ← Redirects to /auth if no token
   │                  Renders <DashboardShell> with sidebar
   │
   ├── dashboard.tsx ← Role-based dashboard dispatch
   ├── students.tsx   ← CRUD pages (33 route files)
   ├── teachers.tsx
   ├── classes.tsx
   ├── memorizations.tsx
   └── ... (30+ more routes)
```

### 4.2 Auth Flow

```
1. User registers → API sends 6-digit code via email
2. User enters code → API verifies → creates user (status: pending)
3. Admin/organizer approves → user status becomes: active
4. User logs in → API returns Sanctum token
5. Token stored in localStorage → injected via Axios interceptor
6. 401 response → auto-clears token, dispatches 'auth:logout' event
```

### 4.3 Data Fetching Pattern

Every dashboard uses the same TanStack Query pattern:

```typescript
// 1. Define the query
const { data: stats, isLoading } = useQuery({
  queryKey: ["dashboard-stats", rangeDays],
  queryFn: () => dashboardApi.get(params),
})

// 2. Handle 3 states:
if (isLoading)         → <Skeleton />   // Loading skeleton
if (!data || data.length === 0) →       // Empty state with icon + message
<Your Data />                            // Render actual data
```

### 4.4 Dashboard Components Map

| File | Purpose | Data Sources |
|------|---------|-------------|
| `admin-dashboard.tsx` | Full school overview | dashboardApi, userApi, attendanceApi, classApi |
| `organizer-dashboard.tsx` | School management view | dashboardApi, userApi, attendanceApi |
| `teacher-dashboard.tsx` | Teacher's classes & students | dashboardApi, classApi, memorizationApi, attendanceApi |
| `student-dashboard.tsx` | Student's own progress | dashboardApi, memorizationApi, attendanceApi, examResultApi |
| `parent-dashboard.tsx` | Children's progress | dashboardApi, memorizationApi, attendanceApi, examResultApi, certificateApi |
| `page-header.tsx` | Reusable page header | Shared utility component |
| `stat-card.tsx` | Reusable stat card | Shared utility component |
| `staff-dashboard.tsx` | Legacy (replaced by admin + organizer) | — |
| `member-dashboard.tsx` | Legacy (replaced by teacher + student + parent) | — |

### 4.5 API Service Layer (`services/api.ts`)

```typescript
// One Axios instance with:
// - Base URL from env VITE_API_URL
// - Auth token injected via interceptor
// - Auto-redirect on 401 (except login/register)
// - Each entity has a dedicated API object:

authApi      → /auth/*        (login, register, verify, google, me, logout)
dashboardApi → /dashboard     (aggregated stats)
userApi      → /users/*       (pending, approve, reject, CRUD)
studentApi   → /students/*    (CRUD + progress/attendance/results)
teacherApi   → /teachers/*    (CRUD + performance)
classApi     → /classes/*     (CRUD + students/attendance)
... (12+ API modules)
```

---

## 5. Backend Architecture

### 5.1 API Routes Organization (`routes/api.php`)

Routes are organized from least to most restrictive:

```
1. PUBLIC  → /auth/register, /auth/login, /auth/verify-email
2. AUTH    → /auth/me, /auth/logout, /dashboard
3. ROLE-GATED:
   ├── admin,organizer,teacher → /students, /teachers (GET), /exam-results
   ├── admin,organizer         → /levels, /subjects, /teachers (POST/PUT/DELETE)
   ├── admin                   → /organizers (CRUD), /audit-logs
   └── all authenticated       → /announcements (GET), /surahs, etc.
```

### 5.2 Controllers (`app/Http/Controllers/Api/`)

| Controller | Model(s) | Key Actions |
|-----------|----------|-------------|
| `AuthController` | User, EmailVerificationCode | login, register, verifyEmail, googleLogin, me, logout |
| `DashboardController` | Multi-model aggregate | adminDashboard, organizerDashboard, teacherDashboard, studentDashboard, parentDashboard |
| `StudentController` | Student, Enrollment | CRUD, progress, attendance, results |
| `TeacherController` | Teacher | CRUD, performance, classes |
| `ClasseController` | Classe | CRUD, students, attendance, schedule |
| `MemorizationTrackingController` | MemorizationTracking | CRUD, myList, weekly/monthly/yearly reports |
| `ExamResultController` | ExamResult | CRUD, record, myResults |
| `CertificateController` | Certificate | CRUD, generatePdf, verify, download |
| `AttendanceController` | Attendance | CRUD, bulk, reports, classReports |
| `AnnouncementController` | Announcement | CRUD, pinned, targeted |
| `MeetingController` | Meeting | CRUD, join, leave, generateLink |
| `NotificationController` | Notification | index, markAsRead, markAllAsRead |
| `UserController` | User | pending, approve, reject, deactivate, resetPassword |
| `LevelController` / `SubjectController` / `SurahController` | Respective models | Full CRUD |
| `ParentController` | User (parent role) | CRUD |
| `OrganizerController` | Organizer | CRUD |
| `AuditLogController` | AuditLog | index (admin only) |

### 5.3 Database Schema (Core Models)

```
users ──┬── hasOne → teachers
         ├── hasOne → students
         ├── hasOne → organizers
         ├── hasMany → email_verification_codes
         └── belongsToMany → students (via student_parent)

teachers ──┬── hasMany → classes
            ├── hasMany → memorization_trackings
            ├── hasMany → exam_committee
            └── hasMany → meetings (as organizer_id/teacher_id)

students ──┬── belongsToMany → classes (via enrollments)
            ├── hasMany → memorization_trackings
            ├── hasMany → attendances
            ├── hasMany → exam_requests
            ├── hasMany → exam_results
            ├── hasMany → certificates
            └── belongsToMany → users(parents) (via student_parent)

classes ──┬── belongsTo → level
           ├── belongsTo → teacher
           └── hasMany → enrollments / attendances

levels ── hasMany → classes

subjects ── (independent)

surahs ── (independent reference data for memorization)

memorization_trackings ──┬── belongsTo → student
                          ├── belongsTo → teacher
                          └── belongsTo → surah (optional)

exam_requests ──┬── belongsTo → student
                 ├── hasMany → exam_committee
                 └── hasOne → exam_result

exam_results ──┬── belongsTo → exam_request (nullable)
                ├── belongsTo → student
                └── belongsTo → level

certificates ── belongsTo → student

attendances ──┬── belongsTo → student
               ├── belongsTo → classe
               └── belongsTo → user (marked_by)

announcements ──┬── belongsTo → user (author)
                  ├── belongsToMany → classes (target)
                  └── belongsToMany → users (target)

meetings ──┬── belongsTo → user (organizer)
             ├── belongsToMany → classes / teachers / organizers (target)
             └── hasMany → meeting_participants
```

---

## 6. Key Design Patterns

### 6.1 Dashboard Pattern (Unified API)

Each role's dashboard fetches from a **single `/api/dashboard` endpoint** that returns role-specific data:

```typescript
// Backend DashboardController returns different data per role:
admin     → { total_students, total_teachers, ..., attendance_breakdown }
organizer → { total_students, total_teachers, ..., attendance_breakdown }
teacher   → { my_classes, my_students }
student   → { total_verses_memorized, total_verses_revised, ... }
parent    → { children_stats: [{ child, memorization, attendance }] }
```

### 6.2 Component States Pattern

Every data-driven component follows this exact pattern:

```
isLoading?  ──► Skeleton (placeholder shimmer)
isEmpty?    ──► Empty state (icon + message + optional CTA)
default     ──► Data rendering + "view all" link
error       ──► (handled globally by TanStack Query)
```

### 6.3 RTL Support

The UI is built for **Arabic RTL**:
- `dir="rtl"` on the HTML element
- `mr-*` / `ml-*` utilities used for spacing (not `left-*`/`right-*`)
- `text-right` for labels, `text-left` for numbers
- `ArrowRight` icon used for "view more" links (pointing left in RTL)

### 6.4 Email Verification Flow

```
Register ──► sendVerificationCode()
                │
                ├── Generates 6-digit code
                ├── Stores in email_verification_codes table (10-min expiry)
                └── Sends via SMTP (Gmail) using VerificationCodeMail mailable
                     │
Verify ──► Checks code match + expiry
              │
              └── Creates user with status: pending
                   └── Admin approves → status: active
```

---

## 7. Environment Configuration

### Docker Variables (`.env.docker`)
```
DB_CONNECTION=mysql
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

### Frontend Variables (`.env`)
```
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 8. Quick Reference: Common Tasks

| Task | Frontend File | Backend File |
|------|--------------|-------------|
| Change sidebar links | `src/lib/nav.ts` | — |
| Add a new role-based route | `src/routes/_authenticated/*` | `routes/api.php` |
| Modify dashboard stats | `src/components/dashboard/*.tsx` | `app/Http/Controllers/Api/DashboardController.php` |
| Add a new entity | `src/types/index.ts` + `src/services/api.ts` + route file | `app/Models/*` + migration + controller + `routes/api.php` |
| Change email template | — | `app/Mail/VerificationCodeMail.php` |
| Modify CORS settings | — | `config/cors.php` |

---

## 9. File Responsibility Map (at a glance)

```
FRONTEND                          BACKEND
─────────                         ────────
types/index.ts  ──► defines ──►   database/migrations/  +  app/Models/
services/api.ts  ──► calls ──►    routes/api.php  ──►  Controllers/
hooks/use-auth.tsx  ──►           Controllers/AuthController.php
components/dashboard/*.tsx  ──►   Controllers/DashboardController.php
lib/roles.ts                      middleware (roles)
lib/nav.ts                        routes/api.php (permissions)
```

---

> 💡 **Need help?** Each dashboard component has a file-level docstring at the top explaining its purpose. Search for `─── [FILE PURPOSE] ───` to find these annotations throughout the codebase.
