<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Read-only client for HEIDA, CHED's national HEI directory.
 *
 * Only HEIDA's public endpoints are used, so no token is sent: its central
 * token can also change and delete HEIDA's records. HEIDA's developers asked
 * not to be flooded with requests, so pages are fetched one at a time with a
 * pause between them, and only the nightly directory sync calls this.
 *
 * @phpstan-type HeidaPlace array{code: string, name: string}
 * @phpstan-type HeidaHei array{code: string, name: string, status: ?string, hei_type: ?string, region: ?HeidaPlace, province: ?HeidaPlace}
 * @phpstan-type HeidaDirectory array{regions: list<HeidaPlace>, heis: list<HeidaHei>, calls: int}
 */
class HeidaClient
{
    private const PER_PAGE = 100;

    private const PAUSE_MILLISECONDS = 500;

    /** A stop in case HEIDA's paging ever misbehaves: 20,000 HEIs. */
    private const MAX_PAGES = 200;

    /** The longest HEIDA may ask us to wait after a 429. */
    private const MAX_RETRY_AFTER_SECONDS = 60;

    private int $calls = 0;

    /**
     * Every region and every HEI HEIDA lists, whatever its status.
     *
     * @return HeidaDirectory
     */
    public function directory(): array
    {
        $this->calls = 0;

        $regions = [];
        foreach ($this->page('regions', 1)['data'] as $row) {
            $regions[] = $this->place($row) ?? throw new RuntimeException('HEIDA sent a region without a code or name.');
        }

        $heis = [];
        $page = 1;
        do {
            if ($page > 1) {
                Sleep::for(self::PAUSE_MILLISECONDS)->milliseconds();
            }
            $body = $this->page('heis', $page);
            foreach ($body['data'] as $row) {
                $heis[] = $this->hei($row);
            }
            $page++;
        } while ($page <= $body['last_page'] && $page <= self::MAX_PAGES);

        return ['regions' => $regions, 'heis' => $heis, 'calls' => $this->calls];
    }

    /**
     * @return array{data: list<mixed>, last_page: int}
     */
    private function page(string $endpoint, int $page): array
    {
        $response = $this->get($endpoint, $page);

        // Asked to slow down: wait as long as HEIDA says, once.
        if ($response->status() === 429) {
            $seconds = min(max((int) $response->header('Retry-After'), 1), self::MAX_RETRY_AFTER_SECONDS);
            Sleep::for($seconds)->seconds();
            $response = $this->get($endpoint, $page);
        }

        if (! $response->successful()) {
            throw new RuntimeException("HEIDA answered {$response->status()} for /api/{$endpoint} (page {$page}).");
        }

        $data = $response->json('data');
        if (! is_array($data) || ! array_is_list($data)) {
            throw new RuntimeException("HEIDA sent an unexpected reply for /api/{$endpoint} (page {$page}).");
        }

        return ['data' => $data, 'last_page' => max(1, (int) $response->json('meta.last_page', 1))];
    }

    private function get(string $endpoint, int $page): Response
    {
        $this->calls++;

        try {
            return $this->request()->get("{$this->baseUrl()}/api/{$endpoint}", [
                'per_page' => self::PER_PAGE,
                'page' => $page,
            ]);
        } catch (ConnectionException) {
            throw new RuntimeException('HEIDA could not be reached. Check the connection and HEIDA_API_URL.');
        }
    }

    private function request(): PendingRequest
    {
        return Http::acceptJson()
            ->connectTimeout(5)
            ->timeout(30)
            // Retry a dropped connection or a server error twice, a little
            // later each time; any other answer is returned as it is.
            ->retry(
                2,
                fn (int $attempt): int => $attempt * 2000,
                fn (Throwable $exception): bool => $exception instanceof ConnectionException
                    || ($exception instanceof RequestException && $exception->response->serverError()),
                throw: false,
            );
    }

    private function baseUrl(): string
    {
        $url = rtrim((string) config('services.heida.url'), '/');

        return $url !== '' ? $url : throw new RuntimeException('HEIDA_API_URL is not set.');
    }

    /**
     * Only what the directory keeps. A row without a code or name is passed
     * on with them empty, for the sync to skip and count.
     *
     * @return HeidaHei
     */
    private function hei(mixed $row): array
    {
        if (! is_array($row)) {
            throw new RuntimeException('HEIDA sent an HEI that is not a record.');
        }

        return [
            'code' => is_scalar($row['code'] ?? null) ? trim((string) $row['code']) : '',
            'name' => is_string($row['name'] ?? null) ? Str::squish($row['name']) : '',
            'status' => is_string($row['status'] ?? null) ? Str::lower(trim($row['status'])) : null,
            'hei_type' => is_string($row['hei_type'] ?? null) ? Str::upper(trim($row['hei_type'])) : null,
            'region' => $this->place($row['region'] ?? null),
            'province' => $this->place($row['province'] ?? null),
        ];
    }

    /** @return HeidaPlace|null */
    private function place(mixed $place): ?array
    {
        if (! is_array($place) || ! is_scalar($place['code'] ?? null) || ! is_string($place['name'] ?? null)) {
            return null;
        }

        $code = trim((string) $place['code']);
        $name = Str::squish($place['name']);

        return $code !== '' && $name !== '' ? ['code' => $code, 'name' => $name] : null;
    }
}
