import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    MapPin,
    Pencil,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { PersonAvatar } from '@/components/person-avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

const roleNames: Record<string, string> = {
    admin: 'Administrator',
    'gad-focal-person': 'GAD Focal Person',
    'ched-focal': 'CHED Focal',
    'ched-employee': 'CHED Employee',
    'hei-focal': 'HEI Focal',
    hei: 'HEI User',
};

function profileAffiliation(auth: Auth, institution: string | null) {
    if (institution) return institution;
    if (auth.user.national_access) return 'CHED Central Office';
    if (auth.user.survey_region_id) return 'CHED regional office';
    return 'Affiliation not available in this preview';
}

function EmptyActivity() {
    return (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center sm:px-10">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                <CalendarDays aria-hidden className="size-5" />
            </div>
            <h2 className="mt-5 text-lg font-medium">Your activity space</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Posts and events are not connected to this profile preview yet.
                Your existing community activity is still available in its
                current pages.
            </p>
        </div>
    );
}

export default function MyProfilePreview({
    auth,
    institution,
}: {
    auth: Auth;
    institution: string | null;
}) {
    const { user } = auth;
    const affiliation = profileAffiliation(auth, institution);
    const roles = auth.roles.map((role) => roleNames[role] ?? role);

    return (
        <>
            <Head title="My Profile" />
            <div className="w-full">
                <section
                    aria-labelledby="profile-name"
                    className="border-b border-border bg-card"
                >
                    <div className="bg-muted/50 lg:px-8">
                        <div
                            data-test="profile-cover"
                            className="relative mx-auto flex min-h-56 w-full max-w-6xl items-end overflow-hidden bg-signature-violet px-4 py-6 text-on-signature sm:min-h-72 sm:px-6 lg:min-h-96 lg:px-12"
                        >
                            <div
                                aria-hidden
                                className="absolute -top-20 right-0 size-64 rounded-full border border-on-signature/20 sm:right-16 sm:size-80"
                            />
                            <div
                                aria-hidden
                                className="absolute -top-12 right-10 size-64 rounded-full border border-on-signature/20 sm:right-28 sm:size-80"
                            />
                            <div className="relative max-w-lg">
                                <p className="text-xs font-medium tracking-wide uppercase opacity-80">
                                    PHLGADIS
                                </p>
                                <p className="mt-3 text-2xl leading-tight font-medium sm:text-3xl">
                                    GAD work across higher education
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:px-8">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-12">
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
                                <PersonAvatar
                                    name={user.name}
                                    src={user.avatar}
                                    className="-mt-9 size-20 border-4 border-card shadow-sm sm:-mt-10 sm:size-24"
                                    fallbackClassName="text-2xl"
                                />
                                <div className="min-w-0 sm:pb-1">
                                    <h1
                                        id="profile-name"
                                        className="text-2xl font-medium tracking-tight break-words sm:text-3xl"
                                    >
                                        {user.name}
                                    </h1>
                                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                                        <Building2
                                            aria-hidden
                                            className="mt-0.5 size-4 shrink-0"
                                        />
                                        <span>{affiliation}</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                className="self-start sm:mb-1 sm:self-auto"
                            >
                                <Link href={edit()}>
                                    <Pencil aria-hidden />
                                    Edit account details
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <div className="lg:px-8">
                    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 lg:px-12">
                        <div
                            data-test="profile-notice"
                            className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                        >
                            <span className="font-medium text-foreground">
                                Profile preview
                            </span>{' '}
                            · Only you can see this layout. Following and public
                            profiles are not available yet.
                        </div>

                        <Tabs defaultValue="overview" className="mt-8 gap-6">
                            <TabsList
                                aria-label="Profile sections"
                                className="h-auto max-w-full justify-start overflow-x-auto bg-transparent p-0"
                            >
                                <TabsTrigger
                                    value="overview"
                                    className="min-h-11 px-4"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="activity"
                                    className="min-h-11 px-4"
                                >
                                    Activity
                                </TabsTrigger>
                                <TabsTrigger
                                    value="about"
                                    className="min-h-11 px-4"
                                >
                                    About
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview">
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                                    <div className="min-w-0 space-y-6">
                                        <section className="rounded-xl border border-border bg-card p-6">
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                                                    <UserRound
                                                        aria-hidden
                                                        className="size-5"
                                                    />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-medium">
                                                        Share your GAD work
                                                    </h2>
                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        This space is designed
                                                        to bring your
                                                        activities, events, and
                                                        contributions together.
                                                        The profile timeline is
                                                        a layout preview for
                                                        now.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>
                                        <EmptyActivity />
                                    </div>

                                    <aside
                                        className="min-w-0 space-y-6"
                                        aria-label="Profile details"
                                    >
                                        <section className="rounded-xl border border-border bg-card p-5">
                                            <h2 className="text-base font-medium">
                                                About
                                            </h2>
                                            <dl className="mt-4 space-y-4 text-sm">
                                                <div>
                                                    <dt className="text-muted-foreground">
                                                        Affiliation
                                                    </dt>
                                                    <dd className="mt-1 flex items-start gap-2 font-medium">
                                                        <MapPin
                                                            aria-hidden
                                                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                                        />
                                                        {affiliation}
                                                    </dd>
                                                </div>
                                                {roles.length > 0 && (
                                                    <div>
                                                        <dt className="text-muted-foreground">
                                                            Role
                                                        </dt>
                                                        <dd className="mt-1 font-medium">
                                                            {roles.join(', ')}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </section>
                                        <section className="rounded-xl border border-border bg-card p-5">
                                            <div className="flex items-center gap-2">
                                                <UsersRound
                                                    aria-hidden
                                                    className="size-5 text-brand"
                                                />
                                                <h2 className="text-base font-medium">
                                                    Following
                                                </h2>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                                Follow is the proposed way to
                                                keep up with another member’s
                                                GAD work. This feature is coming
                                                later.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled
                                                className="mt-4"
                                            >
                                                Follow · coming soon
                                            </Button>
                                        </section>
                                    </aside>
                                </div>
                            </TabsContent>
                            <TabsContent value="activity">
                                <EmptyActivity />
                            </TabsContent>
                            <TabsContent value="about">
                                <section className="max-w-2xl rounded-xl border border-border bg-card p-6">
                                    <h2 className="text-lg font-medium">
                                        Profile details
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Your visible profile is based on your
                                        account details.
                                    </p>
                                    <dl className="mt-6 divide-y divide-border text-sm">
                                        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-muted-foreground">
                                                Name
                                            </dt>
                                            <dd className="font-medium">
                                                {user.name}
                                            </dd>
                                        </div>
                                        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-muted-foreground">
                                                Affiliation
                                            </dt>
                                            <dd className="font-medium">
                                                {affiliation}
                                            </dd>
                                        </div>
                                        {roles.length > 0 && (
                                            <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                                <dt className="text-muted-foreground">
                                                    Role
                                                </dt>
                                                <dd className="font-medium">
                                                    {roles.join(', ')}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="mt-6"
                                    >
                                        <Link href={edit()}>
                                            Manage account details
                                        </Link>
                                    </Button>
                                </section>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </>
    );
}
