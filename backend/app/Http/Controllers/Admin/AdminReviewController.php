<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = Review::query()->with(['customer:id,name,email', 'company:id,name', 'car:id,brand,model']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where('text', 'like', "%{$search}%");
        }

        $perPage = min(100, max(1, (int) $request->query('limit', 25)));
        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function hide(Request $request, int $id): JsonResponse
    {
        TenantContext::clear();
        $review = Review::query()->findOrFail($id);
        $review->status = 'hidden';
        $review->save();

        $this->audit->log('review.hidden', $request->user(), 'Review', $review->id, [
            'reason' => $request->input('reason'),
        ], 'info', $request);

        return response()->json(['data' => $review]);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        TenantContext::clear();
        $review = Review::query()->findOrFail($id);
        $review->status = 'visible';
        $review->save();

        $this->audit->log('review.restored', $request->user(), 'Review', $review->id, [], 'info', $request);

        return response()->json(['data' => $review]);
    }
}
