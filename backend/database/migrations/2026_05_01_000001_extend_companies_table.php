<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // Rental policy defaults
            $table->unsignedTinyInteger('min_rental_days')->default(1)->after('commission_rate_bps');
            $table->string('kilometre_policy', 32)->default('unlimited')->after('min_rental_days');
            // Allowed values: 'unlimited' | 'per_day_limit' | 'total_limit'
            $table->unsignedSmallInteger('kilometre_limit_per_day_default')->nullable()->after('kilometre_policy');
            $table->unsignedTinyInteger('min_driver_age_default')->default(21)->after('kilometre_limit_per_day_default');
            $table->boolean('student_friendly')->default(false)->after('min_driver_age_default');
            $table->boolean('roadside_24_7')->default(false)->after('student_friendly');

            // Public contact / social
            $table->string('email_public', 191)->nullable()->after('roadside_24_7');
            $table->string('whatsapp', 64)->nullable()->after('email_public');
            $table->string('instagram', 191)->nullable()->after('whatsapp');
            $table->string('facebook', 191)->nullable()->after('instagram');
            $table->string('website', 191)->nullable()->after('facebook');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'min_rental_days',
                'kilometre_policy',
                'kilometre_limit_per_day_default',
                'min_driver_age_default',
                'student_friendly',
                'roadside_24_7',
                'email_public',
                'whatsapp',
                'instagram',
                'facebook',
                'website',
            ]);
        });
    }
};
