import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { dashboardService, attendanceService } from '../api/services';

interface DashboardData {
  total_employees?: number;
  present_today?: number;
  on_leave?: number;
  pending_approvals?: number;
}

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await dashboardService.getStats();
      if (response.success && response.data) {
        // Map nested API response to flat structure for display
        const data = response.data as any;
        const employees = data.employees || {};
        const attendance = data.attendance || {};
        const leaveRequests = data.leave_requests || {};

        setDashboardData({
          total_employees: employees.total || 0,
          present_today: attendance.present || 0,
          on_leave: employees.on_leave || 0,
          pending_approvals: leaveRequests.pending || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const response = await attendanceService.clockIn();
      if (response.success) {
        setIsClockedIn(true);
        Alert.alert('Success', 'Clocked in successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      const response = await attendanceService.clockOut();
      if (response.success) {
        setIsClockedIn(false);
        Alert.alert('Success', 'Clocked out successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role_display}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.clockSection}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <View style={styles.clockButtons}>
          <TouchableOpacity
            style={[styles.clockButton, styles.clockInButton, isClockedIn && styles.clockButtonDisabled]}
            onPress={handleClockIn}
            disabled={isClockedIn || clockLoading}
          >
            {clockLoading && !isClockedIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.clockButtonText}>Clock In</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.clockButton, styles.clockOutButton, !isClockedIn && styles.clockButtonDisabled]}
            onPress={handleClockOut}
            disabled={!isClockedIn || clockLoading}
          >
            {clockLoading && isClockedIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.clockButtonText}>Clock Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.statValue, { color: '#1d4ed8' }]}>
              {dashboardData.total_employees ?? '-'}
            </Text>
            <Text style={styles.statLabel}>Total Employees</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.statValue, { color: '#15803d' }]}>
              {dashboardData.present_today ?? '-'}
            </Text>
            <Text style={styles.statLabel}>Present Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.statValue, { color: '#b45309' }]}>
              {dashboardData.on_leave ?? '-'}
            </Text>
            <Text style={styles.statLabel}>On Leave</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fce7f3' }]}>
            <Text style={[styles.statValue, { color: '#be185d' }]}>
              {dashboardData.pending_approvals ?? '-'}
            </Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2563eb',
  },
  greeting: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  clockSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  clockButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clockButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clockInButton: {
    backgroundColor: '#22c55e',
  },
  clockOutButton: {
    backgroundColor: '#ef4444',
  },
  clockButtonDisabled: {
    opacity: 0.5,
  },
  clockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
