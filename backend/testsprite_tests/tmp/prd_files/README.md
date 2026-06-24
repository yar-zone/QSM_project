# QSM — Quran School Management System

<div align="center">

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

A full-featured school management platform built for Quran memorization schools, supporting Arabic-first workflows with role-based access for **Admins**, **Organizers**, **Teachers**, **Students**, and **Parents**.

[Features](#✨-features) • [Tech Stack](#️-tech-stack) • [Quick Start](#-quick-start) • [Demo Accounts](#-demo-accounts) • [Architecture](#-architecture)

</div>

---

## ✨ Features

### 👥 Role-Based Access
- **Admin** — full system control, user management, audit logs
- **Organizer** — manage teachers, classes, levels, schedules, and meetings
- **Teacher** — track student memorization, attendance, exam results, create class announcements
- **Student** — view personal progress, attendance, certificates, and class announcements
- **Parent** — monitor children's performance, attendance, and school announcements

### 📚 Academic Management
- **Classes & Levels** — multi-level class system with teacher assignments
- **Enrollments** — student enrollment across multiple classes per academic year
- **Subjects & Surahs** — curriculum management with surah-based memorization tracking
- **Memorization Tracking** — daily/weekly recording of verses memorized and revised
- **Exam Requests & Results** — structured exam workflow with committee evaluation

### 📊 Attendance & Reporting
- **Daily Attendance** — bulk attendance entry per class with status (present, absent, late, excused)
- **Attendance Reports** — per-class and per-student attendance summaries with percentages
- **Dashboard Statistics** — role-specific dashboards with key metrics and charts (Recharts)

### 📄 Certificates & PDFs
- **Certificate Generation** — landscape PDF certificates with Arabic typography (mPDF)
- **QR Code Verification** — built-in certificate verification workflow
- **Download & Verify** — students can download their certificates; third parties can verify them

### 📢 Communication
- **Announcements** — targeted announcements by class, teacher, or role with Rich Text
- **Meetings** — online meeting scheduling with class/teacher/organizer targeting
- **Notifications** — in-app notification system

### 🔐 Security
- **Sanctum Token Authentication** — secure API token-based auth
- **Role Middleware** — granular `role:admin,organizer,teacher,student,parent` middleware
- **Password Management** — self-service password change, admin password reset
- **Audit Logging** — track administrative actions system-wide

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Laravel 12** | PHP framework (routing, ORM, migrations, queues) |
| **PHP 8.2+** | Runtime |
| **Laravel Sanctum** | API token authentication |
| **SQLite** | Default database (MySQL-ready) |
| **mPDF** | PDF generation with native Arabic support |
| **ar-php** | Arabic text shaping (UTF8 glyphs) |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript 6** | Type safety |
| **Vite 8** | Build tool & dev server |
| **TanStack Router** | File-based routing (`v1.170`) |
| **TanStack Query** | Server state management (`v5`) |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Radix-based component library (47 components) |
| **React Hook Form + Zod** | Form validation |
| **Recharts** | Dashboard charts |
| **Lucide React** | Icon library |

### Infrastructure
- **Proxy Dev Setup** — Vite proxies `/api` → Laravel backend on `localhost:8000`
- **Bun** — JavaScript package manager

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer 2.x
- Node.js 20+ / Bun
- SQLite (included with PHP)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install PHP dependencies
composer install

# Copy environment file
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac

# Generate app key
php artisan key:generate

# Run migrations (creates SQLite database)
php artisan migrate

# Seed demo data
php artisan db:seed

# Start the API server
php artisan serve --host=localhost --port=8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
# or: bun install

# Start the dev server
npm run dev
# or: bun dev
```

The frontend starts on `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

---

## 👤 Demo Accounts

All seeded with password: **`password`**

| Role | Email |
|---|---|
| **Admin** | `admin@qsm.com` |
| **Organizer** | `organizer@qsm.com` |
| **Teacher** | `teacher@qsm.com` |
| **Student** | `student@qsm.com` |
| **Parent** | `parent@qsm.com` |

> ⚠️ These are demo credentials. Change passwords before production use.

---

## 🏗️ Architecture

```
QSM_project/
├── backend/                 # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/           # API controllers (17 resources)
│   │   │   │   └── Controller.php
│   │   │   └── Middleware/        # Role middleware
│   │   ├── Models/                # Eloquent models
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/            # Schema migrations
│   │   └── seeders/               # Demo data seeders
│   ├── routes/
│   │   └── api.php                # API route definitions
│   └── storage/
│       └── fonts/                 # Arabic fonts (Tajawal)
│
├── frontend/                # React + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/        # Role-specific dashboards
│   │   │   ├── layout/           # Shell, sidebar, protected routes
│   │   │   └── ui/               # shadcn components (47)
│   │   ├── hooks/                # use-auth, use-mobile
│   │   ├── lib/                  # Constants, nav tree, roles, utils
│   │   ├── routes/
│   │   │   └── _authenticated/   # 33 route files
│   │   ├── services/api.ts       # Axios client & API endpoints
│   │   └── types/index.ts        # TypeScript interfaces
│   └── package.json
│
└── README.md
```

### Role Hierarchy

```
Admin ─── Full access to everything
  │
  ├── Organizer ─── Manage teachers, classes, levels, meetings
  │
  ├── Teacher ─── Manage students, memorization, attendance, exams
  │
  ├── Student ─── View personal progress, certificates, announcements
  │
  └── Parent ─── View children's progress, attendance, announcements
```

### Data Flow

```
┌─────────┐       ┌──────────┐       ┌──────────┐
│  React  │ ───→  │  Vite    │ ───→  │ Laravel  │
│  SPA    │  HTTP  │  Proxy   │  API  │ Backend  │
│ :5173   │ ←───  │ /api →   │ ←───  │ :8000    │
└─────────┘       │ :8000    │       │          │
                  └──────────┘       └────┬─────┘
                                          │
                                   ┌──────┴──────┐
                                   │   SQLite     │
                                   │  Database    │
                                   └─────────────┘
```

---

## 📡 API Overview

| Resource | Endpoint | Auth |
|---|---|---|
| Auth | `/api/auth/*` | Public / Sanctum |
| Dashboard | `/api/dashboard` | Sanctum |
| Students | `/api/students` | Sanctum + Role |
| Teachers | `/api/teachers` | Sanctum + Role |
| Organizers | `/api/organizers` | Sanctum + Role |
| Classes | `/api/classes` | Sanctum |
| Levels | `/api/levels` | Sanctum + Role |
| Subjects | `/api/subjects` | Sanctum + Role |
| Surahs | `/api/surahs` | Sanctum |
| Memorization | `/api/memorization-trackings` | Sanctum + Role |
| Exam Requests | `/api/exam-requests` | Sanctum + Role |
| Exam Results | `/api/exam-results` | Sanctum + Role |
| Certificates | `/api/certificates` | Sanctum + Role |
| Attendance | `/api/attendances` | Sanctum + Role |
| Announcements | `/api/announcements` | Sanctum |
| Meetings | `/api/meetings` | Sanctum + Role |
| Parents | `/api/parents` | Sanctum + Role |
| Users | `/api/users` | Sanctum + Role |
| Notifications | `/api/notifications` | Sanctum |
| Audit Logs | `/api/audit-logs` | Sanctum + Admin |

Each endpoint supports role-based scoping (e.g., teachers see only their students, students see only their data).

---

## 🌐 Localization

- **UI Language:** Arabic (RTL)
- **Backend:** Arabic validation messages, Arabic PDF content
- **Fonts:** Tajawal (Arabic), Amiri (classical Arabic), Plus Jakarta Sans (Latin)
- **PDF:** mPDF with `autoArabic` rendering for connected Arabic letters
- **Date formats:** Islamic/Georgian calendar support

---

## 🧪 Testing

```bash
# Backend tests
cd backend
php artisan test

# Frontend type checking
cd frontend
npx tsc --noEmit
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-sourced under the [MIT license](https://opensource.org/licenses/MIT).

---

<div align="center">
Built with ❤️ for Quran education
</div>
