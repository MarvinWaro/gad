import { useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { CircleCheck, Lock, Star, X } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { store } from '@/routes/ratings';

// What each number of stars means, shown once a rating is picked.
const meanings = [
    'Needs improvement',
    'Fair',
    'Good',
    'Very good',
    'Excellent',
];

/**
 * The homepage's "Rate PHLGADIS" button: a card with a 1–5 star rating and
 * an optional suggestion. Answers are anonymous (SiteRatingController keeps
 * only the stars, the text and the time) and appear in Settings → Site
 * ratings, where the button can also be switched off.
 */
export function RateWidget() {
    // A link to /#rate (the HEI home's "Need help?" card) opens it at once.
    const [open, setOpen] = useState(
        () => typeof window !== 'undefined' && window.location.hash === '#rate',
    );
    const [sent, setSent] = useState(false);
    const [preview, setPreview] = useState(0);
    const form = useForm({ rating: 0, suggestion: '', website: '' });
    const shown = preview || form.data.rating;

    const changeOpen = (next: boolean) => {
        setOpen(next);
        // After a thank-you, the next visit to the card starts fresh.
        if (!next && sent) {
            setSent(false);
            form.reset();
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setSent(true),
        });
    };

    return (
        <Popover open={open} onOpenChange={changeOpen}>
            <PopoverTrigger asChild>
                <Button className="rate-trigger">
                    <Star aria-hidden="true" />
                    <span className="rate-trigger-label">Rate PHLGADIS</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={10}
                collisionPadding={16}
                className="public-theme rate-card"
                aria-labelledby="rate-card-title"
            >
                <button
                    type="button"
                    className="rate-close"
                    onClick={() => changeOpen(false)}
                    aria-label="Close"
                >
                    <X aria-hidden="true" />
                </button>
                {sent ? (
                    <div className="rate-thanks" role="status">
                        <CircleCheck aria-hidden="true" />
                        <h2 id="rate-card-title">Thank you!</h2>
                        <p>
                            Your rating helps CHED Regional Office XII improve
                            PHLGADIS.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => changeOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="rate-form">
                        <p className="rate-eyebrow">Overall impression</p>
                        <h2 id="rate-card-title">
                            How would you rate PHLGADIS?
                        </h2>
                        <fieldset className="rate-stars-field">
                            <legend>Your rating</legend>
                            <div
                                className="rate-stars"
                                onMouseLeave={() => setPreview(0)}
                            >
                                {meanings.map((meaning, index) => {
                                    const value = index + 1;
                                    return (
                                        <label
                                            key={value}
                                            className="rate-star"
                                            data-filled={
                                                value <= shown ? '' : undefined
                                            }
                                            onMouseEnter={() =>
                                                setPreview(value)
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={value}
                                                checked={
                                                    form.data.rating === value
                                                }
                                                onChange={() =>
                                                    form.setData(
                                                        'rating',
                                                        value,
                                                    )
                                                }
                                            />
                                            <Star aria-hidden="true" />
                                            <span className="sr-only">
                                                {value}{' '}
                                                {value === 1 ? 'star' : 'stars'}
                                                , {meaning.toLowerCase()}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="rate-meaning" aria-live="polite">
                                {shown
                                    ? meanings[shown - 1]
                                    : '1 = Needs improvement, 5 = Excellent'}
                            </p>
                            <InputError message={form.errors.rating} />
                        </fieldset>
                        <label className="rate-label" htmlFor="rate-suggestion">
                            Suggestions <span>(optional)</span>
                        </label>
                        <textarea
                            id="rate-suggestion"
                            className="rate-textarea"
                            rows={3}
                            maxLength={1000}
                            placeholder="Tell us how we can improve"
                            value={form.data.suggestion}
                            onChange={(event) =>
                                form.setData('suggestion', event.target.value)
                            }
                        />
                        <InputError message={form.errors.suggestion} />
                        {/* Left empty by people; bots that fill it are ignored. */}
                        <input
                            type="text"
                            name="website"
                            className="rate-honeypot"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                            value={form.data.website}
                            onChange={(event) =>
                                form.setData('website', event.target.value)
                            }
                        />
                        <p className="rate-privacy">
                            <Lock aria-hidden="true" />
                            Anonymous: no name, email, or IP address is stored.
                        </p>
                        <Button
                            type="submit"
                            className="rate-submit"
                            disabled={form.data.rating === 0 || form.processing}
                        >
                            Submit feedback
                        </Button>
                    </form>
                )}
            </PopoverContent>
        </Popover>
    );
}
