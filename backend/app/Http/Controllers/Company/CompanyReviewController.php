<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyReviewController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $reviews = Review::query()
            ->with(['customer:id,name', 'car:id,brand,model'])
            ->orderByDesc('id')
            ->paginate(min(50, max(1, (int) $request->query('limit', 20))));

        return response()->json([
            'data' => $reviews->getCollection(),
            'meta' => [
                'page' => $reviews->currentPage(),
                'total' => $reviews->total(),
                'has_next' => $reviews->hasMorePages(),
            ],
        ]);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['text' => ['required', 'string', 'max:2000']]);
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $review = Review::query()->findOrFail($id);
        $review->update([
            'company_reply' => $data['text'],
            'company_replied_at' => now(),
        ]);

        $this->audit->log('review.replied', $request->user(), 'Review', $review->id, [], 'info', $request);

        return response()->json(['data' => $review]);
    }
}
