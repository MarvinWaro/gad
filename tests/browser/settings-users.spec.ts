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

test('long region and institution names wrap inside the user dialog', async ({
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
    await dialog.getByRole('checkbox', { name: 'HEI Focal' }).click();
    const region = dialog.getByRole('combobox', { name: 'Region' });
    const institution = dialog.getByRole('combobox', { name: 'Institution' });
    await expect(region).toHaveText('Regional Office XII');

    // The fixture's names are short, so the longest real ones stand in.
    await region.locator('[data-slot="select-value"]').evaluate((value) => {
        value.textContent =
            'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)';
    });
    await institution
        .locator('span')
        .first()
        .evaluate((value) => {
            value.textContent =
                'Mindanao State University – General Santos City';
        });

    // Where each field sits, and whether its whole name shows.
    const measure = () =>
        dialog.evaluate((element) => {
            const form = element.querySelector('form')!.getBoundingClientRect();
            const field = (name: string) => {
                const trigger = [
                    ...element.querySelectorAll('[role="combobox"]'),
                ].find(
                    (control) =>
                        control.id &&
                        element
                            .querySelector(`label[for="${control.id}"]`)
                            ?.textContent?.trim() === name,
                )!;
                const text = trigger.firstElementChild!;
                const box = trigger.getBoundingClientRect();

                return {
                    top: box.top,
                    bottom: box.bottom,
                    height: box.height,
                    inside:
                        box.left >= form.left - 0.5 &&
                        box.right <= form.right + 0.5,
                    whole: text.scrollHeight <= text.clientHeight + 1,
                };
            };

            return {
                region: field('Region'),
                institution: field('Institution'),
            };
        });

    // A row each: nothing overlaps, and both stay inside the form.
    let fields = await measure();
    expect(fields.region.inside && fields.institution.inside).toBe(true);
    expect(fields.region.bottom).toBeLessThanOrEqual(fields.institution.top);

    // On a phone, long names wrap onto a second line instead of being cut.
    await page.setViewportSize({ width: 375, height: 800 });
    fields = await measure();
    for (const field of [fields.region, fields.institution]) {
        expect(field.inside).toBe(true);
        expect(field.height).toBeGreaterThan(44);
        expect(field.whole).toBe(true);
    }
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await dialog.screenshot({
        path: testInfo.outputPath('user-form-long-names-375.png'),
    });
});

test('saving an account keeps the filtered list, and Edit shows what is saved', async ({
    page,
}) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/settings/users');

    // An account of its own, so the other specs' accounts stay as they are.
    await page.getByRole('button', { name: 'Add user' }).click();
    const create = page.getByRole('dialog', { name: 'Create user' });
    await create.getByLabel('Name', { exact: true }).fill('List State Member');
    await create.getByLabel('Email address').fill('list-state@example.test');
    await create.getByRole('checkbox', { name: 'HEI User' }).click();
    await create.getByRole('combobox', { name: 'Institution' }).click();
    await page.getByRole('option', { name: 'Browser Test HEI' }).click();
    await create.getByRole('button', { name: 'Create user' }).click();
    await expect(create).toBeHidden();

    // Narrow the list, then edit the account from it.
    const filters = page.getByRole('group', { name: 'Filter users' });
    await filters.getByRole('combobox', { name: 'Role' }).click();
    await page.getByRole('option', { name: 'HEI User', exact: true }).click();
    await expect(page).toHaveURL(/role=hei(&|$)/);
    const row = page
        .getByRole('row')
        .filter({ hasText: 'list-state@example.test' });
    await row.getByRole('button', { name: 'Edit List State Member' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit user' });
    await edit.getByLabel('Name', { exact: true }).fill('List State Saved');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(edit).toBeHidden();

    // Still the same filtered list, with the change in it.
    await expect(page).toHaveURL(/role=hei(&|$)/);
    await expect(filters.getByRole('combobox', { name: 'Role' })).toHaveText(
        'HEI User',
    );
    await expect(
        row.getByText('List State Saved', { exact: true }),
    ).toBeVisible();

    // Edit opens with what is saved, and a cancelled change never comes back.
    const reopen = () =>
        row.getByRole('button', { name: 'Edit List State Saved' }).click();
    await reopen();
    await expect(edit.getByLabel('Name', { exact: true })).toHaveValue(
        'List State Saved',
    );
    await edit.getByLabel('Name', { exact: true }).fill('Not saved');
    await edit.getByRole('button', { name: 'Cancel' }).click();
    await expect(edit).toBeHidden();
    await reopen();
    await expect(edit.getByLabel('Name', { exact: true })).toHaveValue(
        'List State Saved',
    );
});
