<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLocation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Exception;

class DocumentService
{
    /**
     * Store document primarily based on explicit location type
     */
    public function storeDocument(UploadedFile $file, array $data, string $storageType = 'local'): Document
    {
        // 1. Get Location Entity
        $location = DocumentLocation::where('slug', $storageType)->firstOrFail();
        
        // 2. Configure Dynamic Disk
        $diskName = $this->configureDisk($location);

        // 3. Generate Path
        $ownerType = $data['owner_type']; 
        $ownerId = $data['owner_id'];
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        $path = "{$ownerType}/{$ownerId}/" . date('Y');

        // 4. Upload
        try {
            $storagePath = Storage::disk($diskName)->putFileAs($path, $file, $filename);
        } catch (\Exception $e) {
            throw new Exception("Storage Error: " . $e->getMessage());
        }

        if (!$storagePath) throw new Exception("Failed to upload to {$storageType}");

        // 5. Save Metadata
        return Document::create([
            'document_type_id' => $data['document_type_id'],
            'document_location_id' => $location->id,
            'org_id' => $data['org_id'] ?? null,
            'company_id' => $data['company_id'] ?? null,
            'user_id' => auth()->id(),
            'owner_type' => $ownerType,
            'owner_id' => $ownerId,
            'doc_url' => $storagePath,
            'document_name' => $data['document_name'] ?? $file->getClientOriginalName(),
            'document_size' => $file->getSize(),
            'document_extension' => $extension,
            'mime_type' => $file->getMimeType(),
        ]);
    }

    /**
     * Get Document Logic
     */
    public function getDocument(int $id): ?Document
    {
        return Document::with(['location', 'type', 'uploader', 'organization', 'company'])->find($id);
    }
    
    /**
     * Get All Documents Logic
     */
    public function getAllDocuments(): \Illuminate\Database\Eloquent\Collection
    {
        return Document::with(['location', 'type'])->latest()->get();
    }

    /**
     * Update Document Metadata (File replacement is complex, usually a new upload)
     */
    public function updateDocumentMetadata(int $id, array $data): Document
    {
        $document = Document::findOrFail($id);
        $document->update([
            'document_name' => $data['document_name'] ?? $document->document_name,
            'document_type_id' => $data['document_type_id'] ?? $document->document_type_id,
        ]);
        return $document;
    }

    /**
     * Delete Document
     */
    public function deleteDocument(int $id): bool
    {
        $document = Document::findOrFail($id);
        $location = $document->location;
        
        // Configure disk to delete file
        $diskName = $this->configureDisk($location);
        
        if (Storage::disk($diskName)->exists($document->doc_url)) {
            Storage::disk($diskName)->delete($document->doc_url);
        }

        return $document->delete();
    }

    /**
     * Get View/Download URL
     */
    public function getDocumentUrl(Document $document): string
    {
        $location = $document->location;
        $diskName = $this->configureDisk($location);

        if ($location->slug === 'local') {
            return Storage::disk('public')->url($document->doc_url);
        }

        // S3/Wasabi Presigned
        return Storage::disk($diskName)->temporaryUrl(
            $document->doc_url, now()->addMinutes(60)
        );
    }

    /**
     * Configure Dynamic Disk
     */
    protected function configureDisk(DocumentLocation $location): string
    {
        $diskName = 'dynamic_disk_' . $location->slug;

        if ($location->slug === 'local') {
            return 'public'; // Simplify to standard public disk
        }

        if ($location->slug === 'wasabi') {
            $config = $location->wasabiConfig;
            if (!$config) throw new Exception("Wasabi config missing");

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
            if (!$config) throw new Exception("AWS config missing");

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

        return 'public';
    }
}
