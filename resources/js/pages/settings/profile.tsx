import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import ProfilePhotoField from '@/components/profile-photo-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';
import { isMyProfileView } from '@/lib/my-profile';
import MyProfilePreview from './my-profile-preview';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
    institution,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    /** The account's HEI (read-only here); null for CHED staff. */
    institution: string | null;
}) {
    const page = usePage<PageProps>();
    const { auth } = page.props;

    if (isMyProfileView(page.url)) {
        return <MyProfilePreview auth={auth} institution={institution} />;
    }

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your photo, name, and email address"
                />

                <ProfilePhotoField />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {institution && (
                                <div className="grid gap-2">
                                    <Label htmlFor="institution">
                                        Institution
                                    </Label>

                                    {/* Read-only and unnamed, so it is never
                                        submitted with the form. */}
                                    <Input
                                        id="institution"
                                        className="mt-1 block w-full bg-muted text-muted-foreground"
                                        value={institution}
                                        readOnly
                                        aria-describedby="institution-note"
                                    />

                                    <Alert
                                        id="institution-note"
                                        className="bg-muted/60"
                                    >
                                        <Lock />
                                        <AlertTitle className="line-clamp-none">
                                            Only an administrator can change
                                            your institution
                                        </AlertTitle>
                                        <AlertDescription>
                                            <p>
                                                If this is wrong, contact CHEDRO
                                                XII at{' '}
                                                <a
                                                    href="mailto:chedro12@ched.gov.ph"
                                                    className="text-foreground underline underline-offset-4"
                                                >
                                                    chedro12@ched.gov.ph
                                                </a>
                                                .
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {/* Only administrators may delete their own account. */}
            {auth.roles.includes('admin') && <DeleteUser />}
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
