<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'user_id',
        'role',
        'joined_at',
        'left_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
        ];
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
