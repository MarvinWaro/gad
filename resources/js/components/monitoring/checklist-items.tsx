import { Circle, CircleCheck } from 'lucide-react';
import { readOnlyControlClass } from '@/components/survey-builder/read-only';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { TemplateItem } from '@/types/monitoring';

/**
 * A checklist's tick boxes under "Check all", two to a row from `sm`. The
 * chosen keys keep the checklist's order.
 */
export function ChecklistChoices({
    items,
    value,
    onChange,
    disabled = false,
}: {
    items: TemplateItem[];
    value: string[];
    onChange: (keys: string[]) => void;
    disabled?: boolean;
}) {
    const checked = new Set(value);
    const count = items.filter((item) => checked.has(item.key)).length;
    const all = count === items.length;
    const boxClass = cn(disabled && readOnlyControlClass);
    const labelClass = disabled ? 'cursor-default' : 'cursor-pointer';

    function toggle(key: string, on: boolean) {
        onChange(
            items
                .map((item) => item.key)
                .filter((itemKey) =>
                    itemKey === key ? on : checked.has(itemKey),
                ),
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 border-b pb-2">
                <label
                    className={cn(
                        'flex min-h-11 items-center gap-3 text-sm font-medium',
                        labelClass,
                    )}
                >
                    <Checkbox
                        className={boxClass}
                        disabled={disabled}
                        checked={
                            all ? true : count > 0 ? 'indeterminate' : false
                        }
                        onCheckedChange={() =>
                            onChange(all ? [] : items.map((item) => item.key))
                        }
                    />
                    Check all
                </label>
                <p
                    aria-live="polite"
                    className="text-sm text-muted-foreground tabular-nums"
                >
                    {count} of {items.length} checked
                </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
                {items.map((item) => (
                    <li key={item.key}>
                        <label
                            className={cn(
                                'flex h-full min-h-11 items-start gap-3 rounded-lg border p-3 text-sm leading-snug transition-colors has-[[data-state=checked]]:border-brand/40 has-[[data-state=checked]]:bg-brand-soft',
                                labelClass,
                                !disabled && 'hover:bg-muted/50',
                            )}
                        >
                            <Checkbox
                                className={cn('mt-px', boxClass)}
                                disabled={disabled}
                                checked={checked.has(item.key)}
                                onCheckedChange={(on) =>
                                    toggle(item.key, on === true)
                                }
                            />
                            {item.label}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** What an HEI checked, for reading: every item, marked checked or not. */
export function ChecklistAnswers({
    items,
    value,
}: {
    items: TemplateItem[];
    value: string[];
}) {
    const checked = new Set(value);

    return (
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {items.map((item) => {
                const on = checked.has(item.key);
                const Icon = on ? CircleCheck : Circle;

                return (
                    <li
                        key={item.key}
                        className={cn(
                            'flex items-start gap-2.5 text-sm leading-snug',
                            !on && 'text-muted-foreground',
                        )}
                    >
                        <Icon
                            aria-hidden
                            className={cn(
                                'mt-px size-4 shrink-0',
                                on && 'text-brand',
                            )}
                        />
                        <span>
                            <span className="sr-only">
                                {on ? 'Checked: ' : 'Not checked: '}
                            </span>
                            {item.label}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
