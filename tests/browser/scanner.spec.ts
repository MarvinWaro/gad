import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * The QR scanner (/admin/scanner): staff pick today's event and check people
 * in from their Virtual ID, with the camera or by typing its code. The camera
 * here is a canvas stream showing a participant's own Virtual ID. The
 * fixtures are in tests/browser/server.php: today's "Fixture Check-in
 * Training" in Region XII, and two HEI users with known codes.
 */

/** A CHED Focal of Region XII. */
const STAFF = 'browser-quest-focal@example.test';

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

const participantId = (page: Page) =>
    page.getByRole('textbox', { name: /^Participant ID/ });
const result = (page: Page) =>
    page.getByRole('region', { name: 'Scan result' });

test('staff open the scanner from the sidebar and check someone in by typing their code', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, STAFF);
    await page
        .locator('[data-sidebar="footer"]')
        .getByRole('link', { name: 'QR Scanner' })
        .click();
    await expect(page).toHaveURL(/\/admin\/scanner$/);
    await expect(
        page.getByRole('heading', { level: 1, name: 'QR Scanner' }),
    ).toBeVisible();
    // The only event today is picked already.
    await expect(page.getByRole('combobox', { name: 'Event' })).toContainText(
        'Fixture Check-in Training',
    );
    await expect(result(page)).toContainText('Ready to scan');

    // Lowercase works: the boxes keep capitals.
    await participantId(page).fill('scan2026');
    await page.getByRole('button', { name: 'Check in' }).click();
    await expect(result(page)).toContainText('Checked in');
    await expect(result(page)).toContainText('Fictional Scan Participant');
    await expect(result(page)).toContainText('Browser Test HEI');
    await expect(result(page)).toContainText('HEI User');
    await expect(result(page)).toContainText('Typed');
    // The boxes clear for the next person.
    await expect(participantId(page)).toHaveValue('');
    await page.screenshot({ path: testInfo.outputPath('scanner-typed.png') });

    // Once a day: a second time says so.
    await participantId(page).fill('SCAN2026');
    await page.keyboard.press('Enter');
    await expect(result(page)).toContainText('Already checked in today');
    await expect(result(page)).toContainText('First checked in at');

    // Recent, a drawer, lists who came today at every scanner.
    await page.getByRole('button', { name: /^Recent/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Checked in today' });
    await expect(drawer).toContainText('Fictional Scan Participant');
    await expect(drawer).toContainText('Fixture Check-in Training · 1 person');
    // Let the drawer finish sliding in.
    await page.waitForTimeout(600);
    await page.screenshot({ path: testInfo.outputPath('scanner-recent.png') });
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
});

test('the camera reads a Virtual ID and checks the person in', async ({
    browser,
    page,
}, testInfo) => {
    // The participant's own card, drawn sharp, as their phone would show it.
    const participant = await browser.newContext({ deviceScaleFactor: 3 });
    const own = await participant.newPage();
    await logIn(own, 'fictional-camera-participant@example.test');
    await own.goto('/settings/virtual-id');
    const card = own.getByRole('img', {
        name: /^Virtual ID of Fictional Camera Participant, /,
    });
    await expect
        .poll(() =>
            card.evaluate((canvas) => (canvas as HTMLCanvasElement).width),
        )
        .toBeGreaterThan(600);
    const picture = await card.evaluate((canvas) =>
        (canvas as HTMLCanvasElement).toDataURL('image/png'),
    );
    await participant.close();

    // A camera that films the card on a white table.
    await page.addInitScript((source) => {
        const camera = {
            deviceId: 'fake-camera',
            groupId: 'fake',
            kind: 'videoinput',
            label: 'Fake camera',
            toJSON: () => ({}),
        } as MediaDeviceInfo;
        navigator.mediaDevices.enumerateDevices = () =>
            Promise.resolve([camera]);
        navigator.mediaDevices.getUserMedia = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            const context = canvas.getContext('2d')!;
            const image = new Image();
            image.src = source;
            await image.decode();
            const height = 680;
            const width = (image.width / image.height) * height;
            const paint = () => {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(
                    image,
                    (canvas.width - width) / 2,
                    20,
                    width,
                    height,
                );
                requestAnimationFrame(paint);
            };
            paint();

            return canvas.captureStream(15);
        };
    }, picture);

    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, STAFF);
    await page.goto('/admin/scanner');
    await page.getByRole('button', { name: 'Start camera' }).click();
    await expect(page.getByText('Scanning', { exact: true })).toBeVisible();
    await expect(result(page)).toContainText('Fictional Camera Participant', {
        timeout: 20_000,
    });
    await expect(result(page)).toContainText('Checked in');
    await expect(result(page)).toContainText('Scanned');
    await page.screenshot({ path: testInfo.outputPath('scanner-camera.png') });
    await expect(page.getByRole('button', { name: /^Recent/ })).toContainText(
        '2',
    );

    await page.getByRole('button', { name: 'Stop camera' }).click();
    await expect(page.getByText('Camera off', { exact: true })).toBeVisible();
});

