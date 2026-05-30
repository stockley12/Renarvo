<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'phone_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dateTime('phone_verified_at')->nullable()->after('email_verified_at');
            });
        }

        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 32);
            $table->string('purpose', 16); // login | register
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code_hash');
            $table->string('challenge', 64)->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->dateTime('expires_at');
            $table->dateTime('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['phone', 'purpose']);
            $table->index('challenge');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');

        if (Schema::hasColumn('users', 'phone_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('phone_verified_at');
            });
        }
    }
};
