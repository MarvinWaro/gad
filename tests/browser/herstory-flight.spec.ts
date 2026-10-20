import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { herstory } from '../../resources/js/data/herstory';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];
const titles = herstory.map((entry) => entry.title);

// The flight runs only where WebGL draws on a graphics chip. Test browsers
// have none, so they draw with SwiftShader, and this page is told it is a
// chip: the app's own check (lib/scroll-scenes.ts) is left as it is.
test.use({
    launchOptions: {
        args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
    },
});

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        const getContext = Object.getOwnPropertyDescriptor(
            HTMLCanvasElement.prototype,
            'getContext',
        )?.value as (
            this: HTMLCanvasElement,
            type: string,
            options?: object,
        ) => RenderingContext | null;
        HTMLCanvasElement.prototype.getContext = function (
            this: HTMLCanvasElement,
            type: string,
            options?: object,
        ) {
            return getContext.call(this, type, {
                ...options,
                failIfMajorPerformanceCaveat: false,
            });
        } as typeof HTMLCanvasElement.prototype.getContext;
        for (const context of [WebGLRenderingContext, WebGL2RenderingContext]) {
            const getParameter = Object.getOwnPropertyDescriptor(
                context.prototype,
                'getParameter',
            )?.value as (this: WebGLRenderingContext, name: number) => unknown;
            context.prototype.getParameter = function (
                this: WebGLRenderingContext,
                name: number,
            ) {
                // UNMASKED_RENDERER_WEBGL
                return name === 0x9246
                    ? 'Test GPU'
                    : getParameter.call(this, name);
            };
        }
    });
});

/** Scrolls so the camera stops at milestone `stop` (0 to 12). */
async function flyTo(page: Page, stop: number) {
    await page.evaluate((stop) => {
        const section = document.querySelector<HTMLElement>('.flight')!;
        const stage = document.querySelector<HTMLElement>('.flight-stage')!;
        const top = parseFloat(getComputedStyle(stage).top);
        const travel = section.offsetHeight - stage.offsetHeight;
        const start =
            section.getBoundingClientRect().top + window.scrollY - top;
        window.scrollTo({
            top: start + (stop / 12) * travel,
            behavior: 'instant',
        });
    }, stop);
}

const opacity = (page: Page, index: number) =>
    page
        .locator('.flight-caption')
        .nth(index)
        .evaluate((element) => Number(getComputedStyle(element).opacity));

test('the GAD Herstory flight shows one milestone at a time as the page scrolls', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/about/gad-herstory');

    await expect(page.locator('.flight-canvas[data-ready]')).toBeAttached({
        timeout: 20_000,
    });
    await expect(page.locator('.timeline')).toHaveCount(0);
    // Every milestone is in the list, word for word, for screen readers.
    await expect(
        page
            .locator('.flight-captions > li')
            .getByRole('heading', { level: 2 }),
    ).toHaveText(titles);
    await expect(page.locator('.flight-captions time').first()).toHaveAttribute(
        'datetime',
        '1981-08',
    );

    const current = page.locator('.flight-caption.is-current h2');
    await expect(current).toHaveText('CEDAW');
    expect(await opacity(page, 0)).toBeGreaterThan(0.95);
    expect(await opacity(page, 1)).toBe(0);

    await flyTo(page, 6);
    await expect(current).toHaveText('RA 9710');
    await expect.poll(() => opacity(page, 6)).toBeGreaterThan(0.95);
    expect(await opacity(page, 0)).toBe(0);
    await expect(page.locator('.flight-rail > i.is-current')).toHaveCount(1);

    await flyTo(page, 12);
    await expect(current).toHaveText('GADtimpala Award 2018');
    await expect.poll(() => opacity(page, 12)).toBeGreaterThan(0.95);

    // Leaving the page takes the scene down cleanly.
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/#about$/);
    expect(errors).toEqual([]);
});

test('reduced motion keeps the still timeline', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/about/gad-herstory');

    await expect(page.locator('.timeline > li')).toHaveCount(titles.length);
    await expect(page.locator('.flight')).toHaveCount(0);
});

for (const colorScheme of ['light', 'dark'] as const) {
    for (const [width, height] of [
        [390, 844],
        [1280, 900],
    ]) {
        test(`the flight fits ${width}px in ${colorScheme} mode`, async ({
            page,
        }, testInfo) => {
            await page.setViewportSize({ width, height });
            await page.emulateMedia({ colorScheme });
            await page.goto('/about/gad-herstory');
            await expect(
                page.locator('.flight-canvas[data-ready]'),
            ).toBeAttached({ timeout: 20_000 });
            await flyTo(page, 7);
            await expect(
                page.locator('.flight-caption.is-current h2'),
            ).toHaveText('Magna Carta of Women');
            await expect.poll(() => opacity(page, 7)).toBeGreaterThan(0.95);

            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth >
                        window.innerWidth,
                ),
            ).toBe(false);
            await page.screenshot({
                path: testInfo.outputPath(
                    `herstory-flight-${colorScheme}-${width}.png`,
                ),
            });
            const accessibility = await new AxeBuilder({ page })
                .withTags(wcag)
                .analyze();
            expect(accessibility.violations).toEqual([]);
        });
    }
}
