<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RateLimiterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class PasswordResetController extends Controller
{
    public function __construct(private readonly RateLimiterService $limiter) {}

    public function sendLink(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        if (! $this->limiter->consume("pwreset:{$request->ip()}", 5, 3600)) {
            throw new TooManyRequestsHttpException(3600, 'Too many requests.');
        }

        $email = strtolower((string) $request->input('email'));
        $user = User::query()->where('email', $email)->first();

        if ($user) {
            $token = Str::random(64);
            $hash = hash('sha256', $token);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token_hash' => $hash, 'created_at' => now()],
            );

            try {
                Mail::raw(
                    sprintf("Reset your password: %s/reset-password?token=%s", config('app.frontend_url'), $token),
                    function ($message) use ($email) {
                        $message->to($email)->subject('Renarvo: Reset your password');
                    }
                );
            } catch (\Throwable) {
                // swallow mail errors during dev
            }
        }

        return response()->json(['data' => ['ok' => true]]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $email = strtolower($data['email']);
        $hash = hash('sha256', $data['token']);

        $row = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $row || $row->token_hash !== $hash || now()->diffInMinutes($row->created_at) > 60) {
            throw ValidationException::withMessages(['token' => 'Invalid or expired reset token.']);
        }

        $user = User::query()->where('email', $email)->firstOrFail();
        $user->update([
            'password_hash' => Hash::make($data['password']),
            'token_version' => $user->token_version + 1,
        ]);

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
