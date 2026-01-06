<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    private array $legacyToCanonical = [
        'administrator' => 'admin',
        'hr_officer' => 'hr',
        'manager' => 'company',
        'staff_member' => 'staff',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->legacyToCanonical as $legacyName => $canonicalName) {
            $legacyRole = DB::table('roles')->where('name', $legacyName)->first();
            $canonicalRole = DB::table('roles')->where('name', $canonicalName)->first();

            if (! $legacyRole || ! $canonicalRole) {
                continue;
            }

            $usersWithLegacyRole = DB::table('model_has_roles')
                ->where('role_id', $legacyRole->id)
                ->where('model_type', 'App\\Models\\User')
                ->get();

            foreach ($usersWithLegacyRole as $assignment) {
                $hasCanonicalRole = DB::table('model_has_roles')
                    ->where('role_id', $canonicalRole->id)
                    ->where('model_id', $assignment->model_id)
                    ->where('model_type', 'App\\Models\\User')
                    ->exists();

                if (! $hasCanonicalRole) {
                    DB::table('model_has_roles')->insert([
                        'role_id' => $canonicalRole->id,
                        'model_id' => $assignment->model_id,
                        'model_type' => 'App\\Models\\User',
                    ]);
                }

                DB::table('model_has_roles')
                    ->where('role_id', $legacyRole->id)
                    ->where('model_id', $assignment->model_id)
                    ->where('model_type', 'App\\Models\\User')
                    ->delete();

                Log::info("Migrated user {$assignment->model_id} from {$legacyName} to {$canonicalName}");
            }

            DB::table('role_has_permissions')->where('role_id', $legacyRole->id)->delete();
            DB::table('roles')->where('id', $legacyRole->id)->delete();

            Log::info("Deleted legacy role: {$legacyName}");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Log::warning('Legacy role consolidation cannot be automatically reversed. Manual intervention required.');
    }
};
