import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    answerField,
    detailField,
    isBlank,
    letterOf,
} from '@/lib/monitoring-draft';
import { formatAccomplishedDate } from '@/lib/monitoring-pdf';
import { cn } from '@/lib/utils';
import type {
    DetailKey,
    MonitoringPlace,
    MonitoringTemplate,
    TemplateSection,
} from '@/types/monitoring';
import { Field, fieldClass, panelClass } from './shared';

export type SectionsProps = {
    template: MonitoringTemplate;
    place: MonitoringPlace;
    value: (field: string) => string;
    editable: boolean;
    onChange?: (field: string, value: string) => void;
    /** Leaving a field saves what is waiting. */
    onBlur?: () => void;
    conflict?: (field: string) => string | undefined;
    onResolve?: (field: string, choice: 'saved' | 'mine') => void;
};

/** A field's element id, for labels and jump links. */
export function fieldId(field: string): string {
    return `field-${field.replace('.', '-')}`;
}

/** The form's page anchors, in order. */
export function sectionAnchors(template: MonitoringTemplate): string[] {
    return [
        'details',
        ...template.sections.map((section) => `section-${section.key}`),
        'signatories',
    ];
}

/** Everything on the official form, editable or as submitted. */
export function ReportSections(props: SectionsProps) {
    const { template } = props;

    return (
        <div className="space-y-6">
            <DetailsCard {...props} />
            <p className="text-sm text-muted-foreground">
                {template.columns.instruction}
                {props.editable &&
                    ' If a requirement does not apply to your institution, say why. Answers save as you type.'}
            </p>
            {template.sections.map((section) => (
                <SectionCard key={section.key} section={section} {...props} />
            ))}
            <SignatoriesCard {...props} />
        </div>
    );
}

function DetailsCard({
    template,
    place,
    value,
    editable,
    onChange,
    onBlur,
    conflict,
    onResolve,
}: SectionsProps) {
    const accomplished = value(detailField('accomplished_on'));

    return (
        <section
            id="details"
            aria-labelledby="details-heading"
            className={cn(panelClass, 'scroll-mt-below-header space-y-5')}
        >
            <header>
                <h2 id="details-heading" className="text-xl font-medium">
                    Institution details
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {template.title}{' '}
                    {template.subtitle.flat().map((run, index) =>
                        run.bold ? (
                            <strong key={index} className="font-medium">
                                {run.text}
                            </strong>
                        ) : (
                            <span key={index}>{run.text} </span>
                        ),
                    )}
                </p>
            </header>
            <dl className="grid gap-1">
                <dt className="text-sm font-medium">
                    {template.labels.institution}
                </dt>
                <dd>{place.hei.name}</dd>
                <dd className="text-sm text-muted-foreground">
                    {[place.cluster?.name, place.region?.name]
                        .filter(Boolean)
                        .join(' · ')}
                </dd>
            </dl>
            <DetailInput
                field="address"
                label={template.labels.address}
                multiline
                {...{ value, editable, onChange, onBlur, conflict, onResolve }}
            />
            {editable ? (
                <DetailInput
                    field="accomplished_on"
                    label={template.labels.accomplished_on}
                    type="date"
                    {...{
                        value,
                        editable,
                        onChange,
                        onBlur,
                        conflict,
                        onResolve,
                    }}
                />
            ) : (
                <ReadOnly
                    label={template.labels.accomplished_on}
                    text={formatAccomplishedDate(accomplished)}
                />
            )}
        </section>
    );
}

