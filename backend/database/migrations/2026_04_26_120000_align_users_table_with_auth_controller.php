<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite does not support MySQL's MODIFY syntax. Local SQLite setups
        // keep the nullable definitions from the preceding migration.
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY phone VARCHAR(191) NOT NULL");
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(191) NOT NULL");
        DB::statement("ALTER TABLE users MODIFY status VARCHAR(191) NOT NULL DEFAULT 'active'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY phone VARCHAR(191) NULL");
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(191) NULL");
        DB::statement("ALTER TABLE users MODIFY status VARCHAR(191) NOT NULL DEFAULT 'active'");
    }
};
