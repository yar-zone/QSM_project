<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'guardian_id',
        'enrollment_date',
        'date_of_birth',
        'gender',
        'address',
        'phone',
        'emergency_contact',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'enrollment_date' => 'date',
            'date_of_birth' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guardian_id');
    }

    public function parents(): HasMany
    {
        return $this->hasMany(StudentParent::class, 'student_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function memorizationTrackings(): HasMany
    {
        return $this->hasMany(MemorizationTracking::class);
    }

    public function examRequests(): HasMany
    {
        return $this->hasMany(ExamRequest::class);
    }

    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'enrollments', 'student_id', 'class_id');
    }
}
