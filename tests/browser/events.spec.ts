import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Join (docs/event-registration.md): an HEI user opens an event from the
 * calendar, joins it, sees it in My certificates and leaves it; a CHED
 * Focal sees who joined and closes registration. The fixtures are in
 * tests/browser/server.php: "Fixture Join Workshop", a week away in Region
 * XII, and the HEI user who joins it.
 */

/** A CHED Focal of Region XII. */
const STAFF = 'browser-quest-focal@example.test';
const PARTICIPANT = 'fictional-join-participant@example.test';
const EVENT = 'Fixture Join Workshop';

async function logIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 20_000 });
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

test('an HEI user joins an event from the calendar, finds it in My certificates, and leaves it', async ({
    page,
}, testInfo) => {
    // Sign-ins and axe scans in both themes outlast the default 30 seconds on a busy run.
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, PARTICIPANT);
    await page.goto('/events');
    await page.getByRole('link', { name: EVENT }).first().click();

    await expect(
        page.getByRole('heading', { level: 1, name: EVENT }),
    ).toBeVisible();
    await expect(page.getByText('Fixture Training Room')).toBeVisible();
    await expect(page.getByText('Bring your Virtual ID.')).toBeVisible();
    const card = page.getByRole('region', { name: 'Join this event' });
    await expect(card).toContainText(
        'Registration is open until the event ends.',
    );
    await checkBothThemes(page, testInfo, 'event-page');

    await card.getByRole('button', { name: 'Join event' }).click();
    const joined = page.getByRole('region', { name: 'You joined' });
    await expect(joined).toContainText('Show your Virtual ID');
    // How many joined is for the event's creator and Administrators.
    await expect(joined).not.toContainText('person joined');
    await expect(
        joined.getByRole('link', { name: 'Open your Virtual ID' }),
    ).toBeVisible();
    await expect(
        page.getByText('Joined', { exact: true }).first(),
    ).toBeVisible();
    await page.screenshot({
        path: testInfo.outputPath('event-page-joined.png'),
        fullPage: true,
    });

    // The calendar marks it, and My certificates lists it.
    await page.getByRole('link', { name: 'GAD events' }).click();
    await expect(page).toHaveURL(/\/events$/);
    await page.goto('/settings/my-certificates');
    const events = page.getByRole('region', { name: 'Events you joined' });
    await expect(events.getByRole('link', { name: EVENT })).toBeVisible();
    await expect(events).toContainText('Upcoming');
    await checkBothThemes(page, testInfo, 'my-certificates-events');

    // Leaving asks first, and the event can be joined again.
    await events.getByRole('link', { name: EVENT }).click();
    await page.getByRole('button', { name: 'Leave event' }).click();
    await page
        .getByRole('alertdialog', { name: 'Leave this event?' })
        .getByRole('button', { name: 'Leave event' })
        .click();
    await expect(
        page.getByRole('region', { name: 'Join this event' }),
    ).toBeVisible();
});

test('a CHED Focal sees who joined and closes registration, then reopens it', async ({
    browser,
    page,
}, testInfo) => {
    // Sign-ins and axe scans in both themes outlast the default 30 seconds on a busy run.
    test.setTimeout(90_000);
    // Someone joins first.
    const participant = await browser.newContext();
    const own = await participant.newPage();
    await logIn(own, PARTICIPANT);
    await own.goto('/events');
    await own.getByRole('link', { name: EVENT }).first().click();
    await own.getByRole('button', { name: 'Join event' }).click();
    await expect(own.getByRole('region', { name: 'You joined' })).toBeVisible();
    await participant.close();

    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, STAFF);
    await page.goto('/admin/events');
    await page
        .getByRole('link', { name: new RegExp(`^See who joined ${EVENT}`) })
        .click();

    await expect(
        page.getByRole('heading', { level: 1, name: EVENT }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: '1 person joined' }),
    ).toBeVisible();
    await expect(
        page.getByText('Fictional Join Participant', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Not checked in yet')).toBeVisible();
    await checkBothThemes(page, testInfo, 'event-registrations');

    await page.getByRole('button', { name: 'Close registration' }).click();
    await page
        .getByRole('alertdialog', { name: 'Close registration now?' })
        .getByRole('button', { name: 'Close registration' })
        .click();
    await expect(page.getByText(/^Registration closed /)).toBeVisible();

    await page.getByRole('button', { name: 'Reopen registration' }).click();
    await expect(
        page.getByText('Registration is open until the event ends.'),
    ).toBeVisible();
});

