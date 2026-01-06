<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoleAuditLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use ApiResponse;

    /**
     * Get the current user's highest priority hierarchy level (lowest number = highest priority).
     * Admin users (hierarchy_level = 1) have the highest priority.
     */
    protected function getUserHierarchyLevel(): int
    {
        $user = auth()->user();
        $userRoles = $user->roles;

        if ($userRoles->isEmpty()) {
            return 99; // Lowest priority if no roles
        }

        return $userRoles->min('hierarchy_level') ?? 99;
    }

    /**
     * Check if the current user can manage a role based on hierarchy.
     * Users can only manage roles with equal or lower priority (higher hierarchy_level).
     */
    protected function canManageRole(Role $role): bool
    {
        $userLevel = $this->getUserHierarchyLevel();

        // Admin (level 1) can manage all roles
        if ($userLevel === 1) {
            return true;
        }

        // Users can only manage roles with lower priority (higher hierarchy_level)
        return $role->hierarchy_level > $userLevel;
    }

    /**
     * Check if the current user can create/edit a role with the given hierarchy level.
     */
    protected function canSetHierarchyLevel(int $targetLevel): bool
    {
        $userLevel = $this->getUserHierarchyLevel();

        // Admin (level 1) can set any hierarchy level
        if ($userLevel === 1) {
            return true;
        }

        // Users can only create/edit roles with lower priority (higher hierarchy_level)
        return $targetLevel > $userLevel;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Role::query()
            ->withCount(['permissions']);

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $roles = $query->orderBy('hierarchy_level')->orderBy('name')->get();

        $roles->each(function ($role) {
            $role->users_count = \App\Models\User::role($role->name)->count();
        });

        return $this->success($roles, 'Roles retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'hierarchy_level' => 'nullable|integer|min:1|max:99',
        ]);

        $targetLevel = $validated['hierarchy_level'] ?? 99;

        // Hierarchy enforcement: prevent creating roles with higher priority than user's own
        if (! $this->canSetHierarchyLevel($targetLevel)) {
            return $this->error('You cannot create a role with higher priority than your own role', 403);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'is_system' => false,
            'hierarchy_level' => $targetLevel,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
        ]);

        RoleAuditLog::log(
            auth()->id(),
            'role_created',
            Role::class,
            $role->id,
            null,
            $role->toArray()
        );

        return $this->created($role->load('permissions'), 'Role created successfully');
    }

    public function show(int $id): JsonResponse
    {
        $role = Role::with(['permissions'])->findOrFail($id);
        $role->users_count = \App\Models\User::role($role->name)->count();

        return $this->success($role, 'Role retrieved successfully');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Hierarchy enforcement: prevent editing roles with higher priority than user's own
        if (! $this->canManageRole($role)) {
            return $this->error('You cannot edit a role with higher priority than your own role', 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,'.$id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'hierarchy_level' => 'nullable|integer|min:1|max:99',
        ]);

        // Hierarchy enforcement: prevent setting hierarchy level higher than user's own
        $targetLevel = $validated['hierarchy_level'] ?? $role->hierarchy_level;
        if (! $this->canSetHierarchyLevel($targetLevel)) {
            return $this->error('You cannot set a hierarchy level higher than your own role', 403);
        }

        $oldValues = $role->toArray();

        if ($role->is_system && isset($validated['name']) && $validated['name'] !== $role->name) {
            return $this->error('Cannot rename system roles', 403);
        }

        $role->update([
            'name' => $validated['name'] ?? $role->name,
            'description' => $validated['description'] ?? $role->description,
            'icon' => $validated['icon'] ?? $role->icon,
            'hierarchy_level' => $targetLevel,
        ]);

        RoleAuditLog::log(
            auth()->id(),
            'role_updated',
            Role::class,
            $role->id,
            $oldValues,
            $role->toArray()
        );

        return $this->success($role->load('permissions'), 'Role updated successfully');
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Hierarchy enforcement: prevent deleting roles with higher priority than user's own
        if (! $this->canManageRole($role)) {
            return $this->error('You cannot delete a role with higher priority than your own role', 403);
        }

        if ($role->is_system) {
            return $this->error('Cannot delete system roles', 403);
        }

        $oldValues = $role->toArray();

        RoleAuditLog::log(
            auth()->id(),
            'role_deleted',
            Role::class,
            $role->id,
            $oldValues,
            null
        );

        $role->delete();

        return $this->success(null, 'Role deleted successfully');
    }

    public function syncPermissions(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Hierarchy enforcement: prevent modifying permissions of roles with higher priority
        if (! $this->canManageRole($role)) {
            return $this->error('You cannot modify permissions of a role with higher priority than your own role', 403);
        }

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // Hierarchy enforcement: non-admin users can only grant permissions they possess
        $userLevel = $this->getUserHierarchyLevel();
        if ($userLevel !== 1) {
            $userPermissions = auth()->user()->getAllPermissions()->pluck('name')->toArray();
            $requestedPermissions = $validated['permissions'];
            $unauthorizedPermissions = array_diff($requestedPermissions, $userPermissions);

            if (! empty($unauthorizedPermissions)) {
                return $this->error(
                    'You cannot grant permissions you do not possess: '.implode(', ', $unauthorizedPermissions),
                    403
                );
            }
        }

        $oldPermissions = $role->permissions->pluck('name')->toArray();

        $role->syncPermissions($validated['permissions']);

        RoleAuditLog::log(
            auth()->id(),
            'permissions_synced',
            Role::class,
            $role->id,
            ['permissions' => $oldPermissions],
            ['permissions' => $validated['permissions']]
        );

        return $this->success($role->load('permissions'), 'Permissions synced successfully');
    }

    public function getPermissions(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        return $this->success($role->permissions, 'Role permissions retrieved successfully');
    }

    /**
     * Get role inventory with detailed metrics for governance dashboard.
     * Shows all roles with users_count, permissions_count, is_system, hierarchy_level, and timestamps.
     */
    public function inventory(): JsonResponse
    {
        $roles = Role::query()
            ->withCount(['permissions'])
            ->orderBy('hierarchy_level')
            ->orderBy('name')
            ->get();

        $roles->each(function ($role) {
            $role->users_count = \App\Models\User::role($role->name)->count();
        });

        $inventory = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'icon' => $role->icon,
                'hierarchy_level' => $role->hierarchy_level,
                'is_system' => $role->is_system,
                'users_count' => $role->users_count,
                'permissions_count' => $role->permissions_count,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return $this->success($inventory, 'Role inventory retrieved successfully');
    }

    /**
     * Get role health metrics for governance dashboard.
     * Shows unused roles, overprivileged roles, and orphan permissions.
     */
    public function healthMetrics(): JsonResponse
    {
        $roles = Role::query()
            ->withCount(['permissions'])
            ->get();

        $roles->each(function ($role) {
            $role->users_count = \App\Models\User::role($role->name)->count();
        });

        // Unused roles: roles with 0 users assigned (excluding system roles)
        $unusedRoles = $roles->filter(function ($role) {
            return $role->users_count === 0 && ! $role->is_system;
        })->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions_count' => $role->permissions_count,
                'created_at' => $role->created_at,
            ];
        })->values();

        // Overprivileged roles: non-admin roles with more than 50 permissions
        $overprivilegedThreshold = 50;
        $overprivilegedRoles = $roles->filter(function ($role) use ($overprivilegedThreshold) {
            return $role->hierarchy_level > 1 && $role->permissions_count > $overprivilegedThreshold;
        })->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'hierarchy_level' => $role->hierarchy_level,
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
            ];
        })->values();

        // Get all permissions
        $allPermissions = \Spatie\Permission\Models\Permission::all();

        // Orphan permissions: permissions not assigned to any role
        $orphanPermissions = $allPermissions->filter(function ($permission) {
            return $permission->roles->isEmpty();
        })->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'created_at' => $permission->created_at,
            ];
        })->values();

        // Role distribution by hierarchy level
        $roleDistribution = $roles->groupBy('hierarchy_level')->map(function ($group, $level) {
            return [
                'hierarchy_level' => $level,
                'count' => $group->count(),
                'total_users' => $group->sum('users_count'),
            ];
        })->values();

        // Summary statistics
        $summary = [
            'total_roles' => $roles->count(),
            'system_roles' => $roles->where('is_system', true)->count(),
            'custom_roles' => $roles->where('is_system', false)->count(),
            'total_permissions' => $allPermissions->count(),
            'unused_roles_count' => $unusedRoles->count(),
            'overprivileged_roles_count' => $overprivilegedRoles->count(),
            'orphan_permissions_count' => $orphanPermissions->count(),
        ];

        return $this->success([
            'summary' => $summary,
            'unused_roles' => $unusedRoles,
            'overprivileged_roles' => $overprivilegedRoles,
            'orphan_permissions' => $orphanPermissions,
            'role_distribution' => $roleDistribution,
        ], 'Role health metrics retrieved successfully');
    }

    /**
     * Get recent role audit logs for governance dashboard.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 20);

        $logs = RoleAuditLog::with(['user'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return $this->success([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ], 'Role audit logs retrieved successfully');
    }
}
