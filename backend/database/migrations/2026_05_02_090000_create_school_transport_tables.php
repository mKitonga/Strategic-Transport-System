<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_transport_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('school_transport_requests', 'preferred_sacco_admin_id')) {
                $table->unsignedBigInteger('preferred_sacco_admin_id')->nullable()->after('school_admin_id');
            }
        });

        Schema::create('school_routes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->string('school_name');
            $table->string('location');
            $table->string('route_name');
            $table->timestamps();
        });

        Schema::create('school_route_terminals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_route_id');
            $table->string('terminal_name');
            $table->unsignedInteger('terminal_order')->default(1);
            $table->timestamps();
        });

        Schema::create('school_daily_trips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->unsignedBigInteger('school_route_id')->nullable();
            $table->string('school_name');
            $table->string('location');
            $table->string('grade');
            $table->time('pickup_time');
            $table->time('dropoff_time');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('published');
            $table->timestamps();
        });

        Schema::create('school_educational_trips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->string('school_name');
            $table->string('location');
            $table->string('grade');
            $table->string('trip_title');
            $table->string('destination');
            $table->unsignedInteger('duration_days');
            $table->decimal('amount', 10, 2);
            $table->date('trip_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('published');
            $table->timestamps();
        });

        Schema::create('school_closing_trips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->unsignedBigInteger('preferred_sacco_admin_id')->nullable();
            $table->string('school_name');
            $table->string('location');
            $table->date('closing_day');
            $table->text('notes')->nullable();
            $table->string('status')->default('published');
            $table->timestamps();
        });

        Schema::create('school_closing_trip_fares', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_closing_trip_id');
            $table->unsignedBigInteger('sacco_route_id');
            $table->unsignedBigInteger('from_terminal_id');
            $table->unsignedBigInteger('to_terminal_id');
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        Schema::create('school_trip_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->unsignedBigInteger('parent_id');
            $table->string('student_name');
            $table->string('grade');
            $table->string('trip_type');
            $table->unsignedBigInteger('trip_id');
            $table->decimal('amount', 10, 2);
            $table->string('phone_number');
            $table->string('mpesa_reference')->nullable();
            $table->string('status')->default('submitted');
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();
        });

        Schema::create('school_daily_trip_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_daily_trip_id');
            $table->unsignedBigInteger('parent_id');
            $table->unsignedBigInteger('school_driver_id')->nullable();
            $table->string('student_name');
            $table->string('grade');
            $table->time('assigned_pickup_time');
            $table->string('status')->default('assigned');
            $table->timestamp('sent_to_driver_at')->nullable();
            $table->timestamps();
        });

        Schema::create('school_closing_trip_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_closing_trip_id');
            $table->unsignedBigInteger('parent_id');
            $table->unsignedBigInteger('sacco_driver_id');
            $table->string('student_name');
            $table->string('grade');
            $table->unsignedBigInteger('school_closing_trip_fare_id')->nullable();
            $table->string('status')->default('assigned');
            $table->timestamp('sent_to_parent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('school_transport_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->unsignedBigInteger('source_user_id')->nullable();
            $table->string('source_role');
            $table->string('school_name');
            $table->string('location');
            $table->string('subject');
            $table->text('message');
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('school_sacco_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_admin_id');
            $table->unsignedBigInteger('sacco_admin_id');
            $table->string('school_name');
            $table->string('location');
            $table->text('message');
            $table->string('status')->default('sent');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_sacco_messages');
        Schema::dropIfExists('school_transport_notifications');
        Schema::dropIfExists('school_closing_trip_assignments');
        Schema::dropIfExists('school_daily_trip_assignments');
        Schema::dropIfExists('school_trip_payments');
        Schema::dropIfExists('school_closing_trip_fares');
        Schema::dropIfExists('school_closing_trips');
        Schema::dropIfExists('school_educational_trips');
        Schema::dropIfExists('school_daily_trips');
        Schema::dropIfExists('school_route_terminals');
        Schema::dropIfExists('school_routes');

        Schema::table('school_transport_requests', function (Blueprint $table) {
            if (Schema::hasColumn('school_transport_requests', 'preferred_sacco_admin_id')) {
                $table->dropColumn('preferred_sacco_admin_id');
            }
        });
    }
};
