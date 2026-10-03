import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DAY = 86_400_000;
const MANILA = 8 * 3_600_000;

/**
 * Where tests/browser/server.php put the dashboard's figures: two goal-tagged
 * posts and three survey answers, all 32 days ago. Other specs post and
 * answer today, so that day's month holds only the seeded figures. Read in
 * Philippine time; academic years start in August.
 */
function seeded() {
    const day = new Date(Date.now() - 32 * DAY + MANILA);
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth() + 1;
    const start = month >= 8 ? year : year - 1;
    return {
        academicYear: `${start}-${start + 1}`,
        month,
        monthName: day.toLocaleString('en-PH', {
            month: 'long',
            timeZone: 'UTC',
        }),
    };
}

function metric(page: Page, label: string) {
    return page
        .locator('dl[aria-label="Overview metrics"] > div')
        .filter({ has: page.locator('dt', { hasText: label }) })
        .locator('dd')
        .first();
}

test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    const { academicYear, month } = seeded();
    await page.goto(
        `/dashboard?academic_year=${academicYear}&view=month&month=${month}`,
    );
});

test('the dashboard shows the network’s real figures, led by its goals', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Your GAD network, at a glance.',
    );
    await expect(page.getByText(/sample data/i)).toHaveCount(0);
    await expect(metric(page, 'Survey responses')).toHaveText('3');
    await expect(metric(page, 'Participating HEIs')).toHaveText('1');

    // The chart switches between responses and posts, one at a time.
    const activity = page.getByRole('region', {
        name: 'Participation over time',
    });
    await expect(activity).toContainText('3 in this period');
    const postsShared = activity.getByRole('button', {
        name: 'Posts shared',
        exact: true,
    });
    await postsShared.click();
    await expect(postsShared).toHaveAttribute('aria-pressed', 'true');
    await expect(activity).toContainText(
        `${await metric(page, 'GAD posts').textContent()} in this period`,
    );
    await activity
        .getByRole('button', { name: 'Show activity data table' })
        .click();
    await expect(
        activity.getByRole('columnheader', { name: 'Posts shared' }),
    ).toBeVisible();
    await activity
        .getByRole('button', { name: 'Show activity data table' })
        .click();
    await expect(
        page.locator('dl[aria-label="Overview metrics"]'),
    ).toContainText('2 tagged with an SDG or A.C.H.I.E.V.E. item');

    const goals = page.getByRole('region', {
        name: 'Where GAD work meets the goals',
    });
    await expect(goals).toContainText('Tagged posts');
    const ranked = goals
        .getByRole('list', { name: 'Goals' })
        .getByRole('listitem');
    // Goals with posts rank first; the rest wait behind a button.
    await expect(ranked).toHaveCount(3);
    await expect(ranked.first()).toContainText('Gender Equality');
    await expect(ranked.first()).toContainText('2');
    await goals
        .getByRole('button', { name: 'Show the 14 goals with no posts yet' })
        .click();
    await expect(ranked).toHaveCount(17);

    const gender = goals.getByRole('button', { name: /Gender Equality/ });
    await gender.click();
    await expect(gender).toHaveAttribute('aria-pressed', 'true');
    const details = goals.getByRole('complementary');
    await expect(details.getByRole('heading', { level: 3 })).toHaveText(
        'SDG 5 · Gender Equality',
    );
    await expect(details).toContainText('2 posts');
    await expect(details).toContainText('Browser Test HEI');
    await expect(
        goals.getByRole('table', { name: 'Tagged posts by hei and goal' }),
    ).toContainText('Browser Test HEI');
    await expect(goals).toContainText(
        'The content of this publication has not been approved by the United Nations',
    );

    await goals.getByRole('tab', { name: 'A.C.H.I.E.V.E. Agenda' }).click();
    const agenda = goals
        .getByRole('list', { name: 'Agenda items' })
        .getByRole('listitem');
    await expect(agenda).toHaveCount(2);
    await expect(agenda.first()).toContainText(
        'Vitalized Policies, Internal Systems, and Governance',
    );

    await expect(
        page
            .getByRole('region', { name: 'Whose voices are we hearing?' })
            .getByRole('table', { name: 'Responses by sex' }),
    ).toContainText(/Female\s*2/);
    await expect(
        page.getByRole('region', { name: 'Four laws. One shared purpose.' }),
    ).toContainText('RA 9710');
    // The donuts read out through their tables.
    await expect(
        page
            .getByRole('region', { name: 'Who shares the work' })
            .getByRole('table', { name: 'Posts by who posted them' }),
    ).toContainText(/HEIs, ownership not recorded\s*\d+\s*100%/);
    await expect(
        page
            .getByRole('region', { name: 'People on PHLGADIS' })
            .getByRole('table', { name: 'Accounts by kind and status' }),
    ).toContainText('CHED staff');
    expect(errors).toEqual([]);
});

