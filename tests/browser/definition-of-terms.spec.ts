import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const url = '/resources/definition-of-terms';

for (const width of [375, 768, 1280]) {
    test(`Definition of Terms searches and fits at ${width}px`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(url);

        await expect(
            page.getByRole('heading', {
                level: 1,
                name: 'Definition of Terms',
            }),
        ).toBeVisible();
        const entries = page.locator('.glossary-entry');
        await expect(page.locator('.glossary-group')).toHaveCount(3);
        await expect(entries).toHaveCount(19);
        await expect(
            page.getByRole('link', { name: /Read the Act RA 9262/ }),
        ).toHaveAttribute(
            'href',
            'https://lawphil.net/statutes/repacts/ra2004/ra_9262_2004.html',
        );
        await expect(
            page.getByRole('link', { name: /Read the Act RA 9710 \(PDF/ }),
        ).toHaveAttribute('href', '/assets/document/ra9710.pdf');
        // A public page: full-bleed, never inside the signed-in app shell.
        expect(await page.locator('.public-theme').boundingBox()).toMatchObject(
            { x: 0, width },
        );
        // The public site stays light even when the device prefers dark.
        await expect(page.locator('.public-theme')).toHaveCSS(
            'background-color',
            'rgb(255, 255, 255)',
        );
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            ),
        ).toBe(false);
        await page.screenshot({
            path: testInfo.outputPath(`definition-of-terms-${width}.png`),
        });

        const search = page.getByRole('searchbox', {
            name: 'Search terms and definitions',
        });
        await search.fill('stalking');
        await expect(entries).toHaveCount(2);
        await expect(page.locator('.glossary-status')).toHaveText(
            'Showing 2 of 19 terms',
        );
        await expect(page.locator('.glossary-mark').first()).toHaveText(
            /stalking/i,
        );
        await expect(page.locator('#ra-9710')).toHaveCount(0);
        await expect(
            page
                .getByRole('navigation', { name: 'Laws on this page' })
                .getByRole('link', { name: /RA 9710/ }),
        ).toHaveAttribute('data-empty', '');
        await page.screenshot({
            path: testInfo.outputPath(
                `definition-of-terms-search-${width}.png`,
            ),
        });
        await search.press('Escape');
        await expect(search).toHaveValue('');
        await expect(entries).toHaveCount(19);

        await search.fill('zzzz');
        await expect(
            page.getByRole('heading', { name: 'No terms match “zzzz”' }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'gender', exact: true }).click();
        await expect(search).toHaveValue('gender');
        await expect(entries).not.toHaveCount(0);
        await page.getByRole('button', { name: 'Clear search' }).click();
        await expect(entries).toHaveCount(19);

        const accessibility = await new AxeBuilder({ page })
            .include('#main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(accessibility.violations).toEqual([]);
    });
}

test('term links open, highlight and survive a search', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${url}#catcalling`);

    const catcalling = page.locator('#catcalling');
    await expect(catcalling).toBeInViewport();
    await expect(catcalling).toHaveAttribute('data-targeted', '');
    // Clear of the sticky header and toolbar.
    const toolbarBottom = await page
        .locator('.glossary-toolbar')
        .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(
        await catcalling.evaluate(
            (element) => element.getBoundingClientRect().top,
        ),
    ).toBeGreaterThanOrEqual(toolbarBottom - 1);
    await page.screenshot({
        path: testInfo.outputPath('definition-of-terms-target.png'),
    });

    const laws = page.getByRole('navigation', { name: 'Laws on this page' });
    await laws.getByRole('link', { name: /RA 9710/ }).click();
    await expect(page).toHaveURL(/#ra-9710$/);
    await expect(laws.getByRole('link', { name: /RA 9710/ })).toHaveAttribute(
        'aria-current',
        'true',
    );

    // VAWC lists its four forms; each form links back.
    await page
        .locator('#violence-against-women-and-their-children')
        .getByRole('link', { name: 'Economic abuse' })
        .click();
    await expect(page).toHaveURL(/#economic-abuse$/);
    await expect(page.locator('#economic-abuse')).toBeInViewport();

    // A link to a term the search hides clears the search, then opens it.
    const search = page.getByRole('searchbox', {
        name: 'Search terms and definitions',
    });
    await search.fill('household');
    await expect(page.locator('.glossary-entry')).toHaveCount(1);
    await page
        .locator('#economic-abuse')
        .getByRole('link', {
            name: 'Violence against women and their children',
        })
        .click();
    await expect(search).toHaveValue('');
    await expect(page.locator('.glossary-entry')).toHaveCount(19);
    await expect(page).toHaveURL(/#violence-against-women-and-their-children$/);
    await expect(
        page.locator('#violence-against-women-and-their-children'),
    ).toBeInViewport();

    await page.getByRole('heading', { level: 1 }).click();
    await page.keyboard.press('/');
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');

    await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write']);
    const stalking = page.locator('#stalking');
    await stalking.hover();
    await stalking
        .getByRole('button', { name: 'Copy link to Stalking' })
        .click();
    await expect(stalking.getByRole('status')).toHaveText('Link copied');
    await expect(
        stalking.getByRole('button', { name: 'Copy link to Stalking' }),
    ).toHaveAttribute('data-copied', '');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
        /\/resources\/definition-of-terms#stalking$/,
    );
});
