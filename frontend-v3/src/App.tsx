import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import StaffList from './pages/staff/StaffList';
import StaffCreate from './pages/staff/StaffCreate';
import ClockInOut from './pages/attendance/ClockInOut';
import WorkLogs from './pages/attendance/WorkLogs';
import LeaveRequests from './pages/leave/LeaveRequests';
import SalarySlips from './pages/payroll/SalarySlips';
import Jobs from './pages/recruitment/Jobs';
import Candidates from './pages/recruitment/Candidates';
import OfficeLocations from './pages/settings/OfficeLocations';
import Divisions from './pages/settings/Divisions';
import JobTitles from './pages/settings/JobTitles';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Staff Management */}
        <Route path="staff" element={<StaffList />} />
        <Route path="staff/new" element={<StaffCreate />} />
        <Route path="staff/:id" element={<StaffList />} />
        <Route path="staff/:id/edit" element={<StaffCreate />} />
        
        {/* Attendance */}
        <Route path="attendance/clock" element={<ClockInOut />} />
        <Route path="attendance/logs" element={<WorkLogs />} />
        <Route path="attendance/regularization" element={<WorkLogs />} />
        
        {/* Leave Management */}
        <Route path="leave/requests" element={<LeaveRequests />} />
        <Route path="leave/requests/:id" element={<LeaveRequests />} />
        <Route path="leave/categories" element={<LeaveRequests />} />
        <Route path="leave/balance" element={<LeaveRequests />} />
        
        {/* Payroll */}
        <Route path="payroll/slips" element={<SalarySlips />} />
        <Route path="payroll/generate" element={<SalarySlips />} />
        <Route path="payroll/setup" element={<SalarySlips />} />
        
        {/* Recruitment */}
        <Route path="recruitment/jobs" element={<Jobs />} />
        <Route path="recruitment/jobs/:id/applications" element={<Jobs />} />
        <Route path="recruitment/candidates" element={<Candidates />} />
        <Route path="recruitment/applications" element={<Jobs />} />
        
        {/* Reports */}
        <Route path="reports" element={<Dashboard />} />
        
        {/* Documents */}
        <Route path="documents" element={<Dashboard />} />
        
        {/* Settings */}
        <Route path="settings/locations" element={<OfficeLocations />} />
        <Route path="settings/divisions" element={<Divisions />} />
        <Route path="settings/job-titles" element={<JobTitles />} />
        <Route path="settings/holidays" element={<OfficeLocations />} />
        <Route path="settings/shifts" element={<OfficeLocations />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
