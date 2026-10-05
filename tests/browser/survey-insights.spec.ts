import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Survey analytics: the Surveys page's insights, and a law's Summary of
 * its answers, from the five RA 9262 answers seeded in AY 2025-2026
 * (tests/browser/server.php).
 */

async function logIn(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

/** Fits 375px and 1440px in both themes, with no axe violations. */
async function checkBothThemes(page: Page, testInfo: TestInfo, name: string) {
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
                path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
                fullPage: true,
            });
        }
        const scan = await new AxeBuilder({ page })
            .include('main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
}

test('the Surveys page shows insights, and a law opens its Summary', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page);
    await page.goto('/admin/surveys?academic_year=2025-2026');

    await expect(
        page.getByRole('heading', { name: 'Survey insights' }),
    ).toBeVisible();
    const figures = page.locator('dl[aria-label="Survey figures"]');
    await expect(figures).toContainText('Responses5');
    await expect(figures).toContainText('80%');
    // The library is still there, as it was.
    await expect(page.getByText('Survey library')).toBeVisible();
    await checkBothThemes(page, testInfo, 'survey-insights');

    await page
        .getByRole('region', { name: 'Responses by law' })
        .getByRole('link', { name: 'RA 9262' })
        .click();
    await expect(page).toHaveURL(/\/admin\/surveys\/\d+\/summary$/);
    // The current year has none of the seeded answers (at most the one
    // ra9262.spec.ts sends), too few to show any.
    await expect(
        page.getByText(
            /^(No responses in view yet|Too few responses to show answers)$/,
        ),
    ).toBeVisible();
});

test('a Summary shows each answer by sex, and hides answers for a small group', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page);
    await page.goto('/admin/surveys');
    const summaryHref = await page
        .getByRole('row')
        .filter({ hasText: 'RA 9262' })
        .locator('a[href$="/summary"]')
        .getAttribute('href');
    await page.goto(`${summaryHref}?academic_year=2025-2026`);

    await expect(
        page
            .getByRole('navigation', { name: 'Survey results' })
            .getByRole('link', {
                name: 'Summary',
            }),
    ).toHaveAttribute('aria-current', 'page');
    const experiences = page.getByRole('region', {
        name: 'Violence Experiences',
    });
    const battery = experiences
        .getByRole('listitem')
        .filter({ hasText: 'Battery (Pananakit)' });
    await expect(battery).toContainText('4 · 80%');
    await expect(battery).toContainText('4 female · 0 male');
    await battery.getByText('Who was responsible').click();
    await expect(battery).toContainText('Teacher');

    await experiences.getByRole('button', { name: 'View data' }).click();
    await expect(
        experiences.getByRole('cell', { name: '4', exact: true }).first(),
    ).toBeVisible();
    await checkBothThemes(page, testInfo, 'survey-summary');

    // One man answered: too few to show answers without risking him.
    await page.getByRole('combobox', { name: 'Sex' }).click();
    await page.getByRole('option', { name: /^Male/ }).click();
    await expect(page).toHaveURL(/sex=male/);
    await expect(
        page.getByText('Too few responses to show answers'),
    ).toBeVisible();
    await expect(experiences).toHaveCount(0);
});

test('a CHED Focal reads the surveys without changing them', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page
        .getByLabel('Email address')
        .fill('browser-quest-focal@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);

    await page
        .locator('[data-sidebar="sidebar"]')
        .getByRole('link', { name: 'Surveys' })
        .click();
    await expect(page).toHaveURL(/\/admin\/surveys$/);
    await expect(
        page.getByRole('heading', { name: 'Survey insights' }),
    ).toBeVisible();
    // Nothing that changes a survey, and no single responses.
    await expect(page.getByRole('button', { name: 'New survey' })).toHaveCount(
        0,
    );
    const row = page.getByRole('row').filter({ hasText: 'RA 9262' });
    await expect(row.locator('a[href$="/responses"]')).toHaveCount(0);
    await expect(row.getByRole('button')).toHaveCount(0);

    await row.locator('a[href$="/summary"]').click();
    await expect(page).toHaveURL(/\/summary$/);
    await expect(
        page.getByRole('navigation', { name: 'Survey results' }),
    ).toHaveCount(0);
    await checkBothThemes(page, testInfo, 'survey-summary-focal');

    await page.goto('/admin/surveys');
    await page
        .getByRole('row')
        .filter({ hasText: 'RA 9262' })
        .getByRole('link', { name: /^View the draft/ })
        .click();
    await expect(page.getByText('View only', { exact: true })).toBeVisible();
});
