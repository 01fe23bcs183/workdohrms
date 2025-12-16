<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AccessController;
use App\Http\Controllers\Api\OfficeLocationController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\JobTitleController;
use App\Http\Controllers\Api\FileCategoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/sign-up', [AccessController::class, 'signUp']);
    Route::post('/sign-in', [AccessController::class, 'signIn']);
    Route::post('/forgot-password', [AccessController::class, 'forgotPassword']);
    Route::post('/reset-password', [AccessController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/sign-out', [AccessController::class, 'signOut']);
        Route::get('/profile', [AccessController::class, 'profile']);
    });

    // Organization Structure (Prompt Set 2)
    Route::apiResource('office-locations', OfficeLocationController::class);
    Route::apiResource('divisions', DivisionController::class);
    Route::apiResource('job-titles', JobTitleController::class);
    Route::apiResource('file-categories', FileCategoryController::class);

    // AJAX endpoints for cascading dropdowns
    Route::post('/fetch-divisions', [DivisionController::class, 'fetchByLocation']);
    Route::post('/fetch-job-titles', [JobTitleController::class, 'fetchByDivision']);
});
