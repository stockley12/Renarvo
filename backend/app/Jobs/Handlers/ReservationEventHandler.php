<?php

namespace App\Jobs\Handlers;

use App\Models\Notification;
use App\Models\Reservation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ReservationEventHandler implements JobHandlerInterface
{
    public function __construct(private readonly string $event) {}

    public function handle(array $payload): void
    {
        $reservationId = $payload['reservation_id'] ?? null;
        if (!$reservationId) {
            Log::warning('ReservationEventHandler missing reservation_id', $payload + ['event' => $this->event]);
            return;
        }

        $reservation = Reservation::query()
            ->with(['customer:id,email,name', 'company:id,name,owner_user_id', 'company.owner:id,email,name', 'car:id,brand,model'])
            ->find($reservationId);

        if (!$reservation) {
            Log::warning('ReservationEventHandler reservation not found', ['reservation_id' => $reservationId]);
            return;
        }

        switch ($this->event) {
            case 'email.reservation_confirmation':
                $this->mailCustomer($reservation, 'Reservation received', "Your reservation #{$reservation->code} has been received and is awaiting company confirmation.");
                break;

            case 'email.reservation_confirmed':
                $this->mailCustomer($reservation, 'Reservation confirmed', "Your reservation #{$reservation->code} is confirmed for {$reservation->pickup_at}.");
                Notification::query()->create([
                    'user_id' => $reservation->customer_id,
                    'type' => 'reservation_confirmed',
                    'title' => 'Reservation confirmed',
                    'body' => "Reservation #{$reservation->code} confirmed.",
                    'data' => ['reservation_id' => $reservation->id],
                ]);
                break;

            case 'email.reservation_rejected':
                $this->mailCustomer($reservation, 'Reservation rejected', "Unfortunately reservation #{$reservation->code} was rejected. Reason: {$reservation->cancellation_reason}");
                Notification::query()->create([
                    'user_id' => $reservation->customer_id,
                    'type' => 'reservation_rejected',
                    'title' => 'Reservation rejected',
                    'body' => "Reservation #{$reservation->code} rejected.",
                    'data' => ['reservation_id' => $reservation->id],
                ]);
                break;

            case 'email.reservation_cancelled':
                $this->mailCustomer($reservation, 'Reservation cancelled', "Reservation #{$reservation->code} has been cancelled.");
                break;

            case 'email.review_request':
                $this->mailCustomer($reservation, 'Tell us about your trip', "Hope you enjoyed your rental. Please leave a review for reservation #{$reservation->code}.");
                break;

            case 'notification.company_new_reservation':
                $owner = optional($reservation->company)->owner;
                if ($owner) {
                    Notification::query()->create([
                        'user_id' => $owner->id,
                        'type' => 'new_reservation',
                        'title' => 'New reservation',
                        'body' => "New reservation #{$reservation->code} from {$reservation->customer->name}.",
                        'data' => ['reservation_id' => $reservation->id],
                    ]);
                }
                break;

            default:
                Log::info('ReservationEventHandler unhandled event', ['event' => $this->event]);
        }
    }

    private function mailCustomer(Reservation $r, string $subject, string $body): void
    {
        $email = optional($r->customer)->email;
        if (!$email) {
            return;
        }
        try {
            Mail::raw($body, function ($message) use ($email, $subject) {
                $message->to($email)->subject('Renarvo: ' . $subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Mail send failed', ['email' => $email, 'error' => $e->getMessage()]);
        }
    }
}
