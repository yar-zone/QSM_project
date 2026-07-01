<?php

// ─── [FILE PURPOSE] ────────────────────────────────────────────────────
// Unified dashboard API endpoint — returns role-specific aggregated data.
// Each role gets a different data shape:
//   admin/organizer → counts (students, teachers, classes) + attendance stats
//   teacher          → my_classes, my_students
//   student          → memorized verses, sessions, avg performance
//   parent           → children_stats with per-child memorization + attendance
// Uses cache (Cache::remember, 5 min TTL) to reduce DB load.
// ────────────────────────────────────────────────────────────────────────

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classe;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\MemorizationTracking;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $data = match ($user->role) {
            'admin' => $this->adminDashboard($dateFrom, $dateTo),
            'organizer' => $this->organizerDashboard($dateFrom, $dateTo),
            'teacher' => $this->teacherDashboard($user),
            'student' => $this->studentDashboard($user),
            'parent' => $this->parentDashboard($user, $dateFrom, $dateTo),
            default => [],
        };

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function attendanceBreakdown(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = Attendance::selectRaw("status, COUNT(*) as count");

        if ($dateFrom) {
            $query->where('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('date', '<=', $dateTo);
        }

        $all = $query->groupBy('status')->pluck('count', 'status');

        return [
            'present' => $all['present'] ?? 0,
            'absent' => $all['absent'] ?? 0,
            'late' => $all['late'] ?? 0,
            'excused' => $all['excused'] ?? 0,
        ];
    }

    private function adminDashboard(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = 'dashboard_admin_' . ($dateFrom ?? 'all') . '_' . ($dateTo ?? 'all');

        return Cache::remember($cacheKey, 300, function () use ($dateFrom, $dateTo) {
            $totalStudents = Student::count();
            $totalTeachers = Teacher::count();
            $totalClasses = Classe::count();
            $totalLevels = Level::count();
            $totalUsers = User::count();
            $pendingUsers = User::where('status', 'pending')->count();

            $attQuery = Attendance::query();
            if ($dateFrom) $attQuery->where('date', '>=', $dateFrom);
            if ($dateTo) $attQuery->where('date', '<=', $dateTo);
            $totalAttendances = (clone $attQuery)->count();
            $presentAttendances = (clone $attQuery)->where('status', 'present')->count();
            $attendanceRate = $totalAttendances > 0 ? round(($presentAttendances / $totalAttendances) * 100, 2) : 0;

            return [
                'total_students' => $totalStudents,
                'total_teachers' => $totalTeachers,
                'total_classes' => $totalClasses,
                'total_levels' => $totalLevels,
                'total_users' => $totalUsers,
                'pending_approvals' => $pendingUsers,
                'attendance_rate' => $attendanceRate,
                'attendance_breakdown' => $this->attendanceBreakdown($dateFrom, $dateTo),
            ];
        });
    }

    private function organizerDashboard(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = 'dashboard_organizer_' . ($dateFrom ?? 'all') . '_' . ($dateTo ?? 'all');

        return Cache::remember($cacheKey, 300, function () use ($dateFrom, $dateTo) {
            $totalStudents = Student::count();
            $totalTeachers = Teacher::count();
            $totalClasses = Classe::count();
            $totalLevels = Level::count();

            $attQuery = Attendance::query();
            if ($dateFrom) $attQuery->where('date', '>=', $dateFrom);
            if ($dateTo) $attQuery->where('date', '<=', $dateTo);
            $totalAttendances = (clone $attQuery)->count();
            $presentAttendances = (clone $attQuery)->where('status', 'present')->count();
            $attendanceRate = $totalAttendances > 0 ? round(($presentAttendances / $totalAttendances) * 100, 2) : 0;

            return [
                'total_students' => $totalStudents,
                'total_teachers' => $totalTeachers,
                'total_classes' => $totalClasses,
                'total_levels' => $totalLevels,
                'attendance_rate' => $attendanceRate,
                'attendance_breakdown' => $this->attendanceBreakdown($dateFrom, $dateTo),
            ];
        });
    }

    private function teacherDashboard(User $user): array
    {
        $teacher = $user->teacher;

        if (!$teacher) {
            return [];
        }

        $cacheKey = 'dashboard_teacher_' . $teacher->id;

        return Cache::remember($cacheKey, 300, function () use ($teacher) {
            $myClasses = Classe::where('teacher_id', $teacher->id)->count();
            $myStudents = Enrollment::whereIn('class_id', function ($q) use ($teacher) {
                $q->select('id')->from('classes')->where('teacher_id', $teacher->id);
            })->distinct('student_id')->count('student_id');

            return [
                'my_classes' => $myClasses,
                'my_students' => $myStudents,
            ];
        });
    }

    private function studentDashboard(User $user): array
    {
        $student = $user->student;

        if (!$student) {
            return [];
        }

        $cacheKey = 'dashboard_student_' . $student->id;

        return Cache::remember($cacheKey, 300, function () use ($student) {
            $stats = MemorizationTracking::where('student_id', $student->id)
                ->selectRaw('COALESCE(SUM(verses_memorized), 0) as total_memorized')
                ->selectRaw('COALESCE(SUM(verses_revised), 0) as total_revised')
                ->selectRaw('COALESCE(AVG(performance_score), 0) as avg_score')
                ->selectRaw('COUNT(*) as total_sessions')
                ->first();

            return [
                'total_verses_memorized' => (int) $stats->total_memorized,
                'total_verses_revised' => (int) $stats->total_revised,
                'average_performance_score' => round((float) $stats->avg_score, 2),
                'total_sessions' => (int) $stats->total_sessions,
            ];
        });
    }

    private function parentDashboard(User $user, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $studentIds = $user->parentStudents()->pluck('student_id');

        if ($studentIds->isEmpty()) {
            return ['children_stats' => []];
        }

        $children = Student::whereIn('id', $studentIds)->with('user')->get();

        // Batch all memorization stats
        $memorizationStats = MemorizationTracking::whereIn('student_id', $studentIds)
            ->selectRaw('student_id')
            ->selectRaw('COALESCE(SUM(verses_memorized), 0) as total_memorized')
            ->selectRaw('COALESCE(SUM(verses_revised), 0) as total_revised')
            ->selectRaw('COALESCE(AVG(performance_score), 0) as avg_score')
            ->selectRaw('COUNT(*) as total_sessions')
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        // Batch all attendance stats
        $attendanceQuery = Attendance::whereIn('student_id', $studentIds)
            ->selectRaw('student_id')
            ->selectRaw('COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) as present', ['present'])
            ->selectRaw('COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) as absent', ['absent'])
            ->selectRaw('COUNT(*) as total_att');

        if ($dateFrom) $attendanceQuery->where('date', '>=', $dateFrom);
        if ($dateTo) $attendanceQuery->where('date', '<=', $dateTo);

        $attendanceStats = $attendanceQuery->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $childrenStats = [];
        foreach ($children as $child) {
            $mem = $memorizationStats->get($child->id);
            $att = $attendanceStats->get($child->id);

            $totalAtt = (int)($att->total_att ?? 0);
            $present = (int)($att->present ?? 0);

            $childrenStats[] = [
                'child' => $child,
                'memorization' => [
                    'total_verses_memorized' => (int)($mem->total_memorized ?? 0),
                    'total_verses_revised' => (int)($mem->total_revised ?? 0),
                    'average_performance_score' => round((float)($mem->avg_score ?? 0), 2),
                    'total_sessions' => (int)($mem->total_sessions ?? 0),
                ],
                'attendance' => [
                    'present' => $present,
                    'absent' => (int)($att->absent ?? 0),
                    'total' => $totalAtt,
                    'attendance_percentage' => $totalAtt > 0 ? round(($present / $totalAtt) * 100, 2) : 0,
                ],
            ];
        }

        return [
            'children_stats' => $childrenStats,
        ];
    }
}
