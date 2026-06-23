<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function exams(): HasMany
    {
        return $this->hasMany(ExamRequest::class);
    }

    public function memorizationTrackings(): HasMany
    {
        return $this->hasMany(MemorizationTracking::class);
    }
}
