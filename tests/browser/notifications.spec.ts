import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The Browser Test Member starts with twelve notifications, two of them read
// (tests/browser/server.php). The tests run in order and build on each other.
const member = 'browser-member@example.test';

async function logIn(page: Page, email = member) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

/** The bell's panel and its list. */
async function openPanel(page: Page) {
    await page.getByRole('button', { name: /^Notifications/ }).click();
    const panel = page.getByRole('dialog', { name: 'Notifications' });
    await expect(panel).toBeVisible();

    return {
        panel,
        rows: panel
            .getByRole('list', { name: 'Notifications, newest first' })
            .getByRole('listitem'),
        scroller: panel.locator('[aria-busy]'),
    };
}

test('the bell counts unread notifications and loads five more each time the panel reaches its end', async ({
    page,
}) => {
    await logIn(page);
    await expect(
        page.getByRole('button', { name: 'Notifications, 10 unread' }),
    ).toBeVisible();
    await expect(page.locator('[data-test="notification-badge"]')).toHaveText(
        '9+',
    );

    const { panel, rows, scroller } = await openPanel(page);
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toContainText(
        'Fictional Monitoring Member commented on your post',
    );
    await expect(
        panel.getByRole('heading', { name: 'Notifications' }),
    ).toBeFocused();

    await scroller.evaluate((element) =>
        element.scrollTo(0, element.scrollHeight),
    );
    await expect(rows).toHaveCount(10);
    await scroller.evaluate((element) =>
        element.scrollTo(0, element.scrollHeight),
    );
    await expect(rows).toHaveCount(12);

    // The ⋯ menu marks one read, then unread again.
    const first = rows.first();
    await first.hover();
    await first.getByRole('button', { name: 'Notification options' }).click();
    await page.getByRole('menuitem', { name: 'Mark as read' }).click();
    // A menu still closing would take the next click as a click outside it.
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Notifications, 9 unread' }),
    ).toBeAttached();
    await expect(first.getByText('Unread:')).toHaveCount(0);

    await first.getByRole('button', { name: 'Notification options' }).click();
    await page.getByRole('menuitem', { name: 'Mark as unread' }).click();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Notifications, 10 unread' }),
    ).toBeAttached();

    // Deleting asks first, by the ⋯ button.
    const last = rows.last();
    await last.hover();
    await last.getByRole('button', { name: 'Notification options' }).click();
    await page.getByRole('menuitem', { name: 'Delete notification' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('Delete this notification?');
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(rows).toHaveCount(11);
    await expect(page.getByText('Notification deleted.')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Notifications, 10 unread' }),
    ).toBeFocused();
});

test('opening a notification goes to the post and reads it', async ({
    page,
}) => {
    await logIn(page);
    const { rows } = await openPanel(page);
    await rows.first().getByRole('link').click();

    await expect(page).toHaveURL(/\/posts\/[0-9a-z]{26}$/);
    await expect(page.getByRole('dialog')).toContainText(
        'Browser seed post 11',
    );
    // The post's window hides the page behind it from assistive technology.
    await expect(
        page.getByRole('button', {
            name: 'Notifications, 9 unread',
            includeHidden: true,
        }),
    ).toBeAttached();
});

