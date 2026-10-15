import { Eye, EyeOff } from 'lucide-react';
import type { ChangeEvent, ComponentProps, Ref } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import PasswordStrength from '@/components/password-strength';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = Omit<ComponentProps<'input'>, 'type'> & {
    ref?: Ref<HTMLInputElement>;
    /** A new password's `passwordrules`: shows the strength meter under it. */
    strengthRules?: string;
};

export default function PasswordInput({
    className,
    ref,
    strengthRules,
    onChange,
    ...props
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [value, setValue] = useState('');
    const input = useRef<HTMLInputElement | null>(null);
    const meterId = useId();

    const setRefs = useCallback(
        (element: HTMLInputElement | null) => {
            input.current = element;
            if (typeof ref === 'function') ref(element);
            else if (ref) ref.current = element;
        },
        [ref],
    );

    // Inertia's <Form> clears a field without an input event; catch up after.
    useEffect(() => {
        if (strengthRules !== undefined && input.current?.value !== value) {
            setValue(input.current?.value ?? '');
        }
    });

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        onChange?.(event);
    };

    const showMeter = strengthRules !== undefined && value !== '';

    return (
        <>
            <div className="relative">
                <Input
                    type={showPassword ? 'text' : 'password'}
                    className={cn('pr-10', className)}
                    ref={setRefs}
                    onChange={handleChange}
                    {...props}
                    aria-describedby={
                        [props['aria-describedby'], showMeter && meterId]
                            .filter(Boolean)
                            .join(' ') || undefined
                    }
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                    }
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="size-4" />
                    ) : (
                        <Eye className="size-4" />
                    )}
                </button>
            </div>
            {strengthRules !== undefined && (
                <PasswordStrength
                    id={meterId}
                    rules={strengthRules}
                    value={value}
                />
            )}
        </>
    );
}
