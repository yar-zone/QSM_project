<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingTargetClass extends Model
{
    use HasFactory;

    protected $table = 'meeting_target_classes';

    protected $fillable = [
        'meeting_id',
        'class_id',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }
}