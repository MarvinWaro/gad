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
                className={cn('h-11 w-full rounded-[10px]', className)}
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
