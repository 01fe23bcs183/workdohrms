<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffMemberResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'staff_code' => $this->staff_code,
            'full_name' => $this->full_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'personal_email' => $this->personal_email,
            'phone_number' => $this->phone_number,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            
            // Employment
            'employment_status' => $this->employment_status,
            'employment_type' => $this->employment_type,
            'hire_date' => $this->hire_date?->toDateString(),
            'base_salary' => (float) $this->base_salary,
            
            // Relationships
            'office_location' => $this->whenLoaded('officeLocation', function () {
                return [
                    'id' => $this->officeLocation->id,
                    'title' => $this->officeLocation->title,
                ];
            }),
            'division' => $this->whenLoaded('division', function () {
                return [
                    'id' => $this->division->id,
                    'title' => $this->division->title,
                ];
            }),
            'job_title' => $this->whenLoaded('jobTitle', function () {
                return [
                    'id' => $this->jobTitle->id,
                    'title' => $this->jobTitle->title,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'email' => $this->user->email,
                    'is_active' => $this->user->is_active,
                ];
            }),
            
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
