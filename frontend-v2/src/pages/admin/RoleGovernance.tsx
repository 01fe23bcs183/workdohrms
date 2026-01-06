import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Shield,
  Users,
  Key,
  Lock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface RoleInventoryItem {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  hierarchy_level: number;
  is_system: boolean;
  users_count: number;
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

interface HealthMetrics {
  summary: {
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    total_permissions: number;
    unused_roles_count: number;
    overprivileged_roles_count: number;
    orphan_permissions_count: number;
  };
  unused_roles: Array<{
    id: number;
    name: string;
    permissions_count: number;
    created_at: string;
  }>;
  overprivileged_roles: Array<{
    id: number;
    name: string;
    hierarchy_level: number;
    permissions_count: number;
    users_count: number;
  }>;
  orphan_permissions: Array<{
    id: number;
    name: string;
    created_at: string;
  }>;
  role_distribution: Array<{
    hierarchy_level: number;
    count: number;
    total_users: number;
  }>;
}

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  role_name: string;
  details: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function RoleGovernance() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<RoleInventoryItem[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'health' | 'audit'>('overview');

  useEffect(() => {
    fetchInventory();
    fetchHealthMetrics();
    fetchAuditLogs();
  }, []);

  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const response = await roleService.getInventory();
      setInventory(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch role inventory:', error);
      showAlert('error', 'Error', 'Failed to fetch role inventory');
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const fetchHealthMetrics = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await roleService.getHealthMetrics();
      setHealthMetrics(response.data.data || null);
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
      showAlert('error', 'Error', 'Failed to fetch health metrics');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await roleService.getAuditLogs({ per_page: 10 });
      setAuditLogs(response.data.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      showAlert('error', 'Error', 'Failed to fetch audit logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const refreshAll = () => {
    fetchInventory();
    fetchHealthMetrics();
    fetchAuditLogs();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-solarized-red/10 text-solarized-red',
      organisation: 'bg-solarized-orange/10 text-solarized-orange',
      company: 'bg-solarized-yellow/10 text-solarized-yellow',
      hr: 'bg-solarized-blue/10 text-solarized-blue',
      staff: 'bg-solarized-green/10 text-solarized-green',
    };
    return colors[role] || 'bg-solarized-violet/10 text-solarized-violet';
  };

  const getHealthScore = () => {
    if (!healthMetrics) return 0;
    const { summary } = healthMetrics;
    let score = 100;
    if (summary.unused_roles_count > 0) score -= summary.unused_roles_count * 5;
    if (summary.overprivileged_roles_count > 0) score -= summary.overprivileged_roles_count * 10;
    if (summary.orphan_permissions_count > 0) score -= Math.min(summary.orphan_permissions_count, 10);
    return Math.max(0, score);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-solarized-green';
    if (score >= 60) return 'text-solarized-yellow';
    return 'text-solarized-red';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Roles</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {healthMetrics?.summary.total_roles || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-violet/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-solarized-violet" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Permissions</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {healthMetrics?.summary.total_permissions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Health Score</p>
                <p className={`text-xl font-bold ${getHealthScoreColor(getHealthScore())}`}>
                  {getHealthScore()}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-orange/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-solarized-orange" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Issues Found</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {(healthMetrics?.summary.unused_roles_count || 0) +
                    (healthMetrics?.summary.overprivileged_roles_count || 0) +
                    (healthMetrics?.summary.orphan_permissions_count || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-solarized-orange" />
              Unused Roles
            </CardTitle>
            <CardDescription>
              Custom roles with no users assigned (candidates for removal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHealth ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : healthMetrics?.unused_roles.length === 0 ? (
              <p className="text-solarized-base01 text-sm">No unused roles found</p>
            ) : (
              <div className="space-y-2">
                {healthMetrics?.unused_roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-2 bg-solarized-base3 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(role.name)}>
                        {role.name.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-solarized-base01">
                        {role.permissions_count} permissions
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/roles/${role.id}/permissions`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-solarized-red" />
              Overprivileged Roles
            </CardTitle>
            <CardDescription>
              Non-admin roles with excessive permissions (more than 50)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHealth ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : healthMetrics?.overprivileged_roles.length === 0 ? (
              <p className="text-solarized-base01 text-sm">No overprivileged roles found</p>
            ) : (
              <div className="space-y-2">
                {healthMetrics?.overprivileged_roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-2 bg-solarized-base3 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(role.name)}>
                        {role.name.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-solarized-base01">
                        {role.permissions_count} permissions, {role.users_count} users
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/roles/${role.id}/permissions`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-solarized-blue" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest role management actions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-solarized-base01 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-solarized-base3 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm text-solarized-base02">
                      {log.role_name}
                    </span>
                    {log.user && (
                      <span className="text-xs text-solarized-base01">
                        by {log.user.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-solarized-base01">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderInventory = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Role Inventory</CardTitle>
        <CardDescription>
          Complete list of all roles with detailed metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingInventory ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No roles found</h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge className={getRoleBadgeColor(role.name)}>
                        {role.name.replace('_', ' ')}
                      </Badge>
                      {role.description && (
                        <span className="text-xs text-solarized-base01 mt-1 max-w-xs truncate">
                          {role.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{role.hierarchy_level}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Key className="h-4 w-4 text-solarized-violet" />
                      {role.permissions_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-solarized-blue" />
                      {role.users_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge
                        variant="outline"
                        className="bg-solarized-red/10 text-solarized-red border-solarized-red/20"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        System
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-solarized-green/10 text-solarized-green border-solarized-green/20"
                      >
                        Custom
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-solarized-base01">
                      {formatDate(role.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/roles/${role.id}/permissions`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderHealth = () => (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-red/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-solarized-red" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">System Roles</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {healthMetrics?.summary.system_roles || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Custom Roles</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {healthMetrics?.summary.custom_roles || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-orange/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-solarized-orange" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Unused Roles</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {healthMetrics?.summary.unused_roles_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Orphan Permissions</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {healthMetrics?.summary.orphan_permissions_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Role Distribution by Hierarchy Level</CardTitle>
          <CardDescription>
            How roles and users are distributed across hierarchy levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHealth ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hierarchy Level</TableHead>
                  <TableHead>Roles Count</TableHead>
                  <TableHead>Total Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthMetrics?.role_distribution.map((dist) => (
                  <TableRow key={dist.hierarchy_level}>
                    <TableCell>
                      <span className="font-mono">{dist.hierarchy_level}</span>
                    </TableCell>
                    <TableCell>{dist.count}</TableCell>
                    <TableCell>{dist.total_users}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {healthMetrics && healthMetrics.orphan_permissions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-solarized-yellow" />
              Orphan Permissions
            </CardTitle>
            <CardDescription>
              Permissions not assigned to any role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {healthMetrics.orphan_permissions.map((perm) => (
                <Badge key={perm.id} variant="outline">
                  {perm.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAudit = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Audit Logs</CardTitle>
        <CardDescription>
          Complete history of role management actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingLogs ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No audit logs</h3>
            <p className="text-solarized-base01 mt-1">
              Role management actions will appear here
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(log.role_name)}>
                      {log.role_name.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <span className="text-sm">{log.user.name}</span>
                    ) : (
                      <span className="text-sm text-solarized-base01">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-solarized-base01 max-w-xs truncate block">
                      {log.details || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-solarized-base01">
                      {formatDate(log.created_at)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Role Governance</h1>
          <p className="text-solarized-base01">
            Monitor role health, track usage, and manage role lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="bg-solarized-blue hover:bg-solarized-blue/90"
            onClick={() => navigate('/admin/roles')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Manage Roles
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-solarized-base2">
        {(['overview', 'inventory', 'health', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-solarized-blue text-solarized-blue'
                : 'border-transparent text-solarized-base01 hover:text-solarized-base02'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'inventory' && renderInventory()}
      {activeTab === 'health' && renderHealth()}
      {activeTab === 'audit' && renderAudit()}
    </div>
  );
}
