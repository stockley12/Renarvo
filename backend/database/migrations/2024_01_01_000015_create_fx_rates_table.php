<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fx_rates', function (Blueprint $table) {
            $table->id();
            $table->char('base_currency', 3)->default('TRY');
            $table->char('target_currency', 3);
            $table->decimal('rate', 12, 6);
            $table->dateTime('fetched_at');
            $table->timestamps();

            $table->index(['target_currency', 'fetched_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fx_rates');
    }
};