test('a blocked camera explains itself, and typing still works', async ({
    page,
}) => {
    await page.addInitScript(() => {
        navigator.mediaDevices.getUserMedia = () =>
            Promise.reject(
                new DOMException('Permission denied', 'NotAllowedError'),
            );
    });
    await logIn(page, STAFF);
    await page.goto('/admin/scanner');

    await page.getByRole('button', { name: 'Start camera' }).click();
    await expect(page.getByText(/The camera is blocked/)).toBeVisible();
    await expect(
        page.getByText('Camera unavailable', { exact: true }),
    ).toBeVisible();

    await participantId(page).fill('SCAN2026');
    await page.getByRole('button', { name: 'Check in' }).click();
    await expect(result(page)).toContainText('Already checked in today');
});

test('kiosk mode gives the whole screen to the scanner, on a computer only', async ({
    page,
}, testInfo) => {
    await logIn(page, STAFF);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/admin/scanner');
    await expect(page.getByRole('button', { name: 'Kiosk mode' })).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const topBar = page.getByRole('button', { name: 'Toggle Sidebar' });
    await expect(sidebar).toBeVisible();
    await participantId(page).fill('SCAN2026');
    await page.getByRole('button', { name: 'Check in' }).click();
    await expect(result(page)).toContainText('Fictional Scan Participant');

    await page.getByRole('button', { name: 'Kiosk mode' }).click();
    await expect(sidebar).toHaveCount(0);
    await expect(topBar).toHaveCount(0);
    // The same page, never reloaded: the result is still there.
    await expect(result(page)).toContainText('Fictional Scan Participant');
    await page.screenshot({
        path: testInfo.outputPath('scanner-kiosk-1440.png'),
    });

    await page.getByRole('button', { name: 'Exit kiosk mode' }).click();
    await expect(sidebar).toBeVisible();
    await expect(topBar).toBeVisible();
    await expect(result(page)).toContainText('Fictional Scan Participant');
});

test('the scanner fits phones and computers in both themes', async ({
    page,
}, testInfo) => {
    await logIn(page, STAFF);
    await page.goto('/admin/scanner');
    await expect(result(page)).toContainText('Ready to scan');

    await checkBothThemes(page, testInfo, 'scanner');

    // On a phone, Recent rises from the bottom.
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByRole('button', { name: /^Recent/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Checked in today' });
    await expect(drawer).toContainText('Fictional Scan Participant');
    // Once it has slid in, it sits on the bottom edge.
    await expect
        .poll(async () => {
            const box = (await drawer.boundingBox())!;

            return Math.round(box.y + box.height);
        })
        .toBe(800);
    await page.screenshot({
        path: testInfo.outputPath('scanner-recent-375.png'),
    });
});
