import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    formatWhen,
    withClientKeys,
    withoutClientKeys,
} from '@/components/survey-builder/definition';
import { PublicationPanel } from '@/components/survey-builder/publication-panel';
import { QuestionStructureSection } from '@/components/survey-builder/question-structure-section';
import { SurveyDetailsSection } from '@/components/survey-builder/survey-details-section';
import type {
    BuilderSurvey,
    Definition,
    DirectoryStatus,
    Draft,
    DraftData,
    Permissions,
    ReadinessCheck,
} from '@/components/survey-builder/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    survey: BuilderSurvey;
    draft: Draft;
    directoryStatus: DirectoryStatus;
    readiness: ReadinessCheck[];
    permissions: Permissions;
};

export default function SurveyBuilder({
    survey,
    draft,
    directoryStatus,
    readiness,
    permissions,
}: Props) {
    const form = useForm<DraftData>({
        title: survey.title,
        law_title: survey.law_title,
        introduction: draft.introduction,
        privacy_notice: draft.privacy_notice,
        consent_text: draft.consent_text,
        retention_days: draft.retention_days,
        definition: withClientKeys(draft.definition),
    });
    const savedAt = formatWhen(draft.updated_at);

    function changeDefinition(mutate: (definition: Definition) => void) {
        const definition = structuredClone(form.data.definition);
        mutate(definition);
        form.setData('definition', definition);
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            definition: withoutClientKeys(data.definition),
        }));
        form.put(`/admin/surveys/${survey.id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title={`${survey.code} survey builder`} />
            <div className="@container mx-auto w-full max-w-[120rem] flex-1 p-4 md:p-6">
                <div className="mx-auto max-w-6xl pb-8 @min-[88rem]:max-w-none">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="-ml-3 text-muted-foreground"
                    >
                        <Link href="/admin/surveys">
                            <ArrowLeft />
                            All surveys
                        </Link>
                    </Button>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        {survey.code} · {survey.title}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {survey.law_title}
                    </p>
                </div>

                <div className="mx-auto max-w-6xl @min-[88rem]:grid @min-[88rem]:max-w-none @min-[88rem]:grid-cols-[minmax(0,1fr)_21rem] @min-[88rem]:items-start @min-[88rem]:gap-x-12">
                    <div className="@min-[88rem]:sticky @min-[88rem]:top-below-header @min-[88rem]:col-start-2 @min-[88rem]:row-start-1 @min-[88rem]:-mx-1 @min-[88rem]:max-h-[calc(100svh-var(--app-header,0px)-3rem)] @min-[88rem]:overflow-y-auto @min-[88rem]:px-1">
                        <PublicationPanel
                            survey={survey}
                            draft={draft}
                            directoryStatus={directoryStatus}
                            readiness={readiness}
                            canPublishDrafts={permissions.publish}
                            hasUnsavedChanges={form.isDirty}
                        />
                    </div>

                    <form
                        onSubmit={submit}
                        className="min-w-0 @min-[88rem]:col-start-1 @min-[88rem]:row-start-1"
                    >
                        <SurveyDetailsSection form={form} />
                        <QuestionStructureSection
                            definition={form.data.definition}
                            error={form.errors.definition}
                            onChange={changeDefinition}
                        />

                        {permissions.update ? (
                            <div className="sticky bottom-4 z-10 mt-2 flex items-center justify-between gap-4 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span
                                        className={cn(
                                            'size-2 rounded-full',
                                            form.isDirty
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500',
                                        )}
                                    />
                                    {form.isDirty
                                        ? 'Unsaved changes'
                                        : savedAt
                                          ? `Saved ${savedAt}`
                                          : 'No changes yet'}
                                </p>
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={form.processing}
                                >
                                    {form.processing ? 'Saving…' : 'Save draft'}
                                </Button>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                                You have read-only access to this draft.
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
