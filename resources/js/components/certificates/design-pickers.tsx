import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { BackgroundThumbnail } from '@/components/certificates/background-thumbnail';
import { SignatureTile } from '@/components/certificates/signatory-dialog';
import { selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import {
    backgroundLabels,
    CERTIFICATE_BACKGROUNDS,
} from '@/lib/certificate-page';
import { cn } from '@/lib/utils';
import type {
    CertificateKind,
    CertificateKindOption,
    Signatory,
} from '@/types/certificates';

/** A choice drawn as a card: a radio underneath, for the keyboard and readers. */
const choiceCard =
    'relative flex min-w-0 cursor-pointer rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:ring-1 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-60';

export function KindPicker({
    kinds,
    value,
    locked,
    onChange,
}: {
    kinds: CertificateKindOption[];
    value: CertificateKind;
    /** Used on events, so its kind stays. */
    locked: boolean;
    onChange: (kind: CertificateKindOption) => void;
}) {
    return (
        <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Kind</legend>
            <div className="grid gap-2 sm:grid-cols-2">
                {kinds.map((kind) => (
                    <label
                        key={kind.value}
                        className={cn(choiceCard, 'flex-col')}
                    >
                        <input
                            type="radio"
                            name="kind"
                            value={kind.value}
                            checked={value === kind.value}
                            disabled={locked && value !== kind.value}
                            onChange={() => onChange(kind)}
                            className="sr-only"
                        />
                        <span className="text-sm font-medium">
                            {kind.title}
                        </span>
                        <span className="mt-0.5 text-[13px] text-muted-foreground">
                            “{kind.lead} …”
                        </span>
                    </label>
                ))}
            </div>
            {locked && (
                <p className="text-[13px] text-muted-foreground">
                    Used on events, so its kind stays.
                </p>
            )}
        </fieldset>
    );
}

export function BackgroundPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (background: string) => void;
}) {
    return (
        <fieldset>
            <legend className="mb-2 text-sm font-medium">Background</legend>
            <div className="grid grid-cols-3 gap-2">
                {CERTIFICATE_BACKGROUNDS.map((background) => (
                    <label
                        key={background}
                        className={cn(
                            choiceCard,
                            'flex-col items-stretch gap-2 p-2',
                        )}
                    >
                        <input
                            type="radio"
                            name="background"
                            value={background}
                            checked={value === background}
                            onChange={() => onChange(background)}
                            className="sr-only"
                        />
                        <BackgroundThumbnail
                            background={background}
                            className="w-full"
                        />
                        <span className="text-center text-[13px] font-medium">
                            {backgroundLabels[background]}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/**
 * Who signs, left to right on the certificate: one to three of the office's
 * signatories, moved up and down, with the rest offered to add.
 */
export function SignatoryPicker({
    id,
    options,
    value,
    max,
    onChange,
    invalid,
}: {
    id: string;
    /** The office's signatories. */
    options: Signatory[];
    value: string[];
    max: number;
    onChange: (ids: string[]) => void;
    invalid: boolean;
}) {
    const chosen = value
        .map((signatoryId) =>
            options.find((option) => option.id === signatoryId),
        )
        .filter((option): option is Signatory => option !== undefined);
    const rest = options.filter((option) => !value.includes(option.id));

    function move(index: number, by: -1 | 1) {
        const next = [...value];
        [next[index], next[index + by]] = [next[index + by], next[index]];
        onChange(next);
    }

    return (
        <div className="grid gap-2">
            {chosen.length > 0 && (
                <ol className="divide-y rounded-lg border">
                    {chosen.map((signatory, index) => (
                        <li
                            key={signatory.id}
                            className="flex items-center gap-3 py-2 pr-1 pl-3"
                        >
                            <SignatureTile
                                src={signatory.signature}
                                name={signatory.name}
                                className="h-10 w-20 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {signatory.name}
                                </p>
                                <p className="truncate text-[13px] text-muted-foreground">
                                    {signatory.position}
                                </p>
                            </div>
                            <div className="flex shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-11"
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                >
                                    <ArrowUp />
                                    <span className="sr-only">
                                        Move {signatory.name} left
                                    </span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-11"
                                    disabled={index === chosen.length - 1}
                                    onClick={() => move(index, 1)}
                                >
                                    <ArrowDown />
                                    <span className="sr-only">
                                        Move {signatory.name} right
                                    </span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-11 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                        onChange(
                                            value.filter(
                                                (signatoryId) =>
                                                    signatoryId !==
                                                    signatory.id,
                                            ),
                                        )
                                    }
                                >
                                    <X />
                                    <span className="sr-only">
                                        Take {signatory.name} off
                                    </span>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
            {chosen.length < max && (
                <FormSelect
                    id={id}
                    className={selectClass}
                    value=""
                    disabled={rest.length === 0}
                    onChange={(signatoryId) =>
                        onChange([...value, signatoryId])
                    }
                    placeholder={
                        rest.length === 0
                            ? options.length === 0
                                ? 'This office has no signatories yet'
                                : 'Everyone is already on it'
                            : chosen.length === 0
                              ? 'Choose who signs'
                              : 'Add another signatory'
                    }
                    aria-invalid={invalid || undefined}
                    options={rest.map((option) => ({
                        value: option.id,
                        label: `${option.name}, ${option.position}`,
                    }))}
                />
            )}
        </div>
    );
}
