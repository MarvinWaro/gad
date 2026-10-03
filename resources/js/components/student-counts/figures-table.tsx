import { SexSplitBar } from '@/components/sex-split-bar';
import { formatCount, percentOf } from '@/lib/dashboard';
import type { DisciplineFigures } from '@/types/statistics';

/**
 * Enrollment or graduates by discipline group, with every figure printed:
 * the Settings page's list and the dashboard's "View data".
 */
export function FiguresTable({
    groups,
    caption,
}: {
    groups: DisciplineFigures[];
    caption: string;
}) {
    const female = groups.reduce((sum, group) => sum + group.female, 0);
    const male = groups.reduce((sum, group) => sum + group.male, 0);

    return (
        // On phones the table scrolls sideways; the box takes focus so the
        // keyboard can scroll it too.
        <div
            role="region"
            aria-label={caption}
            tabIndex={0}
            className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
            <table className="w-full min-w-[36rem] text-left text-sm tabular-nums">
                <caption className="sr-only">{caption}</caption>
                <thead className="border-b bg-muted/50 text-xs">
                    <tr>
                        <th scope="col" className="px-5 py-3 font-medium">
                            Discipline group
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right font-medium"
                        >
                            Female
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right font-medium"
                        >
                            Male
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right font-medium"
                        >
                            Total
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                            Female share
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {groups.map((group) => (
                        <FiguresRow
                            key={group.id}
                            name={group.name}
                            female={group.female}
                            male={group.male}
                        />
                    ))}
                </tbody>
                <tfoot className="border-t-2 font-medium">
                    <FiguresRow name="Total" female={female} male={male} />
                </tfoot>
            </table>
        </div>
    );
}

function FiguresRow({
    name,
    female,
    male,
}: {
    name: string;
    female: number;
    male: number;
}) {
    const total = female + male;

    return (
        <tr>
            <th scope="row" className="px-5 py-3 text-left font-medium">
                {name}
            </th>
            <td className="px-4 py-3 text-right">{formatCount(female)}</td>
            <td className="px-4 py-3 text-right">{formatCount(male)}</td>
            <td className="px-4 py-3 text-right">{formatCount(total)}</td>
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <span className="w-10 text-right">
                        {percentOf(female, total)}%
                    </span>
                    <SexSplitBar female={female} male={male} className="w-28" />
                </div>
            </td>
        </tr>
    );
}
