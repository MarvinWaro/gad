<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;
use Throwable;

class HeiController extends Controller
{
    /**
     * HEIDA base URL.
     */
    private function baseUrl(): string
    {
        return rtrim(
            config('services.heida.url', 'https://v2.heida.ched.gov.ph'),
            '/'
        );
    }

    /**
     * HEIDA Bearer token.
     */
    private function token(): ?string
    {
        return config('services.heida.token');
    }

    /**
     * Get Regions
     *
     * GET /api/regions
     */
    public function regions(): JsonResponse
    {
        try {
            $url = $this->baseUrl() . '/api/regions';

          $response = Http::withoutVerifying()
            ->acceptJson()
            ->timeout(30)
            ->get($url, [
                'per_page' => 100,
            ]);

            if ($response->failed()) {
                return response()->json([
                    'message' => 'HEIDA failed to return regions.',
                    'heida_url' => $url,
                    'status' => $response->status(),
                    'response' => $response->json()
                        ?? $response->body(),
                ], 502);
            }

            return response()->json(
                $response->json()
            );
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Unable to connect to HEIDA.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get HEIs
     *
     * GET /api/heis
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $url = $this->baseUrl() . '/api/heis';

            $params = [
                'per_page' => $request->integer(
                    'per_page',
                    25
                ),

                'page' => $request->integer(
                    'page',
                    1
                ),
            ];

            /*
            |--------------------------------------------------------------------------
            | Region Filter
            |--------------------------------------------------------------------------
            */

            if ($request->filled('region_id')) {
                $params['region_id'] =
                    $request->input('region_id');
            }

            /*
            |--------------------------------------------------------------------------
            | Search
            |--------------------------------------------------------------------------
            */

            if ($request->filled('search')) {
                $params['search'] =
                    $request->input('search');
            }

            /*
            |--------------------------------------------------------------------------
            | Request HEIDA
            |--------------------------------------------------------------------------
            */

           $response = Http::withoutVerifying()
                ->acceptJson()
                ->timeout(30)
                ->get($url, $params);

            if ($response->failed()) {
                return response()->json([
                    'message' => 'HEIDA failed to return HEIs.',
                    'heida_url' => $url,
                    'status' => $response->status(),
                    'response' => $response->json()
                        ?? $response->body(),
                ], 502);
            }

            $json = $response->json();

            /*
            |--------------------------------------------------------------------------
            | Transform HEIDA data
            |--------------------------------------------------------------------------
            */

            $heis = collect($json['data'] ?? [])
                ->map(function (array $hei) {

                    $region =
                        $hei['region'] ?? null;

                    $province =
                        $hei['province'] ?? null;

                    $city =
                        $hei['city_municipality'] ?? null;

                    $barangay =
                        $hei['barangay'] ?? null;

                    /*
                    |--------------------------------------------------------------------------
                    | Build Address
                    |--------------------------------------------------------------------------
                    */

                    $addressParts = array_filter([
                        is_array($barangay)
                            ? ($barangay['name'] ?? null)
                            : null,

                        is_array($city)
                            ? ($city['name'] ?? null)
                            : null,

                        is_array($province)
                            ? ($province['name'] ?? null)
                            : null,

                        is_array($region)
                            ? ($region['name'] ?? null)
                            : null,
                    ]);

                    return [
                        'id' =>
                            $hei['id'] ?? null,

                        /*
                         * UII / HEI Code
                         */
                        'code' =>
                            $hei['code'] ?? null,

                        /*
                         * HEI
                         */
                        'name' =>
                            $hei['name'] ?? null,

                        'abbreviation' =>
                            $hei['abbreviation'] ?? null,

                        /*
                         * Region
                         */
                        'region_id' =>
                            is_array($region)
                                ? ($region['id'] ?? null)
                                : null,

                        'region_code' =>
                            is_array($region)
                                ? ($region['code'] ?? null)
                                : null,

                        'region_name' =>
                            is_array($region)
                                ? ($region['name'] ?? null)
                                : null,

                        /*
                         * Province
                         */
                        'province' =>
                            is_array($province)
                                ? ($province['name'] ?? null)
                                : null,

                        /*
                         * City / Municipality
                         */
                        'city_municipality' =>
                            is_array($city)
                                ? ($city['name'] ?? null)
                                : null,

                        /*
                         * Barangay
                         */
                        'barangay' =>
                            is_array($barangay)
                                ? ($barangay['name'] ?? null)
                                : null,

                        /*
                         * Full Address
                         */
                        'address' =>
                            implode(', ', $addressParts),

                        /*
                         * HEI Type
                         */
                        'hei_type' =>
                            $hei['hei_type'] ?? null,

                        /*
                         * Status
                         */
                        'status' =>
                            $hei['status'] ?? null,
                    ];
                })
                ->values();

            /*
            |--------------------------------------------------------------------------
            | Return to React
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'data' => $heis,

                'meta' =>
                    $json['meta'] ?? [
                        'total' => $heis->count(),
                        'per_page' =>
                            $request->integer(
                                'per_page',
                                25
                            ),
                        'current_page' =>
                            $request->integer(
                                'page',
                                1
                            ),
                        'last_page' => 1,
                    ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' =>
                    'Unable to connect to HEIDA.',

                'error' =>
                    $e->getMessage(),
            ], 500);
        }
    }
}