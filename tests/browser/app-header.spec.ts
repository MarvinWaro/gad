import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
    await page.evaluate(
        (dark) => document.documentElement.classList.toggle('dark', dark),
        theme === 'dark',
    );
    // Let colour transitions finish before the screenshots.
    await page.waitForTimeout(300);
}

async function expectAccessible(page: Page) {
    expect(
        (
            await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                .analyze()
        ).violations,
    ).toEqual([]);
}

test('staff top navigation: one row like Facebook, icon tabs, the Monitoring menu and a search', async ({
    page,
}, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await login(page, 'browser-admin@example.test');

    // The sidebar labels the Monitoring pages.
    await page.setViewportSize({ width: 1440, height: 900 });
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(
        sidebar.getByText('Monitoring', { exact: true }),
    ).toBeVisible();
    for (const name of ['Reports', 'Training Survey', 'Compliance Survey']) {
        await expect(sidebar.getByRole('link', { name })).toBeVisible();
    }
    await sidebar.getByRole('link', { name: 'Training Survey' }).click();
    await expect(page).toHaveURL(/\/admin\/monitoring\/training$/);
    await expect(
        sidebar.getByRole('link', { name: 'Training Survey' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
        sidebar.getByRole('link', { name: 'Reports' }),
    ).not.toHaveAttribute('aria-current', 'page');
    await page.screenshot({ path: testInfo.outputPath('sidebar-1440.png') });

    await page
        .getByRole('button', { name: 'Switch to top navigation' })
        .click();
    const nav = page.getByRole('navigation', { name: 'Main' });
    const menu = nav.getByRole('button', { name: 'Monitoring' });
    await expect(menu).toBeVisible();
    await expect(
        page.getByRole('button', { name: /^Account menu, / }),
    ).toBeVisible();
    // Only the icon, named for where it leads.
    await expect(
        page.getByRole('link', { name: 'PHLGADIS home' }),
    ).toBeVisible();
    // Each icon tab says its name on hover.
    await nav.getByRole('link', { name: 'Gender Mainstreaming' }).hover();
    await expect(page.getByRole('tooltip')).toHaveText('Gender Mainstreaming');

    // The search finds nothing yet, and says so.
    const comingSoon = page
        .getByText('Search is coming soon.')
        .filter({ visible: true });
    const search = page.getByRole('searchbox', { name: 'Search PHLGADIS' });
    await search.fill('Notre Dame');
    await expect(comingSoon).toBeVisible();
    await search.press('Enter');
    await expect(page).toHaveURL(/\/admin\/monitoring\/training$/);
    await search.press('Escape');
    await expect(comingSoon).toHaveCount(0);

    await menu.click();
    await expect(page.getByRole('menuitem')).toHaveText([
        'Reports',
        'Training Survey',
        'Compliance Survey',
    ]);
    await expect(
        page.getByRole('menuitem', { name: 'Training Survey' }),
    ).toHaveAttribute('aria-current', 'page');
    for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.screenshot({
            path: testInfo.outputPath(`header-menu-${theme}-1440.png`),
        });
    }
    await setTheme(page, 'light');
    await page.getByRole('menuitem', { name: 'Compliance Survey' }).click();
    await expect(page).toHaveURL(/\/admin\/monitoring\/compliance$/);

    // Every tab fits the one row at the narrowest desktop width.
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto('/dashboard');
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
        'aria-current',
        'page',
    );
    const rowHeight = (await nav.boundingBox())!.height;
    expect(rowHeight).toBe(56);
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('header-1024.png') });

    // Scrolled, the bar holds at the top.
    await page.mouse.wheel(0, 400);
    await expect
        .poll(async () => Math.round((await nav.boundingBox())!.y))
        .toBe(0);
    await page.screenshot({
        path: testInfo.outputPath('header-scrolled-1024.png'),
    });

    for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await expectAccessible(page);
    }
    await setTheme(page, 'light');

    // Phones: the bar keeps the menu button and a search button, and the
    // menu lists the same labelled groups.
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByRole('button', { name: 'Search PHLGADIS' }).click();
    await expect(
        page.getByRole('searchbox', { name: 'Search PHLGADIS' }),
    ).toBeFocused();
    await expect(comingSoon).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Navigation menu' });
    for (const label of [
        'Overview',
        'Monitoring',
        'Community',
        'Public site',
    ]) {
        await expect(sheet.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(
        sheet.getByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('aria-current', 'page');
    // Let the sheet finish sliding in.
    await page.waitForTimeout(400);
    await page.screenshot({
        path: testInfo.outputPath('header-sheet-375.png'),
    });
    await sheet.getByRole('link', { name: 'Compliance Survey' }).click();
    await expect(page).toHaveURL(/\/admin\/monitoring\/compliance$/);
    await expect(sheet).toHaveCount(0);

    expect(errors).toEqual([]);
});

test('HEI focal persons get the same header, with Community, Events and Monitoring', async ({
    page,
}, testInfo) => {
    await login(page, 'browser-monitoring@example.test');
    await page.setViewportSize({ width: 1440, height: 900 });
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Community' })).toHaveAttribute(
        'aria-current',
        'page',
    );
    await expect(nav.getByRole('link', { name: 'Events' })).toBeVisible();
    await nav.getByRole('button', { name: 'Monitoring' }).click();
    await expect(page.getByRole('menuitem')).toHaveText([
        'Records',
        'Training Survey',
        'Compliance Survey',
    ]);
    for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await page.screenshot({
            path: testInfo.outputPath(`hei-header-${theme}-1440.png`),
        });
    }
});
