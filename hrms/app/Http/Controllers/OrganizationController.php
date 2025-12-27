<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\OrganizationService;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Validator;

class OrganizationController extends Controller
{
    protected $orgService;

    public function __construct(OrganizationService $orgService)
    {
        $this->orgService = $orgService;
    }

    /**
     * List all Organizations
     */
    public function index()
    {
        try {
            $organizations = $this->orgService->getAllOrganizations();
            return response()->json([
                'success' => true,
                'data' => $organizations
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created Organization.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organization = $this->orgService->createOrganization($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Organization created successfully',
                'data' => $organization
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Organization Details
     */
    public function show($id)
    {
        try {
            $organization = $this->orgService->getOrganization($id);
            if (!$organization) {
                return response()->json(['success' => false, 'message' => 'Organization not found'], 404);
            }
            return response()->json(['success' => true, 'data' => $organization]);
        } catch (Exception $e) {
             return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Organization
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
             return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organization = $this->orgService->updateOrganization($id, $request->all());
            return response()->json([
                'success' => true,
                'message' => 'Organization updated successfully',
                'data' => $organization
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete Organization
     */
    public function destroy($id)
    {
        try {
            $this->orgService->deleteOrganization($id);
            return response()->json([
                'success' => true,
                'message' => 'Organization deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
