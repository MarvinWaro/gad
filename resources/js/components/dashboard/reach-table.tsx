import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatCount, percentOf } from '@/lib/dashboard';
import type { DashboardProps } from '@/types/dashboard';

/**
 * Every region's participation, for when the "Every campus counts" card
 * shows only the leaders: a table in a dialog, in the card's order.
 */
export function ReachTable({
    regions,
    period,
}: {
    regions: DashboardProps['reach']['regions'];
    period: string;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 text-on-signature underline-offset-4 hover:bg-on-signature/10 hover:text-on-signature hover:underline"
                >
                    View all {regions.length} regions
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Participation by region</DialogTitle>
                    <DialogDescription>
                        Institutions contributing survey responses, {period}
                    </DialogDescription>
                </DialogHeader>
                <div className="-mx-6 min-h-0 overflow-y-auto border-t px-6">
                    <table className="w-full text-sm tabular-nums">
                        <caption className="sr-only">
                            Participation by region, {period}
                        </caption>
                        <thead className="sticky top-0 bg-background text-xs text-muted-foreground">
                            <tr className="border-b">
                                <th
                                    scope="col"
                                    className="py-2 pr-3 text-left font-medium"
                                >
                                    Region
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2 text-right font-medium"
                                >
                                    Contributing
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2 text-right font-medium"
                                >
                                    Active HEIs
                                </th>
                                <th
                                    scope="col"
                                    className="py-2 pl-3 text-right font-medium"
                                >
                                    Share
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {regions.map((region) => {
                                const share = percentOf(
                                    region.participating,
                                    region.total,
                                );

                                return (
                                    <tr
                                        key={region.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <th
                                            scope="row"
                                            className="py-2.5 pr-3 text-left font-normal"
                                        >
                                            {region.name}
                                        </th>
                                        <td className="px-3 py-2.5 text-right">
                                            {formatCount(region.participating)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-muted-foreground">
                                            {formatCount(region.total)}
                                        </td>
                                        <td className="py-2.5 pl-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <span
                                                    aria-hidden="true"
                                                    className="hidden h-2 w-12 overflow-hidden rounded-r-[4px] bg-muted sm:block"
                                                >
                                                    <span
                                                        className="block h-full rounded-r-[4px] bg-chart-bar"
                                                        style={{
                                                            width: `${share}%`,
                                                        }}
                                                    />
                                                </span>
                                                {share}%
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
