<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('insurance_package_id')->nullable()->after('extras_price')->constrained('insurance_packages')->nullOnDelete();
            $table->unsignedInteger('insurance_price')->default(0)->after('insurance_package_id');
            $table->unsignedInteger('deposit_amount_snapshot')->default(0)->after('insurance_price');
            // 'unpaid' | 'pending' | 'authorized' | 'paid' | 'refunded' | 'failed' | 'cancelled'
            $table->string('payment_status', 16)->default('unpaid')->after('deposit_amount_snapshot');
            $table->foreignId('current_payment_id')->nullable()->after('payment_status')->constrained('payments')->nullOnDelete();

            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['current_payment_id']);
            $table->dropForeign(['insurance_package_id']);
            $table->dropIndex(['payment_status']);
            $table->dropColumn([
                'insurance_package_id',
                'insurance_price',
                'deposit_amount_snapshot',
                'payment_status',
                'current_payment_id',
            ]);
        });
    }
};
