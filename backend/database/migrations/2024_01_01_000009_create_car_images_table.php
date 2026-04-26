<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();
            $table->string('path');
            $table->tinyInteger('position')->default(0);
            $table->timestamps();

            $table->index(['car_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_images');
    }
};
