<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingTargetClass;
use App\Models\MeetingTargetTeacher;
use App\Models\MeetingTargetOrganizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MeetingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Meeting::with(['organizer', 'teacher.user', 'participants.user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('platform')) {
            $query->where('platform', $request->platform);
        }

        if ($request->has('organizer_id')) {
            $query->where('organizer_id', $request->organizer_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        $user = $request->user();
        if ($user->role === 'admin') {
            // Admin sees all meetings
        } elseif ($user->role === 'organizer') {
            $query->where('organizer_id', $user->id);
        } elseif ($user->role === 'teacher' && $user->teacher) {
            $query->where(function ($q) use ($user) {
                $q->where('teacher_id', $user->teacher->id)
                  ->orWhereHas('targetTeachers', function ($q2) use ($user) {
                      $q2->where('teacher_id', $user->teacher->id);
                  });
            });
        } elseif ($user->role === 'student' && $user->student) {
            $query->whereHas('targetClasses', function ($q) use ($user) {
                $q->whereIn('class_id', $user->student->enrollments->pluck('class_id'));
            });
        } elseif ($user->role === 'parent') {
            $childrenIds = $user->parentStudents->pluck('id')->toArray();
            $query->whereHas('targetClasses', function ($q) use ($childrenIds) {
                $q->whereIn('class_id', function ($subq) use ($childrenIds) {
                    $subq->select('class_id')
                        ->from('enrollments')
                        ->whereIn('student_id', $childrenIds);
                });
            });
        }

        $query->orderBy('scheduled_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $meetings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $meetings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'organizer_id' => 'nullable|exists:users,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'platform' => 'required|string',
            'meeting_link' => 'nullable|string',
            'scheduled_at' => 'required|date',
            'duration_minutes' => 'nullable|integer|min:1',
            'target_classes' => 'nullable|array',
            'target_classes.*' => 'exists:classes,id',
            'target_teachers' => 'nullable|array',
            'target_teachers.*' => 'exists:teachers,id',
            'target_organizers' => 'nullable|array',
            'target_organizers.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $teacherId = $user->role === 'teacher' ? $user->teacher->id : $request->teacher_id;

        $meeting = Meeting::create([
            'organizer_id' => $request->organizer_id ?? $user->id,
            'teacher_id' => $teacherId,
            'title' => $request->title,
            'description' => $request->description,
            'platform' => $request->platform,
            'meeting_link' => $request->meeting_link,
            'meeting_id' => Str::random(10),
            'scheduled_at' => $request->scheduled_at,
            'duration_minutes' => $request->duration_minutes ?? 60,
            'status' => 'scheduled',
        ]);

        if ($request->has('target_classes')) {
            foreach ($request->target_classes as $classId) {
                MeetingTargetClass::create([
                    'meeting_id' => $meeting->id,
                    'class_id' => $classId,
                ]);
            }
        }

        if ($request->has('target_teachers')) {
            foreach ($request->target_teachers as $teacherId) {
                MeetingTargetTeacher::create([
                    'meeting_id' => $meeting->id,
                    'teacher_id' => $teacherId,
                ]);
            }
        }

        if ($request->has('target_organizers')) {
            foreach ($request->target_organizers as $organizerId) {
                MeetingTargetOrganizer::create([
                    'meeting_id' => $meeting->id,
                    'organizer_id' => $organizerId,
                ]);
            }
        }

        $meeting->participants()->create([
            'user_id' => $request->user()->id,
            'role' => 'organizer',
        ]);

        $meeting->load(['organizer', 'teacher.user', 'participants.user', 'targetClasses', 'targetTeachers', 'targetOrganizers']);

        return response()->json([
            'success' => true,
            'data' => $meeting,
            'message' => 'Meeting created successfully.',
        ], 201);
    }

    public function show(Meeting $meeting): JsonResponse
    {
        $meeting->load(['organizer', 'teacher.user', 'participants.user']);

        return response()->json([
            'success' => true,
            'data' => $meeting,
        ]);
    }

    public function update(Request $request, Meeting $meeting): JsonResponse
    {
        $user = $request->user();
        if ($user->role === 'teacher' && $meeting->teacher_id !== $user->teacher->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'platform' => 'nullable|string',
            'meeting_link' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
            'duration_minutes' => 'nullable|integer|min:1',
            'status' => 'nullable|string',
            'recording_url' => 'nullable|string',
        ]);

        $meeting->update($request->all());
        $meeting->load(['organizer', 'teacher.user', 'participants.user']);

        return response()->json([
            'success' => true,
            'data' => $meeting,
            'message' => 'Meeting updated successfully.',
        ]);
    }

    public function destroy(Meeting $meeting): JsonResponse
    {
        $user = request()->user();
        if ($user->role === 'teacher' && $meeting->teacher_id !== $user->teacher->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $meeting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meeting deleted successfully.',
        ]);
    }

    public function join(Request $request, Meeting $meeting): JsonResponse
    {
        $participant = $meeting->participants()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['role' => 'participant', 'joined_at' => now()]
        );

        return response()->json([
            'success' => true,
            'data' => $participant,
            'message' => 'Joined meeting successfully.',
        ]);
    }

    public function leave(Request $request, Meeting $meeting): JsonResponse
    {
        $meeting->participants()
            ->where('user_id', $request->user()->id)
            ->update(['left_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Left meeting successfully.',
        ]);
    }

    public function generateLink(Meeting $meeting): JsonResponse
    {
        $link = $meeting->meeting_link ?? url('/meetings/' . $meeting->meeting_id);

        return response()->json([
            'success' => true,
            'data' => ['meeting_link' => $link],
        ]);
    }
}
