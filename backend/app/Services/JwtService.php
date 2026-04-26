<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JwtService
{
    private string $secret;
    private int $accessTtl;
    private int $refreshTtl;
    private string $issuer;

    public function __construct()
    {
        $this->secret = (string) (config('services.jwt.secret') ?? '');
        $this->accessTtl = (int) config('services.jwt.access_ttl', 900);
        $this->refreshTtl = (int) config('services.jwt.refresh_ttl', 2592000);
        $this->issuer = (string) config('services.jwt.issuer', 'renarvo');
    }

    public function issueAccessToken(User $user): string
    {
        $now = time();

        $payload = [
            'iss' => $this->issuer,
            'sub' => $user->id,
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $this->accessTtl,
            'role' => $user->role,
            'tv' => $user->token_version,
            'email' => $user->email,
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function validateAccessToken(string $token): ?User
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (\Throwable) {
            return null;
        }

        $user = User::query()->find($decoded->sub ?? null);

        if (! $user) {
            return null;
        }

        if ((int) ($decoded->tv ?? -1) !== (int) $user->token_version) {
            return null;
        }

        return $user;
    }

    public function issueRefreshToken(User $user, ?string $ip = null, ?string $ua = null): string
    {
        $token = Str::random(64);
        $hash = hash('sha256', $token);

        RefreshToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => $hash,
            'user_agent' => $ua,
            'ip_address' => $ip,
            'expires_at' => now()->addSeconds($this->refreshTtl),
        ]);

        return $token;
    }

    public function rotateRefreshToken(string $rawToken, ?string $ip = null, ?string $ua = null): ?array
    {
        $hash = hash('sha256', $rawToken);

        return DB::transaction(function () use ($hash, $ip, $ua) {
            $existing = RefreshToken::query()
                ->where('token_hash', $hash)
                ->whereNull('revoked_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->first();

            if (! $existing) {
                return null;
            }

            $existing->update(['revoked_at' => now()]);
            $user = User::query()->find($existing->user_id);
            if (! $user) {
                return null;
            }

            return [
                'access_token' => $this->issueAccessToken($user),
                'refresh_token' => $this->issueRefreshToken($user, $ip, $ua),
                'user' => $user,
            ];
        });
    }

    public function revokeRefreshToken(string $rawToken): void
    {
        RefreshToken::query()
            ->where('token_hash', hash('sha256', $rawToken))
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function revokeAllForUser(int $userId): void
    {
        RefreshToken::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function getAccessTtl(): int
    {
        return $this->accessTtl;
    }
}
