<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys=off');

        Schema::table('exam_results', function (Blueprint $table) {
            $table->foreignId('level_id')->nullable()->constrained('levels')->nullOnDelete();
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->bigInteger('exam_request_id')->unsigned()->nullable()->change();
        });

        DB::statement('PRAGMA foreign_keys=on');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys=off');

        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropForeign(['level_id']);
            $table->dropColumn('level_id');
        });

        DB::statement('PRAGMA foreign_keys=on');
    }
};
