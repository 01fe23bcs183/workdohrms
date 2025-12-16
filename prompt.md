# HRMS Feature Prompts

> Each section contains prompts for 4 related features. Use these prompts to implement the backend systematically.

---

## Prompt Set 1: Core Authentication & Company Setup

### Features: User Registration, Login, Password Management, Company Profile

```
Implement the core authentication and company setup module for an HRMS backend using Node.js/Express and MongoDB.

**Feature 1: User Registration**
- Create User model with fields: email, password, name, role (superadmin/admin/employee), status, createdAt
- Hash passwords using bcrypt before saving
- Generate unique employee IDs
- Validate email uniqueness
- Return JWT token on successful registration

**Feature 2: User Login**
- Verify email and password
- Check user status (active/inactive)
- Generate JWT token with user ID and role
- Include token expiration (24 hours)
- Return user profile with token

**Feature 3: Password Management**
- Forgot password: Generate reset token, send via email (stub for now)
- Reset password: Validate token, update password
- Change password: Require current password verification
- Token expiration: 1 hour for reset tokens

**Feature 4: Company Profile**
- Create Company model with fields: name, email, phone, address, logo, settings
- One company per deployment (single-tenant)
- CRUD operations for company profile
- Only superadmin can modify company settings

API Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- PUT /api/auth/change-password
- GET /api/company
- PUT /api/company
```

---

## Prompt Set 2: Organization Structure

### Features: Branches, Departments, Designations, Roles

```
Implement the organization structure module for the HRMS backend.

**Feature 1: Branches Management**
- Branch model: name, address, phone, email, status, company (ref)
- CRUD operations with validation
- Branch cannot be deleted if employees assigned
- List branches with pagination and search

**Feature 2: Departments Management**
- Department model: name, branch (ref), description, status
- Link departments to branches (optional)
- CRUD operations with validation
- Prevent deletion if employees assigned
- List with branch filtering

**Feature 3: Designations Management**
- Designation model: name, department (ref), description, status
- Link to departments for hierarchy
- CRUD operations
- Prevent deletion if employees assigned
- Sort by hierarchy level

**Feature 4: Roles & Permissions**
- Role model: name, permissions (array), status
- Permission types: create, read, update, delete for each module
- Default roles: Super Admin, HR Manager, Manager, Employee
- Assign roles to users
- Check permissions in middleware

API Endpoints:
- CRUD /api/branches
- CRUD /api/departments
- CRUD /api/designations
- CRUD /api/roles
- GET /api/roles/:id/permissions
- PUT /api/roles/:id/permissions
```

---

## Prompt Set 3: Employee Management Core

### Features: Employee Creation, Employee Profile, Employee Documents, Employee Directory

```
Implement the employee management core module for the HRMS backend.

**Feature 1: Employee Creation**
- Employee model with comprehensive fields:
  - Personal: name, email, phone, dob, gender, address, emergencyContact
  - Employment: employeeId, branch, department, designation, joiningDate, employmentType
  - Salary: baseSalary, salaryType
  - Manager: reportingTo (self ref)
  - Status: active, onLeave, terminated, resigned
- Auto-generate employee ID (e.g., EMP-001)
- Create user account linked to employee
- Send welcome email (stub)

**Feature 2: Employee Profile**
- View complete employee details
- Update personal information
- Update employment details (HR/Admin only)
- View employment history
- Profile photo upload

**Feature 3: Employee Documents**
- Document model: employee (ref), type, name, file, uploadedAt, status
- Upload documents (ID, certificates, etc.)
- Document types: Identity, Education, Experience, Other
- View/download employee documents
- Document verification status

**Feature 4: Employee Directory**
- List all employees with pagination
- Search by name, email, department, designation
- Filter by branch, department, status
- Sort by name, joining date, designation
- Export employee list (CSV stub)

API Endpoints:
- POST /api/employees
- GET /api/employees/:id
- PUT /api/employees/:id
- GET /api/employees
- POST /api/employees/:id/documents
- GET /api/employees/:id/documents
- DELETE /api/employees/:id/documents/:docId
```

---

## Prompt Set 4: Employee Lifecycle

### Features: Promotions, Transfers, Resignations, Terminations

