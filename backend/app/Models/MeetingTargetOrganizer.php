<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingTargetOrganizer extends Model
{
    use HasFactory;

    protected $table = 'meeting_target_organizers';

    protected $fillable = [
        'meeting_id',
        'user_id',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}