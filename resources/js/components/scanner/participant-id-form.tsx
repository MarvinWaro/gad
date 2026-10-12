import { UserCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { pastedCode, typedCode } from '@/lib/scanner';

/** 44px tall for touch; narrow enough on a phone that all eight fit. */
const SLOT = 'h-11 w-7 text-base sm:w-9';

/**
 * Typing a Participant ID, for a Virtual ID the camera can't read, such as
 * a blurred screenshot or a worn print. "GAD-" is there already; the eight
 * characters follow, and a pasted whole code fills them all. `onSubmit`
 * resolves true once the person is checked in, which clears the boxes.
 */
export function ParticipantIdForm({
    disabled,
    busy,
    onSubmit,
}: {
    /** No event picked yet. */
    disabled: boolean;
    busy: boolean;
    onSubmit: (code: string) => Promise<boolean>;
}) {
    const [characters, setCharacters] = useState('');
    const input = useRef<HTMLInputElement>(null);
    const complete = characters.length === 8;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!complete || disabled || busy) {
            return;
        }

        onSubmit(`GAD-${characters.slice(0, 4)}-${characters.slice(4)}`)
            .then((checkedIn) => {
                if (checkedIn) {
                    setCharacters('');
                }

                input.current?.focus();
            })
            .catch(() => undefined);
    }

    return (
        <form onSubmit={submit} className="grid gap-2">
            <Label htmlFor="participant-id">Participant ID</Label>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className="text-base font-medium text-muted-foreground"
                    >
                        GAD-
                    </span>
                    <InputOTP
                        ref={input}
                        id="participant-id"
                        maxLength={8}
                        value={characters}
                        onChange={(value) => setCharacters(typedCode(value))}
                        // The alphabet, plus the I, L and O that typedCode reads as 1 and 0.
                        pattern="^[0-9A-TV-Za-tv-z]+$"
                        pasteTransformer={pastedCode}
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label="Participant ID, the 8 characters after GAD-"
                        disabled={disabled}
                        containerClassName="gap-1.5"
                    >
                        <InputOTPGroup>
                            {[0, 1, 2, 3].map((index) => (
                                <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className={SLOT}
                                />
                            ))}
                        </InputOTPGroup>
                        <InputOTPSeparator className="text-muted-foreground" />
                        <InputOTPGroup>
                            {[4, 5, 6, 7].map((index) => (
                                <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className={SLOT}
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <Button type="submit" disabled={disabled || busy || !complete}>
                    {busy ? <Spinner /> : <UserCheck />}
                    Check in
                </Button>
            </div>
        </form>
    );
}
