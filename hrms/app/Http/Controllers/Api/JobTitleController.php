<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobTitle;
use Illuminate\Http\Request;

class JobTitleController extends Controller
{
    /**
     * Display a listing of job titles.
     */
    public function index(Request $request)
    {
        $query = JobTitle::with(['division.officeLocation', 'author']);

        // Filter by division
        if ($request->filled('division_id')) {
            $query->forDivision($request->division_id);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $jobTitles = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $jobTitles,
        ]);
    }

    /**
     * Store a newly created job title.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        
        $jobTitle = JobTitle::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Job title created successfully',
            'data' => $jobTitle->load(['division.officeLocation', 'author']),
        ], 201);
    }

    /**
     * Display the specified job title.
     */
    public function show(JobTitle $jobTitle)
    {
        return response()->json([
            'success' => true,
            'data' => $jobTitle->load(['division.officeLocation', 'author']),
        ]);
    }

    /**
     * Update the specified job title.
     */
    public function update(Request $request, JobTitle $jobTitle)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'division_id' => 'sometimes|required|exists:divisions,id',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $jobTitle->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Job title updated successfully',
            'data' => $jobTitle->fresh(['division.officeLocation', 'author']),
        ]);
    }

    /**
     * Remove the specified job title.
     */
    public function destroy(JobTitle $jobTitle)
    {
        $jobTitle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job title deleted successfully',
        ]);
    }

    /**
     * Fetch job titles by division (for cascading dropdown).
     */
    public function fetchByDivision(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
        ]);

        $jobTitles = JobTitle::active()
            ->forDivision($request->division_id)
            ->select('id', 'title')
            ->orderBy('title')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jobTitles,
        ]);
    }
}
