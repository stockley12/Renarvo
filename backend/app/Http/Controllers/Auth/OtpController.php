<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Services\OtpService;
use App\Services\RateLimiterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class OtpController extends Controller
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly RateLimiterService $limiter,
    ) {}

    /**
     * Send a verification code for account creation. The code is tied to the
     * phone number and consumed by POST /auth/register.
     */
    public function requestRegister(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:32'],
        ]);

        $phone = $this->otp->normalizePhone($data['phone']);
        if (! $phone) {
            throw ValidationException::withMessages(['phone' => 'Please enter a valid mobile number.']);
        }

        // Throttle both the requesting IP and the destination number.
        if (! $this->limiter->consume("otp_req:{$request->ip()}", 20, 1800)) {
            throw new TooManyRequestsHttpException(1800, 'Too many requests. Please retry later.');
        }
        if (! $this->limiter->consume("otp_phone:{$phone}", 5, 1800)) {
            throw new TooManyRequestsHttpException(1800, 'Too many codes requested for this number.');
        }

        $cooldown = $this->otp->cooldownRemaining($phone, OtpCode::PURPOSE_REGISTER);
        if ($cooldown > 0) {
            throw new TooManyRequestsHttpException($cooldown, "Please wait {$cooldown}s before requesting another code.");
        }

        $result = $this->otp->send($phone, OtpCode::PURPOSE_REGISTER);

        if (! $result['ok'] && $this->otp->isProviderLive()) {
            throw ValidationException::withMessages([
                'phone' => 'We could not send a code to this number. Please check it and try again.',
            ]);
        }

        return response()->json([
            'data' => [
                'sent' => $result['ok'],
                'phone_masked' => $this->otp->mask($phone),
                'dev_code' => $result['dev_code'],
                'resend_in' => (int) config('services.postaguvercini.resend_cooldown', 60),
            ],
        ]);
    }
}