function SectionCard({
    section,
    ...props
}: SectionsProps & { section: TemplateSection }) {
    const headingId = `heading-${section.key}`;

    return (
        <section
            id={`section-${section.key}`}
            aria-labelledby={headingId}
            className={cn(panelClass, 'scroll-mt-below-header space-y-5')}
        >
            <header className="flex items-start gap-3">
                <span
                    aria-hidden
                    className="grid h-8 min-w-8 shrink-0 place-items-center rounded-full bg-brand-soft px-2 text-sm font-medium text-brand tabular-nums"
                >
                    {section.number.replace(/[.)]$/, '')}
                </span>
                <div className="min-w-0 pt-1">
                    <h2 id={headingId} className="text-lg font-medium">
                        {section.title}
                    </h2>
                    {section.detail && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {section.detail}
                        </p>
                    )}
                </div>
            </header>
            {section.items.map((item, index) => (
                <AnswerInput
                    key={item.key}
                    field={answerField(item.key)}
                    label={
                        section.layout === 'single'
                            ? 'Status of compliance'
                            : `${letterOf(index)} ${item.label}`
                    }
                    context={section.title}
                    {...props}
                />
            ))}
        </section>
    );
}

function SignatoriesCard({
    template,
    value,
    editable,
    onChange,
    onBlur,
    conflict,
    onResolve,
}: SectionsProps) {
    return (
        <section
            id="signatories"
            aria-labelledby="signatories-heading"
            className={cn(panelClass, 'scroll-mt-below-header space-y-5')}
        >
            <div>
                <h2 id="signatories-heading" className="text-xl font-medium">
                    Signatories
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Their names are printed on the signature lines. Each signs
                    over their name.
                </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                {template.signatories.map((signatory) => (
                    <DetailInput
                        key={signatory.key}
                        field={signatory.key}
                        label={signatory.role}
                        autoComplete="name"
                        {...{
                            value,
                            editable,
                            onChange,
                            onBlur,
                            conflict,
                            onResolve,
                        }}
                    />
                ))}
            </div>
        </section>
    );
}

type InputProps = Pick<
    SectionsProps,
    'value' | 'editable' | 'onChange' | 'onBlur' | 'conflict' | 'onResolve'
>;

function DetailInput({
    field: key,
    label,
    multiline = false,
    type = 'text',
    autoComplete,
    value,
    editable,
    onChange,
    onBlur,
    conflict,
    onResolve,
}: InputProps & {
    field: DetailKey;
    label: string;
    multiline?: boolean;
    type?: 'text' | 'date';
    autoComplete?: string;
}) {
    const field = detailField(key);
    const id = fieldId(field);
    const theirs = conflict?.(field);

    if (!editable) {
        return <ReadOnly label={label} text={value(field)} />;
    }

    const shared = {
        id,
        className: fieldClass,
        value: value(field),
        onBlur,
        'aria-invalid': theirs !== undefined,
        'aria-describedby': theirs !== undefined ? `${id}-conflict` : undefined,
    };

    return (
        <Field label={label} id={id}>
            {multiline ? (
                <textarea
                    {...shared}
                    rows={2}
                    maxLength={2000}
                    className={cn(fieldClass, 'field-sizing-content')}
                    onChange={(event) => onChange?.(field, event.target.value)}
                />
            ) : (
                <input
                    {...shared}
                    type={type}
                    maxLength={type === 'text' ? 255 : undefined}
                    autoComplete={autoComplete}
                    onChange={(event) => onChange?.(field, event.target.value)}
                />
            )}
            {theirs !== undefined && (
                <ConflictNotice
                    id={`${id}-conflict`}
                    theirs={
                        type === 'date'
                            ? formatAccomplishedDate(theirs)
                            : theirs
                    }
                    onResolve={(choice) => onResolve?.(field, choice)}
                />
            )}
        </Field>
    );
}

function AnswerInput({
    field,
    label,
    context,
    value,
    editable,
    onChange,
    onBlur,
    conflict,
    onResolve,
}: InputProps & { field: string; label: string; context: string }) {
    const id = fieldId(field);
    const theirs = conflict?.(field);

    if (!editable) {
        return <ReadOnly label={label} text={value(field)} />;
    }

    return (
        <Field
            label={
                <>
                    <span className="sr-only">{context}: </span>
                    {label}
                </>
            }
            id={id}
        >
            <textarea
                id={id}
                rows={4}
                maxLength={20000}
                className={cn(
                    fieldClass,
                    'field-sizing-content min-h-28 leading-relaxed',
                )}
                value={value(field)}
                onChange={(event) => onChange?.(field, event.target.value)}
                onBlur={onBlur}
                placeholder="Describe the actual situation at your institution…"
                aria-invalid={theirs !== undefined}
                aria-describedby={
                    theirs !== undefined ? `${id}-conflict` : undefined
                }
            />
            {theirs !== undefined && (
                <ConflictNotice
                    id={`${id}-conflict`}
                    theirs={theirs}
                    onResolve={(choice) => onResolve?.(field, choice)}
                />
            )}
        </Field>
    );
}

