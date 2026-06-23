<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemorizationTracking extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'surah_id',
        'juz',
        'hizb',
        'verses_memorized',
        'verses_revised',
        'start_date',
        'completion_date',
        'teacher_notes',
        'revision_level',
        'performance_score',
        'week_start',
        'month',
        'year',
    ];

    protected function casts(): array
    {
        return [
            'juz' => 'integer',
            'hizb' => 'integer',
            'verses_memorized' => 'integer',
            'verses_revised' => 'integer',
            'start_date' => 'date',
            'completion_date' => 'date',
            'performance_score' => 'integer',
            'week_start' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function surah(): BelongsTo
    {
        return $this->belongsTo(Surah::class);
    }
}
