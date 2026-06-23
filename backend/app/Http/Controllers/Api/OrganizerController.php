<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organizer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OrganizerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Organizer::with('user');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->get('per_page', 15);
        $organizers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $organizers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'qualifications' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'organizer',
            'status' => 'active',
        ]);

        $organizer = $user->organizer()->create($request->only([
            'phone', 'qualifications',
        ]));

        $organizer->load('user');

        return response()->json([
            'success' => true,
            'data' => $organizer,
            'message' => 'Organizer created successfully.',
        ], 201);
    }

    public function show(Organizer $organizer): JsonResponse
    {
        $organizer->load('user');

        return response()->json([
            'success' => true,
            'data' => $organizer,
        ]);
    }

    public function update(Request $request, Organizer $organizer): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $organizer->user_id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'qualifications' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $userData = [];
        if ($request->has('name')) $userData['name'] = $request->name;
        if ($request->has('email')) $userData['email'] = $request->email;
        if ($request->has('password')) $userData['password'] = Hash::make($request->password);

        if (!empty($userData)) {
            $organizer->user()->update($userData);
        }

        $organizer->update($request->only([
            'phone', 'qualifications', 'is_active',
        ]));

        $organizer->load('user');

        return response()->json([
            'success' => true,
            'data' => $organizer,
            'message' => 'Organizer updated successfully.',
        ]);
    }

    public function destroy(Organizer $organizer): JsonResponse
    {
        $organizer->user()->delete();
        $organizer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organizer deleted successfully.',
        ]);
    }
}
