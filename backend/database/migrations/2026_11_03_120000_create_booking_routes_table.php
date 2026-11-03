<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('route_name');
            $table->string('location');
            $table->decimal('fare', 10, 2)->nullable();
            $table->timestamps();
            $table->index(['booking_admin_id', 'route_name']);
        });

        Schema::create('booking_route_terminals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_route_id');
            $table->string('terminal_name');
            $table->unsignedInteger('terminal_order')->default(1);
            $table->timestamps();
            $table->index(['booking_route_id', 'terminal_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_route_terminals');
        Schema::dropIfExists('booking_routes');
    }
};
