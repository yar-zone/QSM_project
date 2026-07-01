<?php

// ─── [FILE PURPOSE] ────────────────────────────────────────────────────
// Defines ALL API routes for the QSM backend.
// Organized from least restrictive (public auth) to most restrictive
// (admin-only). Each route group uses middleware('role:...') for
// role-based access control.
// ────────────────────────────────────────────────────────────────────────

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ClasseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExamResultController;
use App\Http\Controllers\Api\LevelController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\MemorizationTrackingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganizerController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\SurahController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerificationCode']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Students: admin, organizer, teacher
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::apiResource('students', StudentController::class);
        Route::get('students/{student}/progress', [StudentController::class, 'progress']);
        Route::get('students/{student}/results', [StudentController::class, 'results']);
        Route::get('students/{student}/attendance', [StudentController::class, 'attendance']);
    });

    // Teachers: admin, organizer (CRUD); read-only for teachers
    Route::middleware('role:admin,organizer')->group(function () {
        Route::apiResource('teachers', TeacherController::class)->except(['index', 'show']);
        Route::get('teachers/{teacher}/performance', [TeacherController::class, 'performance']);
        Route::get('teachers/{teacher}/classes', [TeacherController::class, 'classes']);
    });
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::get('teachers', [TeacherController::class, 'index']);
        Route::get('teachers/{teacher}', [TeacherController::class, 'show']);
    });

    // Organizers: admin (CRUD); read-only for organizers and teachers
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('organizers', OrganizerController::class)->except(['index', 'show']);
    });
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::get('organizers', [OrganizerController::class, 'index']);
        Route::get('organizers/{organizer}', [OrganizerController::class, 'show']);
    });

    // Levels: admin, organizer
    Route::middleware('role:admin,organizer')->group(function () {
        Route::apiResource('levels', LevelController::class);
    });

    // Classes: admin, organizer, teacher, student, parent (scoped by controller)
    Route::middleware('role:admin,organizer,teacher,student,parent')->group(function () {
        Route::apiResource('classes', ClasseController::class)->except(['store', 'update', 'destroy']);
        Route::get('classes/{classe}/students', [ClasseController::class, 'students']);
        Route::get('classes/{classe}/attendance', [ClasseController::class, 'attendance']);
        Route::get('classes/{classe}/schedule', [ClasseController::class, 'schedule']);
    });
    Route::middleware('role:admin,organizer')->group(function () {
        Route::post('classes', [ClasseController::class, 'store']);
        Route::put('classes/{classe}', [ClasseController::class, 'update']);
        Route::delete('classes/{classe}', [ClasseController::class, 'destroy']);
    });

    // Subjects: admin, organizer
    Route::middleware('role:admin,organizer')->group(function () {
        Route::apiResource('subjects', SubjectController::class);
    });

    Route::apiResource('surahs', SurahController::class);

    // Exam requests (read-only, for exam results dependency)
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::get('exam-requests', [\App\Http\Controllers\Api\ExamRequestController::class, 'index']);
        Route::get('exam-requests/{exam_request}', [\App\Http\Controllers\Api\ExamRequestController::class, 'show']);
    });

    // Memorization: admin, organizer, teacher CRUD; student/parent read own
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::post('memorization-trackings', [MemorizationTrackingController::class, 'store']);
        Route::put('memorization-trackings/{memorization_tracking}', [MemorizationTrackingController::class, 'update']);
        Route::delete('memorization-trackings/{memorization_tracking}', [MemorizationTrackingController::class, 'destroy']);
        Route::get('memorization-trackings/weekly-report', [MemorizationTrackingController::class, 'weeklyReport']);
        Route::get('memorization-trackings/monthly-report', [MemorizationTrackingController::class, 'monthlyReport']);
        Route::get('memorization-trackings/yearly-report', [MemorizationTrackingController::class, 'yearlyReport']);
    });
    Route::middleware('role:admin,organizer,teacher,student,parent')->group(function () {
        Route::get('memorization-trackings/my', [MemorizationTrackingController::class, 'myTrackings']);
        Route::get('memorization-trackings', [MemorizationTrackingController::class, 'index']);
        Route::get('memorization-trackings/{memorization_tracking}', [MemorizationTrackingController::class, 'show']);
        Route::get('memorization-trackings/student-progress', [MemorizationTrackingController::class, 'studentProgress']);
    });

    // Exam Results: admin, organizer, teacher CRUD; student/parent read own
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::post('exam-results', [ExamResultController::class, 'store']);
        Route::put('exam-results/{exam_result}', [ExamResultController::class, 'update']);
        Route::delete('exam-results/{exam_result}', [ExamResultController::class, 'destroy']);
        Route::post('exam-results/record', [ExamResultController::class, 'record']);
    });
    Route::middleware('role:admin,organizer,teacher,student,parent')->group(function () {
        Route::get('exam-results/my', [ExamResultController::class, 'myResults']);
        Route::get('exam-results', [ExamResultController::class, 'index']);
        Route::get('exam-results/{exam_result}', [ExamResultController::class, 'show']);
    });

    // Certificates: admin, organizer, teacher CRUD; student/parent read own
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::post('certificates', [CertificateController::class, 'store']);
        Route::post('certificates/generate-pdf', [CertificateController::class, 'generatePdf']);
        Route::put('certificates/{certificate}', [CertificateController::class, 'update']);
        Route::delete('certificates/{certificate}', [CertificateController::class, 'destroy']);
    });
    Route::middleware('role:admin,organizer,teacher,student,parent')->group(function () {
        Route::get('certificates/my', [CertificateController::class, 'myCertificates']);
        Route::get('certificates/student/{student_id}', [CertificateController::class, 'studentCertificates']);
        Route::get('certificates/{certificate}/download', [CertificateController::class, 'download']);
        Route::post('certificates/{certificate}/verify', [CertificateController::class, 'verify']);
        Route::get('certificates', [CertificateController::class, 'index']);
        Route::get('certificates/{certificate}', [CertificateController::class, 'show']);
    });

    // Announcements: all authenticated users read; admin/organizer/teacher CRUD
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::post('announcements', [AnnouncementController::class, 'store']);
        Route::put('announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    });
    Route::middleware('role:admin,organizer,teacher,student,parent')->group(function () {
        Route::get('announcements/pinned', [AnnouncementController::class, 'pinned']);
        Route::get('announcements/targeted', [AnnouncementController::class, 'targeted']);
        Route::get('announcements', [AnnouncementController::class, 'index']);
        Route::get('announcements/{announcement}', [AnnouncementController::class, 'show']);
    });

    // Meetings: admin, organizer, teacher
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::apiResource('meetings', MeetingController::class);
        Route::post('meetings/{meeting}/join', [MeetingController::class, 'join']);
        Route::post('meetings/{meeting}/leave', [MeetingController::class, 'leave']);
        Route::get('meetings/{meeting}/generate-link', [MeetingController::class, 'generateLink']);
    });

    // Attendance: admin, organizer, teacher CRUD; student/parent read own
    Route::middleware('role:admin,organizer,teacher')->group(function () {
        Route::post('attendances', [AttendanceController::class, 'store']);
        Route::put('attendances/{attendance}', [AttendanceController::class, 'update']);
        Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy']);
        Route::post('attendances/bulk', [AttendanceController::class, 'bulkStore']);
        Route::get('attendances/reports', [AttendanceController::class, 'reports']);
        Route::get('attendances/class-reports', [AttendanceController::class, 'classReports']);
    });
    Route::middleware('role:admin,organizer,teacher,student,parent')->group(function () {
        Route::get('attendances/my', [AttendanceController::class, 'myAttendance']);
        Route::get('attendances', [AttendanceController::class, 'index']);
        Route::get('attendances/{attendance}', [AttendanceController::class, 'show']);
        Route::get('attendances/class', [AttendanceController::class, 'classAttendance']);
        Route::get('attendances/student', [AttendanceController::class, 'studentAttendance']);
    });

    // Notifications: all authenticated users
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Audit logs: admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
    });

    // Users: admin and organizer
    Route::middleware('role:admin,organizer')->group(function () {
        Route::get('/users/pending', [UserController::class, 'pending']);
        Route::post('/users/{user}/approve', [UserController::class, 'approve']);
        Route::post('/users/{user}/reject', [UserController::class, 'reject']);
        Route::post('/users/{user}/deactivate', [UserController::class, 'deactivate']);
        Route::post('/users/{user}/reactivate', [UserController::class, 'reactivate']);
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });

    // Parents: admin, organizer, teacher, parent
    Route::middleware('role:admin,organizer,teacher,parent')->group(function () {
        Route::apiResource('parents', ParentController::class);
    });
});
