<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->index(['city', 'status']);
            $table->index(['category', 'status']);
            $table->index(['price_per_day']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->index(['status', 'pickup_at']);
            $table->index(['company_id', 'created_at']);
            $table->index(['customer_id', 'status']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index(['company_id', 'status']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['action', 'created_at']);
            $table->index(['target_type', 'target_id']);
            $table->index(['actor_id', 'created_at']);
        });

        Schema::table('jobs', function (Blueprint $table) {
            $table->index(['status', 'run_after']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropIndex(['city', 'status']);
            $table->dropIndex(['category', 'status']);
            $table->dropIndex(['price_per_day']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['status', 'pickup_at']);
            $table->dropIndex(['company_id', 'created_at']);
            $table->dropIndex(['customer_id', 'status']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'status']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['target_type', 'target_id']);
            $table->dropIndex(['actor_id', 'created_at']);
        });

        Schema::table('jobs', function (Blueprint $table) {
            $table->dropIndex(['status', 'run_after']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'created_at']);
        });
    }
};
