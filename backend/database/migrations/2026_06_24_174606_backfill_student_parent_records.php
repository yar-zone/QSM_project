<?php

use App\Models\Student;
use App\Models\StudentParent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Student::whereNotNull('guardian_id')->each(function (Student $student) {
            StudentParent::firstOrCreate([
                'student_id' => $student->id,
                'parent_id' => $student->guardian_id,
            ]);
        });
    }

    public function down(): void
    {
        // No reversal — backfill has no destructive effect
    }
};
