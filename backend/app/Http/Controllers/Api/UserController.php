<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User updated successfully.',
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update(['password' => $request->password]);

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة تعيين كلمة المرور بنجاح.',
        ]);
    }

    public function pending(): JsonResponse
    {
        $users = User::where('status', 'pending')->whereNotNull('email_verified_at')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function approve(User $user): JsonResponse
    {
        $user->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User approved successfully.',
        ]);
    }

    public function reject(User $user): JsonResponse
    {
        $user->update(['status' => 'inactive']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User rejected.',
        ]);
    }

    public function deactivate(User $user): JsonResponse
    {
        $user->update(['status' => 'pending']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User deactivated and moved to pending.',
        ]);
    }

    public function reactivate(User $user): JsonResponse
    {
        $user->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User reactivated successfully.',
        ]);
    }
}