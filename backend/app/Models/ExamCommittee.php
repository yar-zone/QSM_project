<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamCommittee extends Model
{
    use HasFactory;

    protected $table = 'exam_committee';

    protected $fillable = [
        'exam_request_id',
        'teacher_id',
        'role',
    ];

    public function examRequest(): BelongsTo
    {
        return $this->belongsTo(ExamRequest::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