test('period and law filters change the figures and the address', async ({
    page,
}) => {
    const { month, monthName } = seeded();
    const months = page.getByRole('combobox', { name: 'Month', exact: true });
    await expect(months).toContainText(monthName);

    await page.getByRole('combobox', { name: 'Law survey' }).click();
    await page.getByRole('option', { name: 'RA 9710', exact: true }).click();
    await expect(page).toHaveURL(/survey=\d+/);
    await expect(metric(page, 'Survey responses')).toHaveText('1');
    await expect(
        page.getByRole('region', { name: 'Participation over time' }),
    ).toContainText(`${monthName.slice(0, 3)} 1–5`);

    // The month before holds nothing seeded (August opens the year).
    if (month !== 8) {
        const before = new Date(Date.UTC(2000, month - 2, 1)).toLocaleString(
            'en-PH',
            { month: 'long', timeZone: 'UTC' },
        );
        await months.click();
        await page.getByRole('option', { name: before, exact: true }).click();
        await expect(page).toHaveURL(
            new RegExp(`[?&]month=${month === 1 ? 12 : month - 1}(&|$)`),
        );
        await expect(metric(page, 'Survey responses')).toHaveText('0');
        await months.click();
        await page
            .getByRole('option', { name: monthName, exact: true })
            .click();
        await expect(metric(page, 'Survey responses')).toHaveText('1');
    }

    await page.getByRole('combobox', { name: 'Law survey' }).click();
    await page.getByRole('option', { name: 'All law surveys' }).click();
    await expect(metric(page, 'Survey responses')).toHaveText('3');
    await expect(page).not.toHaveURL(/survey=/);

    await page.getByRole('combobox', { name: 'View by' }).click();
    await page.getByRole('option', { name: 'Whole year', exact: true }).click();
    await expect(page).toHaveURL(/view=year/);
    await expect(page).not.toHaveURL(/month=/);
    await expect(months).toHaveCount(0);
});

test('enrollment and graduates show the latest imported year by sex', async ({
    page,
}) => {
    const section = page.getByRole('region', {
        name: 'Who studies, who graduates.',
    });
    // tests/browser/server.php imports AY 2025-2026, before the year in view.
    await expect(section).toContainText('227,823');
    await expect(section).toContainText('31,990');
    await expect(section).toContainText('The latest year imported');
    await expect(section.getByRole('listitem')).toHaveCount(8);
    // Largest first.
    await expect(section.getByRole('listitem').first()).toContainText(
        'Education Science and Teacher Training',
    );
    await expect(section.getByRole('listitem').first()).toContainText(
        '69% female, 31% male',
    );

    await section
        .getByRole('group', { name: 'Figures' })
        .getByRole('button', { name: 'Graduates', exact: true })
        .click();
    await expect(
        section.getByRole('heading', {
            name: 'Graduates by discipline group, AY 2025-2026',
        }),
    ).toBeVisible();
    await section
        .getByRole('button', { name: 'Show graduates data table' })
        .click();
    await expect(section.locator('tfoot')).toContainText('31,990');
    await expect(
        section.getByRole('link', { name: 'Manage enrollment and graduates' }),
    ).toHaveAttribute('href', '/settings/student-counts');
    await expect(section).toContainText(
        'Regional totals from Regional Office XII.',
    );
});

test('the goal tabs and rows work from the keyboard', async ({ page }) => {
    const goals = page.getByRole('region', {
        name: 'Where GAD work meets the goals',
    });
    const sdgTab = goals.getByRole('tab', {
        name: 'SDGs',
    });
    await sdgTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(
        goals.getByRole('tab', { name: 'A.C.H.I.E.V.E. Agenda' }),
    ).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(sdgTab).toHaveAttribute('aria-selected', 'true');

    const climate = goals.getByRole('button', { name: /Climate Action/ });
    await climate.focus();
    await page.keyboard.press('Enter');
    await expect(climate).toHaveAttribute('aria-pressed', 'true');
    await expect(
        goals.getByRole('complementary').getByRole('heading', { level: 3 }),
    ).toHaveText('SDG 13 · Climate Action');
    await page.keyboard.press('Enter');
    await expect(climate).toHaveAttribute('aria-pressed', 'false');
});