```
Implement the employee lifecycle module for the HRMS backend.

**Feature 1: Promotions**
- Promotion model: employee, fromDesignation, toDesignation, fromSalary, toSalary, effectiveDate, reason
- Create promotion record
- Update employee designation and salary
- Maintain promotion history
- Approval workflow (manager -> HR)

**Feature 2: Transfers**
- Transfer model: employee, fromBranch, toBranch, fromDepartment, toDepartment, effectiveDate, reason
- Create transfer record
- Update employee branch/department
- Maintain transfer history
- Notify relevant parties (stub)

**Feature 3: Resignations**
- Resignation model: employee, resignationDate, lastWorkingDate, reason, status, noticePeriod
- Submit resignation (employee)
- Approve/reject resignation (manager/HR)
- Calculate last working date based on notice period
- Update employee status on approval

**Feature 4: Terminations**
- Termination model: employee, terminationDate, reason, type (voluntary/involuntary), status
- Create termination record (HR only)
- Update employee status to terminated
- Revoke system access
- Maintain termination history

API Endpoints:
- POST /api/employees/:id/promotions
- GET /api/employees/:id/promotions
- POST /api/employees/:id/transfers
- GET /api/employees/:id/transfers
- POST /api/employees/:id/resignations
- PUT /api/employees/:id/resignations/:resId
- POST /api/employees/:id/terminations
```

---

## Prompt Set 5: HR Features Part 1

### Features: Asset Categories, Asset Management, Asset Assignment, Asset History

```
Implement the asset management module for the HRMS backend.

**Feature 1: Asset Categories**
- AssetCategory model: name, description, status
- CRUD operations
- Examples: Laptop, Mobile, Vehicle, Furniture
- Prevent deletion if assets exist

**Feature 2: Asset Management**
- Asset model: name, category (ref), serialNumber, purchaseDate, purchasePrice, condition, status, description
- Asset status: Available, Assigned, Maintenance, Retired
- CRUD operations with validation
- Track asset value and depreciation (basic)

**Feature 3: Asset Assignment**
- AssetAssignment model: asset (ref), employee (ref), assignedDate, returnDate, condition, notes
- Assign asset to employee
- Update asset status to Assigned
- Cannot assign if already assigned
- Return asset and update status

**Feature 4: Asset History**
- Track all assignments per asset
- Track all assets per employee
- View assignment history
- Generate asset reports (stub)

API Endpoints:
- CRUD /api/asset-categories
- CRUD /api/assets
- POST /api/assets/:id/assign
- PUT /api/assets/:id/return
- GET /api/assets/:id/history
- GET /api/employees/:id/assets
```

---

## Prompt Set 6: HR Features Part 2

### Features: Training Types, Training Programs, Training Enrollment, Training Completion

```
Implement the training management module for the HRMS backend.

**Feature 1: Training Types**
- TrainingType model: name, description, status
- CRUD operations
- Examples: Onboarding, Technical, Soft Skills, Compliance
- Prevent deletion if trainings exist

**Feature 2: Training Programs**
- Training model: name, type (ref), trainer, branch, department, startDate, endDate, cost, description, status
- Training status: Planned, Ongoing, Completed, Cancelled
- CRUD operations
- Filter by type, status, date range

**Feature 3: Training Enrollment**
- TrainingEnrollment model: training (ref), employee (ref), enrolledAt, status
- Enrollment status: Enrolled, Completed, Dropped
- Enroll employees in training
- Check capacity limits
- Bulk enrollment support

**Feature 4: Training Completion**
- Update enrollment status to Completed
- Record completion date and score (optional)
- Generate training certificates (stub)
- Track employee training history

API Endpoints:
- CRUD /api/training-types
- CRUD /api/trainings
- POST /api/trainings/:id/enroll
- PUT /api/trainings/:id/enrollments/:enrollId
- GET /api/trainings/:id/enrollments
- GET /api/employees/:id/trainings
```

---

## Prompt Set 7: Performance Management

### Features: Goal Setting, Performance Indicators, Appraisals, Performance Reviews

```
Implement the performance management module for the HRMS backend.

**Feature 1: Goal Setting**
- Goal model: employee (ref), title, description, targetDate, status, progress, createdBy
- Goal status: Pending, In Progress, Completed, Cancelled
- Create goals for employees (manager/self)
- Update goal progress (percentage)
- Goal approval workflow

**Feature 2: Performance Indicators (KPIs)**
- Indicator model: name, description, designation (ref), weightage, targetValue
- Define KPIs per designation
- CRUD operations
- Aggregate indicators for evaluation

**Feature 3: Appraisals**
- Appraisal model: employee (ref), period (year/quarter), indicators, scores, comments, status
- Appraisal status: Pending, Self Review, Manager Review, Completed
- Create appraisal cycle
- Self-assessment by employee
- Manager review and scoring

**Feature 4: Performance Reviews**
- Review model: employee (ref), reviewer (ref), period, rating, strengths, improvements, comments
- Overall rating calculation
- Review meeting notes
- Action items from review
- Historical performance tracking

API Endpoints:
- CRUD /api/goals
- GET /api/employees/:id/goals
- CRUD /api/indicators
- GET /api/designations/:id/indicators
- POST /api/appraisals
- PUT /api/appraisals/:id
- GET /api/employees/:id/appraisals
- POST /api/performance-reviews
- GET /api/employees/:id/reviews
```

