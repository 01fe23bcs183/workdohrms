<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AccessController;
use App\Http\Controllers\Api\OfficeLocationController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\JobTitleController;
use App\Http\Controllers\Api\FileCategoryController;
use App\Http\Controllers\Api\StaffMemberController;
use App\Http\Controllers\Api\StaffFileController;
use App\Http\Controllers\Api\RecognitionCategoryController;
use App\Http\Controllers\Api\RecognitionRecordController;
use App\Http\Controllers\Api\RoleUpgradeController;
use App\Http\Controllers\Api\LocationTransferController;
use App\Http\Controllers\Api\DisciplineNoteController;
use App\Http\Controllers\Api\ExitCategoryController;
use App\Http\Controllers\Api\OffboardingController;
use App\Http\Controllers\Api\VoluntaryExitController;
use App\Http\Controllers\Api\BusinessTripController;
use App\Http\Controllers\Api\GrievanceController;
use App\Http\Controllers\Api\CompanyNoticeController;
use App\Http\Controllers\Api\CompanyHolidayController;
use App\Http\Controllers\Api\TimeOffCategoryController;
use App\Http\Controllers\Api\TimeOffRequestController;
use App\Http\Controllers\Api\WorkLogController;
use App\Http\Controllers\Api\CompensationCategoryController;
use App\Http\Controllers\Api\BenefitTypeController;
use App\Http\Controllers\Api\AdvanceTypeController;
use App\Http\Controllers\Api\WithholdingTypeController;
use App\Http\Controllers\Api\StaffBenefitController;
use App\Http\Controllers\Api\IncentiveRecordController;
use App\Http\Controllers\Api\SalaryAdvanceController;
use App\Http\Controllers\Api\RecurringDeductionController;
use App\Http\Controllers\Api\BonusPaymentController;
use App\Http\Controllers\Api\ExtraHoursRecordController;
use App\Http\Controllers\Api\EmployerContributionController;
use App\Http\Controllers\Api\SalarySlipController;
use App\Http\Controllers\Api\TaxSlabController;
use App\Http\Controllers\Api\TaxExemptionController;
use App\Http\Controllers\Api\MinimumTaxLimitController;
use App\Http\Controllers\Api\CompanyEventController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\OrganizationPolicyController;
use App\Http\Controllers\Api\OrganizationDocumentController;
use App\Http\Controllers\Api\LetterTemplateController;
use App\Http\Controllers\Api\GeneratedLetterController;
use App\Http\Controllers\Api\AllowedIpAddressController;
use App\Http\Controllers\Api\SystemConfigurationController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/sign-up', [AccessController::class, 'signUp']);
    Route::post('/sign-in', [AccessController::class, 'signIn']);
    Route::post('/forgot-password', [AccessController::class, 'forgotPassword']);
    Route::post('/reset-password', [AccessController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/sign-out', [AccessController::class, 'signOut']);
        Route::get('/profile', [AccessController::class, 'profile']);
    });

    // ============================================
    // PROMPT SET 2: Organization Structure
    // ============================================
    Route::apiResource('office-locations', OfficeLocationController::class);
    Route::apiResource('divisions', DivisionController::class);
    Route::apiResource('job-titles', JobTitleController::class);
    Route::apiResource('file-categories', FileCategoryController::class);

    // AJAX endpoints for cascading dropdowns
    Route::post('/fetch-divisions', [DivisionController::class, 'fetchByLocation']);
    Route::post('/fetch-job-titles', [JobTitleController::class, 'fetchByDivision']);

    // ============================================
    // PROMPT SET 3: Staff Member Management
    // ============================================
    Route::apiResource('staff-members', StaffMemberController::class);
    Route::get('/staff-members-dropdown', [StaffMemberController::class, 'dropdown']);
    
    // Staff Files (nested resource)
    Route::get('/staff-members/{staffMember}/files', [StaffFileController::class, 'index']);
    Route::post('/staff-members/{staffMember}/files', [StaffFileController::class, 'store']);
    Route::get('/staff-members/{staffMember}/files/{file}', [StaffFileController::class, 'show']);
    Route::delete('/staff-members/{staffMember}/files/{file}', [StaffFileController::class, 'destroy']);

    // ============================================
    // PROMPT SET 4: Recognition & Advancement
    // ============================================
    Route::apiResource('recognition-categories', RecognitionCategoryController::class);
    Route::apiResource('recognition-records', RecognitionRecordController::class);
    Route::apiResource('role-upgrades', RoleUpgradeController::class);
    Route::apiResource('location-transfers', LocationTransferController::class);

    // ============================================
    // PROMPT SET 5: Discipline & Exit
    // ============================================
    Route::apiResource('discipline-notes', DisciplineNoteController::class);
    Route::apiResource('exit-categories', ExitCategoryController::class);
    Route::apiResource('offboardings', OffboardingController::class);
    Route::apiResource('voluntary-exits', VoluntaryExitController::class);
    Route::post('/voluntary-exits/{voluntaryExit}/process', [VoluntaryExitController::class, 'processApproval']);

    // ============================================
    // PROMPT SET 6: Business Trips & Grievances
    // ============================================
    Route::apiResource('business-trips', BusinessTripController::class);
    Route::post('/business-trips/{businessTrip}/process', [BusinessTripController::class, 'processApproval']);
    
    Route::apiResource('grievances', GrievanceController::class);
    Route::post('/grievances/{grievance}/status', [GrievanceController::class, 'updateStatus']);
    
    Route::apiResource('company-notices', CompanyNoticeController::class);
    Route::post('/company-notices/{companyNotice}/read', [CompanyNoticeController::class, 'markAsRead']);
    
    Route::apiResource('company-holidays', CompanyHolidayController::class);
    Route::post('/company-holidays/bulk-import', [CompanyHolidayController::class, 'bulkImport']);

    // ============================================
    // PROMPT SET 7: Leave Management
    // ============================================
    Route::apiResource('time-off-categories', TimeOffCategoryController::class);
    Route::apiResource('time-off-requests', TimeOffRequestController::class);
    Route::post('/time-off-requests/{timeOffRequest}/process', [TimeOffRequestController::class, 'processApproval']);
    Route::get('/time-off-balance', [TimeOffRequestController::class, 'getBalance']);

    // ============================================
    // PROMPT SET 8: Attendance Management
    // ============================================
    Route::apiResource('work-logs', WorkLogController::class);
    Route::post('/clock-in', [WorkLogController::class, 'clockIn']);
    Route::post('/clock-out', [WorkLogController::class, 'clockOut']);
    Route::post('/work-logs/bulk', [WorkLogController::class, 'bulkStore']);
    Route::get('/attendance-summary', [WorkLogController::class, 'summary']);

    // ============================================
    // PROMPT SET 9: Payroll Setup
    // ============================================
    Route::apiResource('compensation-categories', CompensationCategoryController::class);
    Route::apiResource('benefit-types', BenefitTypeController::class);
    Route::apiResource('advance-types', AdvanceTypeController::class);
    Route::apiResource('withholding-types', WithholdingTypeController::class);

    // ============================================
    // PROMPT SET 10: Salary Components
    // ============================================
    Route::apiResource('staff-benefits', StaffBenefitController::class);
    Route::apiResource('incentive-records', IncentiveRecordController::class);
    Route::apiResource('salary-advances', SalaryAdvanceController::class);
    Route::post('/salary-advances/{salaryAdvance}/payment', [SalaryAdvanceController::class, 'recordPayment']);
    Route::apiResource('recurring-deductions', RecurringDeductionController::class);

    // ============================================
    // PROMPT SET 11: Payroll Processing
    // ============================================
    Route::apiResource('bonus-payments', BonusPaymentController::class);
    Route::apiResource('extra-hours-records', ExtraHoursRecordController::class);
    Route::apiResource('employer-contributions', EmployerContributionController::class);

    // ============================================
    // PROMPT SET 12: Payslip Generation
    // ============================================
    Route::apiResource('salary-slips', SalarySlipController::class)->except(['store', 'update']);
    Route::post('/salary-slips/generate', [SalarySlipController::class, 'generate']);
    Route::post('/salary-slips/bulk-generate', [SalarySlipController::class, 'bulkGenerate']);
    Route::post('/salary-slips/{salarySlip}/mark-paid', [SalarySlipController::class, 'markPaid']);

    // ============================================
    // PROMPT SET 13: Tax Management
    // ============================================
    Route::apiResource('tax-slabs', TaxSlabController::class);
    Route::post('/tax-slabs/calculate', [TaxSlabController::class, 'calculate']);
    Route::apiResource('tax-exemptions', TaxExemptionController::class);
    Route::apiResource('minimum-tax-limits', MinimumTaxLimitController::class);

    // ============================================
    // PROMPT SET 14: Events & Calendar
    // ============================================
    Route::apiResource('company-events', CompanyEventController::class);
    Route::post('/company-events/{companyEvent}/rsvp', [CompanyEventController::class, 'rsvp']);
    Route::get('/calendar-data', [CompanyEventController::class, 'calendarData']);

    // ============================================
    // PROMPT SET 15: Company Policies & Documents
    // ============================================
    Route::apiResource('document-types', DocumentTypeController::class);
    Route::apiResource('organization-policies', OrganizationPolicyController::class);
    Route::post('/organization-policies/{organizationPolicy}/acknowledge', [OrganizationPolicyController::class, 'acknowledge']);
    Route::get('/policies-pending', [OrganizationPolicyController::class, 'pending']);
    Route::apiResource('organization-documents', OrganizationDocumentController::class);
    Route::get('/organization-documents/{organizationDocument}/download', [OrganizationDocumentController::class, 'download']);

    // ============================================
    // PROMPT SET 16: Letter Templates
    // ============================================
    Route::apiResource('letter-templates', LetterTemplateController::class);
    Route::get('/letter-placeholders', [LetterTemplateController::class, 'placeholders']);
    Route::apiResource('generated-letters', GeneratedLetterController::class)->except(['store', 'update']);
    Route::post('/generated-letters/generate', [GeneratedLetterController::class, 'generate']);
    Route::get('/generated-letters/{generatedLetter}/preview', [GeneratedLetterController::class, 'preview']);

    // ============================================
    // PROMPT SET 17: IP Restriction & Settings
    // ============================================
    Route::apiResource('allowed-ip-addresses', AllowedIpAddressController::class);
    Route::get('/check-ip', [AllowedIpAddressController::class, 'check']);
    Route::get('/system-configurations', [SystemConfigurationController::class, 'index']);
    Route::post('/system-configurations/get', [SystemConfigurationController::class, 'getValue']);
    Route::post('/system-configurations/set', [SystemConfigurationController::class, 'setValue']);
    Route::post('/system-configurations/bulk', [SystemConfigurationController::class, 'bulkUpdate']);
    Route::get('/system-configurations/category/{category}', [SystemConfigurationController::class, 'getByCategory']);
    Route::delete('/system-configurations/{systemConfiguration}', [SystemConfigurationController::class, 'destroy']);

    // ============================================
    // PROMPT SET 18: Reports & Dashboard
    // ============================================
    Route::prefix('reports')->group(function () {
        Route::get('/attendance', [ReportController::class, 'attendanceReport']);
        Route::get('/leave', [ReportController::class, 'leaveReport']);
        Route::get('/payroll', [ReportController::class, 'payrollReport']);
        Route::get('/headcount', [ReportController::class, 'headcountReport']);
    });
    Route::get('/dashboard', [ReportController::class, 'dashboard']);
});
