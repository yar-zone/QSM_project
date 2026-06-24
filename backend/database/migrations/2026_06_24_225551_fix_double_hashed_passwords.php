<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('plain_password', 'like', '$2y$%')
            ->whereColumn('password', '!=', 'plain_password')
            ->update(['password' => DB::raw('plain_password')]);
    }

    public function down(): void
    {
    }
};
