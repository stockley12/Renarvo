<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('city');
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('logo_color', 32)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('tax_number', 32)->nullable();
            $table->string('address')->nullable();
            $table->enum('status', ['pending', 'approved', 'suspended', 'rejected'])->default('pending');
            $table->smallInteger('founded_year')->nullable();
            $table->smallInteger('commission_rate_bps')->default(1200);
            $table->string('languages_spoken')->nullable();
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->unsignedInteger('fleet_size')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('city');
            $table->index('owner_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
