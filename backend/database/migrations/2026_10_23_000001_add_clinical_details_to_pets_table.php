<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table): void {
            $table->string('size', 30)->nullable();
            $table->string('color', 100)->nullable();
            $table->text('allergies')->nullable();
            $table->text('behavior_alerts')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table): void {
            $table->dropColumn(['size', 'color', 'allergies', 'behavior_alerts']);
        });
    }
};
