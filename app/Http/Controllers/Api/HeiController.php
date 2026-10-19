<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\BrowseHeisRequest;
use App\Services\HeidaDirectoryBrowser;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * HEIDA's regions and HEIs for the public /hei page, through
 * HeidaDirectoryBrowser so HEIDA is asked only once for each page.
 */
class HeiController extends Controller
{
    public function __construct(private readonly HeidaDirectoryBrowser $heida) {}

    /** GET /api/regions */
    public function regions(): JsonResponse
    {
        return $this->fromHeida(fn (): array => $this->heida->regions());
    }

    /** GET /api/heis */
    public function index(BrowseHeisRequest $request): JsonResponse
    {
        return $this->fromHeida(fn (): array => $this->heida->heis($request->params()));
    }

    /**
     * HEIDA's reply, or a plain 502 when it cannot be had. What went wrong
     * goes to the log, never to the visitor.
     *
     * @param  callable(): array<mixed>  $read
     */
    private function fromHeida(callable $read): JsonResponse
    {
        try {
            return response()->json($read());
        } catch (RuntimeException $exception) {
            report($exception);

            return response()->json(['message' => __('HEIDA could not be reached. Try again later.')], 502);
        }
    }
}
