<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('school_trip_payments', function (Blueprint $table) {
            $table->string('checkout_request_id')->nullable()->after('mpesa_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_trip_payments', function (Blueprint $table) {
            $table->dropColumn('checkout_request_id');
        });
    }
};
