<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoleAuditLog;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class UserRoleController extends Controller
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
     * Check if the current user can assign/remove a specific role based on hierarchy.
     * Users can only assign/remove roles with equal or lower priority (higher hierarchy_level).
     */
    protected function canAssignRole(string $roleName): bool
    {
        $userLevel = $this->getUserHierarchyLevel();

        // Admin (level 1) can assign any role
        if ($userLevel === 1) {
            return true;
        }

        $role = Role::where('name', $roleName)->first();
        if (! $role) {
            return false;
        }

        // Users can only assign roles with lower priority (higher hierarchy_level)
        return $role->hierarchy_level > $userLevel;
    }

    /**
     * Check if the current user can manage a target user based on hierarchy.
     * Users can only manage users whose highest role is lower priority than their own.
     */
    protected function canManageUser(User $targetUser): bool
    {
        $userLevel = $this->getUserHierarchyLevel();

        // Admin (level 1) can manage any user
        if ($userLevel === 1) {
            return true;
        }

        $targetUserRoles = $targetUser->roles;
        if ($targetUserRoles->isEmpty()) {
            return true; // Can manage users with no roles
        }

        $targetUserLevel = $targetUserRoles->min('hierarchy_level') ?? 99;

        // Users can only manage users with lower priority (higher hierarchy_level)
        return $targetUserLevel > $userLevel;
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        $users->getCollection()->transform(function ($user) {
            $primaryRole = $user->roles->sortBy('hierarchy_level')->first();
            $user->primary_role = $primaryRole ? $primaryRole->name : null;
            $user->primary_role_icon = $primaryRole ? $primaryRole->icon : null;
            $user->roles_list = $user->roles->pluck('name')->toArray();

            return $user;
        });

        return $this->success([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ], 'Users retrieved successfully');
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }])->findOrFail($id);

        $primaryRole = $user->roles->sortBy('hierarchy_level')->first();
        $user->primary_role = $primaryRole ? $primaryRole->name : null;
        $user->primary_role_icon = $primaryRole ? $primaryRole->icon : null;
        $user->roles_list = $user->roles->pluck('name')->toArray();
        $user->permissions_list = $user->getAllPermissions()->pluck('name')->toArray();

        return $this->success($user, 'User retrieved successfully');
    }

    public function getUserRoles(int $id): JsonResponse
    {
        $user = User::with(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }])->findOrFail($id);

        return $this->success($user->roles, 'User roles retrieved successfully');
    }

    public function assignRoles(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Hierarchy enforcement: prevent managing users with higher priority roles
        if (! $this->canManageUser($user)) {
            return $this->error('You cannot manage roles for a user with higher priority than your own role', 403);
        }

        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        // Hierarchy enforcement: check each role being assigned
        $unauthorizedRoles = [];
        foreach ($validated['roles'] as $roleName) {
            if (! $this->canAssignRole($roleName)) {
                $unauthorizedRoles[] = $roleName;
            }
        }

        if (! empty($unauthorizedRoles)) {
            return $this->error(
                'You cannot assign roles with higher priority than your own: '.implode(', ', $unauthorizedRoles),
                403
            );
        }

        $oldRoles = $user->roles->pluck('name')->toArray();

        $user->syncRoles($validated['roles']);

        RoleAuditLog::log(
            auth()->id(),
            'user_roles_assigned',
            User::class,
            $user->id,
            ['roles' => $oldRoles],
            ['roles' => $validated['roles']]
        );

        $user->load(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        $primaryRole = $user->roles->sortBy('hierarchy_level')->first();
        $user->primary_role = $primaryRole ? $primaryRole->name : null;
        $user->primary_role_icon = $primaryRole ? $primaryRole->icon : null;
        $user->roles_list = $user->roles->pluck('name')->toArray();

        return $this->success($user, 'Roles assigned successfully');
    }

    public function addRole(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Hierarchy enforcement: prevent managing users with higher priority roles
        if (! $this->canManageUser($user)) {
            return $this->error('You cannot manage roles for a user with higher priority than your own role', 403);
        }

        $validated = $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        // Hierarchy enforcement: check if user can assign this role
        if (! $this->canAssignRole($validated['role'])) {
            return $this->error('You cannot assign a role with higher priority than your own role', 403);
        }

        $oldRoles = $user->roles->pluck('name')->toArray();

        $user->assignRole($validated['role']);

        RoleAuditLog::log(
            auth()->id(),
            'user_role_added',
            User::class,
            $user->id,
            ['roles' => $oldRoles],
            ['roles' => $user->roles->pluck('name')->toArray()]
        );

        $user->load(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        return $this->success($user, 'Role added successfully');
    }

    public function removeRole(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Hierarchy enforcement: prevent managing users with higher priority roles
        if (! $this->canManageUser($user)) {
            return $this->error('You cannot manage roles for a user with higher priority than your own role', 403);
        }

        $validated = $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        // Hierarchy enforcement: check if user can remove this role
        if (! $this->canAssignRole($validated['role'])) {
            return $this->error('You cannot remove a role with higher priority than your own role', 403);
        }

        $oldRoles = $user->roles->pluck('name')->toArray();

        $user->removeRole($validated['role']);

        RoleAuditLog::log(
            auth()->id(),
            'user_role_removed',
            User::class,
            $user->id,
            ['roles' => $oldRoles],
            ['roles' => $user->roles->pluck('name')->toArray()]
        );

        $user->load(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        return $this->success($user, 'Role removed successfully');
    }
}
