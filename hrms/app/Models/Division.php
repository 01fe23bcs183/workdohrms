<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'office_location_id',
        'notes',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the office location this division belongs to.
     */
    public function officeLocation()
    {
        return $this->belongsTo(OfficeLocation::class);
    }

    /**
     * Get the author who created this division.
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Get job titles in this division.
     */
    public function jobTitles()
    {
        return $this->hasMany(JobTitle::class);
    }

    /**
     * Scope to filter active divisions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by office location.
     */
    public function scopeForLocation($query, $locationId)
    {
        return $query->where('office_location_id', $locationId);
    }
}
