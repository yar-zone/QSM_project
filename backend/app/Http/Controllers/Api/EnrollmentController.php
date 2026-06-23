<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Enrollment::with(['student.user', 'classe.level']);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $enrollments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $enrollments,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'enrolled_date' => 'nullable|date',
            'status' => 'nullable|string',
        ]);

        $enrollment = Enrollment::create($request->all());
        $enrollment->load(['student.user', 'classe.level']);

        return response()->json([
            'success' => true,
            'data' => $enrollment,
            'message' => 'Enrollment created successfully.',
        ], 201);
    }

    public function show(Enrollment $enrollment): JsonResponse
    {
        $enrollment->load(['student.user', 'classe.level']);

        return response()->json([
            'success' => true,
            'data' => $enrollment,
        ]);
    }

    public function update(Request $request, Enrollment $enrollment): JsonResponse
    {
        $request->validate([
            'enrolled_date' => 'nullable|date',
            'status' => 'nullable|string',
        ]);

        $enrollment->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $enrollment,
            'message' => 'Enrollment updated successfully.',
        ]);
    }

    public function destroy(Enrollment $enrollment): JsonResponse
    {
        $enrollment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Enrollment deleted successfully.',
        ]);
    }
}