test('the Notifications page lists everything with tabs, filters and Mark all as read', async ({
    page,
}) => {
    await logIn(page);
    await openPanel(page);
    await page.getByRole('link', { name: 'View all notifications' }).click();

    await expect(page).toHaveURL(/\/notifications$/);
    await expect(
        page.getByRole('heading', { level: 1, name: 'Notifications' }),
    ).toBeVisible();
    await expect(
        page.getByText('You have 9 unread notifications'),
    ).toBeVisible();
    const list = page.getByRole('list', {
        name: 'Notifications, newest first',
    });
    await expect(list.getByRole('listitem')).toHaveCount(11);
    await expect(page.getByText('No older notifications')).toBeVisible();
    await expect(list.getByRole('listitem').first()).toContainText(
        'Gender Mainstreaming',
    );

    await page.getByRole('tab', { name: /Unread/ }).click();
    await expect(page).toHaveURL(/status=unread/);
    await expect(list.getByRole('listitem')).toHaveCount(9);

    await page.getByRole('tab', { name: 'All' }).click();
    await page.getByLabel('Search').fill('seed post 11');
    await expect(page).toHaveURL(/search=seed(\+|%20)post(\+|%20)11/);
    await expect(list.getByRole('listitem')).toHaveCount(1);

    await page.getByLabel('Search').fill('nothing like this');
    await expect(page.getByText('No notifications match')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(11);

    await page.getByLabel('Type').click();
    await page.getByRole('option', { name: 'Comments on your posts' }).click();
    await expect(page).toHaveURL(/kind=post_commented/);
    await expect(list.getByRole('listitem')).toHaveCount(11);

    await page.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(page.getByText('You’re all caught up')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Notifications', exact: true }),
    ).toBeAttached();
    await expect(page.locator('[data-test="notification-badge"]')).toHaveCount(
        0,
    );
    await expect(
        page.getByRole('button', { name: 'Mark all as read' }),
    ).toBeDisabled();
});

test('a new notification shows on the bell within 30 seconds, without reloading', async ({
    page,
    browser,
}) => {
    await page.clock.install();
    await logIn(page);
    await expect(
        page.getByRole('button', { name: 'Notifications', exact: true }),
    ).toBeVisible();

    // Find one of the member's posts through a notification's link.
    const { rows } = await openPanel(page);
    const href = await rows.first().getByRole('link').getAttribute('href');
    const opened = await page.request.get(href!, { maxRedirects: 0 });
    const postUrl = new URL(opened.headers()['location']!).pathname;
    await page.keyboard.press('Escape');

    // A colleague comments on it in their own browser.
    const colleague = await browser.newContext();
    const other = await colleague.newPage();
    await logIn(other, 'browser-monitoring@example.test');
    await other.goto(postUrl);
    const box = other.getByRole('dialog').getByPlaceholder(/^Comment as/);
    await box.fill('Congratulations on the orientation!');
    await box.press('Enter');
    await expect(
        other
            .getByRole('dialog')
            .getByText('Congratulations on the orientation!'),
    ).toBeVisible();
    await colleague.close();

    await expect(
        page.getByRole('button', { name: 'Notifications', exact: true }),
    ).toBeVisible();
    await page.clock.fastForward('00:31');
    await expect(
        page.getByRole('button', { name: 'Notifications, 1 unread' }),
    ).toBeVisible();
    await expect(page.locator('[data-test="notification-badge"]')).toHaveText(
        '1',
    );
});

test('the bell and the page fit every screen, in light and dark, and pass axe', async ({
    page,
}) => {
    await logIn(page);
    await page.goto('/notifications');
    await expect(
        page.getByRole('list', { name: 'Notifications, newest first' }),
    ).toBeVisible();

    for (const width of [375, 768, 1280, 1536]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('body')).toHaveJSProperty(
            'scrollWidth',
            await page.locator('body').evaluate((body) => body.clientWidth),
        );

        const { panel } = await openPanel(page);
        const box = await panel.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        await page.keyboard.press('Escape');
    }

    const light = await new AxeBuilder({ page }).include('main').analyze();
    expect(light.violations).toEqual([]);
    await openPanel(page);
    const panelLight = await new AxeBuilder({ page })
        .include('[data-slot="popover-content"]')
        .analyze();
    expect(panelLight.violations).toEqual([]);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const dark = await new AxeBuilder({ page }).include('main').analyze();
    expect(dark.violations).toEqual([]);
    await openPanel(page);
    const panelDark = await new AxeBuilder({ page })
        .include('[data-slot="popover-content"]')
        .analyze();
    expect(panelDark.violations).toEqual([]);
});
