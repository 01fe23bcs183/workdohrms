<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentWasabiConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id', 'bucket', 'region', 'access_key', 'secret_key', 'endpoint', 'is_active'
    ];

    public function location()
    {
        return $this->belongsTo(DocumentLocation::class, 'location_id');
    }
}
