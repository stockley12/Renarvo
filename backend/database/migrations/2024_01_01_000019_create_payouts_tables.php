<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('period', 7);
            $table->unsignedInteger('gross');
            $table->unsignedInteger('commission');
            $table->unsignedInteger('net');
            $table->enum('status', ['pending', 'processing', 'paid', 'failed'])->default('pending');
            $table->dateTime('paid_at')->nullable();
            $table->string('reference')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'period']);
        });

        Schema::create('company_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
            $table->string('iban', 64);
            $table->string('account_holder');
            $table->string('bank_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_bank_accounts');
        Schema::dropIfExists('payouts');
    }
};
