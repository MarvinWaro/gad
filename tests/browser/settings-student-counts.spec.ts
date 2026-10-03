import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** A graduates file as the analyst writes it, in capitals. */
function sheet(rows: string[]) {
    return {
        name: 'graduates_2023_2024.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
            [
                'Discipline Group,Male Count,Female Count,Academic Year',
                ...rows,
            ].join('\n'),
        ),
    };
}

test('a regional office imports, reads and deletes its figures', async ({
    page,
}, testInfo) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/settings/student-counts');
    await expect(
        page.getByRole('link', { name: 'Enrollment & graduates' }),
    ).toBeVisible();
    // The newest year with figures, from tests/browser/server.php.
    await expect(
        page.getByRole('heading', {
            name: 'Enrollment by discipline group, AY 2025-2026',
        }),
    ).toBeVisible();
    await expect(page.locator('tfoot')).toContainText('227,823');

    await page
        .getByRole('navigation', { name: 'Figures' })
        .getByRole('link', { name: 'Graduates' })
        .click();
    await expect(page).toHaveURL(/kind=graduates/);
    await expect(page.locator('tfoot')).toContainText('31,990');

    // A file with a problem is refused whole.
    await page.getByRole('button', { name: 'Import file' }).click();
    const dialog = page.getByRole('dialog', {
        name: 'Import enrollment or graduates',
    });
    await dialog
        .locator('input[type="file"]')
        .setInputFiles(
            sheet([
                'ENGINEERING,1230,687,2023-2024',
                'MARITIME,lots,7,2023-2024',
            ]),
        );
    await dialog.getByRole('button', { name: 'Import', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText(
        'Row 3: Male Count must be a whole number, 0 or more.',
    );

    await dialog.getByRole('button', { name: /^Remove / }).click();
    await dialog
        .locator('input[type="file"]')
        .setInputFiles(
            sheet([
                'ENGINEERING,1230,687,2023-2024',
                'MARITIME,367,7,2023-2024',
            ]),
        );
    await dialog.getByRole('button', { name: 'Import', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/academic_year=2023-2024/);
    await expect(
        page.getByText(
            'Imported 2 discipline groups: AY 2023-2024 graduates for Regional Office XII.',
        ),
    ).toBeVisible();
    await expect(page.getByRole('row', { name: /^Engineering/ })).toContainText(
        '1,917',
    );
    await expect(page.locator('tfoot')).toContainText('2,291');

    for (const theme of ['light', 'dark']) {
        await page.evaluate(
            (value) =>
                document.documentElement.classList.toggle(
                    'dark',
                    value === 'dark',
                ),
            theme,
        );
        for (const width of [375, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        document.documentElement.clientWidth,
                ),
            ).toBe(true);
            await page.screenshot({
                path: testInfo.outputPath(
                    `student-counts-${theme}-${width}.png`,
                ),
                fullPage: true,
            });
        }
        const scan = await new AxeBuilder({ page })
            .include('main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
    }

    // Deleting the year leaves the others, and the homepage, as they were.
    await page.getByRole('button', { name: 'Delete these figures' }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Delete' })
        .click();
    await expect(
        page.getByRole('heading', {
            name: 'No graduates figures for AY 2023-2024',
        }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'AY 2025-2026' }).click();
    await expect(page.locator('tfoot')).toContainText('31,990');
});
