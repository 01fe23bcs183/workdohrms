<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentLocation extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'is_active'];

    public function localConfig()
    {
        return $this->hasOne(DocumentLocalConfig::class, 'location_id');
    }

    public function wasabiConfig()
    {
        return $this->hasOne(DocumentWasabiConfig::class, 'location_id');
    }

    public function awsConfig()
    {
        return $this->hasOne(DocumentAwsConfig::class, 'location_id');
    }
}
