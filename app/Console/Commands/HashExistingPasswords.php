<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class HashExistingPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:hash-passwords';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hashes all users with plain-text passwords';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::all();
        $count = 0;

        foreach ($users as $user) {
            // Skip already hashed passwords (bcrypt starts with $2y$)
            if (!str_starts_with($user->password, '$2y$')) {
                $user->password = Hash::make($user->password);
                $user->save();
                $count++;
                $this->info("Hashed password for: {$user->email}");
            }
        }

        $this->info("Done! Total passwords hashed: {$count}");
    }
}
