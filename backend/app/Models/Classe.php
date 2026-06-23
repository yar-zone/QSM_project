<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classe extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'level_id',
        'teacher_id',
        'name',
        'academic_year',
        'max_students',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'max_students' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'class_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'enrollments', 'class_id', 'student_id');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(ExamRequest::class);
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'class_id');
    }
}
