import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * A region's CHED Focal keeps its own office details (the letterhead on its
 * monitoring reports) in Settings → Regions, which shows them their region
 * alone, with nothing else of the directory to change.
 */

async function logIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

test("a CHED Focal keeps their own region's office details up to date", async ({
    page,
}) => {
    await logIn(page, 'browser-quest-focal@example.test');
    await page.goto('/settings/profile');
    await page.getByRole('link', { name: 'Regions', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/regions$/);

    // Their region alone, with only its office details to change.
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Regional Office XII');
    await expect(page.getByRole('button', { name: 'Add region' })).toHaveCount(
        0,
    );
    await expect(
        page.getByRole('button', { name: /^(Deactivate|Activate)$/ }),
    ).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Delete this region' }),
    ).toHaveCount(0);

    const open = page.getByRole('button', {
        name: 'Office details for Regional Office XII',
    });
    const dialog = page.getByRole('dialog', { name: 'Office details' });
    const phone = dialog.getByLabel('Phone and fax');
    await open.click();
    await expect(dialog.getByLabel('City')).toHaveValue('Koronadal City');
    const seeded = await phone.inputValue();
    expect(seeded).not.toBe('');

    const scan = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
    expect(scan.violations).toEqual([]);

    await phone.fill('(083) 000-0000');
    await dialog.getByRole('button', { name: 'Save office details' }).click();
    await expect(
        page.getByText('Office details saved for Regional Office XII.'),
    ).toBeVisible();
    await expect(dialog).toBeHidden();

    // It opens with what is saved: a cancelled change is gone.
    await open.click();
    await expect(phone).toHaveValue('(083) 000-0000');
    await phone.fill('Typed, then cancelled');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await open.click();
    await expect(phone).toHaveValue('(083) 000-0000');

    // The seeded details go back for the specs that follow.
    await phone.fill(seeded);
    await dialog.getByRole('button', { name: 'Save office details' }).click();
    await expect(dialog).toBeHidden();

    // The page fits a phone.
    await page.setViewportSize({ width: 375, height: 800 });
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
});
