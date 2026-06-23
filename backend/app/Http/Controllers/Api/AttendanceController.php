<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Attendance::with(['student.user', 'classe', 'markedBy']);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $query->whereIn('class_id', $classIds);
            }
        }

        $perPage = $request->get('per_page', 15);
        $attendances = $query->orderBy('date', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'class_id' => $request->class_id,
                'date' => $request->date,
            ],
            [
                'status' => $request->status,
                'notes' => $request->notes,
                'marked_by' => $request->user()->id,
            ]
        );

        $attendance->load(['student.user', 'classe', 'markedBy']);

        return response()->json([
            'success' => true,
            'data' => $attendance,
            'message' => 'Attendance recorded successfully.',
        ], 201);
    }

    public function show(Attendance $attendance): JsonResponse
    {
        $attendance->load(['student.user', 'classe', 'markedBy']);

        return response()->json([
            'success' => true,
            'data' => $attendance,
        ]);
    }

    public function update(Request $request, Attendance $attendance): JsonResponse
    {
        $request->validate([
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $attendance->update([
            'status' => $request->status ?? $attendance->status,
            'notes' => $request->notes ?? $attendance->notes,
            'marked_by' => $request->user()->id,
        ]);

        $attendance->load(['student.user', 'classe', 'markedBy']);

        return response()->json([
            'success' => true,
            'data' => $attendance,
            'message' => 'Attendance updated successfully.',
        ]);
    }

    public function destroy(Attendance $attendance): JsonResponse
    {
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted successfully.',
        ]);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|string',
            'attendances.*.notes' => 'nullable|string',
        ]);

        $records = [];
        foreach ($request->attendances as $record) {
            $attendance = Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'class_id' => $request->class_id,
                    'date' => $request->date,
                ],
                [
                    'status' => $record['status'],
                    'notes' => $record['notes'] ?? null,
                    'marked_by' => $request->user()->id,
                ]
            );
            $records[] = $attendance;
        }

        return response()->json([
            'success' => true,
            'data' => $records,
            'message' => 'Bulk attendance recorded successfully.',
        ], 201);
    }

    public function classAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'nullable|date',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $query = Attendance::with(['student.user', 'markedBy'])
            ->where('class_id', $request->class_id);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        $attendances = $query->orderBy('date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function studentAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $attendances = Attendance::with(['classe', 'markedBy'])
            ->where('student_id', $request->student_id)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'nullable|exists:classes,id',
            'student_id' => 'nullable|exists:students,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $query = Attendance::with(['student.user', 'classe']);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $query->whereBetween('date', [$request->date_from, $request->date_to]);
        $attendances = $query->get();

        $summary = [
            'present' => $attendances->where('status', 'present')->count(),
            'absent' => $attendances->where('status', 'absent')->count(),
            'late' => $attendances->where('status', 'late')->count(),
            'excused' => $attendances->where('status', 'excused')->count(),
            'total' => $attendances->count(),
        ];

        $summary['attendance_percentage'] = $summary['total'] > 0
            ? round(($summary['present'] / $summary['total']) * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'attendances' => $attendances,
                'summary' => $summary,
            ],
        ]);
    }

    public function classReports(Request $request): JsonResponse
    {
        $user = $request->user();

        $classIds = null;
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            $classIds = $teacher ? $teacher->classes()->pluck('classes.id')->toArray() : [];
        }

        $attendances = Attendance::selectRaw("class_id, status, COUNT(*) as count")
            ->when($classIds !== null, fn($q) => $q->whereIn('class_id', $classIds))
            ->when($request->has('date_from'), fn($q) => $q->where('date', '>=', $request->date_from))
            ->when($request->has('date_to'), fn($q) => $q->where('date', '<=', $request->date_to))
            ->groupBy('class_id', 'status')
            ->get();

        $grouped = $attendances->groupBy('class_id');

        $classes = \App\Models\Classe::whereIn('id', $grouped->keys())
            ->get()
            ->keyBy('id');

        $result = [];
        foreach ($grouped as $classId => $records) {
            $present = $records->where('status', 'present')->sum('count');
            $absent = $records->where('status', 'absent')->sum('count');
            $late = $records->where('status', 'late')->sum('count');
            $excused = $records->where('status', 'excused')->sum('count');
            $total = $present + $absent + $late + $excused;

            $result[] = [
                'class_id' => (int) $classId,
                'class_name' => $classes[$classId]->name ?? "فصل #$classId",
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'total' => $total,
                'attendance_percentage' => $total > 0 ? round(($present / $total) * 100, 2) : 0,
            ];
        }

        usort($result, fn($a, $b) => strcmp($a['class_name'], $b['class_name']));

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function myAttendance(Request $request): JsonResponse
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

        $query = Attendance::whereIn('student_id', $studentIds)
            ->with(['classe', 'markedBy']);

        $perPage = $request->get('per_page', 15);
        $attendances = $query->orderBy('date', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }
}
