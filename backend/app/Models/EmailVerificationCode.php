<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerificationCode extends Model
{
    protected $fillable = [
        'email',
        'code',
        'expires_at',
        'data',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'data' => 'array',
        ];
    }
}