---

## Prompt Set 8: Recruitment Part 1

### Features: Job Categories, Job Postings, Job Requirements, Job Status Management

```
Implement the job management module for the HRMS backend.

**Feature 1: Job Categories**
- JobCategory model: name, description, status
- CRUD operations
- Examples: Engineering, Marketing, HR, Finance
- Prevent deletion if jobs exist

**Feature 2: Job Postings**
- Job model: title, category (ref), branch, department, positions, description, requirements, salary range, status, postedAt, closingDate
- Job status: Draft, Published, Closed, Filled
- CRUD operations
- Auto-close on closing date

**Feature 3: Job Requirements**
- Store as embedded array in Job model
- Fields: skill, experience (years), mandatory (boolean)
- Add/remove requirements
- Categorize: Skills, Experience, Education, Certifications

**Feature 4: Job Status Management**
- Publish job (draft -> published)
- Close job manually
- Mark as filled when hired
- Reopen closed job
- Track applicant count per job

API Endpoints:
- CRUD /api/job-categories
- CRUD /api/jobs
- PUT /api/jobs/:id/publish
- PUT /api/jobs/:id/close
- PUT /api/jobs/:id/fill
- GET /api/jobs/:id/stats
```

---

## Prompt Set 9: Recruitment Part 2

### Features: Candidate Applications, Resume Management, Candidate Stages, Candidate Communication

```
Implement the candidate management module for the HRMS backend.

**Feature 1: Candidate Applications**
- Candidate model: name, email, phone, job (ref), resume, coverLetter, stage, appliedAt, source
- Application source: Website, LinkedIn, Referral, Agency
- Submit application (public endpoint)
- View all candidates per job
- Filter by stage, date

**Feature 2: Resume Management**
- Upload resume (PDF, DOC)
- Parse basic info (stub for AI parsing)
- Store parsed data
- Download resume
- Resume search (basic)

**Feature 3: Candidate Stages**
- Stages: Applied, Screening, Interview, Offered, Hired, Rejected
- Move candidate between stages
- Track stage history with timestamps
- Stage transition reasons
- Bulk stage updates

**Feature 4: Candidate Communication**
- CandidateNote model: candidate (ref), note, createdBy, createdAt
- Add notes to candidates
- Email templates (stub)
- Log all communications
- Internal discussion on candidates

API Endpoints:
- POST /api/jobs/:id/apply (public)
- GET /api/jobs/:id/candidates
- GET /api/candidates/:id
- PUT /api/candidates/:id/stage
- POST /api/candidates/:id/notes
- GET /api/candidates/:id/notes
- POST /api/candidates/:id/resume
```

---

## Prompt Set 10: Recruitment Part 3

### Features: Interview Scheduling, Interview Feedback, Hiring Decisions, Offer Management

```
Implement the interview and hiring module for the HRMS backend.

**Feature 1: Interview Scheduling**
- Interview model: candidate (ref), round, scheduledAt, duration, interviewers, location, type, status
- Interview type: Phone, Video, In-person, Technical, HR
- Schedule interviews
- Send calendar invites (stub)
- Reschedule/cancel interviews

**Feature 2: Interview Feedback**
- InterviewFeedback model: interview (ref), interviewer (ref), rating, strengths, weaknesses, recommendation, comments
- Submit feedback post-interview
- Ratings: Strong Hire, Hire, No Hire, Strong No Hire
- Aggregate feedback per candidate
- Required before stage advancement

**Feature 3: Hiring Decisions**
- Review all feedback
- Make hire/reject decision
- Record decision with reason
- Move candidate to Offered/Rejected stage
- Notify candidate (stub)

**Feature 4: Offer Management**
- Offer model: candidate (ref), job (ref), salary, joiningDate, expiryDate, status, document
- Offer status: Pending, Accepted, Rejected, Expired
- Generate offer letter (template)
- Track offer acceptance
- Convert to employee on accept

API Endpoints:
- POST /api/interviews
- GET /api/candidates/:id/interviews
- PUT /api/interviews/:id
- POST /api/interviews/:id/feedback
- GET /api/interviews/:id/feedback
- POST /api/candidates/:id/decision
- POST /api/candidates/:id/offer
- PUT /api/offers/:id/accept
- PUT /api/offers/:id/reject
```

---

## Prompt Set 11: Onboarding

