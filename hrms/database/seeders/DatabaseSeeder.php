<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(AccessSeeder::class);

        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@hrms.local'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $admin->assignRole('administrator');

        // Create HR officer user
        $hrOfficer = User::firstOrCreate(
            ['email' => 'hr@hrms.local'],
            [
                'name' => 'HR Officer',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $hrOfficer->assignRole('hr_officer');

        // Create manager user
        $manager = User::firstOrCreate(
            ['email' => 'manager@hrms.local'],
            [
                'name' => 'Department Manager',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $manager->assignRole('manager');

        // Create staff member user
        $staff = User::firstOrCreate(
            ['email' => 'staff@hrms.local'],
            [
                'name' => 'Staff Member',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $staff->assignRole('staff_member');
    }
}
