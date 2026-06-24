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

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                if (!in_array((int)$request->class_id, $classIds->toArray())) {
                    return response()->json(['success' => false, 'message' => 'الفصل ليس ضمن فصولك.'], 403);
                }
            }
        }

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
            'date' => 'nullable|date',
        ]);

        $attendance->update([
            'status' => $request->status ?? $attendance->status,
            'notes' => $request->notes ?? $attendance->notes,
            'date' => $request->date ?? $attendance->date,
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

        $attended = $summary['present'] + $summary['late'];
        $summary['attendance_percentage'] = $summary['total'] > 0
            ? round(($attended / $summary['total']) * 100, 2)
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

        $query = \App\Models\Classe::selectRaw("
                classes.id,
                classes.name,
                COALESCE(SUM(CASE WHEN attendances.status = 'present' THEN 1 ELSE 0 END), 0) as present,
                COALESCE(SUM(CASE WHEN attendances.status = 'absent' THEN 1 ELSE 0 END), 0) as absent,
                COALESCE(SUM(CASE WHEN attendances.status = 'late' THEN 1 ELSE 0 END), 0) as late,
                COALESCE(SUM(CASE WHEN attendances.status = 'excused' THEN 1 ELSE 0 END), 0) as excused
            ")
            ->leftJoin('attendances', function ($join) use ($request) {
                $join->on('attendances.class_id', '=', 'classes.id');
                if ($request->has('date_from')) {
                    $join->where('attendances.date', '>=', $request->date_from);
                }
                if ($request->has('date_to')) {
                    $join->where('attendances.date', '<=', $request->date_to);
                }
            })
            ->when($classIds !== null, fn($q) => $q->whereIn('classes.id', $classIds))
            ->groupBy('classes.id', 'classes.name')
            ->orderBy('classes.name');

        $results = $query->get()->map(function ($row) {
            $total = $row->present + $row->absent + $row->late + $row->excused;
            return [
                'class_id' => (int) $row->id,
                'class_name' => $row->name,
                'present' => (int) $row->present,
                'absent' => (int) $row->absent,
                'late' => (int) $row->late,
                'excused' => (int) $row->excused,
                'total' => $total,
                'attendance_percentage' => $total > 0 ? round((($row->present + $row->late) / $total) * 100, 2) : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $results,
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
