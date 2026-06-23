<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExamRequest::with(['student.user', 'committee.teacher.user', 'result']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $examRequests = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $examRequests,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'hizb_count' => 'required|integer|min:1',
            'committee_notes' => 'nullable|string',
            'requested_date' => 'nullable|date',
        ]);

        $examRequest = ExamRequest::create([
            'student_id' => $request->student_id,
            'hizb_count' => $request->hizb_count,
            'committee_notes' => $request->committee_notes,
            'status' => 'pending',
            'requested_date' => $request->requested_date ?? now()->toDateString(),
        ]);

        $examRequest->load(['student.user']);

        return response()->json([
            'success' => true,
            'data' => $examRequest,
            'message' => 'Exam request created successfully.',
        ], 201);
    }

    public function show(ExamRequest $examRequest): JsonResponse
    {
        $examRequest->load(['student.user', 'committee.teacher.user', 'result', 'reviewer']);

        return response()->json([
            'success' => true,
            'data' => $examRequest,
        ]);
    }

    public function update(Request $request, ExamRequest $examRequest): JsonResponse
    {
        $request->validate([
            'hizb_count' => 'nullable|integer|min:1',
            'committee_notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $examRequest->update($request->all());
        $examRequest->load(['student.user', 'committee.teacher.user', 'result']);

        return response()->json([
            'success' => true,
            'data' => $examRequest,
            'message' => 'Exam request updated successfully.',
        ]);
    }

    public function destroy(ExamRequest $examRequest): JsonResponse
    {
        $examRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Exam request deleted successfully.',
        ]);
    }

    public function approve(ExamRequest $examRequest): JsonResponse
    {
        $examRequest->update([
            'status' => 'approved',
            'reviewed_by' => request()->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $examRequest,
            'message' => 'Exam request approved.',
        ]);
    }

    public function reject(Request $request, ExamRequest $examRequest): JsonResponse
    {
        $request->validate([
            'committee_notes' => 'nullable|string',
        ]);

        $examRequest->update([
            'status' => 'rejected',
            'committee_notes' => $request->committee_notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $examRequest,
            'message' => 'Exam request rejected.',
        ]);
    }

    public function schedule(Request $request, ExamRequest $examRequest): JsonResponse
    {
        $request->validate([
            'teacher_ids' => 'required|array',
            'teacher_ids.*' => 'exists:teachers,id',
        ]);

        foreach ($request->teacher_ids as $teacherId) {
            $examRequest->committee()->create([
                'teacher_id' => $teacherId,
                'role' => 'examiner',
            ]);
        }

        $examRequest->update(['status' => 'scheduled']);
        $examRequest->load(['committee.teacher.user']);

        return response()->json([
            'success' => true,
            'data' => $examRequest,
            'message' => 'Exam committee scheduled.',
        ]);
    }
}
