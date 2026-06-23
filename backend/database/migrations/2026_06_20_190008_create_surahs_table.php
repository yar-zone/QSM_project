<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surahs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_arabic')->nullable();
            $table->integer('juz')->nullable();
            $table->integer('hizb')->nullable();
            $table->integer('verses_count')->nullable();
            $table->string('revelation_type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surahs');
    }
};
