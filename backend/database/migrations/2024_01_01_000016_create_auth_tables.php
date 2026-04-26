<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64);
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->dateTime('expires_at');
            $table->dateTime('revoked_at')->nullable();
            $table->timestamps();

            $table->index('token_hash');
            $table->index('user_id');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token_hash', 64);
            $table->dateTime('created_at');
        });

        Schema::create('email_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64);
            $table->dateTime('expires_at');
            $table->dateTime('verified_at')->nullable();
            $table->timestamps();

            $table->index('token_hash');
        });

        Schema::create('rate_limit_buckets', function (Blueprint $table) {
            $table->string('key', 191)->primary();
            $table->unsignedInteger('tokens');
            $table->unsignedInteger('max_tokens');
            $table->unsignedInteger('refill_seconds');
            $table->dateTime('last_refill_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_limit_buckets');
        Schema::dropIfExists('email_verifications');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('refresh_tokens');
    }
};
