<?php

namespace Database\Seeders;

use App\Models\OfficeLocation;
use App\Models\Division;
use App\Models\JobTitle;
use App\Models\StaffMember;
use App\Models\WorkLog;
use App\Models\TimeOffCategory;
use App\Models\TimeOffRequest;
use App\Models\CompanyHoliday;
use App\Models\CompanyNotice;
use App\Models\CompanyEvent;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    /**
     * Seed demo data for testing.
     */
    public function run(): void
    {
        // Office Locations
        $locations = [
            ['title' => 'Head Office', 'city' => 'New York', 'is_headquarters' => true],
            ['title' => 'Regional Office West', 'city' => 'Los Angeles', 'is_headquarters' => false],
            ['title' => 'Regional Office East', 'city' => 'Boston', 'is_headquarters' => false],
        ];

        foreach ($locations as $loc) {
            OfficeLocation::create($loc);
        }

        $headOffice = OfficeLocation::first();

        // Divisions
        $divisions = [
            ['title' => 'Engineering', 'office_location_id' => $headOffice->id],
            ['title' => 'Human Resources', 'office_location_id' => $headOffice->id],
            ['title' => 'Finance', 'office_location_id' => $headOffice->id],
            ['title' => 'Marketing', 'office_location_id' => $headOffice->id],
            ['title' => 'Operations', 'office_location_id' => $headOffice->id],
        ];

        foreach ($divisions as $div) {
            Division::create($div);
        }

        $engineering = Division::where('title', 'Engineering')->first();
        $hr = Division::where('title', 'Human Resources')->first();

        // Job Titles
        $jobTitles = [
            ['title' => 'Senior Developer', 'division_id' => $engineering->id, 'min_salary' => 80000, 'max_salary' => 120000],
            ['title' => 'Junior Developer', 'division_id' => $engineering->id, 'min_salary' => 50000, 'max_salary' => 70000],
            ['title' => 'Team Lead', 'division_id' => $engineering->id, 'min_salary' => 100000, 'max_salary' => 150000],
            ['title' => 'HR Manager', 'division_id' => $hr->id, 'min_salary' => 70000, 'max_salary' => 100000],
            ['title' => 'HR Coordinator', 'division_id' => $hr->id, 'min_salary' => 45000, 'max_salary' => 60000],
        ];

        foreach ($jobTitles as $jt) {
            JobTitle::create($jt);
        }

        // Time Off Categories
        $leaveTypes = [
            ['title' => 'Annual Leave', 'annual_allowance' => 20, 'is_paid' => true],
            ['title' => 'Sick Leave', 'annual_allowance' => 10, 'is_paid' => true],
            ['title' => 'Personal Leave', 'annual_allowance' => 5, 'is_paid' => true],
            ['title' => 'Unpaid Leave', 'annual_allowance' => 30, 'is_paid' => false],
        ];

        foreach ($leaveTypes as $lt) {
            TimeOffCategory::create($lt);
        }

        // Company Holidays 2025
        $holidays = [
            ['title' => "New Year's Day", 'holiday_date' => '2025-01-01'],
            ['title' => 'Martin Luther King Jr. Day', 'holiday_date' => '2025-01-20'],
            ['title' => "Presidents' Day", 'holiday_date' => '2025-02-17'],
            ['title' => 'Memorial Day', 'holiday_date' => '2025-05-26'],
            ['title' => 'Independence Day', 'holiday_date' => '2025-07-04'],
            ['title' => 'Labor Day', 'holiday_date' => '2025-09-01'],
            ['title' => 'Thanksgiving Day', 'holiday_date' => '2025-11-27'],
            ['title' => 'Christmas Day', 'holiday_date' => '2025-12-25'],
        ];

        foreach ($holidays as $h) {
            CompanyHoliday::create($h);
        }

        // Staff Members (using factory if available, otherwise manual)
        $staffData = [
            ['first_name' => 'John', 'last_name' => 'Smith', 'personal_email' => 'john.smith@demo.com', 'gender' => 'male', 'hire_date' => '2022-03-15', 'base_salary' => 95000],
            ['first_name' => 'Sarah', 'last_name' => 'Johnson', 'personal_email' => 'sarah.j@demo.com', 'gender' => 'female', 'hire_date' => '2023-01-10', 'base_salary' => 65000],
            ['first_name' => 'Michael', 'last_name' => 'Williams', 'personal_email' => 'm.williams@demo.com', 'gender' => 'male', 'hire_date' => '2021-07-20', 'base_salary' => 110000],
            ['first_name' => 'Emily', 'last_name' => 'Brown', 'personal_email' => 'emily.b@demo.com', 'gender' => 'female', 'hire_date' => '2024-02-01', 'base_salary' => 55000],
            ['first_name' => 'David', 'last_name' => 'Davis', 'personal_email' => 'd.davis@demo.com', 'gender' => 'male', 'hire_date' => '2020-11-05', 'base_salary' => 85000],
        ];

        $jobTitleModels = JobTitle::all();
        foreach ($staffData as $index => $sd) {
            StaffMember::create(array_merge($sd, [
                'office_location_id' => $headOffice->id,
                'division_id' => $engineering->id,
                'job_title_id' => $jobTitleModels[$index % count($jobTitleModels)]->id,
                'employment_status' => 'active',
                'employment_type' => 'full_time',
            ]));
        }

        // Generate attendance for last 30 days
        $staffMembers = StaffMember::all();
        $today = Carbon::today();

        foreach ($staffMembers as $staff) {
            for ($i = 30; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                
                // Skip weekends
                if ($date->isWeekend()) {
                    continue;
                }

                // Random status
                $statuses = ['present', 'present', 'present', 'present', 'present', 'absent', 'half_day'];
                $status = $statuses[array_rand($statuses)];

                WorkLog::create([
                    'staff_member_id' => $staff->id,
                    'log_date' => $date,
                    'status' => $status,
                    'clock_in' => $status === 'present' ? '09:' . str_pad(rand(0, 15), 2, '0', STR_PAD_LEFT) : null,
                    'clock_out' => $status === 'present' ? '18:' . str_pad(rand(0, 30), 2, '0', STR_PAD_LEFT) : null,
                    'late_minutes' => $status === 'present' ? rand(0, 20) : 0,
                    'working_minutes' => $status === 'present' ? 480 : ($status === 'half_day' ? 240 : 0),
                ]);
            }
        }

        // Company Notice
        CompanyNotice::create([
            'title' => 'Welcome to the New HRMS',
            'content' => 'We are excited to announce the launch of our new Human Resource Management System. This platform will streamline all HR processes including attendance tracking, leave management, and payroll processing.',
            'notice_type' => 'general',
            'priority' => 'high',
            'is_active' => true,
            'publish_date' => now(),
        ]);

        // Company Event
        CompanyEvent::create([
            'title' => 'Annual Company Meeting',
            'description' => 'Join us for our annual company meeting where we will discuss the achievements of the past year and goals for the upcoming year.',
            'event_start' => now()->addDays(14),
            'event_end' => now()->addDays(14),
            'start_time' => '10:00',
            'end_time' => '16:00',
            'location' => 'Main Conference Room',
            'is_all_day' => false,
            'is_company_wide' => true,
            'color' => '#3b82f6',
        ]);

        $this->command->info('Demo data seeded successfully!');
    }
}
