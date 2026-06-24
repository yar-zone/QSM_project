<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'title',
        'content',
        'category',
        'target_audience',
        'target_class_id',
        'meeting_link',
        'is_pinned',
        'published_at',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function targetClass(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'target_class_id');
    }

    public function targetClasses(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'announcement_target_classes', 'announcement_id', 'class_id');
    }

    public function targetUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'announcement_target_users', 'announcement_id', 'user_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AnnouncementAttachment::class);
    }
}
