<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ParentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = User::where('role', 'parent')->with(['parentStudents.user']);

        if ($user->role === 'teacher' && $user->teacher) {
            $studentIds = \App\Models\Enrollment::whereIn('class_id', function ($q) use ($user) {
                $q->select('id')->from('classes')->where('teacher_id', $user->teacher->id);
            })->pluck('student_id');

            $parentIds = StudentParent::whereIn('student_id', $studentIds)->pluck('parent_id');
            $query->whereIn('id', $parentIds);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $parents = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $parents,
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
            'phone' => 'nullable|string|max:20',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'parent',
            'status' => 'active',
            'phone' => $request->phone,
        ]);

        if ($request->has('student_ids')) {
            foreach ($request->student_ids as $studentId) {
                StudentParent::create([
                    'student_id' => $studentId,
                    'parent_id' => $user->id,
                ]);
            }
        }

        $user->load(['parentStudents.user']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Parent created successfully.',
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $user = request()->user();
        $parent = User::where('role', 'parent')->with(['parentStudents.user'])->findOrFail($id);

        if ($user->role === 'teacher' && $user->teacher) {
            $studentIds = \App\Models\Enrollment::whereIn('class_id', function ($q) use ($user) {
                $q->select('id')->from('classes')->where('teacher_id', $user->teacher->id);
            })->pluck('student_id');

            $hasAccess = StudentParent::where('parent_id', $parent->id)
                ->whereIn('student_id', $studentIds)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $parent,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        if (!in_array($request->user()->role, ['admin', 'organizer'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $parent = User::where('role', 'parent')->findOrFail($id);

        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $parent->id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $data = [];
        if ($request->has('name')) $data['name'] = $request->name;
        if ($request->has('email')) $data['email'] = $request->email;
        if ($request->has('password')) $data['password'] = Hash::make($request->password);
        if ($request->has('phone')) $data['phone'] = $request->phone;

        $parent->update($data);

        if ($request->has('student_ids')) {
            StudentParent::where('parent_id', $parent->id)->delete();
            foreach ($request->student_ids as $studentId) {
                StudentParent::create([
                    'student_id' => $studentId,
                    'parent_id' => $parent->id,
                ]);
            }
        }

        $parent->load(['parentStudents.user']);

        return response()->json([
            'success' => true,
            'data' => $parent,
            'message' => 'Parent updated successfully.',
        ]);
    }

    public function destroy($id): JsonResponse
    {
        if (!in_array(request()->user()->role, ['admin', 'organizer'])) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $parent = User::where('role', 'parent')->findOrFail($id);
        StudentParent::where('parent_id', $parent->id)->delete();
        $parent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parent deleted successfully.',
        ]);
    }
}
