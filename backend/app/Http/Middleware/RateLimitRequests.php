<?php

namespace App\Http\Middleware;

use App\Services\RateLimiterService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class RateLimitRequests
{
    public function __construct(private readonly RateLimiterService $limiter) {}

    public function handle(Request $request, Closure $next, string $key = 'default', int $max = 60, int $windowSeconds = 60): Response
    {
        $identifier = $request->user()?->id
            ? "user:{$request->user()->id}:{$key}"
            : "ip:{$request->ip()}:{$key}";

        if (! $this->limiter->consume($identifier, $max, $windowSeconds)) {
            throw new TooManyRequestsHttpException(60, 'Too many requests, please slow down.');
        }

        return $next($request);
    }
}
