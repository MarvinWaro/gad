import { Circle, CircleCheck } from 'lucide-react';
import { checkPassword } from '@/lib/password-strength';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';

/**
 * How strong a new password is, under its field: four segments that fill
 * and change colour, the word for it, and each of the server's rules
 * ticking as it is met. Nothing shows until typing starts.
 */
export default function PasswordStrength({
    id,
    rules,
    value,
}: {
    id: string;
    rules: string;
    value: string;
}) {
    if (value === '') return null;

    const check = checkPassword(value, rules);
    const filled = Math.max(check.score, 1);

    return (
        <div id={id} className="grid gap-2 text-xs">
            <div className="flex items-center gap-3">
                <div aria-hidden className="grid flex-1 grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((segment) => (
                        <span
                            key={segment}
                            className={cn(
                                'h-1.5 rounded-full bg-border motion-safe:transition-colors motion-safe:duration-300',
                                segment < filled &&
                                    tones[check.level.tone].solid,
                            )}
                        />
                    ))}
                </div>
                <p aria-live="polite" className="text-muted-foreground">
                    Strength:{' '}
                    <span className="font-medium text-foreground">
                        {check.level.label}
                    </span>
                </p>
            </div>

            <ul className="grid gap-1">
                {check.rules.map((rule) => (
                    <li
                        key={rule.label}
                        className={cn(
                            'flex items-center gap-1.5',
                            rule.met
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        {rule.met ? (
                            <CircleCheck
                                aria-hidden
                                className="size-3.5 text-emerald-700 motion-safe:animate-in motion-safe:duration-200 motion-safe:zoom-in-50 dark:text-emerald-400"
                            />
                        ) : (
                            <Circle aria-hidden className="size-3.5" />
                        )}
                        {rule.label}
                        <span className="sr-only">
                            {rule.met ? ', done' : ', not yet'}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
