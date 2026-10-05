import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the user form asks where an account belongs by its roles', async ({
    page,
}, testInfo) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/settings/users');

    await page.getByRole('button', { name: 'Add user' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create user' });
    await expect(dialog).toBeVisible();
    // Contact details are the account holder's to add on their Profile.
    await expect(dialog.getByLabel(/Mobile number/)).toHaveCount(0);
    await expect(dialog.getByLabel(/^Sex/)).toHaveCount(0);
    // New accounts start with the temporary password; no password to type.
    await expect(dialog.getByLabel('Password', { exact: true })).toHaveCount(0);
    await expect(
        dialog.locator('[data-test="temporary-password-note"]'),
    ).toContainText('temporary password password');
    // Nothing to place until a role says what kind of account it is.
    await expect(dialog.getByLabel('Institution')).toHaveCount(0);
    await expect(dialog.getByLabel('Office')).toHaveCount(0);

    await dialog.getByLabel('Name').fill('Example HEI Focal');
    await dialog.getByLabel('Email address').fill('example-focal@example.test');
    await dialog.getByRole('checkbox', { name: 'HEI Focal' }).click();
    // The fixture has one region, so it is chosen already.
    await expect(dialog.getByRole('combobox', { name: 'Region' })).toHaveText(
        'Regional Office XII',
    );
    await expect(dialog.getByLabel('Office')).toHaveCount(0);

    // A CHED role adds the office; unticking it takes it away again.
    await dialog.getByRole('checkbox', { name: 'CHED Employee' }).click();
    await expect(
        dialog.getByRole('combobox', { name: 'Office' }),
    ).toBeVisible();
    // A CHED Employee belongs to one region; only Administrators cover all.
    await expect(
        dialog.getByText(
            /^CHED Focal and CHED Employee accounts belong to one regional office/,
        ),
    ).toBeVisible();
    for (const theme of ['light', 'dark'] as const) {
        await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            theme === 'dark',
        );
        await page.waitForTimeout(300);
        await page.screenshot({
            path: testInfo.outputPath(`user-form-${theme}.png`),
        });
        expect(
            (
                await new AxeBuilder({ page })
                    .include('[role="dialog"]')
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .analyze()
            ).violations,
        ).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
    await dialog.getByRole('checkbox', { name: 'CHED Employee' }).click();
    await expect(dialog.getByLabel('Office')).toHaveCount(0);

    // An HEI account can't be saved without its institution.
    await dialog.getByRole('button', { name: 'Create user' }).click();
    await expect(
        dialog.getByText('Choose the institution this HEI account belongs to.'),
    ).toBeVisible();

    await dialog.getByRole('combobox', { name: 'Institution' }).click();
    await page.getByRole('option', { name: 'Browser Test HEI' }).click();
    await dialog.getByRole('button', { name: 'Create user' }).click();
    await expect(dialog).toBeHidden();
    const row = page
        .getByRole('row')
        .filter({ hasText: 'example-focal@example.test' });
    await expect(row.getByText('Browser Test HEI')).toBeVisible();
    await expect(row.getByText('HEI Focal', { exact: true })).toBeVisible();

    // The dialog fits a phone.
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByRole('button', { name: 'Add user' }).click();
    await page
        .getByRole('dialog', { name: 'Create user' })
        .getByRole('checkbox', { name: 'HEI Focal' })
        .click();
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('user-form-375.png') });
});

test('the users list filters by role and place as soon as they change', async ({
    page,
}, testInfo) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/settings/users');

    const filters = page.getByRole('group', { name: 'Filter users' });
    const rows = page.getByRole('table').locator('tbody tr');
    await filters.getByRole('combobox', { name: 'Role' }).click();
    await page.getByRole('option', { name: 'HEI Focal', exact: true }).click();
    await expect(page).toHaveURL(/role=hei-focal/);
    await expect(rows.first()).toContainText('HEI Focal');
    for (const row of await rows.all()) {
        await expect(row).toContainText('HEI Focal');
    }

    // A regional office's own region. Clusters are never shown, so the HEIs
    // list straight away.
    await expect(
        filters.getByRole('combobox', { name: 'Cluster' }),
    ).toHaveCount(0);
    await filters.getByRole('combobox', { name: 'HEI' }).click();
    await page.getByRole('option', { name: 'Browser Test HEI' }).click();
    await expect(page).toHaveURL(/hei=\d+/);
    await expect(rows.first()).toContainText('Browser Test HEI');

    for (const theme of ['light', 'dark'] as const) {
        await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            theme === 'dark',
        );
        await page.waitForTimeout(300);
        await page.screenshot({
            path: testInfo.outputPath(`users-filtered-${theme}.png`),
            fullPage: true,
        });
        expect(
            (
                await new AxeBuilder({ page })
                    .include('main')
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .analyze()
            ).violations,
        ).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );

    // Nothing left: say so, and clear every filter at once.
    await filters.getByRole('combobox', { name: 'Role' }).click();
    await page.getByRole('option', { name: 'Administrator' }).click();
    await expect(page.getByText('No users match these filters')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL(/\/settings\/users$/);
    await expect(rows.first()).toBeVisible();

    await page.setViewportSize({ width: 375, height: 800 });
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('users-filters-375.png'),
        fullPage: true,
    });
});
