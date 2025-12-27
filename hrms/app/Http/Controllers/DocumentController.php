<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\DocumentService;
use App\Models\Document;
use App\Enums\DocumentOwnerType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Validation\Rules\Enum;

class DocumentController extends Controller
{
    protected $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    /**
     * Upload a new document.
     * Content-Type: multipart/form-data
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // Max 10MB
            'document_type_id' => 'required|exists:document_types,id',
            'owner_type' => ['required', new Enum(DocumentOwnerType::class)],
            'owner_id' => 'required|integer',
            'org_id' => 'nullable|exists:organizations,id',
            'company_id' => 'nullable|exists:companies,id',
            'location' => 'nullable|exists:document_locations,slug', // optional, defaults to 'local'
            'document_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $document = $this->documentService->uploadDocument(
                $request->file('file'),
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => $document
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Document Download/View URL
     */
    public function getUrl($id)
    {
        try {
            $document = Document::with('location', 'type')->find($id);

            if (!$document) {
                return response()->json(['success' => false, 'message' => 'Document not found'], 404);
            }

            $url = $this->documentService->getDocumentUrl($document);

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $url,
                    'document' => $document
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving URL: ' . $e->getMessage()
            ], 500);
        }
    }
}
