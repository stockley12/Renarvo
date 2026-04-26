<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    public function __construct(private readonly JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);

        if (! $token) {
            throw new AuthenticationException('Missing access token.');
        }

        $user = $this->jwt->validateAccessToken($token);

        if (! $user) {
            throw new AuthenticationException('Invalid or expired token.');
        }

        if ($user->status === 'banned') {
            throw new AuthenticationException('Account suspended.');
        }

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('jwt_user_id', $user->id);

        return $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');

        if (str_starts_with($header, 'Bearer ')) {
            return trim(substr($header, 7));
        }

        return null;
    }
}
