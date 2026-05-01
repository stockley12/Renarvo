<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('company_extras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            // 'gps' | 'child_seat' | 'baby_seat' | 'additional_driver' | 'wifi' | 'border_crossing' | 'custom'
            $table->string('code', 32);
            $table->string('name', 191);
            // Stored as integer minor units (TRY kuruş not used; we treat units as TRY).
            $table->unsignedInteger('price_per_day')->default(0);
            $table->unsignedInteger('price_per_rental')->default(0);
            // 'per_day' | 'per_rental' | 'free'
            $table->string('charge_mode', 16)->default('per_day');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
            $table->unique(['company_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_extras');
    }
};
