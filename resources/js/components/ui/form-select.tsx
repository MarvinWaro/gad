import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const emptyOptionValue = '__form_select_empty__';

export type FormSelectOption = { value: string; label: string };

export function FormSelect({
    value,
    onChange,
    placeholder,
    options,
    disabled = false,
    allowEmpty = false,
    emptyLabel = placeholder,
    wrap = false,
    className,
    contentClassName,
    id,
    name,
    tabIndex,
    'aria-describedby': describedBy,
    'aria-required': required,
    'aria-invalid': invalid,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: FormSelectOption[];
    disabled?: boolean;
    allowEmpty?: boolean;
    emptyLabel?: string;
    /** Let a long choice wrap onto a second line instead of being cut. */
    wrap?: boolean;
    className?: string;
    contentClassName?: string;
    id?: string;
    name?: string;
    tabIndex?: number;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
}) {
    return (
        <Select
            value={value}
            onValueChange={(nextValue) =>
                onChange(nextValue === emptyOptionValue ? '' : nextValue)
            }
            disabled={disabled}
            name={name}
        >
            <SelectTrigger
                id={id}
                tabIndex={tabIndex}
                aria-describedby={describedBy}
                aria-required={required}
                aria-invalid={invalid}
                // min-w-0: a long choice never pushes the field past its column.
                className={cn(
                    'h-11 w-full min-w-0 rounded-[10px]',
                    className,
                    wrap &&
                        'min-h-11 text-left whitespace-normal data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-2',
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent
                className={cn('rounded-[10px] shadow-lg', contentClassName)}
            >
                {allowEmpty && (
                    <SelectItem value={emptyOptionValue} data-value="">
                        {emptyLabel}
                    </SelectItem>
                )}
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        data-value={option.value}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
