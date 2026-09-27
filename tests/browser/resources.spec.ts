import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// In homepage order. A card with a page shows its summary and links there;
// one without stays static until its content exists.
const resourceCards: { title: string; summary?: string; href?: string }[] = [
    {
        title: 'Definition of Terms',
        summary: '19 terms',
        href: '/resources/definition-of-terms',
    },
    {
        title: 'GAD Enabling Republic Acts',
        summary: '4 laws',
        href: '/resources/gad-enabling-republic-acts',
    },
    { title: 'GAD Videos' },
    {
        title: 'Issuances',
        summary: '2 issuances',
        href: '/resources/issuances',
    },
    {
        title: 'Manuals',
        summary: '2 manuals',
        href: '/resources/manuals',
    },
];
const linkedCount = resourceCards.filter((card) => card.href).length;
const firstStatic = resourceCards.findIndex((card) => !card.href);

for (const width of [375, 768, 1280]) {
    test(`Resources cards link where content exists and fit at ${width}px`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/');

        if (width < 901) {
            await page.getByRole('button', { name: 'Open navigation' }).click();
            await page
                .getByRole('navigation', { name: 'Mobile navigation' })
                .getByRole('link', { name: 'Resources', exact: true })
                .click();
        } else {
            await page
                .getByRole('navigation', { name: 'Main navigation' })
                .getByRole('link', { name: 'Resources', exact: true })
                .click();
        }
        await expect(page).toHaveURL(/\/#resources$/);

        const section = page.locator('#resources');
        const grid = section.locator('.resources-grid');
        const cards = section.locator('.resource-card');
        await expect(cards).toHaveCount(5);
        expect(
            await grid.evaluate((element) => {
                const style = getComputedStyle(element);
                return [style.borderTopWidth, style.borderBottomWidth];
            }),
        ).toEqual(['1px', '1px']);
        expect(
            await cards
                .first()
                .evaluate((element) => getComputedStyle(element).borderRadius),
        ).toBe('0px');
        for (let index = 0; index < resourceCards.length; index++) {
            const { title, summary, href } = resourceCards[index];
            const card = cards.nth(index);
            await expect(card).toHaveJSProperty('tagName', 'LI');
            if (href) {
                await expect(card).toHaveText(`${title}${summary}`);
                await expect(
                    card.getByRole('link', { name: title }),
                ).toHaveAttribute('href', href);
            } else {
                await expect(card).toHaveText(`${title}Content coming soon`);
            }
        }
        // Cards with a page are interactive through one link each.
        await expect(
            section.locator(
                '.resource-card a, .resource-card button, .resource-card [tabindex]',
            ),
        ).toHaveCount(linkedCount);
        await cards.nth(firstStatic).click();
        await expect(page).toHaveURL(/\/#resources$/);
        await expect(page.getByRole('dialog')).toHaveCount(0);

        const boxes = await cards.evaluateAll((items) =>
            items.map((item) => {
                const box = item.getBoundingClientRect();
                return { x: box.x, y: box.y, width: box.width };
            }),
        );
        expect(
            boxes.every((box) => Math.abs(box.width - boxes[0].width) < 2),
        ).toBe(true);
        if (width === 1280) {
            expect(boxes.every((box) => box.y === boxes[0].y)).toBe(true);
        } else if (width === 768) {
            expect(boxes[0].y).toBe(boxes[1].y);
            expect(boxes[2].y).toBe(boxes[0].y);
            expect(boxes[3].y).toBeGreaterThan(boxes[2].y);
            expect(boxes[4].y).toBe(boxes[3].y);
        } else {
            expect(
                boxes.every(
                    (box, index) => index === 0 || box.y > boxes[index - 1].y,
                ),
            ).toBe(true);
        }
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            ),
        ).toBe(false);
        await section.screenshot({
            path: testInfo.outputPath(`resources-${width}.png`),
        });
        await expect(cards.nth(firstStatic)).toHaveCSS('cursor', 'default');
        await expect(cards.first()).toHaveCSS('cursor', 'pointer');
        await cards.first().hover();
        await expect
            .poll(() =>
                cards
                    .first()
                    .evaluate(
                        (element) =>
                            getComputedStyle(element, '::before').opacity,
                    ),
            )
            .toBe('1');
        expect(
            await cards
                .first()
                .evaluate(
                    (element) =>
                        getComputedStyle(element, '::before').backgroundImage,
                ),
        ).toContain('linear-gradient');
        if (width === 1280) {
            await section.screenshot({
                path: testInfo.outputPath('resources-hover-1280.png'),
            });
        }

        const accessibility = await new AxeBuilder({ page })
            .include('#resources')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(accessibility.violations).toEqual([]);

        // The whole card opens the page, not just its title.
        const card = await cards.first().boundingBox();
        await page.mouse.click(card!.x + 24, card!.y + card!.height - 16);
        await expect(page).toHaveURL(/\/resources\/definition-of-terms$/);
        await expect(
            page.getByRole('heading', {
                level: 1,
                name: 'Definition of Terms',
            }),
        ).toBeVisible();
    });
}
