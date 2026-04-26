<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('name');
            $table->string('phone', 32)->nullable();
            $table->enum('role', ['customer', 'company_owner', 'company_staff', 'superadmin'])->default('customer');
            $table->string('avatar_path')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('status', ['active', 'banned'])->default('active');
            $table->enum('locale', ['tr', 'en', 'ru'])->default('tr');
            $table->unsignedInteger('token_version')->default(0);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