function ReadOnly({ label, text }: { label: string; text: string }) {
    return (
        <div className="space-y-1.5">
            <p className="text-sm font-medium">{label}</p>
            {isBlank(text) ? (
                <p className="text-sm text-muted-foreground">No answer</p>
            ) : (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {text.trim()}
                </p>
            )}
        </div>
    );
}

/** A colleague saved this field first; the person chooses whose text stays. */
function ConflictNotice({
    id,
    theirs,
    onResolve,
}: {
    id: string;
    theirs: string;
    onResolve: (choice: 'saved' | 'mine') => void;
}) {
    return (
        <div
            id={id}
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm"
        >
            <p className="font-medium">
                A colleague saved a different version while you were typing.
            </p>
            <p className="mt-1 text-muted-foreground">Their version:</p>
            <p className="mt-1 max-h-40 overflow-auto border-l-2 pl-3 break-words whitespace-pre-wrap">
                {isBlank(theirs) ? '(blank)' : theirs}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve('saved')}
                >
                    Use their version
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve('mine')}
                >
                    Keep mine
                </Button>
            </div>
        </div>
    );
}

/**
 * Jump links to each part of the form, with the answers entered so far.
 * On narrow screens it is a strip that scrolls sideways under the header.
 */
export function SectionRail({
    template,
    value,
}: {
    template: MonitoringTemplate;
    value: (field: string) => string;
}) {
    const anchors = sectionAnchors(template);
    const [active, setActive] = useState(anchors[0]);
    const items = template.sections.flatMap((section) => section.items);
    const entered = items.filter(
        (item) => !isBlank(value(answerField(item.key))),
    ).length;

    useEffect(() => {
        let frame = 0;
        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const offset =
                    parseFloat(
                        getComputedStyle(
                            document.documentElement,
                        ).getPropertyValue('--app-header'),
                    ) || 0;
                let visible = anchors[0];

                for (const id of anchors) {
                    const top = document
                        .getElementById(id)
                        ?.getBoundingClientRect().top;

                    if (top !== undefined && top <= offset + 120) {
                        visible = id;
                    }
                }

                setActive(visible);
            });
        };

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
        // The anchors are fixed for a template.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template.version]);

    const link = (id: string, label: string, complete: boolean) => (
        <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? 'location' : undefined}
            onClick={() => setActive(id)}
            className={cn(
                'flex shrink-0 items-start gap-2 rounded-md px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:max-w-none',
                active === id
                    ? 'bg-brand-soft font-medium text-brand'
                    : 'hover:bg-muted',
            )}
        >
            <span className="min-w-0 lg:flex-1">{label}</span>
            {complete && (
                <Check
                    aria-label="Complete"
                    className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                />
            )}
        </a>
    );

    return (
        <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">
                    {entered} of {items.length} answered
                </p>
                <div
                    role="progressbar"
                    aria-label="Requirements answered"
                    aria-valuenow={entered}
                    aria-valuemin={0}
                    aria-valuemax={items.length}
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                >
                    <div
                        className="h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
                        style={{
                            width: `${(entered / items.length) * 100}%`,
                        }}
                    />
                </div>
            </div>
            <nav
                aria-label="Report sections"
                className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0"
            >
                {link('details', 'Institution details', false)}
                {template.sections.map((section) =>
                    link(
                        `section-${section.key}`,
                        `${section.number} ${section.title}`,
                        section.items.every(
                            (item) => !isBlank(value(answerField(item.key))),
                        ),
                    ),
                )}
                {link('signatories', 'Signatories', false)}
            </nav>
        </div>
    );
}
