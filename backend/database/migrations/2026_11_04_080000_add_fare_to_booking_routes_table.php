<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('booking_routes') && ! Schema::hasColumn('booking_routes', 'fare')) {
            Schema::table('booking_routes', function (Blueprint $table) {
                $table->decimal('fare', 10, 2)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('booking_routes') && Schema::hasColumn('booking_routes', 'fare')) {
            Schema::table('booking_routes', function (Blueprint $table) {
                $table->dropColumn('fare');
            });
        }
    }
};
