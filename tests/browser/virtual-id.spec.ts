import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * The Virtual ID in Settings: a wallet-size card (a bank card held upright)
 * with the account's name, place, participant code and QR, which staff will
 * scan to check people in. It saves as an image and as a PDF.
 */

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

const CODE = /GAD-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}/;

/** The card is drawn on a canvas; wait until it has been. */
async function drawnCard(page: Page, name: string) {
    const card = page.getByRole('img', {
        name: new RegExp(`^Virtual ID of ${name}, `),
    });
    await expect(card).toBeVisible();
    await expect
        .poll(() =>
            card.evaluate((canvas) => (canvas as HTMLCanvasElement).width),
        )
        .toBeGreaterThan(100);

    return card;
}

test('everyone has a wallet-size Virtual ID in Settings, with their code as a QR', async ({
    page,
}, testInfo) => {
    await logIn(page, 'browser-quest-player@example.test');
    await page.goto('/settings/profile');
    await page.getByRole('link', { name: 'Virtual ID', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/virtual-id$/);

    const card = await drawnCard(page, 'Fictional Quest Player');
    await expect(card).toHaveAttribute('aria-label', /Browser Test HEI/);
    await expect(card).toHaveAttribute('aria-label', CODE);
    // A bank card held upright: 53.98 × 85.60 mm.
    const box = await card.boundingBox();
    expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(85.6 / 53.98, 2);

    await checkBothThemes(page, testInfo, 'virtual-id');
});

test('the card saves as an image and as a wallet-size PDF', async ({
    page,
}, testInfo) => {
    await logIn(page, 'browser-quest-player@example.test');
    await page.goto('/settings/virtual-id');
    await drawnCard(page, 'Fictional Quest Player');

    const [image] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Save as image' }).click(),
    ]);
    expect(image.suggestedFilename()).toMatch(
        /^PHLGADIS-Virtual-ID-GAD-[0-9A-Z-]+\.png$/,
    );
    await image.saveAs(testInfo.outputPath('virtual-id.png'));
    const png = readFileSync(await image.path());
    // The PNG's own header: 1080 wide, upright like a bank card.
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1080);
    expect(png.readUInt32BE(20)).toBe(Math.round(1080 * (85.6 / 53.98)));

    const [pdf] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Download PDF' }).click(),
    ]);
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
    // One page, 53.98 × 85.60 mm in points.
    const document = readFileSync(await pdf.path()).toString('latin1');
    const box = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(document);
    expect(Number(box?.[1])).toBeCloseTo((53.98 / 25.4) * 72, 1);
    expect(Number(box?.[2])).toBeCloseTo((85.6 / 25.4) * 72, 1);
    expect(document.match(/\/Type \/Page\b/g)).toHaveLength(1);
});

test('a long name fits the card, whole', async ({ page }, testInfo) => {
    const longName = 'Ma. Concepcion Bernadette Dela Cruz-Villanueva III';
    async function rename(name: string) {
        await page.goto('/settings/profile');
        await page.getByLabel('Name', { exact: true }).fill(name);
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
            name,
        );
    }

    await logIn(page, 'browser-quest-player@example.test');
    await rename(longName);
    try {
        await page.goto('/settings/virtual-id');
        for (const width of [320, 375]) {
            await page.setViewportSize({ width, height: 900 });
            const card = await drawnCard(page, longName);
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        document.documentElement.clientWidth,
                ),
            ).toBe(true);
            await card.screenshot({
                path: testInfo.outputPath(`virtual-id-long-${width}.png`),
            });
        }
    } finally {
        await page.setViewportSize({ width: 1440, height: 900 });
        await rename('Fictional Quest Player');
    }
});
