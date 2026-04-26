<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();
            $table->foreignId('car_id')->constrained('cars')->restrictOnDelete();
            $table->foreignId('company_id')->constrained('companies')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('pickup_at');
            $table->dateTime('return_at');
            $table->dateTime('actual_return_at')->nullable();
            $table->string('pickup_location');
            $table->string('return_location')->nullable();
            $table->tinyInteger('days');
            $table->unsignedInteger('base_price');
            $table->unsignedInteger('extras_price')->default(0);
            $table->unsignedInteger('discount_amount')->default(0);
            $table->unsignedInteger('service_fee')->default(0);
            $table->unsignedInteger('tax_amount')->default(0);
            $table->unsignedInteger('total_price');
            $table->char('currency_snapshot', 3)->default('TRY');
            $table->decimal('fx_rate_snapshot', 12, 6)->default(1);
            $table->enum('status', ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'])->default('pending');
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->string('promo_code', 32)->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('notes')->nullable();
            $table->string('flight_number', 16)->nullable();
            $table->string('driving_license_number')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'status']);
            $table->index('customer_id');
            $table->index(['car_id', 'pickup_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
