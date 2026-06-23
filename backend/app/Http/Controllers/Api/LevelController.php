<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Level;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LevelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Level::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $levels = $query->orderBy('order')->with('classes')->get();

        return response()->json([
            'success' => true,
            'data' => $levels,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $level = Level::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $level,
            'message' => 'Level created successfully.',
        ], 201);
    }

    public function show(Level $level): JsonResponse
    {
        $level->load('classes');

        return response()->json([
            'success' => true,
            'data' => $level,
        ]);
    }

    public function update(Request $request, Level $level): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $level->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $level,
            'message' => 'Level updated successfully.',
        ]);
    }

    public function destroy(Level $level): JsonResponse
    {
        $level->delete();

        return response()->json([
            'success' => true,
            'message' => 'Level deleted successfully.',
        ]);
    }
}
