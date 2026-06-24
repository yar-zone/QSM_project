<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExamResult::with(['examRequest.student.user', 'student.user', 'level', 'evaluatedBy']);

        if ($request->has('exam_request_id')) {
            $query->where('exam_request_id', $request->exam_request_id);
        }

        if ($request->has('is_passed')) {
            $query->where('is_passed', $request->boolean('is_passed'));
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $studentIds = \App\Models\Enrollment::whereIn('class_id', $classIds)->pluck('student_id');
                $query->where(function ($q) use ($studentIds) {
                    $q->whereIn('student_id', $studentIds)
                      ->orWhereHas('examRequest', function ($q) use ($studentIds) {
                          $q->whereIn('student_id', $studentIds);
                      });
                });
            }
        }

        $perPage = $request->get('per_page', 15);
        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'level_id' => 'nullable|exists:levels,id',
            'marks_obtained' => 'nullable|numeric|min:0|max:999.99',
            'grade' => 'nullable|string',
            'evaluator_notes' => 'nullable|string',
            'is_passed' => 'nullable|boolean',
        ]);

        $user = $request->user();
        if ($user->role === 'teacher' && $request->has('student_id')) {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $studentIds = \App\Models\Enrollment::whereIn('class_id', $classIds)->pluck('student_id');
                if (!in_array((int)$request->student_id, $studentIds->toArray())) {
                    return response()->json(['success' => false, 'message' => 'الطالب ليس ضمن فصولك.'], 403);
                }
            }
        }

        $result = ExamResult::create([
            'student_id' => $request->student_id,
            'level_id' => $request->level_id,
            'marks_obtained' => $request->marks_obtained,
            'grade' => $request->grade,
            'evaluator_notes' => $request->evaluator_notes,
            'is_passed' => $request->boolean('is_passed', false),
            'evaluated_by' => $request->user()->id,
            'evaluated_at' => now(),
        ]);

        $result->load(['student.user', 'level', 'evaluatedBy']);

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Exam result created successfully.',
        ], 201);
    }

    public function show(ExamResult $examResult): JsonResponse
    {
        $examResult->load(['examRequest.student.user', 'student.user', 'level', 'evaluatedBy']);

        return response()->json([
            'success' => true,
            'data' => $examResult,
        ]);
    }

    public function update(Request $request, ExamResult $examResult): JsonResponse
    {
        $request->validate([
            'marks_obtained' => 'nullable|numeric|min:0|max:999.99',
            'grade' => 'nullable|string',
            'evaluator_notes' => 'nullable|string',
            'is_passed' => 'nullable|boolean',
        ]);

        $examResult->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $examResult,
            'message' => 'Exam result updated successfully.',
        ]);
    }

    public function destroy(ExamResult $examResult): JsonResponse
    {
        $examResult->delete();

        return response()->json([
            'success' => true,
            'message' => 'Exam result deleted successfully.',
        ]);
    }

    public function record(Request $request): JsonResponse
    {
        $request->validate([
            'exam_request_id' => 'required|exists:exam_requests,id',
            'marks_obtained' => 'required|numeric|min:0|max:999.99',
            'grade' => 'nullable|string',
            'evaluator_notes' => 'nullable|string',
            'is_passed' => 'required|boolean',
        ]);

        $result = ExamResult::updateOrCreate(
            ['exam_request_id' => $request->exam_request_id],
            [
                'marks_obtained' => $request->marks_obtained,
                'grade' => $request->grade,
                'evaluator_notes' => $request->evaluator_notes,
                'is_passed' => $request->boolean('is_passed'),
                'evaluated_by' => $request->user()->id,
                'evaluated_at' => now(),
            ]
        );

        $result->examRequest->update(['status' => 'completed']);
        $result->examRequest?->update(['status' => 'completed']);
        $result->load(['examRequest.student.user', 'student.user', 'evaluatedBy']);

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Exam result recorded successfully.',
        ]);
    }

    public function myResults(Request $request): JsonResponse
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

        $query = ExamResult::where(function ($q) use ($studentIds) {
            $q->whereHas('examRequest', function ($q) use ($studentIds) {
                $q->whereIn('student_id', $studentIds);
            })->orWhereIn('student_id', $studentIds);
        })->with(['examRequest.student.user', 'student.user', 'evaluatedBy']);

        $perPage = $request->get('per_page', 15);
        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
