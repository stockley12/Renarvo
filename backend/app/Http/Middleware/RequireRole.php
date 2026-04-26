<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            throw new AuthorizationException('Authentication required.');
        }

        if (! in_array($user->role, $roles, true)) {
            throw new AuthorizationException('Insufficient role.');
        }

        return $next($request);
    }
}
