<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Surah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SurahController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Surah::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('revelation_type')) {
            $query->where('revelation_type', $request->revelation_type);
        }

        $surahs = $query->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $surahs,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'name_arabic' => 'nullable|string',
            'juz' => 'nullable|integer',
            'hizb' => 'nullable|integer',
            'verses_count' => 'nullable|integer',
            'revelation_type' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $surah = Surah::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $surah,
            'message' => 'Surah created successfully.',
        ], 201);
    }

    public function show(Surah $surah): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $surah,
        ]);
    }

    public function update(Request $request, Surah $surah): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'name_arabic' => 'nullable|string',
            'juz' => 'nullable|integer',
            'hizb' => 'nullable|integer',
            'verses_count' => 'nullable|integer',
            'revelation_type' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $surah->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $surah,
            'message' => 'Surah updated successfully.',
        ]);
    }

    public function destroy(Surah $surah): JsonResponse
    {
        $surah->delete();

        return response()->json([
            'success' => true,
            'message' => 'Surah deleted successfully.',
        ]);
    }
}
