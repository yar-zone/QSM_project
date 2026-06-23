<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memorization_trackings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('surah_id')->nullable()->constrained('surahs');
            $table->integer('juz')->nullable();
            $table->integer('hizb')->nullable();
            $table->integer('verses_memorized')->default(0);
            $table->integer('verses_revised')->default(0);
            $table->date('start_date');
            $table->date('completion_date')->nullable();
            $table->text('teacher_notes')->nullable();
            $table->string('revision_level')->nullable();
            $table->integer('performance_score')->nullable();
            $table->date('week_start')->nullable();
            $table->string('month')->nullable();
            $table->string('year')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memorization_trackings');
    }
};
