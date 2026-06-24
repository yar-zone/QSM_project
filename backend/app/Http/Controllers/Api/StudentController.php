<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Student::with(['user', 'guardian', 'enrollments.classe', 'attendances']);

        if ($user->role === 'teacher' && $user->teacher) {
            $query->whereHas('enrollments.classe', function ($q) use ($user) {
                $q->where('teacher_id', $user->teacher->id);
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $students = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'enrollment_date' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:20',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
            'guardian_id' => 'nullable|exists:users,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => 'student',
            'status' => 'active',
        ]);

        $student = $user->student()->create([
            'enrollment_date' => $request->enrollment_date,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'address' => $request->address,
            'phone' => $request->phone,
            'emergency_contact' => $request->emergency_contact,
            'guardian_id' => $request->guardian_id,
        ]);

        if ($request->has('class_ids')) {
            foreach ($request->class_ids as $classId) {
                Enrollment::create([
                    'student_id' => $student->id,
                    'class_id' => $classId,
                    'status' => 'active',
                ]);
            }
        }

        $student->load(['user', 'enrollments.classe']);

        return response()->json([
            'success' => true,
            'data' => $student,
            'message' => 'Student created successfully.',
        ], 201);
    }

    public function show(Student $student): JsonResponse
    {
        $user = request()->user();
        if ($user->role === 'teacher' && $user->teacher) {
            $belongs = $student->enrollments()->whereHas('classe', function ($q) use ($user) {
                $q->where('teacher_id', $user->teacher->id);
            })->exists();
            if (!$belongs) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
        }
        $student->load(['user', 'guardian', 'enrollments.classe', 'memorizationTrackings.surah', 'attendances', 'examRequests', 'certificates']);

        return response()->json([
            'success' => true,
            'data' => $student,
        ]);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }
        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $student->user_id,
            'password' => 'nullable|string|min:8',
            'enrollment_date' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
            'guardian_id' => 'nullable|exists:users,id',
        ]);

        $userData = [];
        if ($request->has('name')) $userData['name'] = $request->name;
        if ($request->has('email')) $userData['email'] = $request->email;
        if ($request->has('password')) $userData['password'] = $request->password;

        if (!empty($userData)) {
            $student->user()->update($userData);
        }

        $student->update($request->only([
            'enrollment_date', 'date_of_birth',
            'gender', 'address', 'phone', 'emergency_contact', 'is_active',
            'guardian_id',
        ]));

        if ($request->has('class_ids')) {
            $student->enrollments()->delete();
            foreach ($request->class_ids as $classId) {
                Enrollment::create([
                    'student_id' => $student->id,
                    'class_id' => $classId,
                    'status' => 'active',
                ]);
            }
        }

        $student->load(['user', 'enrollments.classe']);

        return response()->json([
            'success' => true,
            'data' => $student,
            'message' => 'Student updated successfully.',
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        if (request()->user()->role === 'teacher') {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }
        $student->user()->delete();
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully.',
        ]);
    }

    public function progress(Student $student): JsonResponse
    {
        $trackings = $student->memorizationTrackings()
            ->with('surah')
            ->orderBy('created_at', 'desc')
            ->get();

        $totalMemorized = $student->memorizationTrackings()->sum('verses_memorized');
        $totalRevised = $student->memorizationTrackings()->sum('verses_revised');
        $averageScore = $student->memorizationTrackings()->avg('performance_score');

        return response()->json([
            'success' => true,
            'data' => [
                'trackings' => $trackings,
                'total_verses_memorized' => $totalMemorized,
                'total_verses_revised' => $totalRevised,
                'average_performance_score' => round($averageScore, 2),
                'total_sessions' => $trackings->count(),
            ],
        ]);
    }

    public function results(Student $student): JsonResponse
    {
        $student->load(['examRequests.result', 'certificates']);

        return response()->json([
            'success' => true,
            'data' => [
                'exam_requests' => $student->examRequests,
                'certificates' => $student->certificates,
            ],
        ]);
    }

    public function attendance(Student $student): JsonResponse
    {
        $attendances = $student->attendances()
            ->with('classe')
            ->orderBy('date', 'desc')
            ->get();

        $present = $attendances->where('status', 'present')->count();
        $absent = $attendances->where('status', 'absent')->count();
        $late = $attendances->where('status', 'late')->count();
        $excused = $attendances->where('status', 'excused')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'attendances' => $attendances,
                'summary' => [
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                    'excused' => $excused,
                    'total' => $attendances->count(),
                ],
            ],
        ]);
    }
}