import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { ConfirmPopover } from '@/components/confirm-popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ResponseData = {
    id: string;
    reference: string;
    version: number;
    age: number;
    sex: string;
    respondent_group: string;
    respondent_group_other: string | null;
    region: string;
    hei: string;
    submitted_at: string;
    expires_at: string;
    /** Optional; for a minor, the email of the person who answered. */
    email: string | null;
    /**
     * Follow-ups the respondent was asked, heading => answer, in form order:
     * gender identity, sexual orientation, then the group's student or
     * employee questions.
     */
    details: Record<string, string>;
    answers: {
        answering_for?: string | null;
        experiences: string[];
        perpetrators: Record<string, string[]>;
        other_relative_details: Record<string, string>;
        /** Check-all-that-apply answers, keyed by the question's answer key. */
        selections?: Record<string, string[]>;
    };
    answer_labels: {
        answering_for: Record<string, string>;
        sex: Record<string, string>;
        respondent_group: Record<string, string>;
        experiences: Record<string, string>;
        perpetrators: Record<string, string>;
        selections?: Record<
            string,
            { label: string; options: Record<string, string> }
        >;
    };
};
export default function ResponseShow({
    survey,
    response,
    canDelete,
}: {
    survey: { id: number; code: string; title: string };
    response: ResponseData;
    canDelete: boolean;
}) {
    return (
        <>
            <Head title={response.reference} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Button asChild variant="ghost" className="-ml-3 w-fit">
                    <Link href={`/admin/surveys/${survey.id}/responses`}>
                        <ArrowLeft />
                        Back to responses
                    </Link>
                </Button>
                <div className="flex justify-between gap-4">
                    <div>
                        <p className="font-mono text-sm text-primary">
                            {response.reference}
                        </p>
                        <h1 className="text-2xl font-semibold">
                            Response detail
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Submitted{' '}
                            {new Date(response.submitted_at).toLocaleString()} ·
                            expires{' '}
                            {new Date(response.expires_at).toLocaleDateString()}
                        </p>
                    </div>
                    {canDelete && (
                        <ConfirmPopover
                            title={`Delete response ${response.reference}?`}
                            description="Its answers are removed for good and cannot be recovered. The respondent keeps a reference code that will no longer match anything."
                            confirmLabel="Delete"
                            onConfirm={(visit) =>
                                router.delete(
                                    `/admin/surveys/${survey.id}/responses/${response.id}`,
                                    visit,
                                )
                            }
                        >
                            <Button variant="destructive">
                                <Trash2 />
                                Delete
                            </Button>
                        </ConfirmPopover>
                    )}
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Respondent context</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {'answering_for' in response.answers && (
                                <Item
                                    label="Answering for"
                                    value={
                                        response.answer_labels.answering_for[
                                            response.answers.answering_for ?? ''
                                        ] ?? 'Not provided'
                                    }
                                />
                            )}
                            {response.answers.answering_for ===
                                'minor-under-legal-care' && (
                                <p>
                                    Details and experiences below belong to the
                                    minor.
                                </p>
                            )}
                            <Item label="Age" value={String(response.age)} />
                            <Item
                                label="Sex at birth"
                                value={
                                    response.answer_labels.sex[response.sex] ??
                                    response.sex
                                }
                            />
                            {response.details['Gender identity'] && (
                                <Item
                                    label="Gender identity"
                                    value={response.details['Gender identity']}
                                />
                            )}
                            <Item
                                label="Group"
                                value={
                                    response.respondent_group_other ??
                                    response.answer_labels.respondent_group[
                                        response.respondent_group
                                    ] ??
                                    response.respondent_group
                                }
                            />
                            {Object.entries(response.details)
                                .filter(
                                    ([label]) => label !== 'Gender identity',
                                )
                                .map(([label, value]) => (
                                    <Item
                                        key={label}
                                        label={label}
                                        value={value}
                                    />
                                ))}
                            <Item label="Region" value={response.region} />
                            <Item label="HEI" value={response.hei} />
                            <Item
                                label={
                                    response.answers.answering_for ===
                                    'minor-under-legal-care'
                                        ? 'Email (the person answering)'
                                        : 'Email'
                                }
                                value={response.email ?? 'Not provided'}
                            />
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Experiences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {response.answers.experiences.map((experience) => (
                                <div
                                    key={experience}
                                    className="rounded-lg border p-4"
                                >
                                    <p className="font-medium">
                                        {response.answer_labels.experiences[
                                            experience
                                        ] ?? experience}
                                    </p>
                                    {response.answers.perpetrators[
                                        experience
                                    ] && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Perpetrators:{' '}
                                            {(
                                                response.answers.perpetrators[
                                                    experience
                                                ] ?? []
                                            )
                                                .map(
                                                    (value) =>
                                                        response.answer_labels
                                                            .perpetrators[
                                                            value
                                                        ] ?? value,
                                                )
                                                .join(', ') || 'None recorded'}
                                        </p>
                                    )}
                                    {response.answers.other_relative_details[
                                        experience
                                    ] && (
                                        <p className="mt-1 text-sm">
                                            Specified perpetrator details:{' '}
                                            {
                                                response.answers
                                                    .other_relative_details[
                                                    experience
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                            ))}
                            {Object.entries(
                                response.answer_labels.selections ?? {},
                            ).map(([key, question]) => (
                                <div
                                    key={key}
                                    className="rounded-lg border p-4"
                                >
                                    <p className="font-medium">
                                        {question.label}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {(
                                            response.answers.selections?.[
                                                key
                                            ] ?? []
                                        )
                                            .map(
                                                (value) =>
                                                    question.options[value] ??
                                                    value,
                                            )
                                            .join(', ') || 'Not provided'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
function Item({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            {/* A long email has no spaces to wrap at. */}
            <p className="break-words">{value}</p>
        </div>
    );
}
