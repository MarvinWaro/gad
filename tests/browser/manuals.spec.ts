import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const url = '/resources/manuals';

// The old PHLGADIS list, word for word.
const manuals = [
    {
        title: 'Enhanced GMEF of CHED 2020 Manual',
        href: '/assets/document/gmef.pdf',
        source: 'PDF · 970 kB',
        laws: ['RA 9710', 'RA 11313'],
    },
    {
        title: 'GAD Capacity Assessment Form Manual',
        href: '/assets/document/gcaf.pdf',
        source: 'PDF · 537 kB',
        laws: ['RA 7877', 'RA 9262', 'RA 9710'],
    },
];

for (const width of [375, 768, 1280]) {
    test(`Manuals lists the two manuals and fits at ${width}px`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(url);

        await expect(
            page.getByRole('heading', { level: 1, name: 'Manuals' }),
        ).toBeVisible();
        expect(await page.locator('.public-theme').boundingBox()).toMatchObject(
            { x: 0, width },
        );

        const rows = page.locator('.resource-row');
        await expect(rows).toHaveCount(manuals.length);
        for (let index = 0; index < manuals.length; index++) {
            const { title, href, source, laws } = manuals[index];
            const row = rows.nth(index);
            await expect(row.getByRole('heading', { level: 2 })).toHaveText(
                title,
            );
            // Manuals carry no number, so no pill.
            await expect(row.locator('.law-number')).toHaveCount(0);
            await expect(
                row.getByRole('link', { name: `Read the manual ${title}` }),
            ).toHaveAttribute('href', href);
            await expect(row.locator('.resource-row-source')).toHaveText(
                source,
            );
            await expect(row.locator('.resource-row-laws a')).toContainText(
                laws,
            );
        }
        await expect(rows.nth(0)).toContainText(
            'Enhanced Gender Mainstreaming Evaluation Framework',
        );
        await expect(rows.nth(0).locator('time')).toHaveText('October 1, 2020');
        await expect(rows.nth(1)).toContainText(
            'National Gender and Development Resource Program',
        );

        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            ),
        ).toBe(false);
        await page.screenshot({
            path: testInfo.outputPath(`manuals-${width}.png`),
            fullPage: true,
        });

        const accessibility = await new AxeBuilder({ page })
            .include('#main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(accessibility.violations).toEqual([]);
    });
}
