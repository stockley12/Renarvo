<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\CompanyStaff;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BindCompanyContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            throw new AuthorizationException('Authentication required.');
        }

        $companyId = match ($user->role) {
            'company_owner' => Company::query()->where('owner_user_id', $user->id)->value('id'),
            'company_staff' => CompanyStaff::query()->where('user_id', $user->id)->value('company_id'),
            default => null,
        };

        if (! $companyId) {
            throw new AuthorizationException('No company context for this user.');
        }

        $request->attributes->set('company_id', $companyId);

        return $next($request);
    }
}
