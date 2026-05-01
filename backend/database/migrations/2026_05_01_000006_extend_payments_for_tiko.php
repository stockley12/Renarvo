<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('order_id', 64)->nullable()->after('provider_reference')->index();
            $table->string('trans_id', 64)->nullable()->after('order_id')->index();
            $table->unsignedInteger('amount_try')->default(0)->after('amount');
            $table->unsignedTinyInteger('installment')->default(1)->after('amount_try');
            $table->boolean('hash_inbound_ok')->nullable()->after('installment');
            $table->string('error_msg', 255)->nullable()->after('hash_inbound_ok');
            $table->json('raw_request')->nullable()->after('error_msg');
            $table->json('raw_response')->nullable()->after('raw_request');
            $table->json('raw_callback')->nullable()->after('raw_response');
            $table->json('raw_status_query')->nullable()->after('raw_callback');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['trans_id']);
            $table->dropColumn([
                'order_id',
                'trans_id',
                'amount_try',
                'installment',
                'hash_inbound_ok',
                'error_msg',
                'raw_request',
                'raw_response',
                'raw_callback',
                'raw_status_query',
            ]);
        });
    }
};