### Features: Onboarding Checklists, Onboarding Tasks, New Hire Setup, Onboarding Completion

```
Implement the onboarding module for the HRMS backend.

**Feature 1: Onboarding Checklists**
- OnboardingTemplate model: name, department, tasks (embedded array)
- Task fields: title, description, assignee type (HR/Manager/Employee), dueOffset (days from joining)
- CRUD for templates
- Copy template for new hire

**Feature 2: Onboarding Tasks**
- OnboardingTask model: employee (ref), template (ref), title, description, assignee (ref), dueDate, status, completedAt
- Task status: Pending, In Progress, Completed, Overdue
- Create tasks from template
- Assign to appropriate users
- Track completion

**Feature 3: New Hire Setup**
- Create employee from accepted offer
- Generate login credentials
- Create user account
- Assign onboarding checklist
- Welcome email with credentials (stub)

**Feature 4: Onboarding Completion**
- Mark tasks as complete
- Track overall progress (percentage)
- Complete onboarding when all tasks done
- Notify manager on completion
- Onboarding analytics (stub)

API Endpoints:
- CRUD /api/onboarding-templates
- POST /api/employees/:id/onboarding/start
- GET /api/employees/:id/onboarding
- PUT /api/onboarding-tasks/:id
- PUT /api/onboarding-tasks/:id/complete
- GET /api/employees/:id/onboarding/progress
```

---

## Prompt Set 12: Leave Management

### Features: Leave Types, Leave Policies, Leave Applications, Leave Balances

```
Implement the leave management module for the HRMS backend.

**Feature 1: Leave Types**
- LeaveType model: name, code, isPaid, requiresApproval, maxDays, carryForward, status
- CRUD operations
- Examples: Annual, Sick, Casual, Maternity, Unpaid
- Prevent deletion if leaves taken

**Feature 2: Leave Policies**
- LeavePolicy model: name, leaveType (ref), applicableTo (all/designation/department), accrualRate, maxCarryForward, status
- Define policies per leave type
- Assign policies to groups
- Pro-rate for mid-year joins

**Feature 3: Leave Applications**
- Leave model: employee (ref), leaveType (ref), startDate, endDate, days, reason, status, approvedBy, approvedAt
- Leave status: Pending, Approved, Rejected, Cancelled
- Apply for leave
- Calculate working days (exclude weekends/holidays)
- Check balance before approval
- Approval workflow (manager -> HR)

**Feature 4: Leave Balances**
- LeaveBalance model: employee (ref), leaveType (ref), year, entitled, taken, balance, carryForward
- Initialize balances at year start
- Auto-update on leave approval
- View balance summary
- Balance history per year

API Endpoints:
- CRUD /api/leave-types
- CRUD /api/leave-policies
- POST /api/leaves
- GET /api/leaves
- PUT /api/leaves/:id/approve
- PUT /api/leaves/:id/reject
- PUT /api/leaves/:id/cancel
- GET /api/employees/:id/leave-balance
```

---

## Prompt Set 13: Attendance Management

### Features: Shifts, Attendance Policies, Clock In/Out, Attendance Records

```
Implement the attendance management module for the HRMS backend.

**Feature 1: Shifts**
- Shift model: name, startTime, endTime, breakDuration, workingHours, gracePeriod, status
- CRUD operations
- Assign shifts to employees
- Multiple shifts support

**Feature 2: Attendance Policies**
- AttendancePolicy model: name, shift (ref), lateThreshold, halfDayThreshold, absentThreshold, overtimeStart
- Define late/absent rules
- Apply to departments/employees
- Flexible timing policies

**Feature 3: Clock In/Out**
- Attendance model: employee (ref), date, clockIn, clockOut, shift (ref), status, workingHours, overtime
- Attendance status: Present, Late, Half-day, Absent, On Leave, Holiday
- Clock in with timestamp
- Clock out with timestamp
- Calculate working hours
- IP/location restriction (basic)

**Feature 4: Attendance Records**
- View daily attendance
- Monthly attendance report
- Filter by employee, department, date
- Bulk attendance entry (for past)
- Export attendance report (CSV stub)

API Endpoints:
- CRUD /api/shifts
- PUT /api/employees/:id/shift
- CRUD /api/attendance-policies
- POST /api/attendance/clock-in
- POST /api/attendance/clock-out
- GET /api/attendance
- GET /api/employees/:id/attendance
- POST /api/attendance/bulk
```

---

## Prompt Set 14: Attendance Extended

### Features: Attendance Regularization, Overtime, Holidays, Attendance Reports

