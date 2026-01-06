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
}
