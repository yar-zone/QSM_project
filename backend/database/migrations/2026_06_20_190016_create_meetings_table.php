<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->nullable()->constrained('users');
            $table->foreignId('teacher_id')->nullable()->constrained('teachers');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('platform');
            $table->string('meeting_link')->nullable();
            $table->string('meeting_id')->nullable();
            $table->datetime('scheduled_at');
            $table->integer('duration_minutes')->default(60);
            $table->string('status')->default('scheduled');
            $table->string('recording_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
