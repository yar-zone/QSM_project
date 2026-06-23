<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Surah extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_arabic',
        'juz',
        'hizb',
        'verses_count',
        'revelation_type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'juz' => 'integer',
            'hizb' => 'integer',
            'verses_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function memorizationTrackings(): HasMany
    {
        return $this->hasMany(MemorizationTracking::class);
    }
}
