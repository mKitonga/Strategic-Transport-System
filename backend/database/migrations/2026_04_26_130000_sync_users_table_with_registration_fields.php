<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'route_name')) $table->string('route_name')->nullable();
            if (! Schema::hasColumn('users', 'sacco_name')) $table->string('sacco_name')->nullable();
            if (! Schema::hasColumn('users', 'location')) $table->string('location')->nullable();
            if (! Schema::hasColumn('users', 'number_plate')) $table->string('number_plate')->nullable();
            if (! Schema::hasColumn('users', 'matatu_name')) $table->string('matatu_name')->nullable();
            if (! Schema::hasColumn('users', 'school_name')) $table->string('school_name')->nullable();
            if (! Schema::hasColumn('users', 'student_name')) $table->string('student_name')->nullable();
            if (! Schema::hasColumn('users', 'grade')) $table->string('grade')->nullable();
            if (! Schema::hasColumn('users', 'admission_number')) $table->string('admission_number')->nullable();
            if (! Schema::hasColumn('users', 'company_name')) $table->string('company_name')->nullable();
            if (! Schema::hasColumn('users', 'bus_capacity')) $table->unsignedInteger('bus_capacity')->nullable();
        });

        $users = DB::table('users')->select(['id', 'profile_data'])->get();

        foreach ($users as $user) {
            $profileData = json_decode((string) $user->profile_data, true);

            if (! is_array($profileData)) {
                continue;
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'route_name' => $profileData['route_name'] ?? null,
                    'sacco_name' => $profileData['sacco_name'] ?? null,
                    'location' => $profileData['location'] ?? null,
                    'number_plate' => $profileData['number_plate'] ?? null,
                    'matatu_name' => $profileData['matatu_name'] ?? null,
                    'school_name' => $profileData['school_name'] ?? ($profileData['school'] ?? null),
                    'student_name' => $profileData['student_name'] ?? null,
                    'grade' => $profileData['grade'] ?? null,
                    'admission_number' => $profileData['admission_number'] ?? null,
                    'company_name' => $profileData['company_name'] ?? null,
                    'bus_capacity' => isset($profileData['bus_capacity']) ? (int) $profileData['bus_capacity'] : null,
                ]);
        }

        if (Schema::hasColumn('users', 'module')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('module');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('module')->nullable()->after('role');
            $table->dropColumn([
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
            ]);
        });
    }
};
