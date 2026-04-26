<?php

use App\Http\Controllers\Admin\AdminAuditController;
use App\Http\Controllers\Admin\AdminCatalogController;
use App\Http\Controllers\Admin\AdminCompanyController;
use App\Http\Controllers\Admin\AdminFinanceController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\Admin\AdminReservationController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminRiskController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminSystemHealthController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\CompanyRegistrationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Company\CompanyBranchController;
use App\Http\Controllers\Company\CompanyCarController;
use App\Http\Controllers\Company\CompanyCustomerController;
use App\Http\Controllers\Company\CompanyDocumentController;
use App\Http\Controllers\Company\CompanyMessageController;
use App\Http\Controllers\Company\CompanyOverviewController;
use App\Http\Controllers\Company\CompanyPaymentController;
use App\Http\Controllers\Company\CompanyPayoutController;
use App\Http\Controllers\Company\CompanyPricingController;
use App\Http\Controllers\Company\CompanyPromoController;
use App\Http\Controllers\Company\CompanyReservationController;
use App\Http\Controllers\Company\CompanyReviewController;
use App\Http\Controllers\Company\CompanySettingsController;
use App\Http\Controllers\Company\CompanyStaffController;
use App\Http\Controllers\Company\CompanyStatisticsController;
use App\Http\Controllers\Customer\CustomerMessageController;
use App\Http\Controllers\Customer\CustomerNotificationController;
use App\Http\Controllers\Customer\CustomerPrivacyController;
use App\Http\Controllers\Customer\CustomerProfileController;
use App\Http\Controllers\Customer\CustomerReservationController;
use App\Http\Controllers\Customer\CustomerReviewController;
use App\Http\Controllers\Public\CarPublicController;
use App\Http\Controllers\Public\CompanyPublicController;
use App\Http\Controllers\Public\HealthController;
use App\Http\Controllers\Public\LookupController;
use App\Http\Controllers\Public\PaymentWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ---------- Health ----------
    Route::get('/health', [HealthController::class, 'show']);

    // ---------- Public lookups ----------
    Route::get('/categories', [LookupController::class, 'categories']);
    Route::get('/cities', [LookupController::class, 'cities']);
    Route::get('/pickup-points', [LookupController::class, 'pickupPoints']);
    Route::get('/fx-rates', [LookupController::class, 'fxRates']);

    // ---------- Public catalog ----------
    Route::get('/cars', [CarPublicController::class, 'index']);
    Route::get('/cars/{id}', [CarPublicController::class, 'show']);
    Route::get('/companies', [CompanyPublicController::class, 'index']);
    Route::get('/companies/{slug}', [CompanyPublicController::class, 'show']);
    Route::get('/reviews', [CustomerReviewController::class, 'publicIndex']);

    // ---------- Payment webhooks (no auth) ----------
    Route::post('/webhooks/payments/{provider}', [PaymentWebhookController::class, 'handle']);

    // ---------- Privacy / consent (anonymous + authenticated) ----------
    Route::post('/privacy/consent', [CustomerPrivacyController::class, 'recordConsent']);

    // ---------- Auth ----------
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/register-company', [CompanyRegistrationController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth.jwt');
        Route::post('/forgot-password', [PasswordResetController::class, 'sendLink']);
        Route::post('/reset-password', [PasswordResetController::class, 'reset']);
        Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    });

    // ---------- Customer (any authenticated user) ----------
    Route::middleware('auth.jwt')->group(function () {
        Route::get('/me', [CustomerProfileController::class, 'show']);
        Route::patch('/me', [CustomerProfileController::class, 'update']);
        Route::delete('/me', [CustomerProfileController::class, 'destroy']);
        Route::get('/me/data-export', [CustomerProfileController::class, 'dataExport']);

        Route::get('/me/reservations', [CustomerReservationController::class, 'index']);
        Route::post('/me/reservations', [CustomerReservationController::class, 'store']);
        Route::get('/me/reservations/{id}', [CustomerReservationController::class, 'show']);
        Route::patch('/me/reservations/{id}/cancel', [CustomerReservationController::class, 'cancel']);

        Route::post('/me/reviews', [CustomerReviewController::class, 'store']);

        Route::get('/me/messages', [CustomerMessageController::class, 'index']);
        Route::post('/me/messages', [CustomerMessageController::class, 'store']);

        Route::get('/me/notifications', [CustomerNotificationController::class, 'index']);
        Route::patch('/me/notifications/read-all', [CustomerNotificationController::class, 'readAll']);

        Route::post('/me/data-export-request', [CustomerPrivacyController::class, 'requestDataExport']);
        Route::post('/me/erase', [CustomerPrivacyController::class, 'eraseAccount']);
    });

    // ---------- Company ----------
    Route::middleware(['auth.jwt', 'role:company_owner,company_staff', 'company'])
        ->prefix('company')
        ->group(function () {
            Route::get('/overview', [CompanyOverviewController::class, 'show']);
            Route::get('/calendar', [CompanyOverviewController::class, 'calendar']);
            Route::get('/statistics', [CompanyStatisticsController::class, 'show']);

            Route::get('/cars', [CompanyCarController::class, 'index']);
            Route::post('/cars', [CompanyCarController::class, 'store']);
            Route::get('/cars/{id}', [CompanyCarController::class, 'show']);
            Route::patch('/cars/{id}', [CompanyCarController::class, 'update']);
            Route::delete('/cars/{id}', [CompanyCarController::class, 'destroy']);
            Route::post('/cars/{id}/images', [CompanyCarController::class, 'uploadImage']);
            Route::delete('/cars/{id}/images/{imgId}', [CompanyCarController::class, 'deleteImage']);

            Route::get('/reservations', [CompanyReservationController::class, 'index']);
            Route::get('/reservations/{id}', [CompanyReservationController::class, 'show']);
            Route::patch('/reservations/{id}/confirm', [CompanyReservationController::class, 'confirm']);
            Route::patch('/reservations/{id}/reject', [CompanyReservationController::class, 'reject']);
            Route::patch('/reservations/{id}/pickup', [CompanyReservationController::class, 'pickup']);
            Route::patch('/reservations/{id}/return', [CompanyReservationController::class, 'returnCar']);

            Route::get('/customers', [CompanyCustomerController::class, 'index']);

            Route::get('/messages', [CompanyMessageController::class, 'index']);
            Route::get('/messages/{threadId}', [CompanyMessageController::class, 'show']);
            Route::post('/messages/{threadId}', [CompanyMessageController::class, 'reply']);

            Route::get('/reviews', [CompanyReviewController::class, 'index']);
            Route::post('/reviews/{id}/reply', [CompanyReviewController::class, 'reply']);

            Route::get('/pricing', [CompanyPricingController::class, 'index']);
            Route::put('/pricing', [CompanyPricingController::class, 'update']);

            Route::get('/promos', [CompanyPromoController::class, 'index']);
            Route::post('/promos', [CompanyPromoController::class, 'store']);
            Route::patch('/promos/{id}', [CompanyPromoController::class, 'update']);
            Route::delete('/promos/{id}', [CompanyPromoController::class, 'destroy']);

            Route::get('/branches', [CompanyBranchController::class, 'index']);
            Route::post('/branches', [CompanyBranchController::class, 'store']);
            Route::patch('/branches/{id}', [CompanyBranchController::class, 'update']);
            Route::delete('/branches/{id}', [CompanyBranchController::class, 'destroy']);

            Route::get('/staff', [CompanyStaffController::class, 'index']);
            Route::post('/staff', [CompanyStaffController::class, 'store']);
            Route::delete('/staff/{id}', [CompanyStaffController::class, 'destroy']);

            Route::get('/documents', [CompanyDocumentController::class, 'index']);
            Route::post('/documents', [CompanyDocumentController::class, 'store']);

            Route::get('/payouts', [CompanyPayoutController::class, 'index']);
            Route::put('/bank-account', [CompanyPayoutController::class, 'updateBank']);

            Route::get('/reservations/{id}/payment', [CompanyPaymentController::class, 'show']);
            Route::post('/payments/{id}/capture', [CompanyPaymentController::class, 'capture']);

            Route::get('/settings', [CompanySettingsController::class, 'show']);
            Route::put('/settings', [CompanySettingsController::class, 'update']);
        });

    // ---------- Superadmin ----------
    Route::middleware(['auth.jwt', 'role:superadmin'])
        ->prefix('admin')
        ->group(function () {
            Route::get('/overview', [AdminOverviewController::class, 'show']);

            Route::get('/companies', [AdminCompanyController::class, 'index']);
            Route::get('/companies/{id}', [AdminCompanyController::class, 'show']);
            Route::patch('/companies/{id}/approve', [AdminCompanyController::class, 'approve']);
            Route::patch('/companies/{id}/reject', [AdminCompanyController::class, 'reject']);
            Route::patch('/companies/{id}/suspend', [AdminCompanyController::class, 'suspend']);

            Route::get('/catalog', [AdminCatalogController::class, 'index']);
            Route::patch('/catalog/{id}/hide', [AdminCatalogController::class, 'hide']);
            Route::patch('/catalog/{id}/flag', [AdminCatalogController::class, 'flag']);

            Route::get('/reservations', [AdminReservationController::class, 'index']);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::patch('/users/{id}/ban', [AdminUserController::class, 'ban']);
            Route::patch('/users/{id}/unban', [AdminUserController::class, 'unban']);

            Route::get('/reviews', [AdminReviewController::class, 'index']);
            Route::patch('/reviews/{id}/hide', [AdminReviewController::class, 'hide']);
            Route::patch('/reviews/{id}/restore', [AdminReviewController::class, 'restore']);

            Route::get('/risk', [AdminRiskController::class, 'index']);
            Route::patch('/risk/{id}/clear', [AdminRiskController::class, 'clear']);
            Route::patch('/risk/{id}/escalate', [AdminRiskController::class, 'escalate']);

            Route::get('/notifications', [AdminNotificationController::class, 'index']);
            Route::post('/notifications', [AdminNotificationController::class, 'send']);

            Route::get('/audit-log', [AdminAuditController::class, 'index']);

            Route::get('/finance', [AdminFinanceController::class, 'overview']);
            Route::get('/finance/payouts', [AdminFinanceController::class, 'payouts']);
            Route::post('/finance/payouts/{id}/process', [AdminFinanceController::class, 'processPayout']);

            Route::get('/system/health', [AdminSystemHealthController::class, 'show']);

            Route::get('/settings', [AdminSettingsController::class, 'show']);
            Route::put('/settings', [AdminSettingsController::class, 'update']);
        });
});
