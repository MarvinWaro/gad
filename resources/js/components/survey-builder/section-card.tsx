import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import {
    countLabel,
    moveWithin,
    newQuestion,
    questionTypes,
} from '@/components/survey-builder/definition';
import { Field } from '@/components/survey-builder/field';
import { QuestionEditor } from '@/components/survey-builder/question-editor';
import { useReadOnly } from '@/components/survey-builder/read-only';
import type { Section } from '@/components/survey-builder/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * One section of the questionnaire, collapsed to its title until opened:
 * its heading, its questions, and a button for each kind of question.
 */
export function SectionCard({
    section,
    index,
    isFirst,
    isLast,
    open,
    onOpenChange,
    onMove,
    onRemove,
    onChange,
}: {
    section: Section;
    /** Its position, which its questions' ids start with. */
    index: number;
    isFirst: boolean;
    isLast: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMove: (offset: -1 | 1) => void;
    onRemove: () => void;
    /** Edits a copy of this section, which then replaces it. */
    onChange: (mutate: (section: Section) => void) => void;
}) {
    const readOnly = useReadOnly();

    return (
        <Collapsible open={open} onOpenChange={onOpenChange}>
            <Card
                id={`section-${section.id}`}
                className="scroll-mt-below-header"
            >
                <CardHeader className="flex-row items-center gap-3">
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="min-w-0 flex-1 justify-start text-left"
                        >
                            <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                    'shrink-0 transition-transform',
                                    !open && '-rotate-90',
                                )}
                            />
                            <span className="truncate font-semibold">
                                {section.title || 'Untitled section'}
                            </span>
                            <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">
                                {countLabel(
                                    section.questions.length,
                                    'question',
                                )}
                            </span>
                        </Button>
                    </CollapsibleTrigger>
                    {!readOnly && (
                        <div className="flex shrink-0 items-center gap-1">
                            <IconAction
                                type="button"
                                label="Move section earlier"
                                disabled={isFirst}
                                onClick={() => onMove(-1)}
                            >
                                <ArrowUp />
                            </IconAction>
                            <IconAction
                                type="button"
                                label="Move section later"
                                disabled={isLast}
                                onClick={() => onMove(1)}
                            >
                                <ArrowDown />
                            </IconAction>
                            <IconAction
                                type="button"
                                label="Remove this section and its questions"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={onRemove}
                            >
                                <Trash2 />
                            </IconAction>
                        </div>
                    )}
                </CardHeader>
                <CollapsibleContent asChild>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                            <Field label="Section title">
                                <Input
                                    value={section.title}
                                    onChange={(event) =>
                                        onChange((target) => {
                                            target.title = event.target.value;
                                        })
                                    }
                                />
                            </Field>
                            <Field label="Description">
                                <Input
                                    placeholder="Optional guidance shown under the title"
                                    value={section.description ?? ''}
                                    onChange={(event) =>
                                        onChange((target) => {
                                            target.description =
                                                event.target.value;
                                        })
                                    }
                                />
                            </Field>
                        </div>
                        {section.questions.length === 0 && (
                            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                This section is empty. A section without
                                questions blocks publication.
                            </p>
                        )}
                        {section.questions.map((question, questionIndex) => (
                            <QuestionEditor
                                key={question.clientKey ?? question.id}
                                question={question}
                                idPrefix={`question-${index}-${questionIndex}`}
                                isFirst={questionIndex === 0}
                                isLast={
                                    questionIndex ===
                                    section.questions.length - 1
                                }
                                onMove={(offset) =>
                                    onChange((target) =>
                                        moveWithin(
                                            target.questions,
                                            questionIndex,
                                            questionIndex + offset,
                                        ),
                                    )
                                }
                                onRemove={() =>
                                    onChange((target) =>
                                        target.questions.splice(
                                            questionIndex,
                                            1,
                                        ),
                                    )
                                }
                                onChange={(mutate) =>
                                    onChange((target) =>
                                        mutate(target.questions[questionIndex]),
                                    )
                                }
                            />
                        ))}
                        {!readOnly && (
                            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                                <span className="mr-1 text-xs text-muted-foreground">
                                    Add a question
                                </span>
                                {questionTypes.map((type) => (
                                    <Tooltip key={type.value}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    onChange((target) =>
                                                        target.questions.push(
                                                            newQuestion(
                                                                type.value,
                                                            ),
                                                        ),
                                                    )
                                                }
                                            >
                                                <Plus />
                                                {type.label}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {type.hint}
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
