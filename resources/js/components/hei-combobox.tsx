import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type HeiOption = { id: number; name: string };

/**
 * Searchable picker for a higher education institution. Pass `name` to
 * submit the selected id with a native form (Inertia `<Form>`).
 */
export function HeiCombobox({
    value,
    onChange,
    options,
    id,
    name,
    placeholder = 'Search or select your HEI',
    allowClear = false,
    clearLabel = 'No institution',
    disabled = false,
    wrap = false,
    tabIndex,
    className,
    contentClassName,
    'aria-describedby': describedBy,
    'aria-invalid': invalid,
}: {
    value: string;
    onChange: (value: string) => void;
    options: HeiOption[];
    id?: string;
    name?: string;
    placeholder?: string;
    allowClear?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    /** Let a long name wrap onto a second line instead of being cut. */
    wrap?: boolean;
    tabIndex?: number;
    className?: string;
    /** Classes for the list, such as the public site's theme. */
    contentClassName?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = useMemo(
        () => options.find((option) => String(option.id) === value),
        [options, value],
    );

    function select(nextValue: string) {
        onChange(nextValue);
        setOpen(false);
    }

    return (
        // Modal keeps the list scrollable when the picker sits inside a dialog.
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    id={id}
                    role="combobox"
                    aria-expanded={open}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={disabled}
                    tabIndex={tabIndex}
                    className={cn(
                        'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-[6px] border border-input bg-transparent px-3 py-1 text-left text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                        wrap && 'h-auto min-h-11 py-2',
                        className,
                    )}
                >
                    <span
                        className={cn(
                            wrap
                                ? 'line-clamp-2 min-w-0 break-words'
                                : 'truncate',
                            !selected && 'text-muted-foreground',
                        )}
                    >
                        {selected?.name ?? placeholder}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className={cn(
                    'w-(--radix-popover-trigger-width) min-w-72 p-0',
                    contentClassName,
                )}
            >
                <Command>
                    <CommandInput placeholder="Type to search institutions…" />
                    <CommandList>
                        <CommandEmpty>No institution found.</CommandEmpty>
                        <CommandGroup>
                            {allowClear && value !== '' && (
                                <CommandItem
                                    value="__none__"
                                    onSelect={() => select('')}
                                    className="text-muted-foreground"
                                >
                                    {clearLabel}
                                </CommandItem>
                            )}
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={`${option.name} ${option.id}`}
                                    onSelect={() => select(String(option.id))}
                                >
                                    <Check
                                        className={cn(
                                            'size-4',
                                            String(option.id) === value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {/* Wrapped, so two long campus names
                                        never look the same. */}
                                    <span className="min-w-0 break-words">
                                        {option.name}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
            {name && <input type="hidden" name={name} value={value} />}
        </Popover>
    );
}
