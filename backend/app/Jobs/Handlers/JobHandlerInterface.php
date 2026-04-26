<?php

namespace App\Jobs\Handlers;

interface JobHandlerInterface
{
    public function handle(array $payload): void;
}
