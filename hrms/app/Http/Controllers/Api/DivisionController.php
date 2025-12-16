<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    /**
     * Display a listing of divisions.
     */
    public function index(Request $request)
    {
        $query = Division::with(['officeLocation', 'author']);

        // Filter by office location
        if ($request->filled('office_location_id')) {
            $query->forLocation($request->office_location_id);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $divisions = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $divisions,
        ]);
    }

    /**
     * Store a newly created division.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'office_location_id' => 'required|exists:office_locations,id',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        
        $division = Division::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Division created successfully',
            'data' => $division->load(['officeLocation', 'author']),
        ], 201);
    }

    /**
     * Display the specified division.
     */
    public function show(Division $division)
    {
        return response()->json([
            'success' => true,
            'data' => $division->load(['officeLocation', 'author', 'jobTitles']),
        ]);
    }

    /**
     * Update the specified division.
     */
    public function update(Request $request, Division $division)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'office_location_id' => 'sometimes|required|exists:office_locations,id',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $division->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Division updated successfully',
            'data' => $division->fresh(['officeLocation', 'author']),
        ]);
    }

    /**
     * Remove the specified division.
     */
    public function destroy(Division $division)
    {
        // Check if division has job titles
        if ($division->jobTitles()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete division with existing job titles',
            ], 422);
        }

        $division->delete();

        return response()->json([
            'success' => true,
            'message' => 'Division deleted successfully',
        ]);
    }

    /**
     * Fetch divisions by office location (for cascading dropdown).
     */
    public function fetchByLocation(Request $request)
    {
        $request->validate([
            'office_location_id' => 'required|exists:office_locations,id',
        ]);

        $divisions = Division::active()
            ->forLocation($request->office_location_id)
            ->select('id', 'title')
            ->orderBy('title')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $divisions,
        ]);
    }
}
