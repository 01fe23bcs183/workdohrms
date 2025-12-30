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
     * UNIFIED UPLOAD: Automatically detects storage location based on org/company
     * Single API endpoint for all uploads
     */
    public function uploadDocument(UploadedFile $file, array $data): Document
    {
        // 1. Determine storage location based on org_id or company_id
        $location = $this->determineStorageLocation($data);

        if (!$location) {
            throw new Exception('No storage location configured for this organization/company');
        }

        // 2. Get storage type name for logging
        $storageTypeName = $this->getStorageTypeName($location->location_type);

        // 3. Configure Dynamic Disk
        $diskName = $this->configureDisk($location);

        // 4. Generate Path
        $ownerType = $data['owner_type'];
        $ownerId = $data['owner_id'];
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        $path = "{$ownerType}/{$ownerId}/" . date('Y');
        $fullPath = $path . '/' . $filename;

        // 5. Upload File
        try {
            $stream = fopen($file->getRealPath(), 'r');
            if ($stream === false) {
                throw new Exception('Unable to open file stream');
            }

            Storage::disk($diskName)->writeStream(
                $fullPath,
                $stream,
                ['visibility' => 'private']
            );

            if (is_resource($stream)) {
                fclose($stream);
            }

            \Log::info("Document uploaded successfully", [
                'storage' => $storageTypeName,
                'path' => $fullPath,
                'file' => $file->getClientOriginalName()
            ]);

        } catch (\Aws\S3\Exception\S3Exception $e) {
            $awsError = $e->getAwsErrorMessage() ?? $e->getMessage();
            $awsCode = $e->getAwsErrorCode() ?? 'Unknown';

            \Log::error("Cloud Storage Upload Error [{$storageTypeName}]", [
                'error_code' => $awsCode,
                'error_message' => $awsError,
                'status_code' => $e->getStatusCode(),
                'file' => $file->getClientOriginalName(),
                'path' => $fullPath,
            ]);

            throw new Exception("Cloud Storage Error [{$awsCode}]: {$awsError}");

        } catch (\Exception $e) {
            \Log::error("Document Upload Error [{$storageTypeName}]: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $file->getClientOriginalName(),
                'location_type' => $location->location_type,
                'disk' => $diskName,
                'path' => $fullPath
            ]);

            $detailedError = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            throw new Exception("Storage Error: " . $detailedError);
        }

        // 6. Save Metadata to Database
        return Document::create([
            'document_type_id' => $data['document_type_id'],
            'document_location_id' => $location->id,
            'org_id' => $data['org_id'] ?? null,
            'company_id' => $data['company_id'] ?? null,
            'user_id' => auth()->id(),
            'owner_type' => $ownerType,
            'owner_id' => $ownerId,
            'doc_url' => $fullPath,
            'document_name' => $data['document_name'] ?? $file->getClientOriginalName(),
            'document_size' => $file->getSize(),
            'document_extension' => $extension,
            'mime_type' => $file->getMimeType(),
        ]);
    }

    /**
     * Determine storage location based on org_id or company_id
     * Priority: org_id > company_id > default
     */
    protected function determineStorageLocation(array $data): ?DocumentLocation
    {
        $query = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig']);

        // Priority 1: Match by org_id
        if (isset($data['org_id']) && $data['org_id']) {
            $location = $query->where('org_id', $data['org_id'])->first();
            if ($location) {
                return $location;
            }
        }

        // Priority 2: Match by company_id
        if (isset($data['company_id']) && $data['company_id']) {
            $location = $query->where('company_id', $data['company_id'])->first();
            if ($location) {
                return $location;
            }
        }

        // Priority 3: Global/Default location (org_id and company_id are null)
        $location = $query->whereNull('org_id')
            ->whereNull('company_id')
            ->first();

        if ($location) {
            return $location;
        }

        // Fallback: Use any local storage if available
        return $query->where('location_type', 1)->first();
    }

    /**
     * Get storage type name from location_type ID (public for controller access)
     */
    public function getStorageTypeName(int $locationType): string
    {
        return match($locationType) {
            1 => 'local',
            2 => 'wasabi',
            3 => 'aws',
            default => 'unknown'
        };
    }

    /**
     * Configure Dynamic Disk based on location type
     */
    protected function configureDisk(DocumentLocation $location): string
    {
        $storageType = $this->getStorageTypeName($location->location_type);
        $diskName = 'dynamic_disk_' . $storageType . '_' . $location->id;

        // Local Storage
        if ($location->location_type === 1) {
            return 'public';
        }

        // Wasabi Storage
        if ($location->location_type === 2) {
            $config = $location->wasabiConfig;
            if (!$config) {
                throw new Exception("Wasabi configuration missing for location ID: {$location->id}");
            }

            $wasabiEndpoint = "https://s3.{$config->region}.wasabisys.com";

            Config::set("filesystems.disks.{$diskName}", [
                'driver' => 's3',
                'key' => $config->access_key,
                'secret' => $config->secret_key,
                'region' => $config->region,
                'bucket' => $config->bucket,
                'endpoint' => $wasabiEndpoint,
                'use_path_style_endpoint' => false,
                'throw' => true,
            ]);

            return $diskName;
        }

        // AWS S3 Storage
        if ($location->location_type === 3) {
            $config = $location->awsConfig;
            if (!$config) {
                throw new Exception("AWS configuration missing for location ID: {$location->id}");
            }

            Config::set("filesystems.disks.{$diskName}", [
                'driver' => 's3',
                'key' => $config->access_key,
                'secret' => $config->secret_key,
                'region' => $config->region,
                'bucket' => $config->bucket,
                'throw' => true,
            ]);

            return $diskName;
        }

        // Fallback to public
        return 'public';
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

        if ($location->location_type === 1) { // Local
            return Storage::disk('public')->url($document->doc_url);
        }

        // S3/Wasabi Presigned URL (60 minutes)
        return Storage::disk($diskName)->temporaryUrl(
            $document->doc_url,
            now()->addMinutes(60)
        );
    }

    /**
     * Download Document (stream response)
     */
    public function downloadDocument(Document $document)
    {
        $location = $document->location;
        $diskName = $this->configureDisk($location);

        if (!Storage::disk($diskName)->exists($document->doc_url)) {
            throw new Exception('File not found in storage');
        }

        $fileContents = Storage::disk($diskName)->get($document->doc_url);

        return response($fileContents, 200)
            ->header('Content-Type', $document->mime_type)
            ->header('Content-Disposition', 'attachment; filename="' . $document->document_name . '"');
    }
}
