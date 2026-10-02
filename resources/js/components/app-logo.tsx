import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

/** The official icon and the app's name, for the sidebar and the phone menu. */
export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md border bg-white p-1">
                <AppLogoIcon className="size-6 object-contain" />
            </div>
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
