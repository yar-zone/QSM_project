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
        $query = Announcement::with(['author', 'attachments', 'targetClass', 'targetClasses', 'targetUsers']);

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

        if ($user->role === 'student') {
            $student = $user->student;
            $classIds = $student ? $student->classes()->pluck('classes.id')->toArray() : [];
            $query->where(function ($q) use ($user, $classIds) {
                // Announcements targeting their classes (via pivot or old single column)
                if (!empty($classIds)) {
                    $q->where(function ($sub) use ($classIds) {
                        $sub->whereHas('targetClasses', function ($t) use ($classIds) {
                            $t->whereIn('classes.id', $classIds);
                        });
                        // Fallback: old single target_class_id column
                        $sub->orWhere(function ($f) use ($classIds) {
                            $f->whereDoesntHave('targetClasses')
                              ->whereIn('target_class_id', $classIds);
                        });
                    });
                }
                // School-wide: no targets, admin/organizer author, audience student/all
                $q->orWhere(function ($sub) {
                    $sub->whereDoesntHave('targetClasses')
                         ->whereDoesntHave('targetUsers')
                         ->whereNull('target_class_id')
                         ->whereIn('target_audience', ['student', 'all'])
                         ->whereHas('author', function ($a) {
                             $a->whereIn('role', ['admin', 'organizer']);
                         });
                });
                // Directly targeted via users pivot
                $q->orWhereHas('targetUsers', function ($t) use ($user) {
                    $t->where('users.id', $user->id);
                });
                $q->orWhere('author_id', $user->id);
            });
        } elseif ($user->role === 'parent') {
            $childClassIds = $user->children()
                ->join('students', 'student_parent.student_id', '=', 'students.id')
                ->join('enrollments', 'students.id', '=', 'enrollments.student_id')
                ->pluck('enrollments.class_id')
                ->unique()
                ->toArray();
            $query->where(function ($q) use ($user, $childClassIds) {
                if (!empty($childClassIds)) {
                    $q->where(function ($sub) use ($childClassIds) {
                        $sub->whereHas('targetClasses', function ($t) use ($childClassIds) {
                            $t->whereIn('classes.id', $childClassIds);
                        });
                        $sub->orWhere(function ($f) use ($childClassIds) {
                            $f->whereDoesntHave('targetClasses')
                              ->whereIn('target_class_id', $childClassIds);
                        });
                    });
                }
                $q->orWhere(function ($sub) {
                    $sub->whereDoesntHave('targetClasses')
                         ->whereDoesntHave('targetUsers')
                         ->whereNull('target_class_id')
                         ->whereIn('target_audience', ['student', 'parent', 'all'])
                         ->whereHas('author', function ($a) {
                             $a->whereIn('role', ['admin', 'organizer']);
                         });
                });
                $q->orWhereHas('targetUsers', function ($t) use ($user) {
                    $t->where('users.id', $user->id);
                });
                $q->orWhere('author_id', $user->id);
            });
        } elseif ($user->role === 'teacher') {
            $teacher = $user->teacher;
            $teacherClassIds = $teacher ? $teacher->classes()->pluck('classes.id')->toArray() : [];
            $targetRoles = ['teacher', 'all'];
            $query->where(function ($q) use ($user, $targetRoles, $teacherClassIds) {
                // Role-based targeting
                $q->whereIn('target_audience', $targetRoles);
                // Their own classes announcements (via pivot or old column)
                if (!empty($teacherClassIds)) {
                    $q->orWhere(function ($sub) use ($teacherClassIds) {
                        $sub->whereHas('targetClasses', function ($t) use ($teacherClassIds) {
                            $t->whereIn('classes.id', $teacherClassIds);
                        });
                        $sub->orWhere(function ($f) use ($teacherClassIds) {
                            $f->whereDoesntHave('targetClasses')
                              ->whereIn('target_class_id', $teacherClassIds);
                        });
                    });
                }
                // Directly targeted
                $q->orWhereHas('targetUsers', function ($t) use ($user) {
                    $t->where('users.id', $user->id);
                });
                $q->orWhere('author_id', $user->id);
            });
        } elseif ($user->role === 'organizer') {
            $query->where(function ($q) use ($user) {
                $q->whereIn('target_audience', ['organizer', 'all'])
                  ->orWhereHas('targetUsers', function ($t) use ($user) {
                      $t->where('users.id', $user->id);
                  })
                  ->orWhere('author_id', $user->id);
            });
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
            'target_class_ids' => 'nullable|array',
            'target_class_ids.*' => 'exists:classes,id',
            'target_user_ids' => 'nullable|array',
            'target_user_ids.*' => 'exists:users,id',
            'target_class_id' => 'nullable|exists:classes,id',
            'meeting_link' => 'nullable|string|max:500',
            'is_pinned' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'is_active' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $targetClassIds = $request->target_class_ids ?? [];
        $targetUserIds = $request->target_user_ids ?? [];

        // Auto-scope teacher: if targeting students/parents without classes, use their first class
        if ($user->role === 'teacher' && empty($targetClassIds)) {
            $audiences = explode(',', $request->target_audience);
            if (array_intersect($audiences, ['student', 'parent'])) {
                $teacher = $user->teacher;
                if (!$teacher) {
                    return response()->json([
                        'success' => false,
                        'message' => 'لم يتم العثور على حساب المعلم الخاص بك.',
                    ], 422);
                }
                $firstClass = $teacher->classes()->first();
                if (!$firstClass) {
                    return response()->json([
                        'success' => false,
                        'message' => 'يجب أن تكون مشرفاً على فصل واحد على الأقل لإنشاء إعلان للطلاب أو أولياء الأمور.',
                    ], 422);
                }
                $targetClassIds = [$firstClass->id];
            }
        }

        // Set single target_class_id for backward compat
        $singleClassId = !empty($targetClassIds) ? $targetClassIds[0] : $request->target_class_id;

        $announcement = Announcement::create([
            'author_id' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'target_audience' => $request->target_audience,
            'target_class_id' => $singleClassId,
            'meeting_link' => $request->meeting_link,
            'is_pinned' => $request->boolean('is_pinned', false),
            'published_at' => $request->published_at ?? now(),
            'expires_at' => $request->expires_at,
            'is_active' => $request->boolean('is_active', true),
        ]);

        // Sync pivot tables
        if (!empty($targetClassIds)) {
            $announcement->targetClasses()->sync($targetClassIds);
        }
        if (!empty($targetUserIds)) {
            $announcement->targetUsers()->sync($targetUserIds);
        }

        $announcement->load(['author', 'attachments', 'targetClass', 'targetClasses', 'targetUsers']);

        return response()->json([
            'success' => true,
            'data' => $announcement,
            'message' => 'Announcement created successfully.',
        ], 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        $announcement->load(['author', 'attachments', 'targetClass', 'targetClasses', 'targetUsers']);

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
            'target_class_ids' => 'nullable|array',
            'target_class_ids.*' => 'exists:classes,id',
            'target_user_ids' => 'nullable|array',
            'target_user_ids.*' => 'exists:users,id',
            'target_class_id' => 'nullable|exists:classes,id',
            'meeting_link' => 'nullable|string|max:500',
            'is_pinned' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'is_active' => 'nullable|boolean',
        ]);

        $data = $request->only([
            'title', 'content', 'category', 'target_audience',
            'meeting_link', 'is_pinned', 'published_at', 'expires_at', 'is_active',
        ]);

        // Handle class targeting
        if ($request->has('target_class_ids')) {
            $targetClassIds = $request->target_class_ids ?? [];
            $data['target_class_id'] = !empty($targetClassIds) ? $targetClassIds[0] : null;
            $announcement->targetClasses()->sync($targetClassIds);
        }
        if ($request->has('target_class_id') && !$request->has('target_class_ids')) {
            $data['target_class_id'] = $request->target_class_id;
        }

        if ($request->has('target_user_ids')) {
            $announcement->targetUsers()->sync($request->target_user_ids ?? []);
        }

        $announcement->update($data);
        $announcement->load(['author', 'attachments', 'targetClass', 'targetClasses', 'targetUsers']);

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
        $announcements = Announcement::with(['author', 'attachments', 'targetClass', 'targetClasses', 'targetUsers'])
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

        $announcements = Announcement::with(['author', 'attachments', 'targetClass', 'targetClasses', 'targetUsers'])
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
