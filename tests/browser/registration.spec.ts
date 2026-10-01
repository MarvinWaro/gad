import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

/**
 * Fill in the registration form for the browser fixture's HEI. The fixture
 * has one region, so it comes chosen; contact details wait for the Profile.
 */
async function register(page: Page, email: string) {
    await page.goto('/register');
    await page.getByLabel('Name').fill('On-the-spot Registrant');
    await page.getByLabel('Email address').fill(email);
    await expect(page.getByRole('combobox', { name: 'Region' })).toHaveText(
        'Regional Office XII',
    );
    await expect(page.getByLabel('Mobile number')).toHaveCount(0);
    await page
        .getByRole('combobox', { name: 'Higher education institution' })
        .click();
    await page.getByRole('option', { name: 'Browser Test HEI' }).click();
    await page.getByLabel('Password', { exact: true }).fill('password-1234');
    await page.getByLabel('Confirm password').fill('password-1234');
}

test('a region opens registration without approval for an event, then closes it', async ({
    page,
    browser,
}, testInfo) => {
    // Three people, two registrations and a profile: longer than the default.
    test.setTimeout(90_000);
    await login(page, 'browser-admin@example.test');
    await page.goto('/settings/users');
    const panel = page.getByRole('region', { name: 'Registration' });
    const region = panel.getByRole('switch', { name: 'Regional Office XII' });
    await expect(region).toHaveAttribute('aria-checked', 'false');
    await expect(
        panel.getByText('Needs approval.', { exact: false }),
    ).toBeVisible();

    // Opening asks first, with an optional closing time.
    await region.click();
    const ask = page.getByRole('dialog', {
        name: 'Let Regional Office XII HEIs in without approval?',
    });
    await expect(ask).toBeVisible();
    await ask.getByLabel(/Close automatically at/).fill('2099-12-31T17:00');
    for (const theme of ['light', 'dark'] as const) {
        await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            theme === 'dark',
        );
        await page.waitForTimeout(300);
        await page.screenshot({
            path: testInfo.outputPath(`registration-open-${theme}.png`),
        });
        expect(
            (
                await new AxeBuilder({ page })
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .analyze()
            ).violations,
        ).toEqual([]);
    }
    await ask.getByRole('button', { name: 'Open registration' }).click();
    await expect(region).toHaveAttribute('aria-checked', 'true');
    // The pill shows on the region and on the card's header.
    await expect(panel.getByText('No approval', { exact: true })).toHaveCount(
        2,
    );
    await expect(
        panel.getByText(/sign in straight away until Dec 31, 2099, 5:00/),
    ).toBeVisible();

    // The list folds away, by mouse or keyboard, and the header still says
    // which region skips approval.
    const hide = panel.getByRole('button', { name: 'Hide region' });
    await expect(hide).toHaveAttribute('aria-expanded', 'true');
    await hide.click();
    const show = panel.getByRole('button', { name: 'Show region' });
    await expect(show).toHaveAttribute('aria-expanded', 'false');
    await expect(region).toBeHidden();
    await expect(
        panel.getByText(
            /Regional Office XII lets HEIs in without approval until Dec 31, 2099, 5:00/,
        ),
    ).toBeVisible();
    await page.screenshot({
        path: testInfo.outputPath('registration-folded.png'),
    });
    await show.focus();
    await page.keyboard.press('Enter');
    await expect(region).toBeVisible();

    // A registrant at the event goes straight to the HEI home.
    const registrantContext = await browser.newContext();
    const registrant = await registrantContext.newPage();
    await register(registrant, 'on-the-spot@example.test');
    await expect(
        registrant.getByText(/^Regional Office XII is registering on the spot/),
    ).toBeVisible();
    await registrant
        .getByRole('button', { name: 'Submit registration' })
        .click();
    await expect(registrant).toHaveURL(/\/dashboard$/);
    await expect(
        registrant.getByRole('heading', {
            name: 'HEI Gender Mainstreaming Efforts',
        }),
    ).toBeVisible();

    // Closing needs no question, and the next registrant waits for approval.
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
    await region.click();
    await expect(region).toHaveAttribute('aria-checked', 'false');
    const laterContext = await browser.newContext();
    const later = await laterContext.newPage();
    await register(later, 'after-the-event@example.test');
    await expect(
        later.getByText(
            'The administrator will review your account before you can log in.',
        ),
    ).toBeVisible();
    await later.getByRole('button', { name: 'Submit registration' }).click();
    await expect(later).toHaveURL(/\/login$/);
    await expect(later.getByText(/Registration received/)).toBeVisible();

    // The card fits a phone.
    await page.setViewportSize({ width: 375, height: 800 });
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('registration-375.png'),
        fullPage: true,
    });

    // The shorter form, and where the contact details went.
    await later.setViewportSize({ width: 375, height: 800 });
    await later.goto('/register');
    await later.screenshot({
        path: testInfo.outputPath('register-form-375.png'),
        fullPage: true,
    });
    await registrant.goto('/settings/profile');
    await registrant.getByLabel(/Mobile number/).fill('+63 917 123 4567');
    await registrant.getByRole('combobox', { name: /Sex/ }).click();
    await registrant.getByRole('option', { name: 'Female' }).click();
    await registrant.getByRole('button', { name: 'Save' }).click();
    await expect(registrant.getByText('Profile updated.')).toBeVisible();
    await registrant.reload();
    await expect(registrant.getByLabel(/Mobile number/)).toHaveValue(
        '09171234567',
    );
    await expect(registrant.getByRole('combobox', { name: /Sex/ })).toHaveText(
        'Female',
    );
    await registrant.screenshot({
        path: testInfo.outputPath('profile-contact.png'),
        fullPage: true,
    });

    await registrantContext.close();
    await laterContext.close();
});
