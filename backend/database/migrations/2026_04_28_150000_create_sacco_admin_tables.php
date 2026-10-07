<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sacco_routes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sacco_admin_id');
            $table->string('sacco_name');
            $table->string('route_name');
            $table->string('location')->nullable();
            $table->timestamps();
        });

        Schema::create('route_terminals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sacco_route_id');
            $table->string('terminal_name');
            $table->unsignedInteger('terminal_order')->default(1);
            $table->timestamps();
        });

        Schema::create('sacco_fares', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sacco_route_id');
            $table->unsignedBigInteger('from_terminal_id');
            $table->unsignedBigInteger('to_terminal_id');
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        Schema::create('driver_queue_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sacco_admin_id');
            $table->unsignedBigInteger('driver_id');
            $table->string('station_location');
            $table->timestamp('notified_at');
            $table->unsignedInteger('queue_position')->default(1);
            $table->unsignedBigInteger('assigned_route_id')->nullable();
            $table->string('assigned_route_name')->nullable();
            $table->string('status')->default('waiting');
            $table->timestamp('departed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('school_transport_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id')->nullable();
            $table->string('school_name');
            $table->string('location');
            $table->unsignedInteger('requested_vehicles');
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('requested_at')->nullable();
            $table->timestamps();
        });

        Schema::create('school_transport_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('sacco_admin_id');
            $table->unsignedBigInteger('driver_id');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sacco_complaints', function (Blueprint $table) {
            $table->id();
            $table->string('route_name');
            $table->string('passenger_phone');
            $table->text('message');
            $table->text('response_message')->nullable();
            $table->unsignedBigInteger('responded_by')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sacco_complaints');
        Schema::dropIfExists('school_transport_assignments');
        Schema::dropIfExists('school_transport_requests');
        Schema::dropIfExists('driver_queue_entries');
        Schema::dropIfExists('sacco_fares');
        Schema::dropIfExists('route_terminals');
        Schema::dropIfExists('sacco_routes');
    }
};
