<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnnouncementAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_id',
        'file_path',
        'file_type',
        'file_name',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }
}
