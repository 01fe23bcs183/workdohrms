<?php

namespace App\Services\Attendance;

use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;
use App\Services\Core\BaseService;
use App\Services\Leave\LeaveService;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Attendance Service
 *
 * Handles all business logic for attendance/work log management.
 */
class AttendanceService extends BaseService
{
    protected string $modelClass = WorkLog::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'office_location_id' => 'office_location_id',
    ];

    protected ShiftService $shiftService;
    protected LeaveService $leaveService;

    public function __construct(ShiftService $shiftService, LeaveService $leaveService)
    {
        // parent::__construct();
        $this->shiftService = $shiftService;
        $this->leaveService = $leaveService;
        
        // Initialize any parent properties that need to be set
        $this->perPage = config('app.per_page', 15);
    }

    /**
     * Get attendance records with filters.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        // Apply filters
        if (!empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        if (!empty($params['office_location_id'])) {
            $query->whereHas('staffMember', function ($q) use ($params) {
                $q->where('office_location_id', $params['office_location_id']);
            });
        }

        // Date filter
        if (!empty($params['date'])) {
            $query->whereDate('log_date', $params['date']);
        }

        // Date range filter
        if (!empty($params['start_date'])) {
            $query->whereDate('log_date', '>=', $params['start_date']);
        }
        if (!empty($params['end_date'])) {
            $query->whereDate('log_date', '<=', $params['end_date']);
        }

        // Month/Year filter
        if (!empty($params['month']) && !empty($params['year'])) {
            $query->whereMonth('log_date', $params['month'])
                ->whereYear('log_date', $params['year']);
        }

        // Apply ordering
        $orderBy = $params['order_by'] ?? 'log_date';
        $order = $params['order'] ?? 'desc';
        $query->orderBy($orderBy, $order);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = isset($params['per_page']) ? (int)$params['per_page'] : $this->perPage;

        $result = $paginate
            ? $query->paginate($perPage)
            : $query->get();

        // Format the clock_in and clock_out times to show only time (H:i:s)
        $transformFunc = function ($workLog) {
            if ($workLog->clock_in instanceof \Carbon\Carbon) {
                $workLog->clock_in = $workLog->clock_in->format('H:i:s');
            } elseif (is_string($workLog->clock_in) && $workLog->clock_in) {
                try {
                    $workLog->clock_in = \Carbon\Carbon::parse($workLog->clock_in)->format('H:i:s');
                } catch (\Exception $e) {
                    // Keep original if parsing fails
                }
            }

            if ($workLog->clock_out instanceof \Carbon\Carbon) {
                $workLog->clock_out = $workLog->clock_out->format('H:i:s');
            } elseif (is_string($workLog->clock_out) && $workLog->clock_out) {
                try {
                    $workLog->clock_out = \Carbon\Carbon::parse($workLog->clock_out)->format('H:i:s');
                } catch (\Exception $e) {
                    // Keep original if parsing fails
                }
            }

            return $workLog;
        };

        if ($paginate) {
            $result->getCollection()->transform($transformFunc);
        } else {
            $result->transform($transformFunc);
        }

        return $result;
    }

    /**
     * Clock in for an employee.
     */
    public function clockIn(int $staffMemberId, array $data = []): array
    {
        $today = now()->toDateString();
        $currentTime = now();

        // Check if already clocked in today
        $existing = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        if ($existing && !$existing->clock_out) {
            throw new \Exception('Already clocked in for today');
        }

        // Get employee's shift for today
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, $today);
        
        $lateMinutes = 0;
        $status = 'present';

        if ($shift) {
            // Calculate if late based on shift
            $shiftStart = Carbon::parse($shift->start_time);
            $isLate = $currentTime->gt($shiftStart);
            
            if ($isLate) {
                $lateMinutes = $currentTime->diffInMinutes($shiftStart);
                $status = 'late';
            }
        }

        // If exists but clocked out, update
        if ($existing && $existing->clock_out) {
            $existing->update([
                'clock_in' => $currentTime,
                'clock_in_ip' => $data['ip_address'] ?? null,
                'late_minutes' => $lateMinutes,
                'status' => $status,
                'clock_out' => null,
                'clock_out_ip' => null,
                'early_leave_minutes' => 0,
                'overtime_minutes' => 0,
                'total_hours' => null,
                'author_id' => $data['author_id'] ?? null,
            ]);
            
            $workLog = $existing;
        } else {
            // Create new work log
            $workLog = WorkLog::create([
                'staff_member_id' => $staffMemberId,
                'log_date' => $today,
                'clock_in' => $currentTime,
                'clock_in_ip' => $data['ip_address'] ?? null,
                'late_minutes' => $lateMinutes,
                'status' => $status,
                'author_id' => $data['author_id'] ?? null,
            ]);
        }

        return $this->getCurrentStatus($staffMemberId);
    }

    /**
     * Clock out for an employee.
     */
    public function clockOut(int $staffMemberId, array $data = []): array
    {
        $today = now()->toDateString();
        $currentTime = now();

        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$workLog) {
            throw new \Exception('No active clock-in found for today');
        }

        $clockIn = Carbon::parse($workLog->clock_in);
        $clockOut = $currentTime;
        
        $totalMinutes = $clockIn->diffInMinutes($clockOut);
        $totalHours = round($totalMinutes / 60, 2);

        $earlyLeaveMinutes = 0;
        $overtimeMinutes = 0;
        
        // Get shift for calculation
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, $today);
        
        if ($shift) {
            $shiftEnd = Carbon::parse($shift->end_time);
            
            // Calculate early leave
            if ($clockOut->lt($shiftEnd)) {
                $earlyLeaveMinutes = $clockOut->diffInMinutes($shiftEnd);
            }
            
            // Calculate overtime (after shift end)
            if ($clockOut->gt($shiftEnd)) {
                $overtimeMinutes = $clockOut->diffInMinutes($shiftEnd);
                
                // If shift has overtime threshold, adjust
                if ($shift->overtime_after_hours > 0) {
                    $regularHours = $shift->overtime_after_hours * 60; // Convert to minutes
                    $actualWorkMinutes = $totalMinutes - ($workLog->break_minutes ?? 0);
                    
                    if ($actualWorkMinutes > $regularHours) {
                        $overtimeMinutes = $actualWorkMinutes - $regularHours;
                    } else {
                        $overtimeMinutes = 0;
                    }
                }
            }
        }

        $workLog->update([
            'clock_out' => $clockOut,
            'clock_out_ip' => $data['ip_address'] ?? null,
            'early_leave_minutes' => $earlyLeaveMinutes,
            'overtime_minutes' => $overtimeMinutes,
            'total_hours' => $totalHours,
            'author_id' => $data['author_id'] ?? null,
        ]);

        return $this->getCurrentStatus($staffMemberId);
    }

    /**
     * Get current status with comprehensive info.
     */
    public function getCurrentStatus(int $staffMemberId): array
    {
        $today = now()->toDateString();
        
        // Check if on leave
        $isOnLeave = $this->isOnLeave($staffMemberId, $today);
        
        if ($isOnLeave) {
            return [
                'status' => 'on_leave',
                'clock_in' => null,
                'clock_out' => null,
                'total_hours' => null,
                'on_leave' => true,
                'leave_details' => $isOnLeave,
            ];
        }

        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        // Get shift information
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, $today);
        $shiftInfo = $shift ? [
            'id' => $shift->id,
            'name' => $shift->name,
            'start_time' => $shift->start_time,
            'end_time' => $shift->end_time,
            'is_night_shift' => $shift->is_night_shift,
        ] : null;

        if (!$workLog) {
            return [
                'status' => 'not_clocked_in',
                'clock_in' => null,
                'clock_out' => null,
                'total_hours' => null,
                'shift' => $shiftInfo,
                'current_time' => now()->format('H:i:s'),
            ];
        }

        // Return clock_in and clock_out as datetime strings for frontend timezone conversion
        // The model casts these to datetime, so they're already Carbon instances
        $clockInDateTime = $workLog->clock_in?->format('Y-m-d H:i:s');
        $clockOutDateTime = $workLog->clock_out?->format('Y-m-d H:i:s');

        return [
            'status' => $workLog->clock_out ? 'clocked_out' : 'clocked_in',
            'clock_in' => $clockInDateTime,
            'clock_out' => $clockOutDateTime,
            'total_hours' => $workLog->total_hours,
            'late_minutes' => $workLog->late_minutes,
            'early_leave_minutes' => $workLog->early_leave_minutes,
            'overtime_minutes' => $workLog->overtime_minutes,
            'break_minutes' => $workLog->break_minutes,
            'shift' => $shiftInfo,
            'current_time' => now()->format('H:i:s'),
        ];
    }

    /**
     * Manual attendance entry with shift calculations.
     */
    public function recordAttendance(array $data): WorkLog
    {
        return DB::transaction(function () use ($data) {
            $logDate = $data['log_date'] ?? now()->toDateString();
            $staffMemberId = $data['staff_member_id'];
            
            // Check for existing record
            $existing = WorkLog::where('staff_member_id', $staffMemberId)
                ->whereDate('log_date', $logDate)
                ->first();

            // Auto-calculate if clock_in and clock_out provided
            if (isset($data['clock_in']) && isset($data['clock_out'])) {
                $clockIn = Carbon::parse($data['clock_in']);
                $clockOut = Carbon::parse($data['clock_out']);
                
                if ($clockOut->lt($clockIn)) {
                    // Handle overnight shift (for night shifts)
                    $clockOut->addDay();
                }
                
                $totalMinutes = $clockIn->diffInMinutes($clockOut);
                $data['total_hours'] = round($totalMinutes / 60, 2);
                
                // Get shift for calculations
                $shift = $this->shiftService->getEmployeeShift($staffMemberId, $logDate);
                
                if ($shift) {
                    $shiftStart = Carbon::parse($shift->start_time);
                    $shiftEnd = Carbon::parse($shift->end_time);
                    
                    // Handle night shifts crossing midnight
                    if ($shift->is_night_shift && $shiftEnd->lt($shiftStart)) {
                        $shiftEnd->addDay();
                    }
                    
                    // Late minutes
                    if ($clockIn->gt($shiftStart)) {
                        $data['late_minutes'] = $clockIn->diffInMinutes($shiftStart);
                    }
                    
                    // Early leave minutes
                    if ($clockOut->lt($shiftEnd)) {
                        $data['early_leave_minutes'] = $clockOut->diffInMinutes($shiftEnd);
                    }
                    
                    // Overtime minutes
                    if ($clockOut->gt($shiftEnd)) {
                        $data['overtime_minutes'] = $clockOut->diffInMinutes($shiftEnd);
                    }
                }
            }

            if ($existing) {
                $existing->update($data);
                return $existing->fresh($this->defaultRelations);
            }

            return WorkLog::create($data);
        });
    }

    /**
     * Bulk record attendance for multiple employees.
     */
    public function bulkRecordAttendance(array $records): Collection
    {
        return DB::transaction(function () use ($records) {
            $created = collect();

            foreach ($records as $record) {
                $created->push($this->recordAttendance($record));
            }

            return $created;
        });
    }

    /**
     * Get today's attendance summary.
     */
    public function getTodaySummary(): array
    {
        $today = now()->toDateString();
        $totalEmployees = StaffMember::active()->count();

        $present = WorkLog::whereDate('log_date', $today)->count();
        $absent = $totalEmployees - $present;
        $late = WorkLog::whereDate('log_date', $today)
            ->where('status', 'late')
            ->count();
        $halfDay = WorkLog::whereDate('log_date', $today)
            ->where('status', 'half_day')
            ->count();

        return [
            'date' => $today,
            'total_employees' => $totalEmployees,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'half_day' => $halfDay,
            'not_marked' => $absent,
            'attendance_percentage' => $totalEmployees > 0
                ? round(($present / $totalEmployees) * 100, 1)
                : 0,
        ];
    }

    /**
     * Get attendance summary for a date range.
     */
    public function getSummaryForDateRange(string $startDate, string $endDate, ?int $staffMemberId = null): array
    {
        $query = WorkLog::whereBetween('log_date', [$startDate, $endDate]);

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        $records = $query->get();

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1,
            'present_days' => $records->count(),
            'late_days' => $records->where('status', 'late')->count(),
            'half_days' => $records->where('status', 'half_day')->count(),
            'total_hours' => $records->sum('total_hours'),
            'average_hours_per_day' => $records->count() > 0
                ? round($records->sum('total_hours') / $records->count(), 2)
                : 0,
        ];
    }

    /**
     * Get monthly attendance with shift and leave integration.
     */
    public function getEmployeeMonthlyAttendance(int $staffMemberId, int $month, int $year): array
    {
        $records = WorkLog::with(['staffMember', 'author'])
            ->where('staff_member_id', $staffMemberId)
            ->whereMonth('log_date', $month)
            ->whereYear('log_date', $year)
            ->orderBy('log_date')
            ->get();

        // Get shift for the month
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, Carbon::create($year, $month, 15));
        
        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        $workingDays = $this->countWorkingDays($startOfMonth, $endOfMonth);

        // Get leaves for this month
        $leaves = TimeOffRequest::where('staff_member_id', $staffMemberId)
            ->where('approval_status', 'approved')
            ->whereMonth('start_date', $month)
            ->whereYear('start_date', $year)
            ->get();

        $leaveDays = 0;
        foreach ($leaves as $leave) {
            $leaveStart = Carbon::parse($leave->start_date);
            $leaveEnd = Carbon::parse($leave->end_date);
            
            // Count only working days in the leave period within this month
            $current = max($leaveStart, $startOfMonth);
            $last = min($leaveEnd, $endOfMonth);
            
            while ($current <= $last) {
                if (!$current->isWeekend()) {
                    $leaveDays++;
                }
                $current->addDay();
            }
        }

        // Calculate totals
        $totalLateMinutes = $records->sum('late_minutes');
        $totalOvertimeMinutes = $records->sum('overtime_minutes');
        $totalEarlyLeaveMinutes = $records->sum('early_leave_minutes');
        $totalBreakMinutes = $records->sum('break_minutes');

        return [
            'month' => $month,
            'year' => $year,
            'shift' => $shift,
            'working_days' => $workingDays,
            'present_days' => $records->whereIn('status', ['present', 'late'])->count(),
            'absent_days' => max(0, $workingDays - $records->count() - $leaveDays),
            'leave_days' => $leaveDays,
            'late_days' => $records->where('late_minutes', '>', 0)->count(),
            'total_hours' => $records->sum('total_hours'),
            'total_late_minutes' => $totalLateMinutes,
            'total_overtime_minutes' => $totalOvertimeMinutes,
            'total_early_leave_minutes' => $totalEarlyLeaveMinutes,
            'total_break_minutes' => $totalBreakMinutes,
            'records' => $records,
            'leaves' => $leaves,
        ];
    }


    /**
     * Get attendance report for all employees.
     */
    public function getAttendanceReport(array $params = []): Collection
    {
        $startDate = $params['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? now()->endOfMonth()->toDateString();

        $employees = StaffMember::active()
            ->with(['officeLocation', 'division', 'jobTitle'])
            ->get();

        return $employees->map(function ($employee) use ($startDate, $endDate) {
            $summary = $this->getSummaryForDateRange($startDate, $endDate, $employee->id);

            return [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'staff_code' => $employee->staff_code,
                    'department' => $employee->division?->title,
                ],
                'attendance' => $summary,
            ];
        });
    }

    /**
     * Check if employee has clocked in today.
     */
    public function hasClockedInToday(int $staffMemberId): bool
    {
        return WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', now()->toDateString())
            ->exists();
    }

     /**
     * Check if employee is on leave for a specific date.
     */
    private function isOnLeave(int $staffMemberId, string $date): mixed
    {
        return TimeOffRequest::where('staff_member_id', $staffMemberId)
            ->where('approval_status', 'approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->with('category')
            ->first();
    }

    /**
     * Sync attendance with approved leaves (for daily cron).
     */
    public function syncWithApprovedLeaves(): void
    {
        $today = now()->toDateString();
        
        $leaves = TimeOffRequest::where('approval_status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->get();

        foreach ($leaves as $leave) {
            WorkLog::updateOrCreate(
                [
                    'staff_member_id' => $leave->staff_member_id,
                    'log_date' => $today,
                ],
                [
                    'status' => 'on_leave',
                    'notes' => "On approved leave: {$leave->category?->title} - {$leave->reason}",
                    'author_id' => $leave->approved_by,
                ]
            );
        }
    }

    /**
     * Auto-mark absent for employees without attendance.
     */
    public function autoMarkAbsent(): void
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        
        // Get all active staff members
        $staffMembers = StaffMember::active()->pluck('id');
        
        // Get staff who have attendance for yesterday
        $attendedStaff = WorkLog::whereDate('log_date', $yesterday)
            ->whereIn('status', ['present', 'late'])
            ->pluck('staff_member_id');
            
        // Mark absent for staff without attendance
        foreach ($staffMembers as $staffId) {
            if (!$attendedStaff->contains($staffId)) {
                // Check if not on leave
                if (!$this->isOnLeave($staffId, $yesterday)) {
                    WorkLog::updateOrCreate(
                        [
                            'staff_member_id' => $staffId,
                            'log_date' => $yesterday,
                        ],
                        [
                            'status' => 'absent',
                            'notes' => 'Auto-marked absent - no attendance recorded',
                            'author_id' => 1, // System user
                        ]
                    );
                }
            }
        }
    }

    /**
     * Format time safely.
     */
    private function formatTime($time): ?string
    {
        if (!$time) return null;
        
        try {
            if (is_string($time)) {
                return Carbon::parse($time)->format('H:i:s');
            }
            if ($time instanceof Carbon) {
                return $time->format('H:i:s');
            }
            return (string) $time;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Count working days between dates (excludes weekends).
     */
    protected function countWorkingDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        $current = $start->copy();

        while ($current <= $end) {
            if (!$current->isWeekend()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}  