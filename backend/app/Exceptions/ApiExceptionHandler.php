<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class ApiExceptionHandler
{
    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if (! $request->is('api/*') && ! $request->expectsJson()) {
            return null;
        }

        if ($e instanceof ValidationException) {
            return self::envelope(
                'VALIDATION_FAILED',
                'The given data was invalid.',
                422,
                $e->errors(),
            );
        }

        if ($e instanceof AuthenticationException) {
            return self::envelope('UNAUTHENTICATED', 'Authentication required.', 401);
        }

        if ($e instanceof AuthorizationException) {
            return self::envelope('FORBIDDEN', $e->getMessage() ?: 'This action is unauthorized.', 403);
        }

        if ($e instanceof ModelNotFoundException) {
            return self::envelope('NOT_FOUND', 'Resource not found.', 404);
        }

        if ($e instanceof NotFoundHttpException) {
            return self::envelope('NOT_FOUND', 'Endpoint not found.', 404);
        }

        if ($e instanceof TooManyRequestsHttpException) {
            return self::envelope('RATE_LIMITED', 'Too many requests.', 429);
        }

        if ($e instanceof HttpExceptionInterface) {
            $code = match ($e->getStatusCode()) {
                400 => 'BAD_REQUEST',
                401 => 'UNAUTHENTICATED',
                403 => 'FORBIDDEN',
                404 => 'NOT_FOUND',
                409 => 'CONFLICT',
                422 => 'VALIDATION_FAILED',
                default => 'HTTP_ERROR',
            };

            return self::envelope($code, $e->getMessage() ?: 'Request failed.', $e->getStatusCode());
        }

        $debug = config('app.debug');

        return self::envelope(
            'SERVER_ERROR',
            $debug ? $e->getMessage() : 'An unexpected error occurred.',
            500,
            $debug ? ['trace' => collect($e->getTrace())->take(10)->all()] : null,
        );
    }

    private static function envelope(string $code, string $message, int $status, ?array $details = null): JsonResponse
    {
        $payload = [
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];

        if ($details !== null) {
            $payload['error']['details'] = $details;
        }

        return response()->json($payload, $status);
    }
}