```
Implement the attendance extended features for the HRMS backend.

**Feature 1: Attendance Regularization**
- Regularization model: employee (ref), date, originalClockIn, originalClockOut, correctedClockIn, correctedClockOut, reason, status
- Request regularization for missed punch
- Approval workflow
- Update attendance on approval
- Limit regularization requests per month

**Feature 2: Overtime Management**
- Calculate overtime from attendance
- OvertimeRequest model: employee (ref), date, hours, reason, status
- Request overtime approval
- Types: Pre-approved, Post-facto
- Overtime pay calculation (with payroll)

**Feature 3: Holidays Management**
- Holiday model: name, date, type, applicableTo, status
- Holiday types: National, Regional, Optional
- CRUD operations
- Apply to branches/all
- Integration with leave/attendance

**Feature 4: Attendance Reports**
- Daily attendance summary
- Monthly attendance report
- Late arrival report
- Absentee report
- Overtime report
- Department-wise analysis

API Endpoints:
- POST /api/attendance-regularizations
- GET /api/attendance-regularizations
- PUT /api/attendance-regularizations/:id/approve
- POST /api/overtime-requests
- PUT /api/overtime-requests/:id/approve
- CRUD /api/holidays
- GET /api/reports/attendance/daily
- GET /api/reports/attendance/monthly
- GET /api/reports/attendance/late
```

---

## Prompt Set 15: Time Tracking

### Features: Time Entries, Timesheets, Time Reports, Project Time

```
Implement the time tracking module for the HRMS backend.

**Feature 1: Time Entries**
- TimeEntry model: employee (ref), date, startTime, endTime, duration, project, task, description, status
- Manual time entry
- Timer-based entry (start/stop)
- Edit time entries
- Billable vs non-billable

**Feature 2: Timesheets**
- Weekly timesheet view
- Submit timesheet for approval
- Timesheet status: Draft, Submitted, Approved, Rejected
- Approval workflow
- Lock submitted timesheets

**Feature 3: Time Reports**
- Employee time summary
- Project time report
- Department time report
- Utilization report
- Export reports (CSV stub)

**Feature 4: Project Time (Basic)**
- Project model: name, client, status
- Assign employees to projects
- Track time per project
- Project time summary

API Endpoints:
- POST /api/time-entries
- GET /api/time-entries
- PUT /api/time-entries/:id
- DELETE /api/time-entries/:id
- GET /api/timesheets
- POST /api/timesheets/:weekId/submit
- PUT /api/timesheets/:id/approve
- GET /api/reports/time/summary
- CRUD /api/projects
```

---

## Prompt Set 16: Payroll Part 1

### Features: Salary Components, Salary Structure, Employee Salary, Salary History

```
Implement the payroll foundation module for the HRMS backend.

**Feature 1: Salary Components**
- SalaryComponent model: name, type, category, calculationType, value, taxable, status
- Types: Earning, Deduction, Employer Contribution
- Categories: Basic, Allowance, Bonus, Tax, Insurance, PF
- Calculation: Fixed, Percentage of Basic
- CRUD operations

**Feature 2: Salary Structure**
- SalaryStructure model: name, components (array with values), applicableTo, status
- Create salary templates
- Assign to designations
- Multiple structures support
- Clone and modify structures

**Feature 3: Employee Salary**
- EmployeeSalary model: employee (ref), structure (ref), components (with values), effectiveFrom, status
- Assign salary to employee
- Override component values
- CTC calculation
- Net salary calculation

**Feature 4: Salary History**
- Track salary changes over time
- Salary revision records
- Compare old vs new salary
- Salary growth analysis

API Endpoints:
- CRUD /api/salary-components
- CRUD /api/salary-structures
- GET /api/salary-structures/:id/preview
- POST /api/employees/:id/salary
- PUT /api/employees/:id/salary
- GET /api/employees/:id/salary
- GET /api/employees/:id/salary/history
```

---

## Prompt Set 17: Payroll Part 2

### Features: Payroll Run, Payroll Entries, Payslip Generation, Payroll Reports

```
Implement the payroll processing module for the HRMS backend.

**Feature 1: Payroll Run**
- PayrollRun model: month, year, status, createdBy, processedAt, employeeCount, totalAmount
- Payroll status: Draft, Processing, Processed, Approved, Paid
- Initiate monthly payroll
- Select employees to include
- Lock payroll for processing

**Feature 2: Payroll Entries**
- PayrollEntry model: payrollRun (ref), employee (ref), earnings, deductions, grossPay, netPay, status
- Calculate for each employee
- Include attendance adjustments
- Include leave deductions
- Include overtime pay
- Manual adjustments

**Feature 3: Payslip Generation**
- Payslip model: employee (ref), payrollRun (ref), month, year, components, grossPay, deductions, netPay, pdfUrl
- Generate payslip per employee
- PDF generation (template)
- Email payslip (stub)
- Download payslip

**Feature 4: Payroll Reports**
- Monthly payroll summary
- Department-wise payroll
- Tax summary report
- PF/Insurance reports
- Payroll comparison (month-over-month)
- Bank transfer file (stub)

API Endpoints:
- POST /api/payroll-runs
- GET /api/payroll-runs
- POST /api/payroll-runs/:id/process
- PUT /api/payroll-runs/:id/approve
- GET /api/payroll-runs/:id/entries
- PUT /api/payroll-entries/:id
- GET /api/employees/:id/payslips
- GET /api/payslips/:id/download
- GET /api/reports/payroll/summary
- GET /api/reports/payroll/tax
```

