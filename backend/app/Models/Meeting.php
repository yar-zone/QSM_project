<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'organizer_id',
        'teacher_id',
        'title',
        'description',
        'platform',
        'meeting_link',
        'meeting_id',
        'scheduled_at',
        'duration_minutes',
        'status',
        'recording_url',
        'target_classes',
        'target_teachers',
        'target_organizers',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'duration_minutes' => 'integer',
            'target_classes' => 'array',
            'target_teachers' => 'array',
            'target_organizers' => 'array',
        ];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class);
    }

    public function targetClasses(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'meeting_target_classes', 'meeting_id', 'class_id');
    }

    public function targetTeachers(): HasMany
    {
        return $this->hasMany(MeetingTargetTeacher::class, 'meeting_id');
    }

    public function targetOrganizers(): HasMany
    {
        return $this->hasMany(MeetingTargetOrganizer::class, 'meeting_id');
    }
}
