<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyStaff;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CompanyStaffController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');

        $rows = CompanyStaff::query()
            ->where('company_id', $companyId)
            ->with('user:id,name,email,phone,status,last_login_at')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== User::ROLE_COMPANY_OWNER) {
            throw new AuthorizationException('Only owner can invite staff.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:manager,agent'],
        ]);

        $companyId = $request->attributes->get('company_id');

        $staff = DB::transaction(function () use ($data, $companyId) {
            $tempPassword = Str::random(16);
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'password_hash' => Hash::make($tempPassword),
                'role' => User::ROLE_COMPANY_STAFF,
                'locale' => 'tr',
            ]);

            return CompanyStaff::query()->create([
                'company_id' => $companyId,
                'user_id' => $user->id,
                'role' => $data['role'],
                'invited_at' => now(),
            ]);
        });

        $this->audit->log('staff.invited', $request->user(), 'CompanyStaff', $staff->id, [
            'invited_email' => $data['email'],
        ], 'info', $request);

        return response()->json(['data' => $staff->load('user:id,name,email')], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role !== User::ROLE_COMPANY_OWNER) {
            throw new AuthorizationException('Only owner can remove staff.');
        }

        $companyId = $request->attributes->get('company_id');
        $staff = CompanyStaff::query()->where('company_id', $companyId)->where('id', $id)->firstOrFail();
        $userId = $staff->user_id;

        DB::transaction(function () use ($staff, $userId) {
            $staff->delete();
            User::query()->where('id', $userId)->update(['token_version' => DB::raw('token_version + 1')]);
        });

        $this->audit->log('staff.removed', $request->user(), 'CompanyStaff', $id, [], 'info', $request);

        return response()->json(['data' => ['ok' => true]]);
    }
}
