<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Certificate::with(['student.user', 'examResult']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('is_verified')) {
            $query->where('is_verified', $request->boolean('is_verified'));
        }

        if ($request->has('certificate_type')) {
            $query->where('certificate_type', $request->certificate_type);
        }

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $studentIds = Enrollment::whereIn('class_id', $classIds)->pluck('student_id');
                $query->whereIn('student_id', $studentIds);
            }
        }

        $perPage = $request->get('per_page', 15);
        $certificates = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $certificates,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'exam_result_id' => 'nullable|exists:exam_results,id',
            'student_name' => 'required|string|max:255',
            'hizb_count' => 'required|integer|min:1',
            'grade' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'certificate_type' => 'required|string',
        ]);

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $studentIds = \App\Models\Enrollment::whereIn('class_id', $classIds)->pluck('student_id');
                if (!in_array((int)$request->student_id, $studentIds->toArray())) {
                    return response()->json(['success' => false, 'message' => 'الطالب ليس ضمن فصولك.'], 403);
                }
            }
        }

        $certificate = Certificate::create([
            'student_id' => $request->student_id,
            'exam_result_id' => $request->exam_result_id,
            'certificate_number' => 'CERT-' . strtoupper(Str::random(8)),
            'student_name' => $request->student_name,
            'hizb_count' => $request->hizb_count,
            'grade' => $request->grade,
            'issued_date' => $request->issued_date ?? now()->toDateString(),
            'certificate_type' => $request->certificate_type,
            'is_verified' => false,
        ]);

        $certificate->load(['student.user', 'examResult']);

        return response()->json([
            'success' => true,
            'data' => $certificate,
            'message' => 'Certificate created successfully.',
        ], 201);
    }

    public function show(Certificate $certificate): JsonResponse
    {
        $certificate->load(['student.user', 'examResult']);

        return response()->json([
            'success' => true,
            'data' => $certificate,
        ]);
    }

    public function update(Request $request, Certificate $certificate): JsonResponse
    {
        $request->validate([
            'student_name' => 'nullable|string|max:255',
            'hizb_count' => 'nullable|integer|min:1',
            'grade' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'certificate_type' => 'nullable|string',
            'is_verified' => 'nullable|boolean',
        ]);

        $certificate->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $certificate,
            'message' => 'Certificate updated successfully.',
        ]);
    }

    public function destroy(Certificate $certificate): JsonResponse
    {
        $certificate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Certificate deleted successfully.',
        ]);
    }

    public function verify(Certificate $certificate): JsonResponse
    {
        $certificate->update(['is_verified' => true]);

        return response()->json([
            'success' => true,
            'data' => $certificate,
            'message' => 'Certificate verified successfully.',
        ]);
    }

    public function download(Certificate $certificate): JsonResponse
    {
        $certificate->load(['student.user', 'examResult']);

        try {
            $pdf = Pdf::loadView('pdf.certificate', [
                'student_name' => $certificate->student_name,
                'hizb_count' => $certificate->hizb_count,
                'grade' => $certificate->grade,
                'issued_date' => $certificate->issued_date->format('Y-m-d'),
                'certificate_number' => $certificate->certificate_number,
                'certificate_type' => $certificate->certificate_type,
                'is_verified' => $certificate->is_verified,
                'qr_code' => null,
            ]);

            $filename = 'certificate-' . $certificate->certificate_number . '.pdf';
            $pdfContent = base64_encode($pdf->output());

            return response()->json([
                'success' => true,
                'data' => [
                    'pdf' => $pdfContent,
                    'filename' => $filename,
                ],
                'message' => 'Certificate PDF generated.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function generatePdf(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'student_name' => 'required|string|max:255',
            'hizb_count' => 'required|integer|min:1',
            'grade' => 'nullable|string',
            'certificate_type' => 'required|string',
        ]);

        $certificate = Certificate::create([
            'student_id' => $request->student_id,
            'certificate_number' => 'CERT-' . strtoupper(Str::random(8)),
            'student_name' => $request->student_name,
            'hizb_count' => $request->hizb_count,
            'grade' => $request->grade,
            'issued_date' => now()->toDateString(),
            'certificate_type' => $request->certificate_type,
            'is_verified' => false,
        ]);

        try {
            $pdf = Pdf::loadView('pdf.certificate', [
                'student_name' => $certificate->student_name,
                'hizb_count' => $certificate->hizb_count,
                'grade' => $certificate->grade,
                'issued_date' => $certificate->issued_date->format('Y-m-d'),
                'certificate_number' => $certificate->certificate_number,
                'certificate_type' => $certificate->certificate_type,
                'is_verified' => $certificate->is_verified,
                'qr_code' => null,
            ]);

            $filename = 'certificate-' . $certificate->certificate_number . '.pdf';
            $pdfContent = base64_encode($pdf->output());

            return response()->json([
                'success' => true,
                'data' => [
                    'certificate' => $certificate,
                    'pdf' => $pdfContent,
                    'filename' => $filename,
                ],
                'message' => 'Certificate generated successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function myCertificates(Request $request): JsonResponse
    {
        $user = $request->user();
        $studentIds = [];

        if ($user->role === 'student' && $user->student) {
            $studentIds = [$user->student->id];
        } elseif ($user->role === 'parent') {
            $studentIds = $user->children()->pluck('student_id')->toArray();
        } else {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $query = Certificate::whereIn('student_id', $studentIds)
            ->with(['student.user', 'examResult']);

        $perPage = $request->get('per_page', 15);
        $certificates = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $certificates,
        ]);
    }

    public function studentCertificates(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $user = $request->user();
        if ($user->role === 'teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id');
                $studentIds = Enrollment::whereIn('class_id', $classIds)->pluck('student_id');
                if (!in_array($request->student_id, $studentIds->toArray())) {
                    return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
                }
            }
        }

        $certificates = Certificate::where('student_id', $request->student_id)
            ->with('examResult')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $certificates,
        ]);
    }
}
