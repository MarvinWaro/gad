import { useEffect, useState } from 'react';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface Region {
    id: number;
    name: string;
    code: string;
}

interface Hei {
    id: number;
    code: string | null;
    name: string | null;
    abbreviation: string | null;

    region_id: number | null;
    region_code: string | null;
    region_name: string | null;

    province: string | null;
    city_municipality: string | null;
    barangay: string | null;
    address: string | null;

    hei_type: string | null;
    status: string | null;
}

interface PaginationMeta {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
    from?: number;
    to?: number;
}

interface RegionsResponse {
    data: Region[];
}

interface HeisResponse {
    data: Hei[];
    meta?: PaginationMeta | null;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function HeiIndex() {
    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const [regions, setRegions] = useState<Region[]>([]);
    const [heis, setHeis] = useState<Hei[]>([]);

    const [regionId, setRegionId] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');

    const [page, setPage] = useState<number>(1);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    const [loadingRegions, setLoadingRegions] = useState<boolean>(false);

    const [loadingHeis, setLoadingHeis] = useState<boolean>(false);

    const [error, setError] = useState<string>('');

    /*
    |--------------------------------------------------------------------------
    | Search Debounce
    |--------------------------------------------------------------------------
    |
    | Prevents an API request on every single keystroke.
    |
    */

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [search]);

    /*
    |--------------------------------------------------------------------------
    | Fetch Regions
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const controller = new AbortController();

        const fetchRegions = async () => {
            setLoadingRegions(true);

            try {
                const response = await fetch('/api/regions', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch regions: ${response.status}`,
                    );
                }

                const result: RegionsResponse = await response.json();

                setRegions(result.data ?? []);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }

                console.error('Region error:', err);

                setError('Unable to load regions.');
            } finally {
                setLoadingRegions(false);
            }
        };

        void fetchRegions();

        return () => {
            controller.abort();
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Fetch HEIs
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const controller = new AbortController();

        const fetchHeis = async () => {
            setLoadingHeis(true);
            setError('');

            try {
                const params = new URLSearchParams();

                /*
                 * Region filter
                 */
                if (regionId !== '') {
                    params.set('region_id', regionId);
                }

                /*
                 * Search HEI name/code
                 */
                if (debouncedSearch.trim() !== '') {
                    params.set('search', debouncedSearch.trim());
                }

                /*
                 * Pagination
                 */
                params.set('page', page.toString());
                params.set('per_page', '25');

                const response = await fetch(`/api/heis?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch HEIs: ${response.status}`);
                }

                const result: HeisResponse = await response.json();

                setHeis(result.data ?? []);
                setMeta(result.meta ?? null);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }

                console.error('HEI error:', err);

                setError('Unable to load Higher Education Institutions.');

                setHeis([]);
            } finally {
                setLoadingHeis(false);
            }
        };

        void fetchHeis();

        return () => {
            controller.abort();
        };
    }, [regionId, debouncedSearch, page]);

    /*
    |--------------------------------------------------------------------------
    | Region Change
    |--------------------------------------------------------------------------
    */

    const handleRegionChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        setRegionId(event.target.value);
        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Search Change
    |--------------------------------------------------------------------------
    */

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    /*
    |--------------------------------------------------------------------------
    | Clear Filters
    |--------------------------------------------------------------------------
    */

    const clearFilters = () => {
        setRegionId('');
        setSearch('');
        setDebouncedSearch('');
        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const currentPage = meta?.current_page ?? page;
    const lastPage = meta?.last_page ?? 1;
    const total = meta?.total ?? heis.length;

    const previousPage = () => {
        if (currentPage > 1) {
            setPage(currentPage - 1);
        }
    };

    const nextPage = () => {
        if (currentPage < lastPage) {
            setPage(currentPage + 1);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Display HEI Address
    |--------------------------------------------------------------------------
    |
    | Laravel already returns "address", but this provides a fallback
    | in case it is empty.
    |
    */

    const getAddress = (hei: Hei): string => {
        if (hei.address && hei.address.trim() !== '') {
            return hei.address;
        }

        const parts = [
            hei.barangay,
            hei.city_municipality,
            hei.province,
            hei.region_name,
        ].filter(
            (value): value is string =>
                typeof value === 'string' && value.trim() !== '',
        );

        return parts.length > 0 ? parts.join(', ') : '-';
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Higher Education Institutions
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        List of Higher Education Institutions by region
                    </p>
                </div>

                {/* Filter Card */}

                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Region */}

                        <div>
                            <label
                                htmlFor="region"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Region
                            </label>

                            <select
                                id="region"
                                value={regionId}
                                onChange={handleRegionChange}
                                disabled={loadingRegions}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                            >
                                <option value="">
                                    {loadingRegions
                                        ? 'Loading regions...'
                                        : 'All Regions'}
                                </option>

                                {regions.map((region) => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}

                        <div>
                            <label
                                htmlFor="search"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Search HEI
                            </label>

                            <input
                                id="search"
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Search HEI name or code..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Clear */}

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Table Card */}

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* Table Header Information */}

                    <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                HEI List
                            </h2>

                            <p className="text-sm text-gray-500">
                                {loadingHeis
                                    ? 'Loading records...'
                                    : `${total} record${
                                          total !== 1 ? 's' : ''
                                      } found`}
                            </p>
                        </div>

                        {(regionId || search) && (
                            <div className="text-sm text-gray-500">
                                Filters applied
                            </div>
                        )}
                    </div>

                    {/* Table */}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-gray-600 uppercase">
                                        #
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-gray-600 uppercase">
                                        UII / HEI Code
                                    </th>

                                    <th className="min-w-[300px] px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                        HEI Name
                                    </th>

                                    <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                        Region
                                    </th>

                                    <th className="min-w-[350px] px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                        Address
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-gray-600 uppercase">
                                        HEI Type
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-gray-600 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {/* Loading */}

                                {loadingHeis && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                                                Loading HEIs...
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Empty */}

                                {!loadingHeis && heis.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="text-sm text-gray-500">
                                                No Higher Education Institutions
                                                found.
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* HEI Records */}

                                {!loadingHeis &&
                                    heis.map((hei, index) => (
                                        <tr
                                            key={hei.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            {/* Number */}

                                            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                                                {(currentPage - 1) *
                                                    (meta?.per_page ?? 25) +
                                                    index +
                                                    1}
                                            </td>

                                            {/* HEI Code */}

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-sm font-medium text-gray-900">
                                                    {hei.code ?? '-'}
                                                </span>
                                            </td>

                                            {/* HEI Name */}

                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {hei.name ?? '-'}
                                                </div>

                                                {hei.abbreviation && (
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {hei.abbreviation}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Region */}

                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {hei.region_name ?? '-'}
                                            </td>

                                            {/* Address */}

                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {getAddress(hei)}
                                            </td>

                                            {/* Type */}

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {hei.hei_type ? (
                                                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                        {hei.hei_type}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {hei.status ? (
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            hei.status.toLowerCase() ===
                                                            'active'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {hei.status}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}

                    {!loadingHeis && heis.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {lastPage}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={previousPage}
                                    disabled={currentPage <= 1}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={nextPage}
                                    disabled={currentPage >= lastPage}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
