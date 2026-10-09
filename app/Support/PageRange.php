<?php

namespace App\Support;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * A list's page that no longer exists, because a change emptied it (its last
 * row deleted, or moved out of the filter), turns into the list's new last
 * page with the same filters. For Inertia list pages only: an API returns
 * the empty page with its meta. Never call it inside a deferred or
 * ->rescue()d prop, where a redirect would be lost or half applied.
 */
final class PageRange
{
    /**
     * @template TPage of LengthAwarePaginator<array-key, mixed>
     *
     * @param  TPage  $page
     * @return TPage
     *
     * @throws HttpResponseException to the last page when the page asked for is past it
     */
    public static function within(LengthAwarePaginator $page): LengthAwarePaginator
    {
        // Past the end, never "empty": a redirect can't then point at itself.
        if ($page->currentPage() <= $page->lastPage()) {
            return $page;
        }

        $request = request();
        if ($request->hasSession()) {
            // One more hop: keep the toast and any errors for the page it lands on.
            $request->session()->reflash();
        }
        $last = $page->lastPage();

        // The first page needs no number in the address.
        throw new HttpResponseException(redirect()->to($last > 1
            ? $request->fullUrlWithQuery([$page->getPageName() => $last])
            : $request->fullUrlWithoutQuery($page->getPageName())));
    }
}
