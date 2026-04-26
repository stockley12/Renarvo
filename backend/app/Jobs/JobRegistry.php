<?php

namespace App\Jobs;

use App\Jobs\Handlers\JobHandlerInterface;
use App\Jobs\Handlers\NotificationHandler;
use App\Jobs\Handlers\ReservationEventHandler;
use App\Jobs\Handlers\SendEmailHandler;
use InvalidArgumentException;

class JobRegistry
{
    public const SEND_EMAIL = 'send_email';
    public const CREATE_NOTIFICATION = 'create_notification';

    /** @var array<string, class-string<JobHandlerInterface>> */
    private array $map = [
        self::SEND_EMAIL => SendEmailHandler::class,
        self::CREATE_NOTIFICATION => NotificationHandler::class,
    ];

    /** @var string[] Reservation event types handled by ReservationEventHandler */
    private array $reservationEvents = [
        'email.reservation_confirmation',
        'email.reservation_confirmed',
        'email.reservation_rejected',
        'email.reservation_cancelled',
        'email.review_request',
        'notification.company_new_reservation',
    ];

    public function resolve(string $type): JobHandlerInterface
    {
        if (isset($this->map[$type])) {
            return app($this->map[$type]);
        }

        if (in_array($type, $this->reservationEvents, true)) {
            return new ReservationEventHandler($type);
        }

        throw new InvalidArgumentException("No handler registered for job type: {$type}");
    }
}
