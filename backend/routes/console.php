<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('renarvo:process-jobs')->everyMinute()->withoutOverlapping();
Schedule::command('renarvo:auto-complete-reservations')->everyMinute();
Schedule::command('renarvo:auto-cancel-pending')->everyFiveMinutes();
Schedule::command('renarvo:refresh-fx-rates')->dailyAt('06:00')->timezone('Europe/Istanbul');
Schedule::command('renarvo:rotate-logs')->dailyAt('03:00')->timezone('Europe/Istanbul');
Schedule::command('renarvo:purge-audit-log')->dailyAt('04:00')->timezone('Europe/Istanbul');
Schedule::command('renarvo:send-pickup-reminders')->dailyAt('08:00')->timezone('Europe/Istanbul');
Schedule::command('renarvo:check-document-expiry')->dailyAt('09:00')->timezone('Europe/Istanbul');
Schedule::command('renarvo:generate-payouts')->weeklyOn(0, '02:00')->timezone('Europe/Istanbul');
