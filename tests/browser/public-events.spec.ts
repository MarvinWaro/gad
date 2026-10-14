import AxeBuilder from '@axe-core/playwright';
import {
    expect,
    test,
    type Locator,
    type Page,
    type TestInfo,
} from '@playwright/test';

/**
 * GAD events on the public website (docs/event-registration.md): the
 * homepage's strip, the Events page from the header with its Region filter
 * and Past, and an event's page, whose "Log in to join" lands on the event's
 * own page once signed in. Never how many joined. The fixtures are in
 * tests/browser/server.php, all Region XII's: "Fixture Check-in Training"
 * (on now), "Fixture Join Workshop" (a week away) and "Fixture Certificate
 * Workshop" (ended).
 */

const ON_NOW = 'Fixture Check-in Training';
const COMING_UP = 'Fixture Join Workshop';
const ENDED = 'Fixture Certificate Workshop';
const PARTICIPANT = 'fictional-join-participant@example.test';
const ULID = '[0-9a-z]{26}';

/**
 * Fits 375px and 1440px in both themes, with no axe violations; the
 * screenshots are of `part`, or the whole page.
 */
async function checkBothThemes(
    page: Page,
    testInfo: TestInfo,
    name: string,
    part?: Locator,
) {
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
            // Polled: under reduced motion the public site's 0.01ms
            // transitions (public.css) keep the old width's layout for a
            // frame after the jump.
            await expect
                .poll(() =>
                    page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            document.documentElement.clientWidth,
                    ),
                )
                .toBe(true);
            const path = testInfo.outputPath(`${name}-${theme}-${width}.png`);
            await (part
                ? part.screenshot({ path })
                : page.screenshot({ path, fullPage: true }));
        }
        let scan = new AxeBuilder({ page }).withTags([
            'wcag2a',
            'wcag2aa',
            'wcag21aa',
        ]);
        if (part) {
            scan = scan.include(`#${await part.getAttribute('id')}`);
        }
        expect((await scan.analyze()).violations).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
}

test.beforeEach(async ({ page }) => {
    // Sections show at once, without the homepage's reveal.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
});

test('the homepage lists GAD events on now first, by region, and never how many joined', async ({
    page,
}, testInfo) => {
    test.setTimeout(90_000);
    await page.goto('/');

    const strip = page.locator('#events');
    const cards = strip.getByRole('article');
    await expect(
        strip.getByRole('heading', { name: "Be part of what's happening." }),
    ).toBeVisible();
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText(ON_NOW);
    await expect(cards.first()).toContainText('Happening now');
    await expect(cards.nth(1)).toContainText(COMING_UP);
    await expect(cards.nth(1)).toContainText('Fixture Training Room');
    await expect(strip).not.toContainText(ENDED);
    await expect(strip).not.toContainText('joined');
    await checkBothThemes(page, testInfo, 'homepage-events', strip);

    // A region: its events and those for every region, reloaded in place.
    await strip.getByRole('combobox', { name: 'Region', exact: true }).click();
    await page.getByRole('option', { name: 'Regional Office XII' }).click();
    await expect(page).toHaveURL(/\/\?events_region=\d+$/);
    await expect(strip).toContainText(
        'for Regional Office XII and for every region',
    );
    await expect(cards).toHaveCount(2);

    await strip.getByRole('link', { name: 'See all events' }).click();
    await expect(page).toHaveURL(/\/gad-events\?region=\d+$/);
    await expect(
        page.getByRole('heading', { level: 1, name: 'GAD events' }),
    ).toBeVisible();
});

test('the header opens GAD events, by region, with past ones under Past', async ({
    page,
}, testInfo) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'Events', exact: true })
        .click();
    await expect(page).toHaveURL(/\/gad-events$/);

    const current = page.getByRole('region', {
        name: /^Happening now & upcoming/,
    });
    await expect(current.getByRole('listitem')).toHaveCount(2);
    await expect(current.getByRole('listitem').first()).toContainText(ON_NOW);
    await expect(current.getByRole('listitem').nth(1)).toContainText(COMING_UP);
    await expect(
        page.getByRole('link', {
            name: 'Happening now & upcoming',
            exact: true,
        }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(current).not.toContainText('joined');
    await checkBothThemes(page, testInfo, 'gad-events');

    await page.getByRole('combobox', { name: 'Region', exact: true }).click();
    await page.getByRole('option', { name: 'Regional Office XII' }).click();
    await expect(page).toHaveURL(/\/gad-events\?region=\d+$/);
    await expect(
        page.getByRole('region', {
            name: /Regional Office XII and every region$/,
        }),
    ).toBeVisible();

    // Past keeps the region.
    await page.getByRole('link', { name: 'Past', exact: true }).click();
    await expect(page).toHaveURL(/\/gad-events\?region=\d+&when=past$/);
    const past = page.getByRole('region', { name: /^Past events/ });
    await expect(past.getByRole('listitem')).toHaveCount(1);
    await expect(past).toContainText(ENDED);
    await expect(past).toContainText('Ended');

    // An ended event's page has nothing to join.
    await past.getByRole('link', { name: ENDED }).click();
    await expect(page).toHaveURL(new RegExp(`/gad-events/${ULID}$`));
    const join = page.getByRole('region', { name: 'Join this event' });
    await expect(join).toContainText('This event has ended.');
    await expect(join.getByRole('link')).toHaveCount(0);
});

test("an event's page asks visitors to log in to join, and lands them on the event", async ({
    page,
}, testInfo) => {
    test.setTimeout(90_000);
    await page.goto('/gad-events');
    await page.getByRole('link', { name: COMING_UP }).click();
    await expect(page).toHaveURL(new RegExp(`/gad-events/${ULID}$`));

    await expect(
        page.getByRole('heading', { level: 1, name: COMING_UP }),
    ).toBeVisible();
    await expect(page.getByText('Fixture Training Room')).toBeVisible();
    await expect(page.getByText('Bring your Virtual ID.')).toBeVisible();
    await expect(page.getByText('For Regional Office XII')).toBeVisible();
    const join = page.getByRole('region', { name: 'Join this event' });
    await expect(join).toContainText(
        'Registration is open until the event ends.',
    );
    await expect(join).not.toContainText('joined');
    await expect(
        join.getByRole('link', { name: 'Register', exact: true }),
    ).toHaveAttribute('href', '/register');
    await checkBothThemes(page, testInfo, 'gad-event');

    await join.getByRole('link', { name: 'Log in to join' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email address').fill(PARTICIPANT);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();

    // The event's own page, where Join is.
    await expect(page).toHaveURL(new RegExp(`/events/${ULID}$`), {
        timeout: 20_000,
    });
    await expect(
        page.getByRole('heading', { level: 1, name: COMING_UP }),
    ).toBeVisible();

    // Signed in, the public address leads there too.
    await page.goto(page.url().replace('/events/', '/gad-events/'));
    await expect(page).toHaveURL(new RegExp(`/events/${ULID}$`));
});
