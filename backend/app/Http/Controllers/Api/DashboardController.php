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

        $data = match ($user->role) {
            'admin' => $this->adminDashboard(),
            'organizer' => $this->organizerDashboard(),
            'teacher' => $this->teacherDashboard($user),
            'student' => $this->studentDashboard($user),
            'parent' => $this->parentDashboard($user),
            default => [],
        };

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function adminDashboard(): array
    {
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();
        $totalClasses = Classe::count();
        $totalLevels = Level::count();
        $totalUsers = User::count();
        $pendingUsers = User::where('status', 'pending')->count();
        $totalAttendances = Attendance::count();
        $presentAttendances = Attendance::where('status', 'present')->count();
        $attendanceRate = $totalAttendances > 0 ? round(($presentAttendances / $totalAttendances) * 100, 2) : 0;

        return [
            'total_students' => $totalStudents,
            'total_teachers' => $totalTeachers,
            'total_classes' => $totalClasses,
            'total_levels' => $totalLevels,
            'total_users' => $totalUsers,
            'pending_approvals' => $pendingUsers,
            'attendance_rate' => $attendanceRate,
        ];
    }

    private function organizerDashboard(): array
    {
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();
        $totalClasses = Classe::count();
        $totalLevels = Level::count();
        $totalAttendances = Attendance::count();
        $presentAttendances = Attendance::where('status', 'present')->count();
        $attendanceRate = $totalAttendances > 0 ? round(($presentAttendances / $totalAttendances) * 100, 2) : 0;

        return [
            'total_students' => $totalStudents,
            'total_teachers' => $totalTeachers,
            'total_classes' => $totalClasses,
            'total_levels' => $totalLevels,
            'attendance_rate' => $attendanceRate,
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

    private function parentDashboard(User $user): array
    {
        $studentIds = $user->parentStudents()->pluck('student_id');
        $children = Student::whereIn('id', $studentIds)->with('user')->get();
        $childrenStats = [];

        foreach ($children as $child) {
            $totalMemorized = MemorizationTracking::where('student_id', $child->id)->sum('verses_memorized');
            $totalRevised = MemorizationTracking::where('student_id', $child->id)->sum('verses_revised');
            $averageScore = MemorizationTracking::where('student_id', $child->id)->avg('performance_score');
            $totalSessions = MemorizationTracking::where('student_id', $child->id)->count();

            $present = Attendance::where('student_id', $child->id)->where('status', 'present')->count();
            $absent = Attendance::where('student_id', $child->id)->where('status', 'absent')->count();
            $totalAtt = Attendance::where('student_id', $child->id)->count();

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
