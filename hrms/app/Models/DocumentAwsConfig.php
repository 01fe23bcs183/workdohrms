<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentAwsConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id', 'bucket', 'region', 'access_key', 'secret_key', 'is_active'
    ];

    public function location()
    {
        return $this->belongsTo(DocumentLocation::class, 'location_id');
    }
}
