<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyPublicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Company::query()->where('status', 'approved');

        if ($city = $request->query('city')) {
            $query->where('city', $city);
        }

        if ($search = $request->query('q')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $perPage = min(48, max(1, (int) $request->query('limit', 12)));
        $paginator = $query->orderByDesc('rating_avg')->paginate($perPage);

        return response()->json([
            'data' => CompanyResource::collection($paginator)->resolve(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $company = Company::query()
            ->where('slug', $slug)
            ->where('status', 'approved')
            ->firstOrFail();

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }
}