test('the dashboard fits phones and desktops and passes accessibility checks in both themes', async ({
    page,
}, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
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
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth >
                        window.innerWidth,
                ),
            ).toBe(false);
            if (width !== 768) {
                await page.screenshot({
                    path: testInfo.outputPath(
                        `dashboard-${theme}-${width}.png`,
                    ),
                    fullPage: true,
                });
                await page
                    .getByRole('region', {
                        name: 'Where GAD work meets the goals',
                    })
                    .screenshot({
                        path: testInfo.outputPath(
                            `dashboard-goals-${theme}-${width}.png`,
                        ),
                    });
            }
        }
        const scan = await new AxeBuilder({ page })
            .include('main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
    }
});

test('zoomed out, the dashboard keeps the same padding as the other modules', async ({
    page,
}, testInfo) => {
    // A 1920px screen at 80% zoom is 2400 CSS pixels wide.
    await page.setViewportSize({ width: 2400, height: 1000 });
    // Where a page's filter card starts and ends.
    const edges = async (path: string, filters: string) => {
        await page.goto(path);
        const card = (await page
            .getByRole('group', { name: filters })
            .boundingBox())!;
        return { left: card.x, right: card.x + card.width };
    };

    const feedback = await edges('/admin/feedback', 'Filter feedback');
    const dashboard = await edges('/dashboard', 'Reporting filters');
    expect(dashboard.left).toBeCloseTo(feedback.left, 0);
    expect(dashboard.right).toBeCloseTo(feedback.right, 0);
    await page.screenshot({
        path: testInfo.outputPath('dashboard-2400.png'),
    });

    // Settings lists fill the width too, to the same right edge.
    const users = await edges('/settings/users', 'Filter users');
    expect(users.right).toBeCloseTo(feedback.right, 0);
});

test('with many regions, the campus card lists the leaders and opens the rest in a table', async ({
    page,
}, testInfo) => {
    // The Central Office sees every region: Region XII and six more.
    await page.context().clearCookies();
    await page.goto('/login');
    await page
        .getByLabel('Email address')
        .fill('browser-national@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    const { academicYear, month } = seeded();
    await page.goto(
        `/dashboard?academic_year=${academicYear}&view=month&month=${month}`,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });

    const card = page.getByRole('region', { name: 'Every campus counts.' });
    await expect(card.getByRole('listitem')).toHaveCount(5);
    // Leaders first: the one region with responses heads the list.
    await expect(card.getByRole('listitem').first()).toContainText(
        'Regional Office XII',
    );

    // The card no longer stretches the chart beside it.
    const chart = page.getByRole('region', {
        name: 'Participation over time',
    });
    const [cardBox, chartBox] = [
        (await card.boundingBox())!,
        (await chart.boundingBox())!,
    ];
    expect(
        Math.abs(cardBox.y + cardBox.height - (chartBox.y + chartBox.height)),
    ).toBeLessThanOrEqual(2);
    expect(cardBox.height).toBeLessThan(560);

    await card.screenshot({ path: testInfo.outputPath('reach-card.png') });

    const all = card.getByRole('button', { name: 'View all 7 regions' });
    await all.click();
    const dialog = page.getByRole('dialog', {
        name: 'Participation by region',
    });
    await expect(dialog.locator('tbody tr')).toHaveCount(7);
    await expect(dialog.locator('tbody tr').first()).toContainText(
        'Regional Office XII',
    );
    for (const theme of ['light', 'dark']) {
        await page.evaluate(
            (value) =>
                document.documentElement.classList.toggle(
                    'dark',
                    value === 'dark',
                ),
            theme,
        );
        // Let the dialog's entrance and the theme's colour change finish.
        await page.evaluate(() =>
            Promise.all(
                document
                    .getAnimations()
                    .filter(
                        (animation) =>
                            animation.effect?.getComputedTiming().iterations !==
                            Infinity,
                    )
                    .map((animation) => animation.finished),
            ),
        );
        const scan = await new AxeBuilder({ page })
            .include('[role="dialog"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
        await dialog.screenshot({
            path: testInfo.outputPath(`reach-table-${theme}.png`),
        });
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(all).toBeFocused();
});