---

## Prompt Set 18: Documents & Contracts

### Features: Document Categories, HR Documents, Document Templates, Document Acknowledgments

```
Implement the document management module for the HRMS backend.

**Feature 1: Document Categories**
- DocumentCategory model: name, description, requiresAcknowledgment, status
- CRUD operations
- Examples: Policies, Handbooks, Forms, Compliance
- Prevent deletion if documents exist

**Feature 2: HR Documents**
- Document model: name, category (ref), file, version, uploadedBy, uploadedAt, visibleTo, status
- Upload company documents
- Version management
- Set visibility (all, department, designation)
- Search documents

**Feature 3: Document Templates**
- DocumentTemplate model: name, category (ref), content, variables, status
- Create templates with placeholders
- Variables: {employee_name}, {date}, {department}, etc.
- Generate documents from templates
- Preview template

**Feature 4: Document Acknowledgments**
- DocumentAcknowledgment model: document (ref), employee (ref), acknowledgedAt, ipAddress
- Track document reads
- Require acknowledgment for policies
- View acknowledgment status per document
- Bulk acknowledgment status

API Endpoints:
- CRUD /api/document-categories
- CRUD /api/documents
- GET /api/documents/:id/download
- CRUD /api/document-templates
- POST /api/document-templates/:id/generate
- POST /api/documents/:id/acknowledge
- GET /api/documents/:id/acknowledgments
```

---

## Prompt Set 19: Contract Management

### Features: Contract Types, Employee Contracts, Contract Renewals, Contract Templates

```
Implement the contract management module for the HRMS backend.

**Feature 1: Contract Types**
- ContractType model: name, description, defaultDuration, renewalReminder, status
- CRUD operations
- Examples: Permanent, Fixed-term, Probation, Internship
- Set default durations

**Feature 2: Employee Contracts**
- Contract model: employee (ref), type (ref), startDate, endDate, terms, salary, document, status
- Contract status: Draft, Active, Expired, Terminated, Renewed
- Create contracts
- Upload signed contracts
- Track contract status

**Feature 3: Contract Renewals**
- Renewal notification before expiry
- Renewal model: contract (ref), renewedFrom, renewedTo, newTerms, status
- Create renewal
- Update original contract
- Renewal history

**Feature 4: Contract Templates**
- ContractTemplate model: name, type (ref), content, variables, status
- Create contract templates
- Variables: {employee_name}, {salary}, {start_date}, etc.
- Generate contract from template
- Preview and edit before saving

API Endpoints:
- CRUD /api/contract-types
- CRUD /api/contracts
- GET /api/employees/:id/contracts
- GET /api/contracts/expiring
- POST /api/contracts/:id/renew
- GET /api/contracts/:id/renewals
- CRUD /api/contract-templates
- POST /api/contract-templates/:id/generate
```

---

## Prompt Set 20: Meeting Management

### Features: Meeting Types, Meeting Rooms, Meeting Scheduling, Meeting Attendees

```
Implement the meeting management module for the HRMS backend.

**Feature 1: Meeting Types**
- MeetingType model: name, description, defaultDuration, status
- CRUD operations
- Examples: Team Standup, Performance Review, Training, Interview
- Prevent deletion if meetings exist

**Feature 2: Meeting Rooms**
- MeetingRoom model: name, branch (ref), capacity, facilities, status
- CRUD operations
- Facilities: Projector, Video Conference, Whiteboard
- Room availability check

**Feature 3: Meeting Scheduling**
- Meeting model: title, type (ref), room (ref), organizer (ref), startTime, endTime, description, recurring, status
- Meeting status: Scheduled, In Progress, Completed, Cancelled
- Check room availability
- Recurring meetings (daily/weekly/monthly)
- Send invites (stub)

**Feature 4: Meeting Attendees**
- MeetingAttendee model: meeting (ref), employee (ref), response, attendedAt
- Response: Pending, Accepted, Declined, Maybe
- Add/remove attendees
- RSVP functionality
- Attendance tracking

API Endpoints:
- CRUD /api/meeting-types
- CRUD /api/meeting-rooms
- GET /api/meeting-rooms/:id/availability
- CRUD /api/meetings
- POST /api/meetings/:id/attendees
- DELETE /api/meetings/:id/attendees/:empId
- PUT /api/meetings/:id/attendees/:empId/rsvp
- GET /api/employees/:id/meetings
```

