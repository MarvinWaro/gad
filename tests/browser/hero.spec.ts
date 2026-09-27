import { expect, test } from '@playwright/test';

const stageBox = async (page: import('@playwright/test').Page) =>
    (await page.locator('.hero-carousel-stage').boundingBox())!;

// [viewport width, height, expected stage height from its width]
const frames: [number, number, (width: number, height: number) => number][] = [
    // Tall desktop: the full 16:9 landscape frame.
    [1614, 1048, (width) => (width * 9) / 16],
    // Short laptop: capped at 75% of the screen.
    [1366, 768, (_width, height) => height * 0.75],
    // Tablet: 16:9.
    [768, 1024, (width) => (width * 9) / 16],
    // Phone: 3:2.
    [375, 812, (width) => (width * 2) / 3],
];

for (const [width, height, expected] of frames) {
    test(`hero frame fits a natural landscape at ${width}×${height}`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');

        const box = await stageBox(page);
        // Always the full width of the page container, whatever its height.
        const container = (await page.locator('.hero').boundingBox())!;
        const inset = width > 900 ? 64 : width > 600 ? 48 : 32;
        expect(box.width).toBeCloseTo(
            Math.min(width - inset, 1280, container.width),
            0,
        );
        expect(Math.abs(box.height - expected(box.width, height))).toBeLessThan(
            1.5,
        );
        // Never shorter than the strip it replaced.
        expect(box.height).toBeGreaterThanOrEqual(
            width > 1439 ? 375 : width > 900 ? 340 : 0,
        );

        await page.locator('.hero-visual').screenshot({
            path: testInfo.outputPath(`hero-${width}x${height}.png`),
        });
    });
}

test('the notch keeps its size however tall the frame grows', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1614, height: 1048 });
    await page.goto('/');

    // The notched top edge is a fixed-height mask layer over a plain body.
    const mask = await page
        .locator('.hero-carousel-stage')
        .evaluate((element) => {
            const style = getComputedStyle(element);
            return {
                band: style.getPropertyValue('--hero-notch-band').trim(),
                size: style.maskSize,
            };
        });
    expect(mask.band).toBe('73px');
    expect(mask.size).toContain('100% 73px');
});
