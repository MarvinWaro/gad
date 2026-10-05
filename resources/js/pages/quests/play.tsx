import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    ChevronLeft,
    CircleCheck,
    CircleX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BetaTag } from '@/components/beta-tag';
import { BadgeDetails, LevelMark } from '@/components/quests/quest-badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { myProfile } from '@/routes';
import { index } from '@/routes/quests';
import { store as answer } from '@/routes/quests/answers';
import { store as start } from '@/routes/quests/attempts';
import type { QuestPlay, QuestPlayQuestion } from '@/types/quests';

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * The game: an introduction, then one question per screen. Choosing an
 * answer sends it; the page then shows whether it was right and why before
 * the next question. The last answer leads to the score and the badge.
 * Answers and explanations only arrive once a question is answered.
 */
export default function PlayQuest({ quest, attempt, best, can }: QuestPlay) {
    const { errors } = usePage().props;
    const [reviewing, setReviewing] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const error = errors.quest ?? errors.answer;

    const questions = attempt?.questions ?? [];
    const reviewIndex = questions.findIndex(
        (question) => question.id === reviewing,
    );
    const nextIndex = questions.findIndex(
        (question) => question.answer === null,
    );
    const current = reviewIndex >= 0 ? reviewIndex : nextIndex;

    function begin() {
        router.post(
            start.url(quest.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setReviewing(null),
            },
        );
    }

    function choose(question: QuestPlayQuestion, choice: string) {
        router.post(
            answer.url(quest.id),
            { question: question.id, choice },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setReviewing(question.id),
            },
        );
    }

    let screen: 'intro' | 'question' | 'result' | 'stopped';
    if (attempt === null) {
        screen = 'intro';
    } else if (current >= 0 && (can.answer || reviewIndex >= 0)) {
        screen = 'question';
    } else if (attempt.finished) {
        screen = 'result';
    } else {
        screen = 'stopped';
    }

    return (
        <>
            <Head title={quest.title} />
            <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-20 sm:pt-8">
                <Link
                    href={index.url()}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronLeft aria-hidden className="size-4" />
                    GAD Quest
                    <BetaTag className="ml-1" />
                </Link>

                {error && (
                    <p
                        role="alert"
                        className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
                    >
                        {error}
                    </p>
                )}

                {screen === 'intro' && (
                    <Intro
                        quest={quest}
                        canStart={can.start}
                        processing={processing}
                        onStart={begin}
                    />
                )}
                {screen === 'question' && attempt && (
                    <QuestionScreen
                        key={questions[current].id}
                        questions={questions}
                        index={current}
                        processing={processing}
                        onChoose={choose}
                        onNext={() => setReviewing(null)}
                    />
                )}
                {screen === 'result' && attempt && (
                    <Result
                        quest={quest}
                        questions={questions}
                        score={attempt.score}
                        best={best}
                        canStart={can.start}
                        processing={processing}
                        onStart={begin}
                    />
                )}
                {screen === 'stopped' && attempt && (
                    <section className="mt-6 rounded-2xl border bg-card p-6 sm:p-8">
                        <h1 className="text-2xl font-medium text-balance">
                            {quest.title}
                        </h1>
                        <p className="mt-3 text-sm text-muted-foreground">
                            This quest closed before you finished. You answered{' '}
                            {
                                questions.filter(
                                    (question) => question.answer !== null,
                                ).length
                            }{' '}
                            of its {questions.length} questions, so there is no
                            badge for it.
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}

function Intro({
    quest,
    canStart,
    processing,
    onStart,
}: {
    quest: QuestPlay['quest'];
    canStart: boolean;
    processing: boolean;
    onStart: () => void;
}) {
    return (
        <section
            aria-labelledby="quest-title"
            className="mt-6 overflow-hidden rounded-2xl border bg-card"
        >
            <div className="flex items-end justify-between gap-4 bg-brand-soft px-6 pt-6 sm:px-8">
                <p className="pb-6 text-sm font-medium text-brand">
                    {quest.organizer}
                </p>
                <img
                    src="/assets/img/persona-card.webp"
                    alt=""
                    width="240"
                    height="201"
                    className="w-28 shrink-0 sm:w-32"
                />
            </div>
            <div className="p-6 sm:p-8">
                <h1
                    id="quest-title"
                    className="text-2xl leading-tight font-medium text-balance sm:text-3xl"
                >
                    {quest.title}
                </h1>
                {quest.description && (
                    <p className="mt-3 text-pretty text-muted-foreground">
                        {quest.description}
                    </p>
                )}
                <ul className="mt-6 space-y-2 text-sm">
                    {[
                        `${quest.questions} questions, one at a time, in about two minutes`,
                        'Each answer is explained as soon as you give it',
                        quest.allow_retakes
                            ? 'You can play again; your best score counts'
                            : 'One try, so take your time; there is no timer',
                        'Finishing earns a badge for your profile',
                    ].map((line) => (
                        <li key={line} className="flex gap-2">
                            <Check
                                aria-hidden
                                className="mt-0.5 size-4 shrink-0 text-brand"
                            />
                            {line}
                        </li>
                    ))}
                </ul>
                {canStart ? (
                    <Button
                        size="lg"
                        className="mt-8 w-full sm:w-auto"
                        disabled={processing}
                        onClick={onStart}
                    >
                        {processing && <Spinner />}
                        Start the quest
                        <ArrowRight />
                    </Button>
                ) : (
                    <p className="mt-8 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                        This quest is closed, so it can no longer be played.
                    </p>
                )}
            </div>
        </section>
    );
}

function QuestionScreen({
    questions,
    index,
    processing,
    onChoose,
    onNext,
}: {
    questions: QuestPlayQuestion[];
    index: number;
    processing: boolean;
    onChoose: (question: QuestPlayQuestion, choice: string) => void;
    onNext: () => void;
}) {
    const question = questions[index];
    const result = question.answer;
    const last = questions.every((other) => other.answer !== null);
    const promptRef = useRef<HTMLHeadingElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const correctLabel = question.choices.find(
        (choice) => choice.key === result?.correct,
    )?.label;

    // A new question takes the focus, so it is read out; once answered, the
    // button onward does, after the feedback is announced.
    useEffect(() => {
        if (result) {
            nextRef.current?.focus();
        } else {
            promptRef.current?.focus();
        }
    }, [result]);

    return (
        <section aria-labelledby="question-prompt" className="mt-6">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>
                    Question {index + 1} of {questions.length}
                </p>
                <Progress questions={questions} current={index} />
            </div>

            <div className="mt-4 rounded-2xl border bg-card p-6 sm:p-8">
                <h1
                    id="question-prompt"
                    ref={promptRef}
                    tabIndex={-1}
                    className="text-xl leading-snug font-medium text-pretty outline-none sm:text-2xl"
                >
                    {question.prompt}
                </h1>

                <ul className="mt-6 space-y-3">
                    {question.choices.map((choice, position) => {
                        const chosen = result?.choice === choice.key;
                        const right = result?.correct === choice.key;

                        return (
                            <li key={choice.key}>
                                <button
                                    type="button"
                                    disabled={processing || result !== null}
                                    onClick={() =>
                                        onChoose(question, choice.key)
                                    }
                                    className={cn(
                                        'flex min-h-14 w-full items-center gap-3 rounded-xl border-2 bg-background px-4 py-3 text-left text-base transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                        result === null &&
                                            'hover:border-foreground/40 hover:bg-muted/50 disabled:opacity-60',
                                        right &&
                                            'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/60',
                                        chosen &&
                                            !right &&
                                            'border-destructive bg-destructive/10',
                                        result !== null &&
                                            !right &&
                                            !chosen &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                                            right &&
                                                'border-transparent bg-emerald-600 text-white',
                                            chosen &&
                                                !right &&
                                                'border-transparent bg-destructive text-white',
                                        )}
                                    >
                                        {right ? (
                                            <Check className="size-4" />
                                        ) : chosen ? (
                                            <X className="size-4" />
                                        ) : (
                                            letters[position]
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        {choice.label}
                                        {chosen && (
                                            <span className="sr-only">
                                                {' '}
                                                (your answer)
                                            </span>
                                        )}
                                        {right && (
                                            <span className="sr-only">
                                                {' '}
                                                (the correct answer)
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div aria-live="polite">
                    {result && (
                        <div
                            className={cn(
                                'mt-6 rounded-xl border-l-4 bg-muted/60 p-4 motion-safe:animate-in motion-safe:fade-in-0',
                                result.is_correct
                                    ? 'border-l-emerald-600 dark:border-l-emerald-500'
                                    : 'border-l-destructive',
                            )}
                        >
                            <p className="flex items-center gap-2 font-medium">
                                {result.is_correct ? (
                                    <CircleCheck
                                        aria-hidden
                                        className="size-5 text-emerald-700 dark:text-emerald-400"
                                    />
                                ) : (
                                    <CircleX
                                        aria-hidden
                                        className="size-5 text-destructive"
                                    />
                                )}
                                {result.is_correct ? 'Correct.' : 'Not quite.'}
                            </p>
                            {!result.is_correct && correctLabel && (
                                <p className="mt-1 text-sm">
                                    The answer is{' '}
                                    <span className="font-medium">
                                        {correctLabel}
                                    </span>
                                    .
                                </p>
                            )}
                            <p className="mt-2 text-sm text-pretty text-muted-foreground">
                                {result.explanation}
                            </p>
                        </div>
                    )}
                </div>

                {result && (
                    <Button
                        ref={nextRef}
                        size="lg"
                        className="mt-6 w-full sm:w-auto"
                        onClick={onNext}
                    >
                        {last ? 'See your result' : 'Next question'}
                        <ArrowRight />
                    </Button>
                )}
            </div>
        </section>
    );
}

/** One step per question: answered right, answered wrong, current, ahead. */
function Progress({
    questions,
    current,
}: {
    questions: QuestPlayQuestion[];
    current: number;
}) {
    return (
        <ol aria-hidden className="flex gap-1.5">
            {questions.map((question, position) => (
                <li
                    key={question.id}
                    className={cn(
                        'h-2 w-6 rounded-full sm:w-8',
                        question.answer === null && 'bg-muted',
                        question.answer?.is_correct && 'bg-emerald-600',
                        question.answer &&
                            !question.answer.is_correct &&
                            'bg-destructive',
                        position === current &&
                            question.answer === null &&
                            'bg-foreground',
                    )}
                />
            ))}
        </ol>
    );
}

function Result({
    quest,
    questions,
    score,
    best,
    canStart,
    processing,
    onStart,
}: {
    quest: QuestPlay['quest'];
    questions: QuestPlayQuestion[];
    score: number;
    best: QuestPlay['best'];
    canStart: boolean;
    processing: boolean;
    onStart: () => void;
}) {
    const headingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => headingRef.current?.focus(), []);

    return (
        <>
            <section
                aria-labelledby="result-title"
                className="mt-6 overflow-hidden rounded-2xl border bg-card"
            >
                <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center sm:px-8">
                    {best && (
                        <LevelMark
                            level={best.level}
                            image={best.image}
                            className="size-20"
                        />
                    )}
                    <p className="mt-4 text-sm text-muted-foreground">
                        {quest.title}
                    </p>
                    <h1
                        id="result-title"
                        ref={headingRef}
                        tabIndex={-1}
                        className="mt-1 text-2xl font-medium outline-none sm:text-3xl"
                    >
                        {score} of {questions.length} correct
                    </h1>
                    {best && (
                        <p className="mt-2 max-w-md text-pretty text-muted-foreground">
                            {best.score > score
                                ? `Your best is still ${best.score} of ${best.total}, so your ${best.level_label} badge stays.`
                                : `You earned the ${best.level_label} badge. It is on your profile now.`}
                        </p>
                    )}
                </div>
                {best && (
                    <div className="border-t bg-muted/40 px-6 py-5 sm:px-8">
                        <BadgeDetails badge={best} />
                    </div>
                )}
                <div className="flex flex-wrap gap-3 border-t px-6 py-5 sm:px-8">
                    {canStart && (
                        <Button disabled={processing} onClick={onStart}>
                            {processing && <Spinner />}
                            Play again
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href={index.url()}>All quests</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href={myProfile.url()}>Your profile</Link>
                    </Button>
                </div>
            </section>

            <section aria-labelledby="your-answers" className="mt-10">
                <h2 id="your-answers" className="text-lg font-medium">
                    Your answers
                </h2>
                <ol className="mt-4 space-y-3">
                    {questions.map((question, number) => {
                        const result = question.answer;
                        const chosen = question.choices.find(
                            (choice) => choice.key === result?.choice,
                        );
                        const right = question.choices.find(
                            (choice) => choice.key === result?.correct,
                        );

                        return (
                            <li
                                key={question.id}
                                className="rounded-xl border bg-card p-4 sm:p-5"
                            >
                                <p className="font-medium">
                                    <span className="text-muted-foreground">
                                        {number + 1}.
                                    </span>{' '}
                                    {question.prompt}
                                </p>
                                <p className="mt-2 flex items-start gap-2 text-sm">
                                    {result?.is_correct ? (
                                        <CircleCheck
                                            aria-hidden
                                            className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                                        />
                                    ) : (
                                        <CircleX
                                            aria-hidden
                                            className="mt-0.5 size-4 shrink-0 text-destructive"
                                        />
                                    )}
                                    <span>
                                        <span className="sr-only">
                                            {result?.is_correct
                                                ? 'Correct: '
                                                : 'Not quite: '}
                                        </span>
                                        You answered {chosen?.label}.
                                        {!result?.is_correct && right && (
                                            <> The answer is {right.label}.</>
                                        )}
                                    </span>
                                </p>
                                {result && (
                                    <p className="mt-2 border-t pt-2 text-sm text-pretty text-muted-foreground">
                                        {result.explanation}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </section>
        </>
    );
}

PlayQuest.layout = {
    breadcrumbs: [{ title: 'GAD Quest', href: '/quests' }],
};
