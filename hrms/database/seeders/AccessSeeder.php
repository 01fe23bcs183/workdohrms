<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AccessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all abilities (permissions)
        $abilities = [
            // Staff Member abilities
            'view_staff', 'create_staff', 'edit_staff', 'delete_staff', 'export_staff',
            
            // Office Location abilities
            'view_locations', 'create_locations', 'edit_locations', 'delete_locations',
            
            // Division abilities
            'view_divisions', 'create_divisions', 'edit_divisions', 'delete_divisions',
            
            // Job Title abilities
            'view_job_titles', 'create_job_titles', 'edit_job_titles', 'delete_job_titles',
            
            // Recognition abilities
            'view_recognition', 'create_recognition', 'edit_recognition', 'delete_recognition',
            
            // Role Upgrade abilities
            'view_role_upgrades', 'create_role_upgrades', 'edit_role_upgrades', 'delete_role_upgrades',
            
            // Location Transfer abilities
            'view_transfers', 'create_transfers', 'edit_transfers', 'delete_transfers',
            
            // Discipline Note abilities
            'view_discipline', 'create_discipline', 'edit_discipline', 'delete_discipline',
            
            // Offboarding abilities
            'view_offboarding', 'create_offboarding', 'edit_offboarding', 'delete_offboarding',
            
            // Time Off abilities
            'view_time_off', 'create_time_off', 'edit_time_off', 'delete_time_off', 'approve_time_off',
            
            // Attendance abilities
            'view_attendance', 'create_attendance', 'edit_attendance', 'delete_attendance', 'bulk_attendance',
            
            // Compensation abilities
            'view_compensation', 'create_compensation', 'edit_compensation', 'delete_compensation',
            
            // Payslip abilities
            'view_payslips', 'generate_payslips', 'send_payslips',
            
            // Reports abilities
            'view_reports', 'export_reports',
            
            // Settings abilities
            'view_settings', 'edit_settings',
            
            // Announcements abilities
            'view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements',
            
            // Dashboard abilities
            'view_hr_dashboard', 'view_admin_dashboard',
        ];

        // Create all permissions
        foreach ($abilities as $ability) {
            Permission::firstOrCreate(['name' => $ability]);
        }

        // Create roles and assign permissions
        $administrator = Role::firstOrCreate(['name' => 'administrator']);
        $administrator->givePermissionTo(Permission::all());

        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->givePermissionTo([
            'view_staff', 'edit_staff', 'export_staff',
            'view_locations', 'view_divisions', 'view_job_titles',
            'view_recognition', 'create_recognition', 'edit_recognition',
            'view_role_upgrades', 'create_role_upgrades',
            'view_transfers', 'create_transfers',
            'view_discipline', 'create_discipline',
            'view_time_off', 'approve_time_off',
            'view_attendance', 'create_attendance', 'bulk_attendance',
            'view_compensation',
            'view_payslips',
            'view_reports', 'export_reports',
            'view_announcements', 'create_announcements',
            'view_hr_dashboard',
        ]);

        $hrOfficer = Role::firstOrCreate(['name' => 'hr_officer']);
        $hrOfficer->givePermissionTo([
            'view_staff', 'create_staff', 'edit_staff',
            'view_locations', 'create_locations', 'edit_locations',
            'view_divisions', 'create_divisions', 'edit_divisions',
            'view_job_titles', 'create_job_titles', 'edit_job_titles',
            'view_recognition', 'create_recognition', 'edit_recognition',
            'view_time_off', 'create_time_off', 'edit_time_off', 'approve_time_off',
            'view_attendance', 'create_attendance', 'edit_attendance', 'bulk_attendance',
            'view_compensation', 'create_compensation', 'edit_compensation',
            'view_payslips', 'generate_payslips', 'send_payslips',
            'view_reports',
            'view_announcements', 'create_announcements', 'edit_announcements',
            'view_hr_dashboard',
        ]);

        $staffMember = Role::firstOrCreate(['name' => 'staff_member']);
        $staffMember->givePermissionTo([
            'view_time_off', 'create_time_off',
            'view_attendance',
            'view_payslips',
            'view_announcements',
        ]);

        $this->command->info('Roles and permissions seeded successfully!');
    }
}
