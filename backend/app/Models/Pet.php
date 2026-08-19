<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class Pet extends Model
{
    private const PUBLIC_CODE_GENERATION_ATTEMPTS = 20;

    protected $fillable = [
        'client_id',
        'name',
        'species',
        'breed',
        'sex',
        'birth_date',
        'weight',
        'notes',
    ];

    protected static function booted(): void
    {
        static::creating(function (Pet $pet): void {
            for ($attempt = 0; $attempt < self::PUBLIC_CODE_GENERATION_ATTEMPTS; $attempt++) {
                $publicCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                if (! static::query()->where('public_code', $publicCode)->exists()) {
                    $pet->public_code = $publicCode;

                    return;
                }
            }

            throw new RuntimeException('Unable to generate a unique public code for the pet.');
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
