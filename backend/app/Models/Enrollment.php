<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'class_id',
        'enrolled_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }
}