---

## Prompt Set 21: Meeting Extended & Calendar

### Features: Meeting Minutes, Action Items, Calendar Overview, Calendar Integration

```
Implement meeting extended features and calendar module for the HRMS backend.

**Feature 1: Meeting Minutes**
- MeetingMinutes model: meeting (ref), content, decisions, createdBy, createdAt
- Create minutes during/after meeting
- Structured sections: Agenda, Discussion, Decisions
- Share with attendees
- PDF export (stub)

**Feature 2: Action Items**
- ActionItem model: meeting (ref), title, assignee (ref), dueDate, status, completedAt
- Action status: Pending, In Progress, Completed, Overdue
- Create from meeting minutes
- Track completion
- Follow-up reminders (stub)

**Feature 3: Calendar Overview**
- Calendar model: employee (ref), events (embedded)
- Aggregate events: Meetings, Leaves, Holidays, Trainings
- Day/Week/Month views
- Personal calendar
- Team calendar view

**Feature 4: Calendar Integration**
- Google Calendar sync (stub - prepare endpoints)
- ICS file export
- Import external events
- Calendar sharing settings
- Notification preferences

API Endpoints:
- POST /api/meetings/:id/minutes
- GET /api/meetings/:id/minutes
- PUT /api/meetings/:id/minutes
- POST /api/meetings/:id/action-items
- GET /api/action-items
- PUT /api/action-items/:id
- GET /api/calendar
- GET /api/calendar/team
- GET /api/calendar/export
- PUT /api/calendar/settings
```

---

## Prompt Set 22: Settings & Media

### Features: Company Settings, System Settings, Media Library, Media Directories

```
Implement the settings and media management module for the HRMS backend.

**Feature 1: Company Settings**
- CompanySettings model (embedded in Company): logo, favicon, primaryColor, dateFormat, timeFormat, currency, fiscalYearStart
- Update company branding
- Date/time preferences
- Regional settings
- Email settings (SMTP stub)

**Feature 2: System Settings**
- SystemSettings model: modules enabled, features enabled, security settings
- Enable/disable modules
- Security: Password policy, session timeout, 2FA toggle
- Notification settings
- Backup settings (stub)

**Feature 3: Media Library**
- Media model: name, type, size, url, uploadedBy, uploadedAt, directory
- Upload images/documents
- File type validation
- Size limits
- List/search media

**Feature 4: Media Directories**
- MediaDirectory model: name, parent, createdBy
- Create folders structure
- Move files between folders
- Delete folders (with contents)
- Directory tree view

API Endpoints:
- GET /api/settings/company
- PUT /api/settings/company
- GET /api/settings/system
- PUT /api/settings/system
- POST /api/media
- GET /api/media
- DELETE /api/media/:id
- CRUD /api/media-directories
- PUT /api/media/:id/move
```

---

## Prompt Set 23: Employee Lifecycle Extended

### Features: Awards Management, Warnings Management, Business Trips, Complaints Management

```
Implement the extended employee lifecycle module for the HRMS backend.

**Feature 1: Awards Management**
- AwardType model: name, description, frequency (monthly/quarterly/annual), status
- Award model: employee (ref), awardType (ref), reason, date, awardedBy, certificate
- Create award types (Employee of Month, Best Team Player, etc.)
- Nominate and award employees
- Track award history per employee
- Generate award certificates (template stub)

**Feature 2: Warnings Management**
- Warning model: employee (ref), warningType, reason, date, issuedBy, followUp, status
- Warning types: Verbal, Written, Final Warning
- Issue warnings with detailed reasons
- Track warning history
- Progressive discipline workflow
- Follow-up action documentation

**Feature 3: Business Trips Management**
- Trip model: employee (ref), purpose, destination, startDate, endDate, status, description, expectedOutcomes
- TripExpense model: trip (ref), type, date, amount, currency, receipt, reimbursable, status
- Trip status: Planned, Ongoing, Completed, Cancelled
- Advance amount request and approval
- Expense tracking with receipts
- Reimbursement workflow
- Trip report submission

**Feature 4: Complaints Management**
- Complaint model: complainant (ref), against (ref/dept), type, description, status, resolution
- Complaint status: Filed, Investigating, Resolved, Dismissed
- File complaints (employee self-service)
- Track investigation progress
- Resolution documentation
- Confidential handling

API Endpoints:
- CRUD /api/award-types
- POST /api/awards
- GET /api/employees/:id/awards
- POST /api/warnings
- GET /api/employees/:id/warnings
- CRUD /api/trips
- POST /api/trips/:id/expenses
- GET /api/trips/:id/expenses
- POST /api/complaints
- GET /api/complaints
- PUT /api/complaints/:id
```

