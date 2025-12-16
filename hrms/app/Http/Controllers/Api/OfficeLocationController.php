<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfficeLocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OfficeLocationController extends Controller
{
    /**
     * Display a listing of office locations.
     */
    public function index(Request $request)
    {
        $query = OfficeLocation::with('author');

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $locations = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
    }

    /**
     * Store a newly created office location.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        
        $location = OfficeLocation::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Office location created successfully',
            'data' => $location->load('author'),
        ], 201);
    }

    /**
     * Display the specified office location.
     */
    public function show(OfficeLocation $officeLocation)
    {
        return response()->json([
            'success' => true,
            'data' => $officeLocation->load(['author', 'divisions']),
        ]);
    }

    /**
     * Update the specified office location.
     */
    public function update(Request $request, OfficeLocation $officeLocation)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        $officeLocation->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Office location updated successfully',
            'data' => $officeLocation->fresh(['author']),
        ]);
    }

    /**
     * Remove the specified office location.
     */
    public function destroy(OfficeLocation $officeLocation)
    {
        // Check if location has divisions
        if ($officeLocation->divisions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete location with existing divisions',
            ], 422);
        }

        $officeLocation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Office location deleted successfully',
        ]);
    }
}
