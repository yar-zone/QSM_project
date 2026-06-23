<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function pending(): JsonResponse
    {
        $users = User::where('status', 'pending')->get();

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