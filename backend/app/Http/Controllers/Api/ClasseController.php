<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClasseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Classe::with(['level', 'teacher.user']);

        if ($request->has('level_id')) {
            $query->where('level_id', $request->level_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        $user = $request->user();
        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->teacher->id);
        }

        $perPage = $request->get('per_page', 15);
        $classes = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'level_id' => 'required|exists:levels,id',
            'teacher_id' => 'required|exists:teachers,id',
            'name' => 'required|string|max:255',
            'academic_year' => 'nullable|string',
            'max_students' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $classe = Classe::create($request->all());
        $classe->load(['level', 'teacher.user']);

        return response()->json([
            'success' => true,
            'data' => $classe,
            'message' => 'Class created successfully.',
        ], 201);
    }

    public function show(Classe $classe): JsonResponse
    {
        $user = request()->user();
        if ($user->role === 'teacher' && $classe->teacher_id !== $user->teacher->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $classe->load(['level', 'teacher.user', 'enrollments.student.user', 'attendances']);

        return response()->json([
            'success' => true,
            'data' => $classe,
        ]);
    }

    public function update(Request $request, Classe $classe): JsonResponse
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'level_id' => 'nullable|exists:levels,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'name' => 'nullable|string|max:255',
            'academic_year' => 'nullable|string',
            'max_students' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $classe->update($request->all());
        $classe->load(['level', 'teacher.user']);

        return response()->json([
            'success' => true,
            'data' => $classe,
            'message' => 'Class updated successfully.',
        ]);
    }

    public function destroy(Classe $classe): JsonResponse
    {
        if (request()->user()->role === 'teacher') {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $classe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Class deleted successfully.',
        ]);
    }

    public function students(Classe $classe): JsonResponse
    {
        $user = request()->user();
        if ($user->role === 'teacher' && $classe->teacher_id !== $user->teacher->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $students = $classe->enrollments()
            ->with('student.user')
            ->get()
            ->pluck('student');

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    public function attendance(Classe $classe): JsonResponse
    {
        $user = request()->user();
        if ($user->role === 'teacher' && $classe->teacher_id !== $user->teacher->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $attendances = $classe->attendances()
            ->with('student.user')
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function schedule(Classe $classe): JsonResponse
    {
        $user = request()->user();
        if ($user->role === 'teacher' && $classe->teacher_id !== $user->teacher->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $meetings = $classe->meetings()
            ->with('participants.user')
            ->orderBy('scheduled_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $meetings,
        ]);
    }
}
