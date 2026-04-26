<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('brand', 64);
            $table->string('model', 64);
            $table->smallInteger('year');
            $table->enum('category', ['economy', 'compact', 'suv', 'luxury', 'van', 'electric']);
            $table->enum('transmission', ['manual', 'automatic']);
            $table->enum('fuel', ['petrol', 'diesel', 'hybrid', 'electric']);
            $table->tinyInteger('seats')->default(5);
            $table->tinyInteger('doors')->default(4);
            $table->unsignedInteger('price_per_day');
            $table->unsignedInteger('weekly_price')->nullable();
            $table->string('city');
            $table->unsignedInteger('deposit')->default(0);
            $table->string('mileage_policy')->nullable();
            $table->boolean('instant_book')->default(false);
            $table->enum('status', ['active', 'draft', 'maintenance', 'hidden'])->default('draft');
            $table->string('plate', 24)->nullable();
            $table->string('vin', 17)->nullable();
            $table->text('description')->nullable();
            $table->tinyInteger('min_driver_age')->default(21);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->string('image_seed', 64)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('company_id');
            $table->index('status');
            $table->index('city');
            $table->index('category');
            $table->index(['city', 'category', 'status', 'price_per_day'], 'idx_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
