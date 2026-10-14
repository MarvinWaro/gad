import { ImagePlus, X } from 'lucide-react';
import { useRef } from 'react';
import { fieldClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { blankLabels, CERTIFICATE_BLANKS } from '@/lib/certificate-text';
import { cn } from '@/lib/utils';

/** `SaveCertificateDesignRequest`: the wording's length. */
export const BODY_MAX = 400;

/**
 * The wording after the name, with chips that put a blank in where the
 * cursor is. Certificates fill the blanks in for each person.
 */
export function WordingField({
    id,
    value,
    defaultBody,
    invalid,
    describedBy,
    onChange,
}: {
    id: string;
    value: string;
    /** The kind's own wording, to start again from. */
    defaultBody: string;
    invalid: boolean;
    describedBy?: string;
    onChange: (value: string) => void;
}) {
    const field = useRef<HTMLTextAreaElement>(null);

    function insert(blank: string) {
        const element = field.current;
        const token = `{${blank}}`;
        const start = element?.selectionStart ?? value.length;
        const end = element?.selectionEnd ?? value.length;
        onChange(`${value.slice(0, start)}${token}${value.slice(end)}`);

        requestAnimationFrame(() => {
            element?.focus();
            element?.setSelectionRange(
                start + token.length,
                start + token.length,
            );
        });
    }

    return (
        <div className="grid gap-2">
            <textarea
                ref={field}
                id={id}
                className={cn(fieldClass, 'min-h-28')}
                rows={4}
                value={value}
                maxLength={BODY_MAX}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
            />
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[13px] text-muted-foreground">
                    Insert:
                </span>
                {CERTIFICATE_BLANKS.map((blank) => (
                    <Button
                        key={blank}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-9 rounded-full px-3 text-[13px] font-normal"
                        onClick={() => insert(blank)}
                    >
                        {blankLabels[blank]}
                        <span className="sr-only"> blank</span>
                    </Button>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
                <span className="tabular-nums" aria-live="polite">
                    {value.length} of {BODY_MAX} characters
                </span>
                {value !== defaultBody && (
                    <button
                        type="button"
                        className="tap-target rounded-sm underline underline-offset-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() => onChange(defaultBody)}
                    >
                        Use the standard wording
                    </button>
                )}
            </div>
        </div>
    );
}

export type LogoItem = { key: string; url: string };

/**
 * Up to three extra logos, such as a partner HEI's, printed between the
 * CHED seal and Bagong Pilipinas.
 */
export function LogoField({
    id,
    logos,
    max,
    onAdd,
    onRemove,
    describedBy,
}: {
    id: string;
    logos: LogoItem[];
    max: number;
    onAdd: (file: File) => void;
    onRemove: (key: string) => void;
    describedBy?: string;
}) {
    const input = useRef<HTMLInputElement>(null);

    return (
        <div className="grid gap-2">
            {logos.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {logos.map((logo, index) => (
                        <li
                            key={logo.key}
                            className="relative flex size-20 items-center justify-center rounded-lg border bg-paper p-2"
                        >
                            <img
                                src={logo.url}
                                alt={`Logo ${index + 1}`}
                                className="max-h-full max-w-full object-contain"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="absolute -top-2 -right-2 size-8 rounded-full bg-background"
                                onClick={() => onRemove(logo.key)}
                            >
                                <X />
                                <span className="sr-only">
                                    Remove logo {index + 1}
                                </span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            {logos.length < max && (
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10"
                        aria-describedby={describedBy}
                        onClick={() => input.current?.click()}
                    >
                        <ImagePlus />
                        Add logo
                    </Button>
                </div>
            )}
            <input
                ref={input}
                id={id}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                tabIndex={-1}
                aria-label="Logo"
                onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                        onAdd(file);
                    }

                    event.target.value = '';
                }}
            />
        </div>
    );
}
