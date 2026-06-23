<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subject::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $subjects = $query->get();

        return response()->json([
            'success' => true,
            'data' => $subjects,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $subject = Subject::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $subject,
            'message' => 'Subject created successfully.',
        ], 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $subject,
        ]);
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $subject->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $subject,
            'message' => 'Subject updated successfully.',
        ]);
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully.',
        ]);
    }
}
