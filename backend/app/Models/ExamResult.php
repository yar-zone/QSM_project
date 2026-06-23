<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_request_id',
        'marks_obtained',
        'grade',
        'evaluator_notes',
        'is_passed',
        'evaluated_by',
        'evaluated_at',
    ];

    protected function casts(): array
    {
        return [
            'marks_obtained' => 'decimal:2',
            'is_passed' => 'boolean',
            'evaluated_at' => 'datetime',
        ];
    }

    public function examRequest(): BelongsTo
    {
        return $this->belongsTo(ExamRequest::class);
    }

    public function evaluatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }
}
