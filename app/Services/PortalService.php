<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Read-only client for the CHEDRO XII portal.
 *
 * Only the HEI directory is consumed here. The portal is treated as an
 * unreliable dependency: a successful payload is kept for seven days and
 * served as a stale fallback whenever a later fetch fails, so a portal outage
 * degrades the admin view rather than the public survey.
 */
class PortalService
{
    private const CACHE_KEY = 'portal:heis';

    private const FRESH_SECONDS = 600;

    private const FALLBACK_DAYS = 7;

    /**
     * @return array<int, array<string, string|null>>
     */
    public function fetchAllHei(bool $force = false): array
    {
        return $this->heiSnapshot($force)['data'];
    }

    public function isConfigured(): bool
    {
        return filled(config('services.portal.key'))
            && filled(config('services.portal.base_url'));
    }

    /**
     * @return array{data: array<int, array<string, string|null>>, last_fetched_at: ?string, stale: bool, error: ?string}
     */
    public function heiSnapshot(bool $force = false): array
    {
        $key = self::CACHE_KEY;

        if (! $force && ($cached = Cache::get($key))) {
            return $cached + ['stale' => false, 'error' => null];
        }

        $lock = Cache::lock($key.':refresh', 60);
        if (! $lock->get()) {
            return $this->fallback($key, 'A refresh is already in progress. Please try again shortly.');
        }

        try {
            if (! $force && ($cached = Cache::get($key))) {
                return $cached + ['stale' => false, 'error' => null];
            }

            $rows = $this->request();
            $snapshot = ['data' => $rows, 'last_fetched_at' => now()->toIso8601String()];

            Cache::put($key.':last_success', $snapshot, now()->addDays(self::FALLBACK_DAYS));
            Cache::put($key, $snapshot, self::FRESH_SECONDS);

            return $snapshot + ['stale' => false, 'error' => null];
        } catch (\Throwable $exception) {
            // The message is logged without the payload so portal credentials
            // and institution records never reach the log.
            Log::warning('Portal HEI fetch failed', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return $this->fallback($key, 'Could not fetch the HEI list from the CHED portal. Please check the connection and try again.');
        } finally {
            $lock->release();
        }
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function request(): array
    {
        $apiKey = (string) config('services.portal.key');
        $baseUrl = (string) config('services.portal.base_url');

        if ($apiKey === '' || $baseUrl === '') {
            throw new RuntimeException('Portal credentials are not configured.');
        }

        $response = Http::withHeaders(['PORTAL-API' => $apiKey])
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(15)
            ->retry(2, 300)
            ->get(rtrim($baseUrl, '/').'/fetch-all-hei');

        $response->throw();

        // Associative decoding turns an empty JSON object into [], which is
        // indistinguishable from an empty list, so check the raw body first.
        if (is_object(json_decode($response->body()))) {
            throw new RuntimeException('Invalid portal response.');
        }

        return $this->normalize($response->json());
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function normalize(mixed $data): array
    {
        if (is_string($data) && str_starts_with($data, 'Array[')) {
            $data = json_decode(substr($data, 5), true);
        }
        if (! is_array($data) || ! array_is_list($data)) {
            throw new RuntimeException('Invalid portal response.');
        }

        $fields = array_fill_keys([
            'instCode', 'instName', 'instOwnership', 'province', 'municipalityCity',
            'status', 'xCoordinate', 'yCoordinate', 'ownershipSector', 'ownershipHei_type',
        ], null);

        foreach ($data as $row) {
            foreach (['instCode', 'instName'] as $field) {
                if (! is_array($row) || ! isset($row[$field]) || ! is_string($row[$field]) || trim($row[$field]) === '') {
                    throw new RuntimeException('Invalid portal record.');
                }
            }
            foreach (['instOwnership', 'province', 'municipalityCity', 'ownershipSector', 'ownershipHei_type'] as $field) {
                if (isset($row[$field]) && ! is_string($row[$field])) {
                    throw new RuntimeException('Invalid portal field.');
                }
            }
        }

        $rows = array_map(
            fn (array $row): array => array_intersect_key($row, $fields) + $fields,
            $data,
        );

        return collect($rows)
            ->sortBy('instName', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    /**
     * @return array{data: array<int, array<string, string|null>>, last_fetched_at: ?string, stale: bool, error: string}
     */
    private function fallback(string $key, string $message): array
    {
        $previous = Cache::get($key.':last_success');

        return ($previous ?? ['data' => [], 'last_fetched_at' => null])
            + ['stale' => true, 'error' => $message];
    }
}
