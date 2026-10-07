<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sacco_fares', function (Blueprint $table) {
            $table->decimal('peak_amount', 10, 2)->nullable()->after('amount');
            $table->decimal('off_peak_amount', 10, 2)->nullable()->after('peak_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sacco_fares', function (Blueprint $table) {
            $table->dropColumn(['peak_amount', 'off_peak_amount']);
        });
    }
};
