import { router } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import RegionRegistrationController from '@/actions/App/Http/Controllers/Settings/RegionRegistrationController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { fromManilaInput, localDate, manilaInputNow } from '@/lib/manila-time';

/** Whether a region lets new HEI accounts in without approval. */
export type RegionRegistration = {
    id: number;
    name: string;
    open: boolean;
    /** When it closes by itself, if a time was set. */
    until: string | null;
};

/**
 * On-the-spot registration for the regions this user manager covers. New HEI
 * accounts normally wait under Pending; during an event a region can let its
 * HEIs straight in, until a set time or until it is switched off.
 *
 * The regions fold away under a summary that still says which ones are open.
 * A regional office's single region starts unfolded; the Central Office's
 * list starts folded.
 */
export function RegistrationPanel({
    regions,
}: {
    regions: RegionRegistration[];
}) {
    const titleId = useId();
    const [expanded, setExpanded] = useState(regions.length === 1);

    if (regions.length === 0) {
        return null;
    }

    const open = regions.filter((region) => region.open);
    const noun = regions.length === 1 ? 'region' : 'regions';

    return (
        <Collapsible open={expanded} onOpenChange={setExpanded} asChild>
            <section
                aria-labelledby={titleId}
                className="overflow-hidden rounded-xl border bg-card"
            >
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <h2 className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <span id={titleId}>Registration</span>
                            {open.length > 0 && <NoApprovalPill />}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {summary(open)}
                        </p>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="group/fold shrink-0"
                        >
                            {expanded
                                ? `Hide ${noun}`
                                : regions.length === 1
                                  ? 'Show region'
                                  : `Show ${regions.length} regions`}
                            <ChevronDown
                                aria-hidden
                                className="transition-transform group-data-[state=open]/fold:rotate-180"
                            />
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <ul className="divide-y border-t">
                        {regions.map((region) => (
                            <RegionRow key={region.id} region={region} />
                        ))}
                    </ul>
                </CollapsibleContent>
            </section>
        </Collapsible>
    );
}

/** What the folded list would show: which regions skip approval, if any. */
function summary(open: RegionRegistration[]): string {
    if (open.length === 0) {
        return 'New HEI accounts wait under Pending for approval. During an event, let a region’s HEIs in straight away.';
    }

    if (open.length === 1) {
        const [region] = open;

        return region.until
            ? `${region.name} lets HEIs in without approval until ${localDate(region.until)}.`
            : `${region.name} lets HEIs in without approval until it is switched off.`;
    }

    return `${open.length} regions let HEIs in without approval: ${new Intl.ListFormat('en', { type: 'conjunction' }).format(open.map((region) => region.name))}.`;
}

function NoApprovalPill() {
    return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            No approval
        </span>
    );
}

function RegionRow({ region }: { region: RegionRegistration }) {
    const labelId = useId();
    const titleId = useId();
    const untilId = useId();
    const [asking, setAsking] = useState(false);
    const [until, setUntil] = useState('');
    const [error, setError] = useState<string>();
    const [processing, setProcessing] = useState(false);

    function save(open: boolean) {
        router.put(
            RegionRegistrationController.update.url(region.id),
            open && until ? { open, until: fromManilaInput(until) } : { open },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setAsking(false),
                onError: (errors) => setError(errors.until),
            },
        );
    }

    return (
        <li className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span id={labelId}>{region.name}</span>
                    {region.open && <NoApprovalPill />}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {!region.open
                        ? 'Needs approval. New accounts wait under Pending.'
                        : region.until
                          ? `HEI accounts sign in straight away until ${localDate(region.until)}.`
                          : 'HEI accounts sign in straight away until you switch this off.'}
                </p>
            </div>
            <Popover
                open={asking}
                onOpenChange={(next) => {
                    // Stay put while the request runs, so the spinner is seen.
                    if (!processing) {
                        setAsking(next);
                    }
                }}
            >
                <PopoverAnchor asChild>
                    <Switch
                        checked={region.open}
                        aria-labelledby={labelId}
                        disabled={processing}
                        onCheckedChange={(checked) => {
                            if (!checked) {
                                // Back to approval: the safe way, so no question.
                                save(false);

                                return;
                            }

                            setUntil('');
                            setError(undefined);
                            setAsking(true);
                        }}
                    />
                </PopoverAnchor>
                <PopoverContent
                    role="dialog"
                    aria-labelledby={titleId}
                    align="end"
                    className="w-80 rounded-[10px] p-4"
                >
                    <p
                        id={titleId}
                        className="text-sm leading-snug font-medium text-pretty"
                    >
                        Let {region.name} HEIs in without approval?
                    </p>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-pretty text-muted-foreground">
                        Anyone who registers with an HEI in this region can sign
                        in straight away as an HEI User. Make focal persons HEI
                        Focal afterwards.
                    </p>
                    <div className="mt-4 grid gap-1.5">
                        <Label htmlFor={untilId}>
                            Close automatically at{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id={untilId}
                            type="datetime-local"
                            value={until}
                            min={manilaInputNow()}
                            onChange={(event) => setUntil(event.target.value)}
                            aria-describedby={`${untilId}-hint`}
                            aria-invalid={Boolean(error)}
                        />
                        <p
                            id={`${untilId}-hint`}
                            className="text-xs text-muted-foreground"
                        >
                            Philippine time. Leave it empty to keep registration
                            open until you switch it off.
                        </p>
                        <InputError message={error} />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setAsking(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={processing}
                            onClick={() => save(true)}
                        >
                            {processing && <Spinner />}
                            Open registration
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </li>
    );
}
