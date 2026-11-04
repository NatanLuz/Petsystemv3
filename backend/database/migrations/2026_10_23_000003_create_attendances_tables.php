<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('pet_id')->constrained()->restrictOnDelete();
            $table->foreignId('responsible_veterinarian_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('in_progress');
            $table->decimal('amount_charged', 10, 2)->nullable();
            $table->string('payment_method', 40)->nullable();
            $table->text('notes')->nullable();
            $table->text('evolution')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['pet_id', 'started_at']);
        });

        Schema::create('attendance_services', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attendance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->restrictOnDelete();
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('duration_minutes');
            $table->timestamps();
            $table->unique(['attendance_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_services');
        Schema::dropIfExists('attendances');
    }
};
