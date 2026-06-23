<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classe;
use App\Models\Enrollment;
use App\Models\ExamResult;
use App\Models\Level;
use App\Models\MemorizationTracking;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
    }

    private function organizerDashboard(?string $dateFrom = null, ?string $dateTo = null): array
    {
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
    }

    private function teacherDashboard(User $user): array
    {
        $teacher = $user->teacher;

        if (!$teacher) {
            return [];
        }

        $myClasses = Classe::where('teacher_id', $teacher->id)->count();
        $myStudents = Enrollment::whereIn('class_id', function ($q) use ($teacher) {
            $q->select('id')->from('classes')->where('teacher_id', $teacher->id);
        })->distinct('student_id')->count('student_id');

        $myClassesCount = $myClasses;
        $myStudentsCount = $myStudents;

        return [
            'my_classes' => $myClassesCount,
            'my_students' => $myStudentsCount,
        ];
    }

    private function studentDashboard(User $user): array
    {
        $student = $user->student;

        if (!$student) {
            return [];
        }

        $totalMemorized = MemorizationTracking::where('student_id', $student->id)->sum('verses_memorized');
        $totalRevised = MemorizationTracking::where('student_id', $student->id)->sum('verses_revised');
        $averageScore = MemorizationTracking::where('student_id', $student->id)->avg('performance_score');
        $totalSessions = MemorizationTracking::where('student_id', $student->id)->count();

        return [
            'total_verses_memorized' => $totalMemorized,
            'total_verses_revised' => $totalRevised,
            'average_performance_score' => round($averageScore, 2),
            'total_sessions' => $totalSessions,
        ];
    }

    private function parentDashboard(User $user, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $studentIds = $user->parentStudents()->pluck('student_id');
        $children = Student::whereIn('id', $studentIds)->with('user')->get();
        $childrenStats = [];

        foreach ($children as $child) {
            $totalMemorized = MemorizationTracking::where('student_id', $child->id)->sum('verses_memorized');
            $totalRevised = MemorizationTracking::where('student_id', $child->id)->sum('verses_revised');
            $averageScore = MemorizationTracking::where('student_id', $child->id)->avg('performance_score');
            $totalSessions = MemorizationTracking::where('student_id', $child->id)->count();

            $attQuery = Attendance::where('student_id', $child->id);
            if ($dateFrom) $attQuery->where('date', '>=', $dateFrom);
            if ($dateTo) $attQuery->where('date', '<=', $dateTo);
            $present = (clone $attQuery)->where('status', 'present')->count();
            $absent = (clone $attQuery)->where('status', 'absent')->count();
            $totalAtt = (clone $attQuery)->count();

            $childrenStats[] = [
                'child' => $child,
                'memorization' => [
                    'total_verses_memorized' => $totalMemorized,
                    'total_verses_revised' => $totalRevised,
                    'average_performance_score' => round($averageScore, 2),
                    'total_sessions' => $totalSessions,
                ],
                'attendance' => [
                    'present' => $present,
                    'absent' => $absent,
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
