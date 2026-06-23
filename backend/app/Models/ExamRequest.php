<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'hizb_count',
        'committee_notes',
        'status',
        'requested_date',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'hizb_count' => 'integer',
            'requested_date' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function committee(): HasMany
    {
        return $this->hasMany(ExamCommittee::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(ExamResult::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
