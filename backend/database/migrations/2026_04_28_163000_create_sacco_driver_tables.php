<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sacco_passenger_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('driver_id');
            $table->unsignedBigInteger('sacco_route_id');
            $table->unsignedBigInteger('boarding_terminal_id');
            $table->unsignedBigInteger('dropoff_terminal_id');
            $table->string('passenger_phone');
            $table->decimal('fare_amount', 10, 2);
            $table->string('prompt_status')->default('pending_prompt');
            $table->timestamp('prompt_requested_at')->nullable();
            $table->timestamp('cleared_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sacco_passenger_payments');
    }
};
