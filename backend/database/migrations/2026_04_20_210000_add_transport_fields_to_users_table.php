<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->after('email');
            $table->string('role')->after('phone');
            $table->string('status')->default('active')->after('role');
            $table->string('route_name')->nullable()->after('status');
            $table->string('sacco_name')->nullable()->after('route_name');
            $table->string('location')->nullable()->after('sacco_name');
            $table->string('number_plate')->nullable()->after('location');
            $table->string('matatu_name')->nullable()->after('number_plate');
            $table->string('school_name')->nullable()->after('matatu_name');
            $table->string('student_name')->nullable()->after('school_name');
            $table->string('grade')->nullable()->after('student_name');
            $table->string('admission_number')->nullable()->after('grade');
            $table->string('company_name')->nullable()->after('admission_number');
            $table->unsignedInteger('bus_capacity')->nullable()->after('company_name');
            $table->json('profile_data')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'role',
                'status',
                'route_name',
                'sacco_name',
                'location',
                'number_plate',
                'matatu_name',
                'school_name',
                'student_name',
                'grade',
                'admission_number',
                'company_name',
                'bus_capacity',
                'profile_data',
            ]);
        });
    }
};
