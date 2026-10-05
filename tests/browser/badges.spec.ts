import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Badges: an HEI member earns Community Spark by sharing a tagged photo; an
 * administrator creates a custom badge with a picture and awards it by hand.
 * Both show on the member's profile.
 */

const photo = 'public/assets/img/ched12_building.jpg';
const picture = 'public/assets/img/persona-card.webp';
const member = 'browser-quest-player@example.test';

async function logIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
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

test('sharing a photo tagged with an SDG earns Community Spark', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, member);

    await page.getByRole('button', { name: /Share a GAD activity/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Post text').fill('Browser badges: our GAD forum.');
    await page.locator('input[type="file"]').setInputFiles(photo);
    await dialog.getByRole('button', { name: 'SDGs & ACHIEVE' }).click();
    await dialog
        .getByRole('button', { name: 'Goal 5: Gender Equality' })
        .click();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await dialog.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: 20_000 });
    await expect(
        page.getByText('Post shared. You earned the Community Spark badge.'),
    ).toBeVisible();

    // The bell tells them too, and opens their badges.
    await page.getByRole('button', { name: /^Notifications, / }).click();
    await page
        .getByRole('link', { name: /You earned the Community Spark badge/ })
        .click();
    await expect(page).toHaveURL(/\/profile\?tab=badges$/);
    const tab = page.getByRole('tab', { name: /^Badges/ });
    await expect(tab).toHaveAttribute('aria-selected', 'true');

    // A highlight opens the Badges tab at that badge.
    await page.getByRole('tab', { name: 'Posts' }).click();
    const achievements = page.getByRole('region', {
        name: 'Achievements Beta',
    });
    await achievements.getByRole('button', { name: 'Community Spark' }).click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    const badges = page.getByRole('tabpanel', { name: /^Badges/ });
    const tile = badges.getByRole('button', { name: /Community Spark/ });
    await expect(tile).toBeFocused();
    await tile.click();
    await expect(page.getByRole('dialog')).toContainText(
        'Shared a first photo of GAD work',
    );
    await page.keyboard.press('Escape');
    // The rest wait under "Still to earn", with how to earn them.
    await expect(
        badges.getByRole('region', { name: 'Still to earn' }),
    ).toContainText('Tagged photo posts on 5 different days');
});

test('an administrator creates a badge with a picture and awards it by hand', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, 'browser-admin@example.test');
    await page.goto('/settings/badges');

    const list = page.getByRole('region', { name: 'Badges' });
    // The four badges earned by sharing GAD work come first, then the three
    // GAD Quest levels, which stay on: no switch.
    await expect(list.getByRole('listitem')).toHaveCount(7);
    await expect(list).toContainText(
        'Earned by: A first photo post tagged with an SDG or an A.C.H.I.E.V.E. item',
    );
    const champion = list
        .getByRole('listitem')
        .filter({ hasText: 'Earned by: Every answer right in a GAD Quest' });
    await expect(champion).toContainText('Champion');
    await expect(champion.getByRole('switch')).toHaveCount(0);
    await checkBothThemes(page, testInfo, 'badges');

    await page.getByRole('button', { name: 'New badge' }).click();
    const dialog = page.getByRole('dialog', { name: 'New badge' });
    await dialog.getByLabel('Badge picture').setInputFiles(picture);
    await expect(dialog.locator('img')).toBeVisible();
    await dialog.getByLabel('Name').fill('Browser Forum Speaker');
    await dialog
        .getByLabel('What it is for')
        .fill('Spoke at a GAD forum of the region.');
    await dialog.getByRole('button', { name: 'Create badge' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
        page.getByText('Browser Forum Speaker created.'),
    ).toBeVisible();

    const row = list
        .getByRole('listitem')
        .filter({ hasText: 'Browser Forum Speaker' });
    await expect(row).toContainText('Awarded by hand');
    await expect(row.locator('img')).toHaveAttribute(
        'src',
        /\/storage\/badges\//,
    );
    await row.getByRole('link', { name: 'Browser Forum Speaker' }).click();

    await page.getByRole('button', { name: 'Award' }).click();
    const award = page.getByRole('dialog', {
        name: 'Award Browser Forum Speaker',
    });
    await award.getByLabel('Who').fill('Fictional Quest');
    await award.getByRole('button', { name: /Fictional Quest Player/ }).click();
    await award.getByLabel('What for (optional)').fill('the October forum');
    await award
        .getByRole('button', { name: 'Award to Fictional Quest Player' })
        .click();
    await expect(award).toHaveCount(0);

    const holders = page.getByRole('region', { name: '1 holder' });
    await expect(holders).toContainText('Fictional Quest Player');
    await expect(holders).toContainText('For the October forum');
    await checkBothThemes(page, testInfo, 'badge-holders');
});

test('the member finds both badges on their profile', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, member);
    await page.goto('/profile');

    const achievements = page.getByRole('region', {
        name: 'Achievements Beta',
    });
    await expect(achievements.getByRole('listitem')).toHaveCount(2);
    await achievements
        .getByRole('button', { name: /Browser Forum Speaker/ })
        .click();
    await page
        .getByRole('tabpanel', { name: /^Badges/ })
        .getByRole('button', { name: /Browser Forum Speaker/ })
        .click();
    await expect(page.getByRole('dialog')).toContainText('the October forum');
    await page.keyboard.press('Escape');
    await checkBothThemes(page, testInfo, 'profile-badges');
});
