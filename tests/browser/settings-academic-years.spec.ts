import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('an admin can manage academic years with an automatic end-year preview', async ({
    page,
}) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/settings/academic-years');
    await expect(
        page.getByRole('link', { name: 'Academic years' }),
    ).toBeVisible();
    await expect(
        page.getByRole('columnheader', { name: 'Created' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Add academic year' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add academic year' });
    await dialog.getByLabel('Starting year').fill('2035');
    await expect(dialog.locator('output')).toHaveText('2036');
    await expect(dialog.getByText('Academic year 2035-2036')).toBeVisible();
    await dialog.getByRole('button', { name: 'Add academic year' }).click();
    const row = page.getByRole('row', { name: /2035-2036/ });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Edit 2035-2036' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit academic year' });
    await edit.getByLabel('Starting year').fill('2036');
    await expect(edit.locator('output')).toHaveText('2037');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    const updated = page.getByRole('row', { name: /2036-2037/ });
    await expect(updated).toBeVisible();

    await updated.getByRole('button', { name: 'Deactivate' }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Deactivate' })
        .click();
    await expect(updated).toContainText('Inactive');
    await updated.getByRole('button', { name: 'Activate' }).click();
    await expect(updated).toContainText('Active');

    await page.setViewportSize({ width: 375, height: 800 });
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    expect(
        (
            await new AxeBuilder({ page })
                .include('main')
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                .analyze()
        ).violations,
    ).toEqual([]);

    await updated.getByRole('button', { name: 'Delete 2036-2037' }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Delete' })
        .click();
    await expect(updated).toHaveCount(0);
});
