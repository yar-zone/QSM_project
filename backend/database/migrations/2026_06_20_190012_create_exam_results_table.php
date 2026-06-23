<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_request_id')->constrained('exam_requests')->cascadeOnDelete();
            $table->decimal('marks_obtained', 5, 2)->nullable();
            $table->string('grade')->nullable();
            $table->text('evaluator_notes')->nullable();
            $table->boolean('is_passed')->default(false);
            $table->foreignId('evaluated_by')->nullable()->constrained('users');
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
