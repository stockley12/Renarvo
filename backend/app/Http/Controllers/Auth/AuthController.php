<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\EmailVerification;
use App\Models\User;
use App\Services\AuditService;
use App\Services\JwtService;
use App\Services\RateLimiterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class AuthController extends Controller
{
    public function __construct(
        private readonly JwtService $jwt,
        private readonly RateLimiterService $limiter,
        private readonly AuditService $audit,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $this->throttle("register:{$request->ip()}", 10, 3600);

        $data = $request->validated();

        $user = User::query()->create([
            'email' => strtolower($data['email']),
            'password_hash' => Hash::make($data['password']),
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'role' => User::ROLE_CUSTOMER,
            'locale' => $data['locale'] ?? 'tr',
        ]);

        $this->audit->log('user.registered', $user, 'User', $user->id, [], 'info', $request);

        return $this->tokenResponse($user, $request);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $this->throttle("login:{$request->ip()}", 10, 600);
        $this->throttle('login:'.strtolower((string) $request->input('email')), 8, 600);

        $user = User::query()->where('email', strtolower((string) $request->input('email')))->first();

        if (! $user || ! Hash::check((string) $request->input('password'), $user->password_hash)) {
            $this->audit->log('user.login_failed', $user, 'User', $user?->id, [
                'email' => $request->input('email'),
            ], 'warn', $request);

            throw ValidationException::withMessages(['email' => 'Invalid credentials.']);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['email' => 'Account is suspended.']);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $this->audit->log('user.login', $user, 'User', $user->id, [], 'info', $request);

        return $this->tokenResponse($user, $request);
    }

    public function refresh(Request $request): JsonResponse
    {
        $token = $request->cookie('refresh_token') ?: $request->input('refresh_token');

        if (! $token) {
            throw ValidationException::withMessages(['refresh_token' => 'Missing refresh token.']);
        }

        $rotated = $this->jwt->rotateRefreshToken(
            (string) $token,
            $request->ip(),
            (string) $request->userAgent(),
        );

        if (! $rotated) {
            throw ValidationException::withMessages(['refresh_token' => 'Invalid or expired refresh token.']);
        }

        return $this->buildAuthResponse($rotated['user'], $rotated['access_token'], $rotated['refresh_token']);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->cookie('refresh_token') ?: $request->input('refresh_token');
        if ($token) {
            $this->jwt->revokeRefreshToken((string) $token);
        }

        $this->audit->log('user.logout', $request->user(), 'User', $request->user()?->id, [], 'info', $request);

        return response()
            ->json(['data' => ['ok' => true]])
            ->withoutCookie('refresh_token');
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $token = (string) $request->input('token');
        $hash = hash('sha256', $token);

        return DB::transaction(function () use ($hash) {
            $verification = EmailVerification::query()
                ->where('token_hash', $hash)
                ->whereNull('verified_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->first();

            if (! $verification) {
                throw ValidationException::withMessages(['token' => 'Invalid or expired verification token.']);
            }

            $verification->update(['verified_at' => now()]);
            User::query()->where('id', $verification->user_id)->update(['email_verified_at' => now()]);

            return response()->json(['data' => ['verified' => true]]);
        });
    }

    private function tokenResponse(User $user, Request $request): JsonResponse
    {
        $access = $this->jwt->issueAccessToken($user);
        $refresh = $this->jwt->issueRefreshToken($user, $request->ip(), (string) $request->userAgent());

        return $this->buildAuthResponse($user, $access, $refresh);
    }

    private function buildAuthResponse(User $user, string $access, string $refresh): JsonResponse
    {
        return response()
            ->json([
                'data' => [
                    'access_token' => $access,
                    'expires_in' => $this->jwt->getAccessTtl(),
                    'user' => new UserResource($user),
                ],
            ])
            ->cookie(
                'refresh_token',
                $refresh,
                config('services.jwt.refresh_ttl') / 60,
                '/',
                null,
                app()->environment('production'),
                true,
                false,
                'lax',
            );
    }

    private function throttle(string $key, int $max, int $window): void
    {
        if (! $this->limiter->consume($key, $max, $window)) {
            throw new TooManyRequestsHttpException($window, 'Too many attempts. Please retry later.');
        }
    }
}
