<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Attendance extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'appointment_id', 'client_id', 'pet_id', 'responsible_veterinarian_id',
        'status', 'amount_charged', 'payment_method', 'notes', 'evolution',
        'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_charged' => 'decimal:2',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function responsibleVeterinarian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_veterinarian_id');
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'attendance_services')->withPivot(['price', 'duration_minutes'])->withTimestamps();
    }
}
