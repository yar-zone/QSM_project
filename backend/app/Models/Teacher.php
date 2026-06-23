<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'qualification',
        'specialization',
        'join_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'join_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }

    public function memorizationTrackings(): HasMany
    {
        return $this->hasMany(MemorizationTracking::class);
    }

    public function examCommittees(): HasMany
    {
        return $this->hasMany(ExamCommittee::class);
    }
}
