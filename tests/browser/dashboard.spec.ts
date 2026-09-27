import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
});

test('admin preview filters keep overview, chart and breakdowns consistent', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Your GAD network, at a glance.',
    );
    await expect(
        page.getByText('All figures and events are sample data.'),
    ).toBeVisible();
    const overview = page.locator('dl[aria-label="Sample overview metrics"]');
    await expect(overview).toContainText('2,486');
    const activity = page.getByRole('region', {
        name: 'Participation over time',
    });
    await activity
        .getByRole('button', { name: 'Show activity data table' })
        .click();
    await expect(activity.getByRole('table')).toContainText('284');
    await activity
        .getByRole('button', { name: 'Community posts', exact: true })
        .click();
    await expect(
        activity.getByRole('columnheader', { name: 'Community posts' }),
    ).toBeVisible();
    await expect(
        activity.getByRole('cell', { name: '12', exact: true }),
    ).toBeVisible();

    await page.getByRole('combobox', { name: 'View by' }).click();
    await page.getByRole('option', { name: 'Quarter' }).click();
    await expect(overview).toContainText('6,924');
    await expect(page.getByRole('status')).toContainText(
        '43 participating institutions',
    );
    await expect(activity.getByRole('table')).toContainText('Jul 1–15');
    await expect(
        activity.getByRole('cell', { name: '36', exact: true }),
    ).toBeVisible();
    const groups = page.getByRole('table', {
        name: 'Sample responses by respondent group',
    });
    const counts = await groups
        .locator('tbody tr td:first-of-type')
        .allTextContents();
    expect(
        counts.reduce(
            (sum, value) => sum + Number(value.replaceAll(',', '')),
            0,
        ),
    ).toBe(6924);
    await activity
        .getByRole('button', { name: 'Show activity data table' })
        .click();
    await expect(activity.locator('.recharts-area')).toHaveCount(1);
    await expect(
        page.getByRole('link', { name: 'Open community' }),
    ).toHaveAttribute('href', '/community');
    await expect(
        page.getByRole('link', { name: 'Manage law surveys' }),
    ).toHaveAttribute('href', '/admin/surveys');
    await expect(
        page.getByRole('link', { name: 'View calendar' }),
    ).toHaveAttribute('href', '/events');
    expect(errors).toEqual([]);
});

test('all reporting periods update both metrics and retain the annual event calendar', async ({
    page,
}) => {
    const period = page.getByRole('combobox', { name: 'View by' });
    const overview = page.locator('dl[aria-label="Sample overview metrics"]');
    const activity = page.getByRole('region', {
        name: 'Participation over time',
    });
    const calendar = page.getByRole('region', { name: '2026 event calendar' });
    const calendarText = await calendar.innerText();
    await expect(calendar).toContainText('4 sample events');
    await expect(calendar.locator('time')).toHaveCount(4);
    await activity
        .getByRole('button', { name: 'Show activity data table' })
        .click();

    for (const item of [
        {
            label: 'Month',
            responses: 2486,
            posts: 126,
            rows: 6,
            comparison: 'vs. August',
        },
        {
            label: 'Quarter',
            responses: 6924,
            posts: 302,
            rows: 6,
            comparison: 'vs. Q2',
        },
        {
            label: 'Semester',
            responses: 13724,
            posts: 652,
            rows: 6,
            comparison: 'vs. 1st semester 2026',
        },
        {
            label: 'Annual',
            responses: 24364,
            posts: 1096,
            rows: 12,
            comparison: 'vs. 2025',
        },
    ]) {
        await period.click();
        await expect(page.getByRole('option')).toHaveCount(4);
        await page
            .getByRole('option', { name: item.label, exact: true })
            .click();
        await expect(overview).toContainText(
            item.responses.toLocaleString('en-PH'),
        );
        await expect(overview).toContainText(
            item.posts.toLocaleString('en-PH'),
        );
        await expect(overview).toContainText(item.comparison);
        for (const [label, total] of [
            ['Survey responses', item.responses],
            ['Community posts', item.posts],
        ] as const) {
            await activity
                .getByRole('button', { name: label, exact: true })
                .click();
            await expect(activity.locator('tbody tr')).toHaveCount(item.rows);
            const values = await activity.locator('tbody td').allTextContents();
            expect(
                values.reduce(
                    (sum, value) => sum + Number(value.replaceAll(',', '')),
                    0,
                ),
            ).toBe(total);
        }
        const groups = page.getByRole('table', {
            name: 'Sample responses by respondent group',
        });
        const values = await groups
            .locator('tbody tr td:first-of-type')
            .allTextContents();
        expect(
            values.reduce(
                (sum, value) => sum + Number(value.replaceAll(',', '')),
                0,
            ),
        ).toBe(item.responses);
        await expect(calendar).toHaveText(calendarText, { useInnerText: true });
    }
    await expect(
        page.getByRole('region', { name: 'Every campus counts.' }),
    ).toContainText('All 46 registered HEIs contributed');
});

