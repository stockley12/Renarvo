<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('id_number', 64)->nullable()->after('driving_license_number');
        });

        Schema::create('reservation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->string('type', 32); // driving_license, id_passport
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->unsignedInteger('size')->default(0);
            $table->timestamps();

            $table->index('reservation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_documents');

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('id_number');
        });
    }
};