test('a CHED Focal adds someone and a guest with the days they came, then cancels and restores an event', async ({
    page,
}, testInfo) => {
    // Sign-ins, dialogs and axe scans in both themes outlast the default 30 seconds.
    test.setTimeout(120_000);
    const running = 'Fixture Check-in Training';
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, STAFF);
    await page.goto('/admin/events');
    await page
        .getByRole('link', { name: new RegExp(`^See who joined ${running}`) })
        .click();
    await expect(
        page.getByRole('heading', { level: 1, name: running }),
    ).toBeVisible();

    // Someone with an account, from the paper sheet, with yesterday marked.
    await page.getByRole('button', { name: 'Add people' }).click();
    const add = page.getByRole('dialog');
    await add.getByLabel('Who').fill('Fictional Join');
    await add
        .getByRole('button', { name: /Fictional Join Participant/ })
        .click();
    await add.getByRole('checkbox').first().check();
    await add
        .getByRole('button', { name: 'Add Fictional Join Participant' })
        .click();
    await expect(add).toHaveCount(0);
    await expect(page.getByText('Added by staff')).toBeVisible();
    await expect(page.getByText('Attended 1 day')).toBeVisible();

    // Their day unmarked, then off the list.
    await page
        .getByRole('button', {
            name: 'Attendance of Fictional Join Participant',
        })
        .click();
    const days = page.getByRole('dialog');
    await expect(days.getByRole('checkbox').first()).toBeChecked();
    await days.getByRole('checkbox').first().uncheck();
    await days.getByRole('button', { name: 'Save attendance' }).click();
    await expect(days).toHaveCount(0);
    await page
        .getByRole('button', {
            name: 'Take Fictional Join Participant off the list',
        })
        .click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Take off' })
        .click();
    await expect(page.getByText('Added by staff')).toHaveCount(0);

    // A guest from another agency, without an account.
    await page.getByRole('button', { name: 'Add guest' }).click();
    const guest = page.getByRole('dialog');
    await guest.getByLabel('Name').fill('Fictional Agency Guest');
    await guest.getByLabel('Agency or organization').fill('Fictional Agency');
    await guest.getByRole('checkbox').first().check();
    await guest.getByRole('button', { name: 'Add guest' }).click();
    await expect(guest).toHaveCount(0);
    const guests = page.getByRole('region', { name: '1 guest' });
    await expect(guests).toContainText('Fictional Agency Guest');
    await expect(guests).toContainText('Came 1 day');
    await checkBothThemes(page, testInfo, 'event-guests');
    await guests
        .getByRole('button', { name: 'Remove Fictional Agency Guest' })
        .click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Remove guest' })
        .click();
    await expect(page.getByRole('region', { name: '0 guests' })).toBeVisible();

    // Called off, then back on.
    await page.goto('/admin/events');
    await page.getByRole('button', { name: `Cancel ${EVENT}` }).click();
    await page
        .getByRole('alertdialog', { name: 'Cancel this event?' })
        .getByRole('button', { name: 'Cancel event' })
        .click();
    const row = page.getByRole('row', { name: new RegExp(EVENT) });
    await expect(row.getByText('Cancelled', { exact: true })).toBeVisible();
    await row.getByRole('button', { name: `Restore ${EVENT}` }).click();
    await expect(row.getByText('Upcoming', { exact: true })).toBeVisible();
});
