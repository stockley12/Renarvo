<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Generates, sends and verifies one-time SMS passcodes for login and
 * account creation. Codes are stored hashed, expire quickly and lock after
 * a small number of failed attempts.
 */
class OtpService
{
    public function __construct(
        private readonly PostaGuverciniService $sms,
        private readonly AuditService $audit,
    ) {}

    public function normalizePhone(string $phone): ?string
    {
        return $this->sms->normalizePhone($phone);
    }

    public function isProviderLive(): bool
    {
        return $this->sms->isEnabled();
    }

    private function ttl(): int
    {
        return (int) config('services.postaguvercini.code_ttl', 300);
    }

    private function cooldown(): int
    {
        return (int) config('services.postaguvercini.resend_cooldown', 60);
    }

    private function maxAttempts(): int
    {
        return (int) config('services.postaguvercini.max_attempts', 5);
    }

    private function codeLength(): int
    {
        return max(4, min(8, (int) config('services.postaguvercini.code_length', 6)));
    }

    /**
     * Seconds the caller must wait before another code can be sent, or 0.
     */
    public function cooldownRemaining(string $phone, string $purpose): int
    {
        $last = OtpCode::query()
            ->where('phone', $phone)
            ->where('purpose', $purpose)
            ->latest('created_at')
            ->first();

        if (! $last) {
            return 0;
        }

        $elapsed = (int) abs(Carbon::parse($last->created_at)->diffInSeconds(now()));

        return max(0, $this->cooldown() - $elapsed);
    }

    /**
     * Create + send a fresh code. Returns:
     *   ['ok' => bool, 'phone' => string, 'challenge' => ?string, 'dev_code' => ?string]
     * dev_code is only populated when the provider is disabled (testing).
     */
    public function send(string $phone, string $purpose, ?User $user = null): array
    {
        $code = $this->generateCode();
        $challenge = $purpose === OtpCode::PURPOSE_LOGIN ? (string) Str::uuid().bin2hex(random_bytes(8)) : null;

        // Invalidate previous unconsumed codes for this phone+purpose.
        OtpCode::query()
            ->where('phone', $phone)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        OtpCode::query()->create([
            'phone' => $phone,
            'purpose' => $purpose,
            'user_id' => $user?->id,
            'code_hash' => Hash::make($code),
            'challenge' => $challenge,
            'attempts' => 0,
            'expires_at' => now()->addSeconds($this->ttl()),
        ]);

        $brand = (string) config('services.postaguvercini.brand', 'Renarvo');
        $minutes = (int) ceil($this->ttl() / 60);
        $message = "{$brand} dogrulama kodunuz: {$code}. Kod {$minutes} dakika gecerlidir.";

        $ok = $this->sms->sendSms($phone, $message);

        $this->audit->log('otp.sent', $user, 'User', $user?->id, [
            'purpose' => $purpose,
            'phone' => $this->mask($phone),
            'delivered' => $ok,
            'provider_live' => $this->sms->isEnabled(),
        ], $ok ? 'info' : 'warn');

        return [
            'ok' => $ok,
            'phone' => $phone,
            'challenge' => $challenge,
            'dev_code' => $this->sms->isEnabled() ? null : $code,
        ];
    }

    /**
     * Verify a code for the register flow (looked up by phone + purpose).
     * Returns the consumed OtpCode on success, or a status string on failure:
     *   'not_found' | 'expired' | 'locked' | 'invalid'
     */
    public function verifyByPhone(string $phone, string $code): OtpCode|string
    {
        $row = OtpCode::query()
            ->where('phone', $phone)
            ->where('purpose', OtpCode::PURPOSE_REGISTER)
            ->whereNull('consumed_at')
            ->latest('created_at')
            ->first();

        return $this->checkAndConsume($row, $code);
    }

    /**
     * Verify a code for the login flow (looked up by opaque challenge token).
     */
    public function verifyByChallenge(string $challenge, string $code): OtpCode|string
    {
        $row = OtpCode::query()
            ->where('challenge', $challenge)
            ->where('purpose', OtpCode::PURPOSE_LOGIN)
            ->whereNull('consumed_at')
            ->latest('created_at')
            ->first();

        return $this->checkAndConsume($row, $code);
    }

    private function checkAndConsume(?OtpCode $row, string $code): OtpCode|string
    {
        if (! $row) {
            return 'not_found';
        }

        if (Carbon::parse($row->expires_at)->isPast()) {
            return 'expired';
        }

        if ($row->attempts >= $this->maxAttempts()) {
            return 'locked';
        }

        if (! Hash::check($code, $row->code_hash)) {
            $row->increment('attempts');

            return $row->attempts >= $this->maxAttempts() ? 'locked' : 'invalid';
        }

        $row->forceFill(['consumed_at' => now()])->save();

        return $row;
    }

    private function generateCode(): string
    {
        $len = $this->codeLength();
        $max = (10 ** $len) - 1;

        return str_pad((string) random_int(0, $max), $len, '0', STR_PAD_LEFT);
    }

    public function mask(string $phone): string
    {
        if (strlen($phone) <= 4) {
            return $phone;
        }

        return substr($phone, 0, 2).str_repeat('*', max(0, strlen($phone) - 4)).substr($phone, -2);
    }
}
