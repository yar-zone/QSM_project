<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\MemorizationTracking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemorizationTrackingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MemorizationTracking::with(['student.user', 'teacher.user', 'surah']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('surah_id')) {
            $query->where('surah_id', $request->surah_id);
        }

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $studentIds = Enrollment::whereIn('class_id', $classIds)->pluck('student_id');
                $query->whereIn('student_id', $studentIds);
            }
        }

        $perPage = $request->get('per_page', 15);
        $trackings = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $trackings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'teacher_id' => 'required|exists:teachers,id',
            'surah_id' => 'nullable|exists:surahs,id',
            'juz' => 'nullable|integer',
            'hizb' => 'nullable|integer',
            'verses_memorized' => 'nullable|integer|min:0',
            'verses_revised' => 'nullable|integer|min:0',
            'start_date' => 'required|date',
            'completion_date' => 'nullable|date',
            'teacher_notes' => 'nullable|string',
            'revision_level' => 'nullable|string',
            'performance_score' => 'nullable|integer|min:0|max:100',
            'week_start' => 'nullable|date',
            'month' => 'nullable|string',
            'year' => 'nullable|string',
        ]);

        $tracking = MemorizationTracking::create($request->all());
        $tracking->load(['student.user', 'teacher.user', 'surah']);

        return response()->json([
            'success' => true,
            'data' => $tracking,
            'message' => 'Tracking record created successfully.',
        ], 201);
    }

    public function show(MemorizationTracking $memorizationTracking): JsonResponse
    {
        $memorizationTracking->load(['student.user', 'teacher.user', 'surah']);

        return response()->json([
            'success' => true,
            'data' => $memorizationTracking,
        ]);
    }

    public function update(Request $request, MemorizationTracking $memorizationTracking): JsonResponse
    {
        $request->validate([
            'surah_id' => 'nullable|exists:surahs,id',
            'juz' => 'nullable|integer',
            'hizb' => 'nullable|integer',
            'verses_memorized' => 'nullable|integer|min:0',
            'verses_revised' => 'nullable|integer|min:0',
            'start_date' => 'nullable|date',
            'completion_date' => 'nullable|date',
            'teacher_notes' => 'nullable|string',
            'revision_level' => 'nullable|string',
            'performance_score' => 'nullable|integer|min:0|max:100',
            'week_start' => 'nullable|date',
            'month' => 'nullable|string',
            'year' => 'nullable|string',
        ]);

        $memorizationTracking->update($request->all());
        $memorizationTracking->load(['student.user', 'teacher.user', 'surah']);

        return response()->json([
            'success' => true,
            'data' => $memorizationTracking,
            'message' => 'Tracking record updated successfully.',
        ]);
    }

    public function destroy(MemorizationTracking $memorizationTracking): JsonResponse
    {
        $memorizationTracking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tracking record deleted successfully.',
        ]);
    }

    public function studentProgress(Request $request, MemorizationTracking $memorizationTracking): JsonResponse
    {
        $studentId = $request->get('student_id', $memorizationTracking->student_id);

        $trackings = MemorizationTracking::where('student_id', $studentId)
            ->with('surah')
            ->orderBy('created_at', 'desc')
           ->get();

        $totalMemorized = $trackings->sum('verses_memorized');
        $totalRevised = $trackings->sum('verses_revised');

        return response()->json([
            'success' => true,
            'data' => [
                'trackings' => $trackings,
                'total_verses_memorized' => $totalMemorized,
                'total_verses_revised' => $totalRevised,
            ],
        ]);
    }

    public function weeklyReport(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'week_start' => 'nullable|date',
        ]);

        $query = MemorizationTracking::with(['student.user', 'surah']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        $weekStart = $request->get('week_start', now()->startOfWeek()->toDateString());
        $query->where('week_start', $weekStart);

        $trackings = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'week_start' => $weekStart,
                'trackings' => $trackings,
                'total_verses_memorized' => $trackings->sum('verses_memorized'),
                'total_verses_revised' => $trackings->sum('verses_revised'),
                'average_score' => round($trackings->avg('performance_score'), 2),
            ],
        ]);
    }

    public function monthlyReport(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'month' => 'nullable|string',
            'year' => 'nullable|string',
        ]);

        $query = MemorizationTracking::with(['student.user', 'surah']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        $month = $request->get('month', now()->format('m'));
        $year = $request->get('year', now()->format('Y'));
        $query->where('month', $month)->where('year', $year);

        $trackings = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $month,
                'year' => $year,
                'trackings' => $trackings,
                'total_verses_memorized' => $trackings->sum('verses_memorized'),
                'total_verses_revised' => $trackings->sum('verses_revised'),
                'average_score' => round($trackings->avg('performance_score'), 2),
            ],
        ]);
    }

    public function yearlyReport(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'year' => 'nullable|string',
        ]);

        $query = MemorizationTracking::with(['student.user', 'surah']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        $year = $request->get('year', now()->format('Y'));
        $query->where('year', $year);

        $trackings = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'trackings' => $trackings,
                'total_verses_memorized' => $trackings->sum('verses_memorized'),
                'total_verses_revised' => $trackings->sum('verses_revised'),
                'average_score' => round($trackings->avg('performance_score'), 2),
                'monthly_breakdown' => $trackings->groupBy('month')->map(function ($items) {
                    return [
                        'total_verses_memorized' => $items->sum('verses_memorized'),
                        'total_verses_revised' => $items->sum('verses_revised'),
                        'average_score' => round($items->avg('performance_score'), 2),
                        'count' => $items->count(),
                    ];
                }),
            ],
        ]);
    }

    public function myTrackings(Request $request): JsonResponse
    {
        $user = $request->user();
        $studentIds = [];

        if ($user->role === 'student' && $user->student) {
            $studentIds = [$user->student->id];
        } elseif ($user->role === 'parent') {
            $studentIds = $user->children()->pluck('student_id')->toArray();
        } else {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $query = MemorizationTracking::whereIn('student_id', $studentIds)
            ->with(['student.user', 'teacher.user', 'surah']);

        $perPage = $request->get('per_page', 15);
        $trackings = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $trackings,
        ]);
    }
}
