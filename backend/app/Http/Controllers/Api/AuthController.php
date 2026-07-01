<?php

// ─── [FILE PURPOSE] ────────────────────────────────────────────────────
// Handles all authentication: login, register, email verification,
// Google Sign-In, logout, password change, and current user retrieval.
// Key flows:
//   1. Register → send 6-digit code via email → verify → create pending user
//   2. Login → check credentials + active status → return Sanctum token
//   3. Google Login → verify JWT → create/login user as parent role
//   4. Email verification stores codes in DB with 10-min expiry
// ────────────────────────────────────────────────────────────────────────

namespace App\Http\Controllers\Api;

use App\Helpers\EmailHelper;
use App\Http\Controllers\Controller;
use App\Mail\VerificationCodeMail;
use App\Models\EmailVerificationCode;
use App\Models\User;
use Carbon\Carbon;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active. Please contact administrator.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        $user->load($this->getUserRelations($user->role));

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => 'Login successful.',
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:teacher,student,parent',
        ]);

        if (EmailHelper::isDisposable($request->email)) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى استخدام بريد إلكتروني حقيقي. البريد المؤقت غير مسموح به.',
            ], 422);
        }

        $this->sendVerificationCode(
            email: $request->email,
            name: $request->name,
            data: [
                'name' => $request->name,
                'password' => $request->password,
                'role' => $request->role,
                'phone' => $request->phone,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال كود التحقق إلى بريدك الإلكتروني.',
        ], 201);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $record = EmailVerificationCode::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'الكود غير صحيح أو منتهي الصلاحية.',
            ], 422);
        }

        $data = $record->data;

        $user = User::create([
            'name' => $data['name'],
            'email' => $request->email,
            'password' => $data['password'],
            'role' => $data['role'],
            'status' => 'pending',
        ]);

        if ($data['role'] === 'teacher') {
            $user->teacher()->create([]);
        } elseif ($data['role'] === 'student') {
            $user->student()->create([]);
        }

        $user->update(['email_verified_at' => Carbon::now()]);

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحساب بعد التحقق. حسابك قيد انتظار موافقة الإدارة.',
        ]);
    }

    public function resendVerificationCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $record = EmailVerificationCode::where('email', $request->email)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على طلب تسجيل بهذا البريد الإلكتروني.',
            ], 422);
        }

        $data = $record->data;

        $this->sendVerificationCode(
            email: $request->email,
            name: $data['name'] ?? $request->email,
            data: $data,
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال كود التحقق مرة أخرى.',
        ]);
    }

    private function sendVerificationCode(string $email, string $name, ?array $data = null): void
    {
        EmailVerificationCode::where('email', $email)->delete();

        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $recordData = [
            'email' => $email,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(10),
        ];

        if ($data !== null) {
            $recordData['data'] = $data;
        }

        EmailVerificationCode::create($recordData);

        try {
            Mail::to($email)->send(new VerificationCodeMail($code, $name));
        } catch (\Exception $e) {
            Log::error('Failed to send verification email: ' . $e->getMessage(), [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        $clientId = config('services.google.client_id');
        if (!$clientId) {
            return response()->json([
                'success' => false,
                'message' => 'Google login is not configured.',
            ], 500);
        }

        try {
            $keysUrl = 'https://www.googleapis.com/oauth2/v3/certs';
            $keySet = json_decode(file_get_contents($keysUrl), true);
            $keys = JWK::parseKeySet($keySet);

            $decoded = JWT::decode($request->id_token, $keys);
            $payload = (array) $decoded;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل التحقق من البريد الإلكتروني.',
            ], 401);
        }

        if (($payload['aud'] ?? null) !== $clientId) {
            return response()->json([
                'success' => false,
                'message' => 'فشل التحقق من البريد الإلكتروني.',
            ], 401);
        }

        if (!in_array($payload['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'])) {
            return response()->json([
                'success' => false,
                'message' => 'فشل التحقق من البريد الإلكتروني.',
            ], 401);
        }

        $email = $payload['email'] ?? null;
        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم توفير البريد الإلكتروني من Google.',
            ], 400);
        }

        if (EmailHelper::isDisposable($email)) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى استخدام بريد إلكتروني حقيقي. البريد المؤقت غير مسموح به.',
            ], 422);
        }

        $name = $payload['name'] ?? explode('@', $email)[0];
        $googleId = $payload['sub'] ?? null;

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => \Illuminate\Support\Str::random(32),
                'role' => 'parent',
                'status' => 'active',
            ]);
        }

        if ($user->status !== 'active') {
            $user->update(['status' => 'active']);
        }

        $token = $user->createToken('auth-token')->plainTextToken;
        $user->update(['last_login_at' => now()]);
        $user->load($this->getUserRelations($user->role));

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => 'تم تسجيل الدخول بحساب Google.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load($this->getUserRelations($user->role));

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'كلمة المرور الحالية غير صحيحة.',
            ], 422);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    private function getUserRelations(string $role): array
    {
        return match ($role) {
            'admin' => [],
            'organizer' => ['organizer'],
            'teacher' => ['teacher.user', 'teacher.classes'],
            'student' => ['student.user', 'student.enrollments.classe', 'student.parents.parent'],
            'parent' => ['parentStudents.user'],
            default => [],
        };
    }
}
