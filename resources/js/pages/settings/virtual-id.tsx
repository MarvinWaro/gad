import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { VirtualIdCard } from '@/components/virtual-id-card';
import type { VirtualId as VirtualIdData } from '@/components/virtual-id-card';

export default function VirtualId({ card }: { card: VirtualIdData }) {
    return (
        <>
            <Head title="Virtual ID" />

            <h1 className="sr-only">Virtual ID</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Virtual ID"
                    description="Show this at GAD events so staff can check you in. It uses the name and photo on your profile."
                />

                <VirtualIdCard card={card} />
            </div>
        </>
    );
}
