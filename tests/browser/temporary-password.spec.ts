import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function logIn(page: import('@playwright/test').Page, password: string) {
    await page.goto('/login');
    await page
        .getByLabel('Email address')
        .fill('browser-newcomer@example.test');
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

test('a new account chooses its own password before anything else opens', async ({
    page,
}) => {
    await logIn(page, 'password');
    await expect(page).toHaveURL(/\/password\/change$/);
    await expect(
        page.getByRole('heading', { name: 'Choose your password' }),
    ).toBeVisible();
    await expect(page.getByText('browser-newcomer@example.test')).toBeVisible();

    // Nothing else opens meanwhile.
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/password\/change$/);

    for (const dark of [false, true]) {
        await page.evaluate(
            (on) => document.documentElement.classList.toggle('dark', on),
            dark,
        );
        expect(
            (
                await new AxeBuilder({ page })
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .analyze()
            ).violations,
        ).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
    await page.setViewportSize({ width: 375, height: 800 });
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);

    // The temporary password can't be kept.
    await page.getByLabel('New password').fill('password');
    await page.getByLabel('Confirm password').fill('password');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(
        page.getByText('Choose a password different from the temporary one.'),
    ).toBeVisible();

    // Their own opens the page they were headed for.
    await page.getByLabel('New password').fill('newcomer-password');
    await page.getByLabel('Confirm password').fill('newcomer-password');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page).toHaveURL(/\/settings\/profile$/);
    await expect(page.getByText('Your password is set.')).toBeVisible();

    // Next time it goes straight in.
    await page.context().clearCookies();
    await logIn(page, 'newcomer-password');
    await expect(page).toHaveURL(/dashboard/);
});
