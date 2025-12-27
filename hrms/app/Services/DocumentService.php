<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLocation;
use App\Models\DocumentType;
use App\Enums\DocumentOwnerType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Exception;
use Illuminate\Support\Str;

class DocumentService
{
    /**
     * Upload a document to the configured storage location.
     */
    public function uploadDocument(UploadedFile $file, array $data): Document
    {
        // 1. Determine Location (Default to Local if not specified or active)
        $locationSlug = $data['location'] ?? 'local';
        $location = DocumentLocation::where('slug', $locationSlug)->where('is_active', true)->first();

        if (!$location) {
            // Fallback to local if requested location isn't active
            $location = DocumentLocation::where('slug', 'local')->firstOrFail();
        }

        // 2. Prepare Storage Disk Dynamically
        $diskName = $this->configureDisk($location);

        // 3. Generate File Path
        // path: {owner_type}/{owner_id}/{year}/{filename}
        $ownerType = $data['owner_type']; // enum value
        $ownerId = $data['owner_id'];
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        $path = "{$ownerType}/{$ownerId}/" . date('Y');
        
        // 4. Store File
        $storagePath = Storage::disk($diskName)->putFileAs($path, $file, $filename);

        if (!$storagePath) {
            throw new Exception("Failed to upload file to {$location->name}.");
        }

        // 5. Get URL (depends on visibility)
        // For private docs, we might not want a public URL immediately, but for now:
        $url = Storage::disk($diskName)->url($storagePath);

        // 6. Save to Database
        return Document::create([
            'document_type_id' => $data['document_type_id'],
            'document_location_id' => $location->id,
            'org_id' => $data['org_id'] ?? null,
            'company_id' => $data['company_id'] ?? null,
            'user_id' => auth()->id(), // Uploader
            'owner_type' => $ownerType,
            'owner_id' => $ownerId,
            'doc_url' => $storagePath, // Store relative path for portability
            'document_name' => $data['document_name'] ?? $file->getClientOriginalName(),
            'document_size' => $file->getSize(),
            'document_extension' => $extension,
            'mime_type' => $file->getMimeType(),
        ]);
    }

    /**
     * Configure Laravel filesystem disk dynamically based on DB config.
     */
    protected function configureDisk(DocumentLocation $location): string
    {
        $diskName = 'dynamic_disk_' . $location->slug;

        if ($location->slug === 'local') {
            $config = $location->localConfig;
            if (!$config) throw new Exception("Local configuration not found.");

            // We use the 'public' disk but separate root or just standard public
            // For simplicity, we stick to standard 'public' or separate 'local' disk
            // If custom root is needed:
            // Config::set("filesystems.disks.{$diskName}", [ ... ]);
            return 'public'; // Using standard public disk for local for now
        }

        if ($location->slug === 'wasabi') {
            $config = $location->wasabiConfig;
            if (!$config) throw new Exception("Wasabi configuration not found.");

            Config::set("filesystems.disks.{$diskName}", [
                'driver' => 's3',
                'key' => $config->access_key,
                'secret' => $config->secret_key,
                'region' => $config->region,
                'bucket' => $config->bucket,
                'endpoint' => $config->endpoint,
                'visibility' => 'public', // or private
            ]);
            return $diskName;
        }

        if ($location->slug === 'aws') {
            $config = $location->awsConfig;
            if (!$config) throw new Exception("AWS configuration not found.");

            Config::set("filesystems.disks.{$diskName}", [
                'driver' => 's3',
                'key' => $config->access_key,
                'secret' => $config->secret_key,
                'region' => $config->region,
                'bucket' => $config->bucket,
                'visibility' => 'private',
            ]);
            return $diskName;
        }

        throw new Exception("Unsupported storage location: {$location->slug}");
    }

    /**
     * Get a temporary URL for downloading/viewing
     */
    public function getDocumentUrl(Document $document): string
    {
        $location = $document->location;
        $diskName = $this->configureDisk($location);

        // If local public
        if ($location->slug === 'local') {
            return Storage::disk('public')->url($document->doc_url);
        }

        // If S3/Wasabi (presigned url for specific time)
        return Storage::disk($diskName)->temporaryUrl(
            $document->doc_url, now()->addMinutes(60)
        );
    }
}
