import { Form, Head } from '@inertiajs/react';
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
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    heis: HeiOption[];
};

const sexOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
];

export default function Register({ passwordRules, heis }: Props) {
    const [heiId, setHeiId] = useState('');
    const [sex, setSex] = useState('');

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
                                <Label htmlFor="survey_hei_id">
                                    Higher education institution
                                </Label>
                                <HeiCombobox
                                    id="survey_hei_id"
                                    name="survey_hei_id"
                                    value={heiId}
                                    onChange={setHeiId}
                                    options={heis}
                                    tabIndex={3}
                                    aria-invalid={Boolean(errors.survey_hei_id)}
                                />
                                <InputError message={errors.survey_hei_id} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="mobile_number">
                                        Mobile number
                                    </Label>
                                    <Input
                                        id="mobile_number"
                                        type="tel"
                                        inputMode="numeric"
                                        required
                                        tabIndex={4}
                                        autoComplete="tel-national"
                                        name="mobile_number"
                                        placeholder="09XX XXX XXXX"
                                        maxLength={16}
                                        aria-invalid={Boolean(
                                            errors.mobile_number,
                                        )}
                                    />
                                    <InputError
                                        message={errors.mobile_number}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sex">Sex</Label>
                                    <FormSelect
                                        id="sex"
                                        name="sex"
                                        value={sex}
                                        onChange={setSex}
                                        placeholder="Select sex"
                                        options={sexOptions}
                                        tabIndex={5}
                                        className="rounded-[6px] data-[size=default]:h-11"
                                        aria-required
                                        aria-invalid={Boolean(errors.sex)}
                                    />
                                    <InputError message={errors.sex} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={6}
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
                                    tabIndex={7}
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
                                tabIndex={8}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Submit registration
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={9}>
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
    description:
        'Register with your HEI. The administrator will review your account before you can log in.',
};
