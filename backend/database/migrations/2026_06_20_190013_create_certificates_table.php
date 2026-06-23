<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('exam_result_id')->nullable()->constrained('exam_results');
            $table->string('certificate_number')->unique();
            $table->string('student_name');
            $table->integer('hizb_count');
            $table->string('grade')->nullable();
            $table->date('issued_date');
            $table->text('qr_code')->nullable();
            $table->string('certificate_type');
            $table->boolean('is_verified')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
