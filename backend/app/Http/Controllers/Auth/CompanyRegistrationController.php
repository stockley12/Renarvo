<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Company;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\AuditService;
use App\Services\JwtService;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CompanyRegistrationController extends Controller
{
    public function __construct(
        private readonly JwtService $jwt,
        private readonly AuditService $audit,
        private readonly OtpService $otp,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:191'],
            'city' => ['required', 'string', 'max:64'],
            'phone' => ['required', 'string', 'max:32'],
            'otp_code' => ['required', 'string', 'max:8'],
            'tax_number' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:191'],
            'email_public' => ['nullable', 'email', 'max:191'],
            'description' => ['nullable', 'string', 'max:1000'],

            'owner_name' => ['required', 'string', 'max:191'],
            'owner_email' => ['required', 'email', 'max:191', 'unique:users,email'],
            'owner_password' => ['required', 'string', 'min:8'],
        ]);

        // Verify the company phone via SMS OTP before creating anything.
        $phone = $this->otp->normalizePhone($data['phone']);
        if (! $phone) {
            throw ValidationException::withMessages(['phone' => 'Please enter a valid mobile number.']);
        }
        $verify = $this->otp->verifyByPhone($phone, $data['otp_code']);
        if (! $verify instanceof OtpCode) {
            throw ValidationException::withMessages(['otp_code' => match ($verify) {
                'expired' => 'The code has expired. Please request a new one.',
                'locked' => 'Too many incorrect attempts. Please request a new code.',
                'not_found' => 'No active code found. Please request a new one.',
                default => 'The code is incorrect.',
            }]);
        }

        [$user, $company] = DB::transaction(function () use ($data, $phone) {
            $user = User::query()->create([
                'email' => strtolower($data['owner_email']),
                'password_hash' => Hash::make($data['owner_password']),
                'name' => $data['owner_name'],
                'phone' => $phone,
                'phone_verified_at' => now(),
                'role' => User::ROLE_COMPANY_OWNER,
                'locale' => 'tr',
            ]);

            $slug = $this->uniqueSlug($data['company_name']);

            $companyAttrs = [
                'owner_user_id' => $user->id,
                'slug' => $slug,
                'name' => $data['company_name'],
                'city' => $data['city'],
                'phone' => $data['phone'],
                'tax_number' => $data['tax_number'] ?? null,
                'address' => $data['address'] ?? null,
                'description' => $data['description'] ?? null,
                'status' => Company::STATUS_PENDING,
                'commission_rate_bps' => (int) config('services.platform.commission_bps'),
            ];
            if (! empty($data['email_public']) && Schema::hasColumn('companies', 'email_public')) {
                $companyAttrs['email_public'] = $data['email_public'];
            }
            $company = Company::query()->create($companyAttrs);

            return [$user, $company];
        });

        $this->audit->log('company.registered', $user, 'Company', $company->id, [
            'company_name' => $company->name,
        ], 'info', $request);

        $access = $this->jwt->issueAccessToken($user);
        $refresh = $this->jwt->issueRefreshToken($user, $request->ip(), (string) $request->userAgent());

        return response()->json([
            'data' => [
                'access_token' => $access,
                'expires_in' => $this->jwt->getAccessTtl(),
                'user' => new UserResource($user),
                'company' => [
                    'id' => $company->id,
                    'slug' => $company->slug,
                    'name' => $company->name,
                    'status' => $company->status,
                ],
            ],
        ])->cookie(
            'refresh_token',
            $refresh,
            (int) (config('services.jwt.refresh_ttl') / 60),
            '/',
            null,
            app()->environment('production'),
            true,
            false,
            'lax',
        );
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'company';
        $slug = $base;
        $i = 1;
        while (Company::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.++$i;
        }

        return $slug;
    }
}
