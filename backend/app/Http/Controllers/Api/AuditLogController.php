<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('model')) {
            $query->where('model', $request->model);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 15);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
