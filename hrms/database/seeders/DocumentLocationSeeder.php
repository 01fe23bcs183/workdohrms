<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentLocation;
// We intentionally do NOT seed configurations here.
// The user wants to manage config (keys/paths) purely via API/Controller.

class DocumentLocationSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Local
        DocumentLocation::firstOrCreate(
            ['slug' => 'local'],
            ['name' => 'Local Storage', 'is_active' => true]
        );

        // 2. Wasabi
        DocumentLocation::firstOrCreate(
            ['slug' => 'wasabi'],
            ['name' => 'Wasabi Storage', 'is_active' => true]
        );

        // 3. AWS
        DocumentLocation::firstOrCreate(
            ['slug' => 'aws'],
            ['name' => 'AWS S3', 'is_active' => true]
        );
    }
}
