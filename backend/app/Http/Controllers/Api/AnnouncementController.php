<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::with(['author', 'attachments']);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('target_audience')) {
            $query->where('target_audience', $request->target_audience);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('is_pinned')) {
            $query->where('is_pinned', $request->boolean('is_pinned'));
        }

        $user = $request->user();
        if (in_array($user->role, ['student', 'teacher', 'parent'])) {
            if ($user->role === 'parent') {
                $query->whereIn('target_audience', ['parent', 'student', 'all']);
            } else {
                $query->whereIn('target_audience', [$user->role, 'all']);
            }
        }

        $query->orderBy('is_pinned', 'desc')->orderBy('published_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $announcements = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string',
            'target_audience' => 'required|string',
            'is_pinned' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'is_active' => 'nullable|boolean',
        ]);

        $announcement = Announcement::create([
            'author_id' => $request->user()->id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'target_audience' => $request->target_audience,
            'is_pinned' => $request->boolean('is_pinned', false),
            'published_at' => $request->published_at ?? now(),
            'expires_at' => $request->expires_at,
            'is_active' => $request->boolean('is_active', true),
        ]);

        $announcement->load(['author', 'attachments']);

        return response()->json([
            'success' => true,
            'data' => $announcement,
            'message' => 'Announcement created successfully.',
        ], 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        $announcement->load(['author', 'attachments']);

        return response()->json([
            'success' => true,
            'data' => $announcement,
        ]);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'category' => 'nullable|string',
            'target_audience' => 'nullable|string',
            'is_pinned' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'is_active' => 'nullable|boolean',
        ]);

        $announcement->update($request->all());
        $announcement->load(['author', 'attachments']);

        return response()->json([
            'success' => true,
            'data' => $announcement,
            'message' => 'Announcement updated successfully.',
        ]);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    public function pinned(): JsonResponse
    {
        $announcements = Announcement::with(['author', 'attachments'])
            ->where('is_pinned', true)
            ->where('is_active', true)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    public function targeted(Request $request): JsonResponse
    {
        $request->validate([
            'target_audience' => 'required|string',
        ]);

        $announcements = Announcement::with(['author', 'attachments'])
            ->where('target_audience', $request->target_audience)
            ->where('is_active', true)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }
}