---

## Prompt Set 24: Announcements & Holidays

### Features: Announcements, Holidays, Announcement Tracking, Holiday Calendar

```
Implement the announcements and holidays module for the HRMS backend.

**Feature 1: Announcements Management**
- Announcement model: title, category, description, content, startDate, endDate, attachments, isFeatured, isHighPriority, isCompanyWide, targetDepartments, targetBranches
- Categories: Company News, Policy Updates, Events, etc.
- Create targeted or company-wide announcements
- Set priority and featured status
- Attach documents
- Auto-expiration based on end date

**Feature 2: Announcement Tracking**
- AnnouncementView model: announcement (ref), employee (ref), viewedAt
- Track which employees viewed announcements
- View statistics and engagement metrics
- Read/unread status per employee
- Dashboard integration for featured announcements

**Feature 3: Holidays Management**
- Holiday model: name, startDate, endDate, category, description, isRecurring, isPaid, isHalfDay, applicableBranches
- Categories: National, Religious, Company-specific
- Multi-day holiday support
- Recurring annual holidays
- Branch-specific holidays
- Paid/unpaid designation

**Feature 4: Holiday Calendar**
- Visual calendar view of all holidays
- Integration with leave management
- Integration with attendance (auto-mark)
- Export holiday list
- Current year and future planning

API Endpoints:
- CRUD /api/announcements
- POST /api/announcements/:id/view
- GET /api/announcements/:id/views
- GET /api/announcements/featured
- CRUD /api/holidays
- GET /api/holidays/calendar
- GET /api/holidays/year/:year
```

---

## Prompt Set 25: Recruitment Extended

### Features: Job Requisitions, Job Types, Job Locations, Application Forms

```
Implement the extended recruitment module for the HRMS backend.

**Feature 1: Job Requisitions**
- JobRequisition model: code, title, category (ref), department (ref), positionsCount, budgetMin, budgetMax, skillsRequired, educationRequired, experienceRequired, description, responsibilities, priority, status, approvedBy, approvalDate
- Priority: Low, Medium, High, Urgent
- Status: Draft, Pending Approval, Approved, Rejected
- Approval workflow
- Convert approved requisition to job posting

**Feature 2: Job Types**
- JobType model: name, description, status
- Types: Full-time, Part-time, Contract, Internship, Freelance
- CRUD operations
- Link to job postings
- Employment term classification

**Feature 3: Job Locations**
- JobLocation model: name, address, city, state, country, isRemote, status
- Support remote/hybrid/onsite options
- Link to branches (optional)
- CRUD operations
- Location-based job filtering

**Feature 4: Application Forms**
- ApplicationForm model: job (ref), fields (array of field definitions)
- Field types: Text, Email, Phone, File, Select, Checkbox
- Custom application forms per job
- Required/optional field configuration
- Form validation rules

API Endpoints:
- CRUD /api/job-requisitions
- PUT /api/job-requisitions/:id/approve
- PUT /api/job-requisitions/:id/reject
- POST /api/job-requisitions/:id/convert-to-job
- CRUD /api/job-types
- CRUD /api/job-locations
- CRUD /api/jobs/:id/application-form
```

---

## Usage Instructions

1. **Start with Prompt Set 1** to build core authentication
2. **Progress sequentially** through each prompt set
3. **Test each set** before moving to the next
4. **Customize prompts** based on your specific requirements
5. **Reference this file** when implementing each module

> Each prompt set is designed to be self-contained while building upon previous features.

---

## Feature Summary

| Phase | Prompt Sets | Features Count |
|-------|-------------|----------------|
| Core Foundation | 1-2 | 8 features |
| Employee Management | 3-4 | 8 features |
| HR Features | 5-7 | 12 features |
| Recruitment | 8-11, 25 | 16 features |
| Time & Leave | 12-15 | 16 features |
| Payroll | 16-17 | 8 features |
| Documents & Contracts | 18-19 | 8 features |
| Meetings & Calendar | 20-21 | 8 features |
| Settings & Media | 22 | 4 features |
| Extended Features | 23-24 | 8 features |

**Total: 25 Prompt Sets | 96 Features**
