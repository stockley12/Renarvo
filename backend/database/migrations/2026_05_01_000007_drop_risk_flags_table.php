<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('risk_flags')) {
            Schema::drop('risk_flags');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('risk_flags')) {
            Schema::create('risk_flags', function (Blueprint $table) {
                $table->id();
                $table->string('type', 40);
                $table->string('subject_type', 60);
                $table->unsignedBigInteger('subject_id');
                $table->string('reason', 255);
                $table->unsignedInteger('score')->default(0);
                $table->string('status', 24)->default('open');
                $table->unsignedBigInteger('reviewer_id')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
                $table->index(['status', 'type']);
                $table->index(['subject_type', 'subject_id']);
            });
        }
    }
};
