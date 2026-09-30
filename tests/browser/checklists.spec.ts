import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

/** No axe violations and no sideways scroll, in both themes, on phone and desktop. */
async function checkLayout(
    page: Page,
    name: string,
    outputPath: (file: string) => string,
) {
    for (const theme of ['light', 'dark'] as const) {
        await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            theme === 'dark',
        );
        // Let colour transitions finish before the screenshots.
        await page.waitForTimeout(300);
        for (const width of [375, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth,
                ),
            ).toBe(true);
            await page.screenshot({
                path: outputPath(`${name}-${theme}-${width}.png`),
                fullPage: true,
            });
        }
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
}

test('an HEI answers the GAD Training Survey, and CHED reads the answer', async ({
    page,
    browser,
}, testInfo) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) =>
        errors.push(`${page.url()}: ${error.message}`),
    );
    await login(page, 'browser-monitoring@example.test');

    // The quick link leads to the survey's tab in Records. (It is followed
    // with goto: clicking scrolls the rail link into view, which can start
    // the feed's next page just as the page changes.)
    await expect(
        page
            .getByRole('link', { name: 'GAD Training Survey', exact: true })
            .first(),
    ).toHaveAttribute('href', /\/records\/training$/);
    await page.goto('/records/training');
    await expect(page).toHaveURL(/\/records\/training$/);
    await expect(
        page.getByRole('heading', { name: 'GAD Related Trainings' }),
    ).toBeVisible();
    await expect(
        page
            .getByRole('navigation', { name: 'Records' })
            .getByRole('link', { name: 'Training Survey' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Nothing submitted yet.')).toBeVisible();

    // Check all, then leave one out: "Check all" shows some are checked.
    const checkAll = page.getByRole('checkbox', { name: 'Check all' });
    await checkAll.click();
    await expect(page.getByText('8 of 8 checked')).toBeVisible();
    await page
        .getByRole('checkbox', { name: 'Collection of sex disaggregated data' })
        .click();
    await expect(checkAll).toHaveAttribute('aria-checked', 'mixed');
    await expect(page.getByText('7 of 8 checked')).toBeVisible();
    await checkLayout(page, 'training-survey', (file) =>
        testInfo.outputPath(file),
    );

    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(
        page.getByText(/^Submitted .* by Fictional Monitoring Member$/),
    ).toBeVisible();
    const answers = page.getByRole('complementary', { name: 'Your answers' });
    await expect(answers.getByRole('link')).toHaveCount(1);
    await expect(answers.getByText('7 of 8')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Update answers' }),
    ).toBeVisible();

    // The other survey is its own tab, still unanswered.
    await page
        .getByRole('navigation', { name: 'Records' })
        .getByRole('link', { name: 'Compliance Survey' })
        .click();
    await expect(
        page.getByRole('heading', {
            name: 'Implementing Rules and Regulations on Gender-Based Sexual Harassment in Higher Education Institutions',
        }),
    ).toBeVisible();
    await expect(page.getByText('0 of 12 checked')).toBeVisible();

    // CHED sees the HEI's answer in its region, and opens it.
    const admin = await (await browser.newContext()).newPage();
    admin.on('pageerror', (error) =>
        errors.push(`${admin.url()}: ${error.message}`),
    );
    await login(admin, 'browser-admin@example.test');
    await admin.goto('/admin/monitoring/training');
    await expect(
        admin.getByRole('heading', { name: 'GAD Training Survey', level: 1 }),
    ).toBeVisible();
    const rows = admin
        .getByRole('main')
        .getByRole('listitem')
        .filter({ hasText: 'Browser Test HEI' });
    await expect(rows).toHaveCount(1);
    await expect(rows.getByText('7 of 8')).toBeVisible();
    await admin
        .getByRole('button', { name: /^Answers of Browser Test HEI/ })
        .click();
    await expect(
        rows.getByText('Checked: Gender Sensitivity Training'),
    ).toBeAttached();
    await expect(
        rows.getByText('Not checked: Collection of sex disaggregated data'),
    ).toBeAttached();
    await expect(
        rows.getByText('Submitted by Fictional Monitoring Member'),
    ).toBeVisible();
    await checkLayout(admin, 'training-answers', (file) =>
        testInfo.outputPath(file),
    );

    // Filters apply at once; a year with no answers says so.
    await admin.getByRole('combobox', { name: 'Academic year' }).click();
    await admin.getByRole('option', { name: '2020-2021' }).click();
    await expect(admin).toHaveURL(/academic_year=2020-2021/);
    await expect(
        admin.getByText('No answers match these filters'),
    ).toBeVisible();

    expect(errors).toEqual([]);
});
