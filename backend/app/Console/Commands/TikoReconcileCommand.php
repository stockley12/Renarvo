<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\Reservation;
use App\Services\TikoService;
use App\Support\TenantContext;
use Illuminate\Console\Command;

/**
 * Periodically poll TIKO for any payments still in a non-terminal state so
 * we don't depend exclusively on the async callback (which TIKO retries
 * "a few times a day" then gives up).
 */
class TikoReconcileCommand extends Command
{
    protected $signature = 'tiko:reconcile {--minutes=10 : Look back at payments newer than this}';
    protected $description = 'Reconcile pending TIKO payments by polling the gateway status endpoint.';

    public function __construct(private readonly TikoService $tiko)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        TenantContext::clear();

        if (! $this->tiko->isEnabled()) {
            $this->warn('TIKO mode is disabled or unconfigured. Nothing to do.');
            return self::SUCCESS;
        }

        $window = (int) $this->option('minutes');
        $since = now()->subMinutes(max(1, $window));

        $payments = Payment::query()
            ->where('provider', 'tiko')
            ->whereNotNull('order_id')
            ->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_AUTHORIZED])
            ->where('updated_at', '>=', $since)
            ->orderBy('id')
            ->limit(100)
            ->get();

        if ($payments->isEmpty()) {
            $this->info('No pending TIKO payments to reconcile.');
            return self::SUCCESS;
        }

        $reconciled = 0;
        foreach ($payments as $payment) {
            try {
                $result = $this->tiko->queryStatus($payment);
                $this->applyStatus($payment, $result);
                $reconciled++;
            } catch (\Throwable $e) {
                $this->warn("[#{$payment->id}] reconcile failed: {$e->getMessage()}");
            }
        }

        $this->info("Reconciled {$reconciled}/{$payments->count()} pending TIKO payments.");
        return self::SUCCESS;
    }

    private function applyStatus(Payment $payment, array $result): void
    {
        $reservation = $payment->reservation;
        switch ($result['status']) {
            case 'paid':
                $payment->status = Payment::STATUS_CAPTURED;
                $payment->captured_at = $payment->captured_at ?? now();
                $payment->save();
                if ($reservation) {
                    $reservation->payment_status = Reservation::PAYMENT_PAID;
                    $reservation->current_payment_id = $payment->id;
                    if ($reservation->status === Reservation::STATUS_PENDING) {
                        $reservation->status = Reservation::STATUS_CONFIRMED;
                    }
                    $reservation->save();
                }
                break;
            case 'cancelled':
                $payment->status = Payment::STATUS_CANCELLED;
                $payment->save();
                if ($reservation) {
                    $reservation->payment_status = Reservation::PAYMENT_CANCELLED;
                    $reservation->save();
                }
                break;
            case 'failed':
                $payment->status = Payment::STATUS_FAILED;
                $payment->save();
                if ($reservation) {
                    $reservation->payment_status = Reservation::PAYMENT_FAILED;
                    $reservation->save();
                }
                break;
            case 'pending':
            default:
                $payment->save();
                break;
        }
    }
}
