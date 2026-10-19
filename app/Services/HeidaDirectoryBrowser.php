<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Browsing HEIDA, CHED's national HEI directory, for the public /hei page.
 *
 * HEIDA's developers asked not to be flooded with requests, so each reply is
 * kept for a while and a visitor never reaches HEIDA twice for the same page.
 * The nightly directory sync uses HeidaClient instead.
 */
class HeidaDirectoryBrowser
{
    /** HEIDA's regions rarely change. */
    private const REGIONS_CACHE_SECONDS = 86_400;

    private const HEIS_CACHE_SECONDS = 3_600;

    /**
     * HEIDA's region list, as it sends it.
     *
     * @return array<mixed>
     */
    public function regions(): array
    {
        return Cache::remember(
            'heida:browse:regions',
            self::REGIONS_CACHE_SECONDS,
            fn (): array => $this->get('regions', ['per_page' => 100]),
        );
    }

    /**
     * A page of HEIDA's HEIs, each with its place written out.
     *
     * @param  array{page: int, per_page: int, region_id?: string, search?: string}  $params
     * @return array{data: list<array<string, mixed>>, meta: mixed}
     */
    public function heis(array $params): array
    {
        return Cache::remember(
            'heida:browse:heis:'.sha1((string) json_encode($params)),
            self::HEIS_CACHE_SECONDS,
            function () use ($params): array {
                $json = $this->get('heis', $params);
                $rows = is_array($json['data'] ?? null) ? $json['data'] : [];
                $heis = array_values(array_map($this->hei(...), array_filter($rows, is_array(...))));

                return [
                    'data' => $heis,
                    'meta' => $json['meta'] ?? [
                        'total' => count($heis),
                        'per_page' => $params['per_page'],
                        'current_page' => $params['page'],
                        'last_page' => 1,
                    ],
                ];
            },
        );
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<mixed>
     */
    private function get(string $endpoint, array $query): array
    {
        try {
            $response = $this->request()->get("{$this->baseUrl()}/api/{$endpoint}", $query);
        } catch (ConnectionException $exception) {
            throw new RuntimeException("HEIDA could not be reached for /api/{$endpoint}.", previous: $exception);
        }

        $json = $response->json();

        if (! $response->successful() || ! is_array($json)) {
            throw new RuntimeException("HEIDA answered {$response->status()} for /api/{$endpoint}.");
        }

        return $json;
    }

    private function request(): PendingRequest
    {
        return Http::acceptJson()->connectTimeout(5)->timeout(15);
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.heida.url'), '/');
    }

    /**
     * @param  array<mixed>  $hei
     * @return array<string, mixed>
     */
    private function hei(array $hei): array
    {
        $region = $this->place($hei['region'] ?? null);
        $province = $this->place($hei['province'] ?? null);
        $city = $this->place($hei['city_municipality'] ?? null);
        $barangay = $this->place($hei['barangay'] ?? null);

        return [
            'id' => $hei['id'] ?? null,
            // The UII, CHED's code for the institution.
            'code' => $hei['code'] ?? null,
            'name' => $hei['name'] ?? null,
            'abbreviation' => $hei['abbreviation'] ?? null,
            'region_id' => $region['id'] ?? null,
            'region_code' => $region['code'] ?? null,
            'region_name' => $region['name'] ?? null,
            'province' => $province['name'] ?? null,
            'city_municipality' => $city['name'] ?? null,
            'barangay' => $barangay['name'] ?? null,
            'address' => implode(', ', array_filter([
                $barangay['name'] ?? null,
                $city['name'] ?? null,
                $province['name'] ?? null,
                $region['name'] ?? null,
            ])),
            'hei_type' => $hei['hei_type'] ?? null,
            'status' => $hei['status'] ?? null,
        ];
    }

    /** @return array<mixed>|null */
    private function place(mixed $place): ?array
    {
        return is_array($place) ? $place : null;
    }
}
