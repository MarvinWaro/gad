import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import ProfilePhotoField from '@/components/profile-photo-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import type { RegionOffice } from '@/types/monitoring';
import { send } from '@/routes/verification';
import { sexOptions } from '@/lib/sex-options';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
    institution,
    office,
    details,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    /** The account's HEI (read-only here); null for CHED staff. */
    institution: string | null;
    /** The HEI's regional office, to contact about the institution. */
    office: RegionOffice | null;
    /** Contact details left out of registration. */
    details: { mobile_number: string | null; sex: string | null };
}) {
    const page = usePage<PageProps>();
    const { auth } = page.props;
    const [sex, setSex] = useState(details.sex ?? '');

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your photo, name, email address, and contact details"
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
                                                {office?.email ? (
                                                    <>
                                                        If this is wrong,
                                                        contact CHED{' '}
                                                        {office.name} at{' '}
                                                        <a
                                                            href={`mailto:${office.email}`}
                                                            className="text-foreground underline underline-offset-4"
                                                        >
                                                            {office.email}
                                                        </a>
                                                        .
                                                    </>
                                                ) : (
                                                    'If this is wrong, contact your CHED regional office.'
                                                )}
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

                            {/* Left out of registration; each is optional. */}
                            <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="mobile_number">
                                        Mobile number{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="mobile_number"
                                        type="tel"
                                        inputMode="numeric"
                                        autoComplete="tel-national"
                                        name="mobile_number"
                                        placeholder="09XX XXX XXXX"
                                        maxLength={16}
                                        defaultValue={
                                            details.mobile_number ?? ''
                                        }
                                        aria-invalid={Boolean(
                                            errors.mobile_number,
                                        )}
                                    />
                                    <InputError
                                        message={errors.mobile_number}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sex">
                                        Sex{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (optional)
                                        </span>
                                    </Label>
                                    <FormSelect
                                        id="sex"
                                        name="sex"
                                        value={sex}
                                        onChange={setSex}
                                        placeholder="Select sex"
                                        allowEmpty
                                        emptyLabel="Not set"
                                        options={sexOptions}
                                        className="rounded-[6px] data-[size=default]:h-11"
                                        aria-invalid={Boolean(errors.sex)}
                                    />
                                    <InputError message={errors.sex} />
                                </div>
                            </div>

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
