import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { HeiCombobox } from '@/components/hei-combobox';
import type { HeiOption } from '@/components/hei-combobox';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login, register } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    /**
     * Every active region; one may have no institutions yet. `instant`: new
     * accounts there need no approval right now. `email`: the regional office.
     */
    regions: {
        id: number;
        name: string;
        instant: boolean;
        email: string | null;
    }[];
    /**
     * The region whose institutions `heis` holds: the one picked, or the only
     * one there is. Picking another reloads `heis`.
     */
    region: number | null;
    heis: (HeiOption & { region_id: number })[];
};

export default function Register({
    passwordRules,
    regions,
    region: loadedRegionId,
    heis,
}: Props) {
    const [regionId, setRegionId] = useState(
        loadedRegionId === null ? '' : String(loadedRegionId),
    );
    const [heiId, setHeiId] = useState('');
    const region = regions.find((option) => String(option.id) === regionId);
    // Still on its way while the list is another region's.
    const loaded = String(loadedRegionId) === regionId;
    const loading = region !== undefined && !loaded;
    const regionHeis = loaded ? heis : [];
    // HEIDA has not sent this region's institutions yet.
    const noHeis = loaded && heis.length === 0;

    const chooseRegion = (value: string) => {
        setRegionId(value);
        setHeiId('');
        // In the address too, so a failed submit comes back with the list.
        router.get(
            register.url(),
            { region: value },
            {
                only: ['region', 'heis'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="region">Region</Label>
                                {/* Only narrows the institutions; the HEI is
                                    what the account records. */}
                                <FormSelect
                                    id="region"
                                    value={regionId}
                                    onChange={chooseRegion}
                                    placeholder="Choose your region"
                                    options={regions.map((option) => ({
                                        value: String(option.id),
                                        label: option.name,
                                    }))}
                                    tabIndex={3}
                                    className="rounded-[6px] data-[size=default]:h-11"
                                    aria-required
                                />
                                {/* What happens after submitting depends on
                                    whether the region registers people on
                                    the spot. */}
                                <p
                                    role="status"
                                    className="text-sm text-muted-foreground empty:hidden"
                                >
                                    {region === undefined || loading ? (
                                        ''
                                    ) : noHeis ? (
                                        <>
                                            No institutions are listed for this
                                            region yet.{' '}
                                            {region.email ? (
                                                <>
                                                    Email{' '}
                                                    <a
                                                        href={`mailto:${region.email}`}
                                                        className="text-foreground underline underline-offset-4"
                                                    >
                                                        {region.email}
                                                    </a>{' '}
                                                    so yours can be added.
                                                </>
                                            ) : (
                                                'Contact your CHED regional office so yours can be added.'
                                            )}
                                        </>
                                    ) : region.instant ? (
                                        `${region.name} is registering on the spot: you’ll go straight to PHLGADIS after you submit.`
                                    ) : (
                                        'The administrator will review your account before you can log in.'
                                    )}
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="survey_hei_id">
                                    Higher education institution
                                </Label>
                                <HeiCombobox
                                    id="survey_hei_id"
                                    name="survey_hei_id"
                                    value={heiId}
                                    onChange={setHeiId}
                                    options={regionHeis}
                                    disabled={
                                        region === undefined ||
                                        loading ||
                                        noHeis
                                    }
                                    placeholder={
                                        region === undefined
                                            ? 'Choose a region first'
                                            : loading
                                              ? 'Loading institutions…'
                                              : noHeis
                                                ? 'No institutions available'
                                                : undefined
                                    }
                                    tabIndex={4}
                                    aria-invalid={Boolean(errors.survey_hei_id)}
                                />
                                <InputError message={errors.survey_hei_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Submit registration
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Register with your HEI.',
};
