<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_committee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_request_id')->constrained('exam_requests')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('role');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_committee');
    }
};