test('separate date controls update analytics and preserve the selected date when grouping changes', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 375, height: 1000 });
    await page.screenshot({ path: testInfo.outputPath('filters-mobile.png') });
    const grouping = page.getByRole('combobox', {
        name: 'View by',
        exact: true,
    });
    const overview = page.locator('dl[aria-label="Sample overview metrics"]');
    await expect(grouping).toContainText('Month');
    await expect(
        page.getByRole('combobox', { name: 'Year', exact: true }),
    ).toBeDisabled();
    await page.getByRole('combobox', { name: 'Month', exact: true }).click();
    await expect(page.getByRole('option')).toHaveCount(12);
    await page.getByRole('option', { name: 'August', exact: true }).click();
    await expect(overview).toContainText('2,114');
    await expect(overview).toContainText('-9.0% vs. July');
    await grouping.click();
    await page.getByRole('option', { name: 'Quarter', exact: true }).click();
    const quarter = page.getByRole('combobox', {
        name: 'Quarter',
        exact: true,
    });
    await expect(quarter).toContainText('Q3');
    await quarter.click();
    await expect(page.getByRole('option')).toHaveCount(4);
    await page
        .getByRole('option', { name: 'Q1 · Jan–Mar', exact: true })
        .click();
    await expect(overview).toContainText('4,820');
    await expect(overview).toContainText('No earlier sample data');
    await grouping.click();
    await page.getByRole('option', { name: 'Semester', exact: true }).click();
    const semester = page.getByRole('combobox', {
        name: 'Semester',
        exact: true,
    });
    await expect(semester).toContainText('1st semester');
    await semester.click();
    await expect(page.getByRole('option')).toHaveCount(2);
    await page
        .getByRole('option', { name: '2nd semester · Jul–Dec', exact: true })
        .click();
    await expect(overview).toContainText('13,724');
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
        ),
    ).toBe(false);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('filters-desktop.png') });
    await grouping.click();
    await page.getByRole('option', { name: 'Annual', exact: true }).click();
    await expect(
        page
            .getByRole('group', { name: 'Reporting filters' })
            .getByRole('combobox'),
    ).toHaveCount(2);
    await expect(overview).toContainText('24,364');
    await grouping.click();
    await page.getByRole('option', { name: 'Month', exact: true }).click();
    await expect(
        page.getByRole('combobox', { name: 'Month', exact: true }),
    ).toContainText('July');
    await expect(overview).toContainText('2,324');
});

test('admin dashboard fits mobile and desktop and passes accessibility checks in both themes', async ({
    page,
}, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('combobox', { name: 'View by' }).click();
    await page.getByRole('option', { name: 'Annual' }).click();
    for (const theme of ['light', 'dark']) {
        await page.evaluate(
            (value) =>
                document.documentElement.classList.toggle(
                    'dark',
                    value === 'dark',
                ),
            theme,
        );
        for (const width of [375, 768, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            );
            expect(overflow).toBe(false);
            const ticks = page.locator(
                '.recharts-xAxis .recharts-cartesian-axis-tick',
            );
            const boxes = await ticks.evaluateAll((nodes) =>
                nodes.map((node) => {
                    const rect = node.getBoundingClientRect();
                    return { left: rect.left, right: rect.right };
                }),
            );
            expect(boxes.length).toBeGreaterThan(1);
            for (let index = 1; index < boxes.length; index++) {
                expect(boxes[index].left).toBeGreaterThanOrEqual(
                    boxes[index - 1].right,
                );
            }
            if (width !== 768)
                await page.screenshot({
                    path: testInfo.outputPath(
                        `dashboard-${theme}-${width}.png`,
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
    // The period selector also works without a pointer.
    const period = page.getByRole('combobox', { name: 'View by' });
    await period.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('option', { name: 'Annual' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(
        page.getByRole('option', { name: 'Month', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(
        page.getByRole('option', { name: 'Quarter', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Semester' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(period).toContainText('Semester');
    await period.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('option', { name: 'Semester' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('option', { name: 'Annual' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(period).toContainText('Annual');
});
