import { Plus } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { moveWithin, newSection } from '@/components/survey-builder/definition';
import { FormSection } from '@/components/survey-builder/form-section';
import { SectionCard } from '@/components/survey-builder/section-card';
import type { Definition } from '@/components/survey-builder/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The questionnaire's sections in answering order, one open at a time, with
 * an outline beside them for jumping between sections.
 */
export function QuestionStructureSection({
    definition,
    error,
    onChange,
}: {
    definition: Definition;
    error?: string;
    /** Edits a copy of the definition, which then replaces it. */
    onChange: (mutate: (definition: Definition) => void) => void;
}) {
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
        definition.sections[0]?.id ?? null,
    );

    function addSection() {
        const section = newSection();
        onChange((target) => target.sections.push(section));
        setExpandedSectionId(section.id);
    }

    return (
        <FormSection
            title="Question structure"
            description="Respondents answer in this order. Every question needs an answer key, which is what its responses are stored under."
            aside={
                <>
                    {definition.sections.length > 0 && (
                        // Jump between sections while the list scrolls;
                        // links, so the section toggles stay the only buttons
                        // with these names.
                        <nav
                            aria-label="Survey sections"
                            className="mt-5 hidden lg:block"
                        >
                            <ol className="space-y-0.5">
                                {definition.sections.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#section-${section.id}`}
                                            onClick={() =>
                                                setExpandedSectionId(section.id)
                                            }
                                            aria-current={
                                                expandedSectionId === section.id
                                                    ? 'true'
                                                    : undefined
                                            }
                                            className={cn(
                                                'flex items-baseline justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                                expandedSectionId ===
                                                    section.id &&
                                                    'bg-muted font-medium text-foreground',
                                            )}
                                        >
                                            <span className="truncate">
                                                {section.title ||
                                                    'Untitled section'}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                                {section.questions.length}
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSection}
                        className="mt-5"
                    >
                        <Plus />
                        Add section
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {definition.sections.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <p className="font-medium">No sections yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            A survey needs at least one section holding at least
                            one question before it can be published.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={addSection}
                        >
                            <Plus />
                            Add the first section
                        </Button>
                    </div>
                )}

                {definition.sections.map((section, index) => (
                    <SectionCard
                        key={section.id}
                        section={section}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === definition.sections.length - 1}
                        open={expandedSectionId === section.id}
                        onOpenChange={(open) =>
                            setExpandedSectionId(open ? section.id : null)
                        }
                        onMove={(offset) =>
                            onChange((target) =>
                                moveWithin(
                                    target.sections,
                                    index,
                                    index + offset,
                                ),
                            )
                        }
                        onRemove={() =>
                            onChange((target) =>
                                target.sections.splice(index, 1),
                            )
                        }
                        onChange={(mutate) =>
                            onChange((target) => mutate(target.sections[index]))
                        }
                    />
                ))}

                <InputError message={error} />
            </div>
        </FormSection>
    );
}
