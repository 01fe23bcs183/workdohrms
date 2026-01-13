import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService, leaveService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Timer,
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  staff_member_id: number | null;
  organization_name?: string;
  company_name?: string;
}

interface CurrentStatus {
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
}

interface LeaveBalance {
  id: number;
  category_name: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

interface RecentLeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

const formatTimeString = (timeString: string | null | undefined) => {
  if (!timeString) return '--:--';

  try {
    if (timeString.includes(' ') || timeString.includes('T')) {
      const isoString = (timeString.includes('T') ? timeString : timeString.replace(' ', 'T')) + 'Z';
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return timeString;
  }
};

export default function StaffDashboard() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingLeave, setIsLoadingLeave] = useState(false);
  const [isClocking, setIsClocking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    };

    loadUserData();
    setIsLoading(false);

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (!currentUser?.staff_member_id) return;

      setIsLoadingStatus(true);
      try {
        const response = await attendanceService.getCurrentStatusSelf();
        setCurrentStatus(response.data.data);
      } catch (error) {
        console.error('Failed to fetch current status:', error);
        setCurrentStatus({
          status: 'not_clocked_in',
          clock_in: null,
          clock_out: null,
          total_hours: null,
        });
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchCurrentStatus();
  }, [currentUser]);

  useEffect(() => {
    const fetchLeaveData = async () => {
      if (!currentUser?.staff_member_id) return;

      setIsLoadingLeave(true);
      try {
        // Fetch leave balances
        const balancesRes = await leaveService.getMyBalances();
        if (balancesRes.data.success) {
          setLeaveBalances(balancesRes.data.data || []);
        }

        // Fetch recent leave requests
        const requestsRes = await leaveService.getMyRequests({ per_page: 5 });
        if (requestsRes.data.success) {
          setRecentRequests(requestsRes.data.data?.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
      } finally {
        setIsLoadingLeave(false);
      }
    };

    fetchLeaveData();
  }, [currentUser]);

  const handleClockIn = async () => {
    setIsClocking(true);
    setMessage(null);
    try {
      const response = await attendanceService.clockInSelf({});
      setCurrentStatus(response.data.data);
      setMessage({ type: 'success', text: 'Successfully clocked in!' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clock in';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    setIsClocking(true);
    setMessage(null);
    try {
      const response = await attendanceService.clockOutSelf({});
      setCurrentStatus(response.data.data);
      setMessage({ type: 'success', text: 'Successfully clocked out!' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clock out';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsClocking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const hasStaffMember = !!currentUser?.staff_member_id;
  const isClockedIn = currentStatus?.status === 'clocked_in';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-solarized-base01">
            {hasStaffMember ? 'Here\'s your attendance and leave overview' : 'Manage your HR activities'}
          </p>
        </div>
        <div className="text-sm text-solarized-base01">
          <div className="text-2xl font-bold text-solarized-blue">{formatTime(currentTime)}</div>
          <div>{formatDate(currentTime)}</div>
        </div>
      </div>

      {!hasStaffMember && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not linked to a staff member profile. Some features may not be available.
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-solarized-base01">
              Today's Status
            </CardTitle>
            <User className="h-5 w-5 text-solarized-blue" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-solarized-base02 capitalize">
                  {currentStatus?.status === 'clocked_in' && 'Clocked In'}
                  {currentStatus?.status === 'clocked_out' && 'Clocked Out'}
                  {currentStatus?.status === 'not_clocked_in' && 'Not Clocked In'}
                  {!currentStatus && '--'}
                </div>
                <p className="text-xs text-solarized-base01 mt-1">
                  {currentStatus?.clock_in && `In: ${formatTimeString(currentStatus.clock_in)}`}
                  {currentStatus?.clock_out && ` | Out: ${formatTimeString(currentStatus.clock_out)}`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-solarized-base01">
              Hours Today
            </CardTitle>
            <Timer className="h-5 w-5 text-solarized-green" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-solarized-base02">
                  {currentStatus?.total_hours ? `${currentStatus.total_hours.toFixed(2)}h` : '0.00h'}
                </div>
                <p className="text-xs text-solarized-base01 mt-1">
                  Total working hours today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-solarized-base01">
              Leave Balance
            </CardTitle>
            <Calendar className="h-5 w-5 text-solarized-yellow" />
          </CardHeader>
          <CardContent>
            {isLoadingLeave ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-solarized-base02">
                  {leaveBalances.length > 0
                    ? `${leaveBalances[0].remaining_days} days`
                    : 'N/A'}
                </div>
                <p className="text-xs text-solarized-base01 mt-1">
                  {leaveBalances.length > 0 ? leaveBalances[0].category_name : 'No leave categories'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-solarized-base01">
              Pending Requests
            </CardTitle>
            <FileText className="h-5 w-5 text-solarized-orange" />
          </CardHeader>
          <CardContent>
            {isLoadingLeave ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-solarized-base02">
                  {recentRequests.filter(r => r.status === 'pending').length}
                </div>
                <Link to="/leave/requests" className="text-xs text-solarized-blue hover:underline mt-1 inline-flex items-center">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clock In/Out Actions */}
      {hasStaffMember && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Record your attendance for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleClockIn}
                disabled={isClocking || isClockedIn}
                className="flex-1 h-14 text-lg bg-solarized-green hover:bg-solarized-green/90"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Clock In
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={isClocking || !isClockedIn}
                variant="outline"
                className="flex-1 h-14 text-lg border-solarized-red text-solarized-red hover:bg-solarized-red/10"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Clock Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Balances & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leave Balances</CardTitle>
              <CardDescription>Your available leave days</CardDescription>
            </div>
            <Link to="/leave/my-balances">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingLeave ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : leaveBalances.length > 0 ? (
              <div className="space-y-3">
                {leaveBalances.slice(0, 5).map((balance) => (
                  <div
                    key={balance.id}
                    className="flex items-center justify-between p-3 bg-solarized-base3 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-solarized-base02">
                        {balance.category_name}
                      </div>
                      <div className="text-xs text-solarized-base01">
                        {balance.used_days} used / {balance.total_days} total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-solarized-blue">
                        {balance.remaining_days}
                      </div>
                      <div className="text-xs text-solarized-base01">days left</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-solarized-base01">
                No leave balances available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leave Requests</CardTitle>
              <CardDescription>Your latest leave applications</CardDescription>
            </div>
            <Link to="/leave/requests">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingLeave ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.slice(0, 4).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start gap-3 p-3 bg-solarized-base3 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      request.status === 'approved'
                        ? 'bg-solarized-green/10'
                        : request.status === 'pending'
                        ? 'bg-solarized-yellow/10'
                        : 'bg-solarized-red/10'
                    }">
                      {request.status === 'approved' && <CheckCircle className="h-4 w-4 text-solarized-green" />}
                      {request.status === 'pending' && <Clock className="h-4 w-4 text-solarized-yellow" />}
                      {request.status === 'rejected' && <AlertCircle className="h-4 w-4 text-solarized-red" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-solarized-base02 capitalize">
                          {request.status}
                        </p>
                        <p className="text-xs text-solarized-base00">
                          {new Date(request.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-solarized-base01 truncate">
                        {request.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-solarized-base01">
                No leave requests yet
                <Link to="/leave/apply" className="block mt-2 text-solarized-blue hover:underline">
                  Apply for leave
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access commonly used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/attendance/self">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Clock className="h-6 w-6 text-solarized-blue" />
                <span className="text-sm">My Attendance</span>
              </Button>
            </Link>
            <Link to="/leave/apply">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Calendar className="h-6 w-6 text-solarized-green" />
                <span className="text-sm">Apply Leave</span>
              </Button>
            </Link>
            <Link to="/leave/my-balances">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <FileText className="h-6 w-6 text-solarized-yellow" />
                <span className="text-sm">Leave Balances</span>
              </Button>
            </Link>
            <Link to="/payroll/my-slips">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <DollarSign className="h-6 w-6 text-solarized-cyan" />
                <span className="text-sm">My Payslips</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
