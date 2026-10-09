import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * People: an HEI focal person finds a colleague through the header search
 * (in capitals, with a slip), follows them from their profile, and reads
 * the Following feed; the colleague is told and opens the follower's
 * profile from the bell.
 */

const follower = 'browser-monitoring@example.test';
const followed = 'browser-member@example.test';

async function logIn(page: Page, email: string) {
    await page.context().clearCookies();
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

// Profiles are addressed by the account's public ULID, never its number.
const profileUrl = /\/people\/[0-9a-hjkmnp-tv-z]{26}$/;

test('finding a colleague by search and following them', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, follower);

    // Capitals and a slip ("TST") still find Browser Test Member.
    const search = page.getByRole('combobox', { name: 'Search PHLGADIS' });
    await search.fill('BROWSER TST MEMB');
    const people = page.getByRole('listbox', { name: 'People' });
    await expect(
        people.getByRole('option', { name: /Browser Test Member/ }),
    ).toBeVisible();
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await search.press('ArrowDown');
    await expect(search).toHaveAttribute('aria-activedescendant', /option-0$/);
    await search.press('Enter');

    await expect(page).toHaveURL(profileUrl);
    await expect(
        page.getByRole('heading', { level: 1, name: 'Browser Test Member' }),
    ).toBeVisible();
    // Someone else's profile: no activity, no account settings.
    await expect(page.getByRole('tab', { name: 'Activity' })).toHaveCount(0);
    await expect(
        page.getByRole('link', { name: 'Edit account details' }),
    ).toHaveCount(0);

    await page
        .getByRole('button', { name: 'Follow Browser Test Member' })
        .click();
    const following = page.getByRole('button', {
        name: 'Following Browser Test Member',
    });
    await expect(following).toBeVisible();
    await expect(
        page.getByRole('button', { name: '1 follower' }),
    ).toBeVisible();

    await page.getByRole('button', { name: '1 follower' }).click();
    const list = page.getByRole('dialog', { name: 'Followers' });
    await expect(list).toContainText('Fictional Monitoring Member');
    await expect(list).toContainText('You');
    await page.keyboard.press('Escape');
    await checkBothThemes(page, testInfo, 'person-profile');

    // The results page lists everyone found, each with Follow.
    await search.fill('browser test');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=browser(\+|%20)test$/);
    const results = page.getByRole('region', { name: 'People' });
    await expect(
        results.getByRole('link', { name: 'Browser Test Member' }),
    ).toBeVisible();
    await expect(
        results.getByRole('button', { name: 'Following Browser Test Member' }),
    ).toBeVisible();
    await checkBothThemes(page, testInfo, 'search-results');

    // The Following feed holds only the people followed.
    await page.goto('/dashboard');
    await page
        .getByRole('navigation', { name: 'Feed' })
        .getByRole('link', { name: 'Following' })
        .click();
    await expect(page).toHaveURL(/feed=following/);
    const feed = page.getByRole('article');
    await expect(feed.first()).toContainText('Browser Test Member');
    await expect(
        feed.filter({ hasText: 'Fictional Monitoring Member' }),
    ).toHaveCount(0);

    // My region holds the posts of their own region, in the middle tab.
    const tabs = page.getByRole('navigation', { name: 'Feed' });
    await expect(tabs.getByRole('link')).toHaveText([
        'All posts',
        /^My region/,
        'Following',
    ]);
    await tabs.getByRole('link', { name: /^My region/ }).click();
    await expect(page).toHaveURL(/feed=region/);
    // Its HEIs' posts, and its CHED office's.
    await expect(feed.first()).toContainText(
        /Browser Test HEI|CHED Regional Office XII/,
    );
});

test('the Central Office has no My region tab', async ({ page }) => {
    await logIn(page, 'browser-national@example.test');
    await page.goto('/community');
    await expect(
        page.getByRole('navigation', { name: 'Feed' }).getByRole('link'),
    ).toHaveText(['All posts', 'Following']);
});

test("the person followed is told, and opens the follower's profile", async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, followed);

    await page.getByRole('button', { name: /^Notifications, / }).click();
    await page
        .getByRole('link', {
            name: /Fictional Monitoring Member started following you/,
        })
        .click();
    await expect(page).toHaveURL(profileUrl);
    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Fictional Monitoring Member',
        }),
    ).toBeVisible();
    await expect(page.getByText('Follows you')).toBeVisible();

    // Following back, then unfollowing from the Following menu.
    await page
        .getByRole('button', { name: 'Follow Fictional Monitoring Member' })
        .click();
    await page
        .getByRole('button', { name: 'Following Fictional Monitoring Member' })
        .click();
    await page
        .getByRole('menuitem', { name: 'Unfollow Fictional Monitoring Member' })
        .click();
    await expect(
        page.getByRole('button', {
            name: 'Follow Fictional Monitoring Member',
        }),
    ).toBeVisible();
});
