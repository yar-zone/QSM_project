<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'exam_result_id',
        'certificate_number',
        'student_name',
        'hizb_count',
        'grade',
        'issued_date',
        'qr_code',
        'certificate_type',
        'is_verified',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'hizb_count' => 'integer',
            'issued_date' => 'date',
            'is_verified' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function examResult(): BelongsTo
    {
        return $this->belongsTo(ExamResult::class);
    }
}
