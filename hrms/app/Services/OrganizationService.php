<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Company;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class OrganizationService
{
    // ==========================
    // Organization Logic
    // ==========================

    /**
     * Get all Organizations
     */
    public function getAllOrganizations(): Collection
    {
        return Organization::withCount('companies')->latest()->get();
    }

    /**
     * Create a new Organization
     */
    public function createOrganization(array $data): Organization
    {
        return DB::transaction(function () use ($data) {
            return Organization::create([
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
            ]);
        });
    }

    /**
     * Get Organization Details
     */
    public function getOrganization(int $id): ?Organization
    {
        return Organization::with('companies')->find($id);
    }

    /**
     * Update Organization
     */
    public function updateOrganization(int $id, array $data): Organization
    {
        $org = Organization::findOrFail($id);
        
        $org->update([
            'name' => $data['name'] ?? $org->name,
            'address' => $data['address'] ?? $org->address,
        ]);

        return $org;
    }

    /**
     * Delete Organization
     */
    public function deleteOrganization(int $id): bool
    {
        $org = Organization::findOrFail($id);
        return $org->delete();
    }

    // ==========================
    // Company Logic
    // ==========================

    /**
     * Get all Companies (optionally filtered by Org)
     */
    public function getAllCompanies(?int $orgId = null): Collection
    {
        $query = Company::with('organization');

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        return $query->latest()->get();
    }

    /**
     * Create a new Company under an Organization
     */
    public function createCompany(array $data): Company
    {
        return DB::transaction(function () use ($data) {
            // Validate Organization exists
            $org = Organization::findOrFail($data['org_id']);

            return Company::create([
                'org_id' => $org->id,
                'company_name' => $data['company_name'], // DB column is company_name
                'address' => $data['address'] ?? null,
            ]);
        });
    }

    /**
     * Get Company Details
     */
    public function getCompany(int $id): ?Company
    {
        return Company::with('organization')->find($id);
    }

    /**
     * Update Company
     */
    public function updateCompany(int $id, array $data): Company
    {
        $company = Company::findOrFail($id);

        $company->update([
            'company_name' => $data['company_name'] ?? $company->company_name,
            'address' => $data['address'] ?? $company->address,
            'org_id' => $data['org_id'] ?? $company->org_id,
        ]);

        return $company;
    }

    /**
     * Delete Company
     */
    public function deleteCompany(int $id): bool
    {
        $company = Company::findOrFail($id);
        return $company->delete();
    }
}
