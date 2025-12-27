import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Clock, LogIn, LogOut, Loader2, CheckCircle } from 'lucide-react';

export default function ClockInOut() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayLog, setTodayLog] = useState<{ clock_in: string | null; clock_out: string | null } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTodayLog = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await attendanceApi.getWorkLogs({ date: today, staff_member_id: user?.staff_member_id || undefined });
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          const log = response.data[0];
          setTodayLog({ clock_in: log.clock_in, clock_out: log.clock_out });
        }
      } catch (error) {
        console.error('Failed to fetch today log:', error);
      }
    };
    if (user?.staff_member_id) fetchTodayLog();
  }, [user?.staff_member_id]);

  const handleClockIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await attendanceApi.clockIn(user?.staff_member_id || undefined);
      if (response.success) {
        setMessage({ type: 'success', text: 'Clocked in successfully!' });
        setTodayLog({ clock_in: response.data.clock_in, clock_out: null });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to clock in' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to clock in' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await attendanceApi.clockOut(user?.staff_member_id || undefined);
      if (response.success) {
        setMessage({ type: 'success', text: 'Clocked out successfully!' });
        setTodayLog((prev) => prev ? { ...prev, clock_out: response.data.clock_out } : null);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to clock out' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to clock out' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Clock In / Out
        </h1>
        <p className="text-slate-400">Record your attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-4xl font-mono">{formatTime(currentTime)}</CardTitle>
            <CardDescription className="text-slate-400 text-lg">{formatDate(currentTime)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : ''}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-24 text-lg"
                onClick={handleClockIn}
                disabled={isLoading || !!todayLog?.clock_in}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-6 w-6 mr-2" />
                    Clock In
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-24 text-lg border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={handleClockOut}
                disabled={isLoading || !todayLog?.clock_in || !!todayLog?.clock_out}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-6 w-6 mr-2" />
                    Clock Out
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Today's Status</CardTitle>
            <CardDescription className="text-slate-400">Your attendance for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${todayLog?.clock_in ? 'bg-green-500/20' : 'bg-slate-600'}`}>
                  <LogIn className={`h-5 w-5 ${todayLog?.clock_in ? 'text-green-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">Clock In</p>
                  <p className="text-sm text-slate-400">Start of work</p>
                </div>
              </div>
              <div className="text-right">
                {todayLog?.clock_in ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-white font-mono">{todayLog.clock_in}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Not recorded</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${todayLog?.clock_out ? 'bg-green-500/20' : 'bg-slate-600'}`}>
                  <LogOut className={`h-5 w-5 ${todayLog?.clock_out ? 'text-green-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">Clock Out</p>
                  <p className="text-sm text-slate-400">End of work</p>
                </div>
              </div>
              <div className="text-right">
                {todayLog?.clock_out ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-white font-mono">{todayLog.clock_out}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Not recorded</span>
                )}
              </div>
            </div>

            {todayLog?.clock_in && todayLog?.clock_out && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-primary text-center font-medium">Work day completed!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
