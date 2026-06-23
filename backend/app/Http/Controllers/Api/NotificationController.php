<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', $request->user()->id);

        $unreadOnly = $request->boolean('unread_only', false);

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query->orderBy('created_at', 'desc')->get();

        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markAsRead(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== request()->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => $notification,
            'message' => 'Notification marked as read.',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}
