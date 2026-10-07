<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passenger_complaints', function (Blueprint $table) {
            $table->id();
            $table->enum('service_type', ['sacco', 'school', 'booking']);
            $table->string('service_name');
            $table->string('route_name')->nullable();
            $table->string('location')->nullable();
            $table->string('passenger_phone')->nullable();
            $table->string('passenger_email')->nullable();
            $table->text('message');
            $table->string('status')->default('open'); // open, acknowledged, resolved
            $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('response_message')->nullable();
            $table->foreignId('responded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passenger_complaints');
    }
};
