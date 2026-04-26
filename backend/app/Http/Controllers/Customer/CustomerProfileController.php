<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\Reservation;
use App\Models\Review;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerProfileController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing(['ownedCompany', 'staffCompany']);

        return response()->json(['data' => (new UserResource($user))->resolve()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'locale' => ['nullable', 'in:tr,en,ru'],
        ]);

        $user = $request->user();
        $user->fill($data)->save();

        $this->audit->log('user.profile_updated', $user, 'User', $user->id, $data, 'info', $request);

        return response()->json(['data' => (new UserResource($user))->resolve()]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'email' => 'deleted-'.$user->id.'@deleted.local',
            'name' => 'Deleted user',
            'phone' => null,
            'status' => 'banned',
            'token_version' => $user->token_version + 1,
        ]);
        $user->delete();

        $this->audit->log('user.deleted', $user, 'User', $user->id, [], 'critical', $request);

        return response()->json(['data' => ['ok' => true]]);
    }

    public function dataExport(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'user' => (new UserResource($user))->resolve(),
                'reservations' => Reservation::query()->where('customer_id', $user->id)->get(),
                'reviews' => Review::query()->where('customer_id', $user->id)->get(),
                'audit_log' => AuditLog::query()->where('actor_id', $user->id)->get(),
            ],
        ]);
    }
}
