<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('insurance_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            // tier: 'mini' | 'mid' | 'full' (Mini Güvence / Orta Güvence / Full Güvence)
            $table->string('tier', 16);
            $table->string('name', 191);
            $table->unsignedInteger('price_per_day')->default(0);
            $table->unsignedInteger('deductible_amount')->nullable();
            $table->unsignedInteger('coverage_amount')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->json('included_features')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
            $table->unique(['company_id', 'tier']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_packages');
    }
};
