<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::with('user');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('specialization')) {
            $query->where('specialization', $request->specialization);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $teachers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $teachers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!in_array($request->user()->role, ['admin', 'organizer'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'qualification' => 'nullable|string',
            'specialization' => 'nullable|string',
            'join_date' => 'nullable|date',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        $teacher = $user->teacher()->create($request->only([
            'qualification', 'specialization', 'join_date',
        ]));

        $teacher->load('user');

        return response()->json([
            'success' => true,
            'data' => $teacher,
            'message' => 'Teacher created successfully.',
        ], 201);
    }

    public function show(Teacher $teacher): JsonResponse
    {
        $teacher->load(['user', 'classes.level', 'memorizationTrackings.student.user']);

        return response()->json([
            'success' => true,
            'data' => $teacher,
        ]);
    }

    public function update(Request $request, Teacher $teacher): JsonResponse
    {
        if (!in_array($request->user()->role, ['admin', 'organizer'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $teacher->user_id,
            'password' => 'nullable|string|min:8',
            'qualification' => 'nullable|string',
            'specialization' => 'nullable|string',
            'join_date' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        $userData = [];
        if ($request->has('name')) $userData['name'] = $request->name;
        if ($request->has('email')) $userData['email'] = $request->email;
        if ($request->has('password')) $userData['password'] = $request->password;

        if (!empty($userData)) {
            $teacher->user()->update($userData);
        }

        $teacher->update($request->only([
            'qualification', 'specialization', 'join_date', 'is_active',
        ]));

        $teacher->load('user');

        return response()->json([
            'success' => true,
            'data' => $teacher,
            'message' => 'Teacher updated successfully.',
        ]);
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        if (!in_array(request()->user()->role, ['admin', 'organizer'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $teacher->user()->delete();
        $teacher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Teacher deleted successfully.',
        ]);
    }

    public function performance(Teacher $teacher): JsonResponse
    {
        $trackings = $teacher->memorizationTrackings()
            ->with(['student.user', 'surah'])
            ->orderBy('created_at', 'desc')
            ->get();

        $totalStudents = $teacher->memorizationTrackings()->distinct('student_id')->count('student_id');
        $averageScore = $teacher->memorizationTrackings()->avg('performance_score');
        $totalVerses = $teacher->memorizationTrackings()->sum('verses_memorized');

        return response()->json([
            'success' => true,
            'data' => [
                'trackings' => $trackings,
                'total_students' => $totalStudents,
                'average_performance_score' => round($averageScore, 2),
                'total_verses_memorized' => $totalVerses,
                'total_sessions' => $trackings->count(),
            ],
        ]);
    }

    public function classes(Teacher $teacher): JsonResponse
    {
        $classes = $teacher->classes()->with('level', 'enrollments.student.user')->get();

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }
}
