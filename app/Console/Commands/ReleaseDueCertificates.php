<?php

namespace App\Console\Commands;

use App\Actions\Certificates\ManageEventCertificate;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Event certificates go out by themselves when the event ends
 * (docs/certificates.md, decided 2026-10-14): to everyone present on every
 * day, guests too, and later to anyone who earns one since, such as days
 * marked from the paper sheet. Scheduled every minute. Events that ended
 * over RECENT_DAYS ago are left to staff, who can still release by hand.
 */
class ReleaseDueCertificates extends Command
{
    /** How long after an event ends its certificates still go out by themselves. */
    public const RECENT_DAYS = 30;

    protected $signature = 'certificates:release-due';

    /** Whether the event's certificates still go out by themselves: it hasn't ended, or ended lately. */
    public static function stillAutomatic(GadEvent $event): bool
    {
        return GadEvent::localNow()->subDays(self::RECENT_DAYS)->lessThan($event->finishesAt());
    }

    protected $description = 'Release the certificates of GAD events that have ended to everyone present on every day';

    public function handle(ManageEventCertificate $certificates): int
    {
        $now = GadEvent::localNow();
        $since = $now->subDays(self::RECENT_DAYS);
        $given = 0;

        GadEventCertificate::query()
            ->whereHas('event', fn (Builder $query) => $query
                ->inStatus('ended', $now)
                ->where('category', '!=', 'deadline')
                ->where(fn (Builder $query) => $query
                    ->where('ends_at', '>=', $since)
                    ->orWhere(fn (Builder $query) => $query->whereNull('ends_at')->where('starts_at', '>=', $since->startOfDay()))))
            ->with(['event.region', 'design.signatories'])
            ->chunkById(100, function (Collection $uses) use ($certificates, &$given): void {
                $uses->each(function (GadEventCertificate $use) use ($certificates, &$given): void {
                    // One that can't print waits, and its release page says why.
                    if ($certificates->printProblem($use) !== null
                        || ($use->awaitingUsers()->doesntExist() && $use->awaitingGuests()->doesntExist())) {
                        return;
                    }

                    $given += $certificates->release(null, $use);
                });
            });

        $this->info("Gave {$given} certificates.");

        return self::SUCCESS;
    }
}
