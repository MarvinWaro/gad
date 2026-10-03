import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [375, 768, 1280, 1536]) {
    test(`homepage fits ${width}px and keeps preview interactions accessible`, async ({
        page,
    }, testInfo) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            'Advancing gender-responsive higher education through data.',
        );
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveTitle(
            'PHLGADIS | Gender-responsive higher education',
        );
        expect(
            await page
                .getByRole('link', { name: 'Explore GAD data' })
                .evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe('rgb(24, 29, 38)');
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        ).toBeTruthy();
        await expect(page.locator('.campaign-section')).toHaveCount(0);
        await expect(page.locator('.hero-bottom')).toHaveCount(0);
        const previews = page.locator('.hero-thumbnail');
        await expect(previews).toHaveCount(2);
        const previewBoxes = await previews.evaluateAll((elements) =>
            elements.map((element) => {
                const box = element.getBoundingClientRect();
                return { top: box.top, height: box.height };
            }),
        );
        expect(
            Math.abs(previewBoxes[0].top - previewBoxes[1].top),
        ).toBeLessThan(2);
        expect(
            Math.abs(previewBoxes[0].height - previewBoxes[1].height),
        ).toBeLessThan(2);

        for (const section of await page
            .locator('main > section:not(.hero), main > nav.quick-access')
            .all()) {
            await section.scrollIntoViewIfNeeded();
            await expect(section).not.toHaveClass(
                /reveal-pending(?!.*is-revealed)/,
            );
        }
        await page.locator('main').evaluate(async (element) => {
            await Promise.all(
                element
                    .getAnimations({ subtree: true })
                    .map((animation) => animation.finished),
            );
        });
        await page.evaluate(() =>
            window.scrollTo({ top: 0, behavior: 'instant' }),
        );
        await page.screenshot({
            path: testInfo.outputPath(`homepage-${width}.png`),
            fullPage: true,
        });

        // "Share feedback" leads to the website feedback form, as does the
        // footer.
        await expect(
            page
                .locator('#feedback')
                .getByRole('link', { name: 'Share feedback', exact: true }),
        ).toHaveAttribute('href', '/feedback');
        await expect(
            page
                .locator('.site-footer')
                .getByRole('link', { name: 'Share feedback', exact: true }),
        ).toHaveAttribute('href', '/feedback');

        if (width < 901) {
            const trigger = page.getByRole('button', {
                name: 'Open navigation',
            });
            await trigger.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await page
                .getByRole('navigation', { name: 'Mobile navigation' })
                .getByRole('link', { name: 'Resources', exact: true })
                .click();
            await expect(page.getByRole('dialog')).toHaveCount(0);
            await expect(page).toHaveURL(/#resources$/);
            await expect(trigger).toBeFocused();
        }
        expect(errors).toEqual([]);
    });
}

test('hero previews crossfade the featured visual and autoplay resumes after focus leaves', async ({
    page,
}) => {
    await page.clock.install();
    await page.goto('/');
    const carousel = page.getByRole('region', {
        name: 'Featured PHLGADIS visuals',
    });
    const slides = carousel.locator('.hero-carousel-slide');
    const slideCount = await slides.count();
    expect(slideCount).toBeGreaterThan(2);
    const firstSlide = slides.nth(0);
    const secondSlide = slides.nth(1);
    const thirdSlide = slides.nth(2);

    // At most two previews, whatever the number of slides.
    await expect(carousel.locator('.hero-thumbnail')).toHaveCount(
        Math.min(2, slideCount - 1),
    );
    await expect(firstSlide).toHaveClass(/is-active/);
    await expect(carousel).toHaveAttribute('data-autoplay', 'true');
    await page.clock.fastForward(6000);
    await expect(secondSlide).toHaveClass(/is-active/);
    // The previews are the slides that come next, so the first is slide 3.
    await carousel.locator('.hero-thumbnail').first().click();
    await expect(thirdSlide).toHaveClass(/is-active/);
    await expect(secondSlide).not.toHaveClass(/is-active/);
    await expect(carousel.locator('.hero-carousel-meta')).toHaveCount(0);
    await expect(carousel).toHaveAttribute('data-autoplay', 'false');
    await page.mouse.move(0, 0);
    await page.locator('header .brand').focus();
    await expect(carousel).toHaveAttribute('data-autoplay', 'true');
    await page.clock.fastForward(6000);
    await expect(slides.nth(3 % slideCount)).toHaveClass(/is-active/);
    expect(
        await firstSlide.evaluate(
            (element) => getComputedStyle(element).transitionProperty,
        ),
    ).toContain('opacity');

    const activeTitle = await carousel
        .locator('.hero-slide-summary > p')
        .innerText();
    const readMore = carousel.getByRole('button', {
        name: 'Read more',
        exact: true,
    });
    await readMore.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading')).toHaveText(activeTitle);
    await expect(
        dialog.locator('[data-slot="dialog-description"]'),
    ).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(readMore).toBeFocused();
});

test('landing page anchors scroll smoothly to their sections', async ({
    page,
}) => {
    await page.goto('/');
    expect(
        await page.evaluate(
            () => getComputedStyle(document.documentElement).scrollBehavior,
        ),
    ).toBe('auto');
    await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'Data & statistics' })
        .click();
    await expect(page).toHaveURL(/#statistics$/);
    await expect
        .poll(() =>
            page
                .locator('#statistics')
                .evaluate((element) =>
                    Math.round(element.getBoundingClientRect().top),
                ),
        )
        .toBeLessThanOrEqual(135);
    expect(
        await page
            .locator('#statistics')
            .evaluate((element) =>
                Math.round(element.getBoundingClientRect().top),
            ),
    ).toBeGreaterThanOrEqual(85);
    await expect(page.locator('#statistics')).toHaveClass(/is-revealed/);
});

test('statistics reconcile through dataset, sex, view and region controls', async ({
    page,
}) => {
    await page.goto('/');
    const statistics = page.locator('#statistics');
    await expect(statistics.locator('.stat-total strong')).toHaveText(
        '227,823',
    );
    await expect(statistics).toContainText(
        'Higher Education GAD Statistical Data, all regions',
    );

    // Line, the old system's chart, opens first: male, female and total,
    // with every group's full name under its point.
    await expect(
        statistics.getByRole('button', { name: 'Line', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(statistics.locator('.recharts-line')).toHaveCount(3);
    const chartText = statistics.locator('svg');
    await expect(
        chartText.getByText('Agricultural,', { exact: true }),
    ).toBeVisible();
    await expect(
        chartText.getByText('Forestry, and Fisheries', { exact: true }),
    ).toBeVisible();

    // Counts: a row per discipline group, largest first, names in full.
    await statistics
        .getByRole('button', { name: 'Counts', exact: true })
        .click();
    const rows = statistics.locator('.stat-rows > li');
    await expect(rows).toHaveCount(8);
    await expect(rows.first()).toContainText(
        'Education Science and Teacher Training',
    );
    await expect(rows.first()).toContainText('55,000');

    // Balance: by women's share, highest first; a share needs both sexes.
    await statistics
        .getByRole('button', { name: 'Balance', exact: true })
        .click();
    await expect(rows.first()).toContainText('Medical and Allied');
    await expect(rows.first()).toContainText('83% female');
    await expect(
        statistics.getByRole('group', { name: 'Filter by sex' }),
    ).toHaveCount(0);

    await statistics
        .getByRole('button', { name: 'Table', exact: true })
        .click();
    await expect(statistics.locator('tfoot')).toContainText('227,823');
    await statistics
        .getByRole('group', { name: 'Filter by sex' })
        .getByRole('button', { name: 'Female', exact: true })
        .click();
    await expect(statistics.locator('.stat-total strong')).toHaveText(
        '132,086',
    );
    await expect(
        statistics.getByRole('columnheader', { name: 'Male', exact: true }),
    ).toHaveCount(0);
    await statistics
        .getByRole('group', { name: 'Dataset', exact: true })
        .getByRole('button', { name: 'Graduates', exact: true })
        .click();
    await expect(statistics.locator('.stat-total strong')).toHaveText('20,190');
    await statistics
        .getByRole('group', { name: 'Filter by sex' })
        .getByRole('button', { name: 'All', exact: true })
        .click();
    await expect(statistics.locator('tfoot')).toContainText('31,990');
    await page.getByRole('combobox', { name: 'Academic year' }).click();
    await expect(page.getByRole('option')).toHaveCount(1);
    await page.getByRole('option', { name: '2025-2026' }).click();

    // Only regions with figures are offered. Choosing one reloads just the
    // statistics and keeps the view.
    await page.getByRole('combobox', { name: 'Region', exact: true }).click();
    await expect(page.getByRole('option')).toHaveText([
        'All regions',
        'Regional Office XII',
    ]);
    await page.getByRole('option', { name: 'Regional Office XII' }).click();
    await expect(page).toHaveURL(/\?region=\d+/);
    await expect(statistics).toContainText(
        'Regional Office XII Higher Education GAD Statistical Data',
    );
    await expect(statistics.locator('tfoot')).toContainText('31,990');
});

test('public theme follows a dark preference and respects reduced motion', async ({
    page,
}) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(
        page.getByRole('region', { name: 'Featured PHLGADIS visuals' }),
    ).toHaveAttribute('data-autoplay', 'false');
    expect(
        await page.evaluate(
            () => getComputedStyle(document.documentElement).scrollBehavior,
        ),
    ).toBe('auto');
    await expect(page.locator('#stories')).not.toHaveClass(/reveal-pending/);
    // Like the dashboard, the public site follows the device's preference.
    expect(
        await page
            .locator('.public-theme')
            .first()
            .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgb(20, 18, 23)');
    const login = page.getByRole('link', { name: 'Log in', exact: true });
    await expect(login).toHaveAttribute('href', /\/login$/);
    await expect(
        page.getByRole('link', { name: 'Register', exact: true }),
    ).toHaveAttribute('href', /\/register$/);
    await expect(page.locator('.survey-strip')).toHaveCount(0);
    const surveyLinks = page.locator('#surveys .law-card a');
    await expect(surveyLinks).toHaveCount(4);
    for (const label of await surveyLinks.allInnerTexts()) {
        expect(['Take the Survey', 'Opening soon']).toContain(label.trim());
    }
    // Follow a card and check it lands on the state its own label promised,
    // rather than assuming which laws happen to be published.
    const card = page.locator('#surveys .law-card').last();
    const cta = (await card.getByRole('link').innerText()).trim();
    await card.getByRole('link').click();
    await expect(page).toHaveURL(/\/surveys\/ra-[\d]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Survey',
    );
    if (cta === 'Opening soon') {
        await expect(
            page.getByText('Survey questionnaire coming next'),
        ).toBeVisible();
    } else {
        await expect(page.locator('form')).toHaveCount(1);
    }
    expect(
        await page
            .locator('.public-theme')
            .first()
            .evaluate((el) => getComputedStyle(el).colorScheme),
    ).toBe('dark');
});

test('all public anchors have destinations', async ({ page }) => {
    await page.goto('/');
    const missingAnchors = await page
        .locator('a[href^="#"]')
        .evaluateAll((anchors) =>
            anchors
                .map((anchor) => anchor.getAttribute('href')!)
                .filter((href) => !document.getElementById(href.slice(1))),
        );
    expect(missingAnchors).toEqual([]);
});

/**
 * tests/browser/server.php gives two seed posts from 32 days ago a photo.
 * Stories count this academic year only (August to July), so for a month
 * after August 1 those posts belong to the year before.
 */
function seedPhotosThisAcademicYear(): boolean {
    const manila = (time: number) => new Date(time + 8 * 3_600_000);
    const today = manila(Date.now());
    const year =
        today.getUTCMonth() + 1 >= 8
            ? today.getUTCFullYear()
            : today.getUTCFullYear() - 1;
    return (
        manila(Date.now() - 32 * 86_400_000) >= new Date(Date.UTC(year, 7, 1))
    );
}

test('the stories are the year’s most reacted photo posts, credited to their HEI', async ({
    page,
}, testInfo) => {
    test.skip(
        !seedPhotosThisAcademicYear(),
        'The seed photo posts fall in the previous academic year this month.',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const stories = page.locator('#stories');
    await expect(stories.getByRole('article').first()).toBeVisible();
    await expect(stories).not.toContainText('Sample stories');
    await expect(stories).toContainText('Browser Test HEI');
    // The person who posted is never named on the public homepage.
    await expect(stories).not.toContainText('Browser Test Member');

    for (const theme of ['light', 'dark'] as const) {
        await page.emulateMedia({
            colorScheme: theme,
            reducedMotion: 'reduce',
        });
        for (const width of [375, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await stories.scrollIntoViewIfNeeded();
            await stories.screenshot({
                path: testInfo.outputPath(`stories-${theme}-${width}.png`),
            });
        }
        const scan = await new AxeBuilder({ page })
            .include('#stories')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
    }

    await stories
        .getByRole('article')
        .filter({ hasText: 'Browser Test HEI' })
        .first()
        .getByRole('button', { name: 'Read story', exact: true })
        .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Shared by Browser Test HEI');
    // The feed's mosaic: a lone photo shows whole, and opens the viewer.
    const photo = dialog.getByRole('img', {
        name: 'Photo 1 of 1 shared by Browser Test HEI',
    });
    await expect
        .poll(() =>
            photo.evaluate(
                (image: HTMLImageElement) =>
                    image.complete && image.naturalWidth > 0,
            ),
        )
        .toBe(true);
    await expect(photo).toHaveCSS('object-fit', 'contain');
    await dialog.screenshot({ path: testInfo.outputPath('story-dialog.png') });
    await photo.click();
    const viewer = page.getByRole('dialog', {
        name: 'Photos shared by Browser Test HEI',
    });
    await expect(viewer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
    await expect(
        dialog.getByRole('link', { name: 'Log in to react and comment' }),
    ).toHaveAttribute('href', /\/posts\/[0-9a-z]{26}$/);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
});

test('footer uses supplied institutional marks and verified contact details', async ({
    page,
}) => {
    await page.goto('/');
    const footer = page.locator('footer');
    const logo = footer.getByRole('img', {
        name: 'PHLGADIS — Philippine Higher Education Gender and Development Information System',
    });

    await expect(logo).toHaveAttribute('src', '/assets/img/gadlogo.png');
    await logo.scrollIntoViewIfNeeded();
    await expect
        .poll(() =>
            logo.evaluate(
                (image: HTMLImageElement) =>
                    image.complete && image.naturalWidth > 0,
            ),
        )
        .toBeTruthy();

    const partnerImages = footer.locator('.footer-partners img');
    await expect(partnerImages).toHaveCount(4);
    await expect
        .poll(() =>
            partnerImages.evaluateAll((images: HTMLImageElement[]) =>
                images.map((image) => ({
                    src: new URL(image.src).pathname,
                    loaded: image.complete && image.naturalWidth > 0,
                })),
            ),
        )
        .toEqual([
            { src: '/assets/img/ched_logo.png', loaded: true },
            { src: '/assets/img/bagong_pilipinas.png', loaded: true },
            { src: '/assets/img/freedom_information.png', loaded: true },
            { src: '/assets/img/transparency_seal.png', loaded: true },
        ]);
    await expect(
        footer.getByRole('link', { name: '+63 936 616 7199' }),
    ).toHaveAttribute('href', 'tel:+639366167199');
    await expect(
        footer.getByRole('link', { name: 'chedro12@ched.gov.ph' }),
    ).toHaveAttribute('href', 'mailto:chedro12@ched.gov.ph');
    await expect(footer.getByText('Privacy', { exact: true })).toHaveCount(0);
    await expect(
        footer.getByText('Accessibility', { exact: true }),
    ).toHaveCount(0);
    await expect(footer.getByText('Back to top', { exact: true })).toHaveCount(
        0,
    );
});

test('header and rights cards use the supplied image assets', async ({
    page,
}) => {
    await page.goto('/');

    await expect(
        page.locator('header').getByRole('img', { name: 'PHLGADIS' }),
    ).toHaveAttribute('src', '/assets/img/gadlogo2.png');

    const lawImages = page.locator('#rights .law-art img');
    await expect(lawImages).toHaveCount(4);
    await expect
        .poll(() =>
            lawImages.evaluateAll((images: HTMLImageElement[]) =>
                images.map((image) => ({
                    src: new URL(image.src).pathname,
                    loaded: image.complete && image.naturalWidth > 0,
                })),
            ),
        )
        .toEqual([
            { src: '/assets/thumbnails/ra7877.jpg', loaded: true },
            { src: '/assets/thumbnails/ra9262.jpg', loaded: true },
            { src: '/assets/thumbnails/ra9710.jpg', loaded: true },
            { src: '/assets/thumbnails/ra11313.jpg', loaded: true },
        ]);
});

test('homepage and preview dialog meet automated WCAG AA checks', async ({
    page,
}) => {
    await page.goto('/');
    for (const section of await page
        .locator('main > section:not(.hero), main > nav.quick-access')
        .all()) {
        await section.scrollIntoViewIfNeeded();
        await expect(section).not.toHaveClass(
            /reveal-pending(?!.*is-revealed)/,
        );
    }
    await page.locator('main').evaluate(async (element) => {
        await Promise.all(
            element
                .getAnimations({ subtree: true })
                .map((animation) => animation.finished),
        );
    });
    const scan = () =>
        new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
    const homepage = await scan();
    expect(
        homepage.violations.map(({ id, nodes }) => ({
            id,
            nodes: nodes.map((node) => ({
                target: node.target,
                summary: node.failureSummary,
            })),
        })),
    ).toEqual([]);
    await page.getByRole('button', { name: 'Read more', exact: true }).click();
    await page.getByRole('dialog').evaluate(async (element) => {
        await Promise.all(
            element.getAnimations().map((animation) => animation.finished),
        );
    });
    const carouselDialog = await scan();
    expect(
        carouselDialog.violations.map(({ id, nodes }) => ({
            id,
            nodes: nodes.map((node) => ({
                target: node.target,
                summary: node.failureSummary,
            })),
        })),
    ).toEqual([]);
});

test('authenticated homepage navigation uses the dashboard destination', async ({
    page,
}) => {
    // Set the initial shared prop before deferred modules run. No account or
    // authenticated session is created; render afresh instead of hydrating guest HTML.
    await page.addInitScript(() => {
        const observer = new MutationObserver(() => {
            const script = document.querySelector('script[data-page="app"]');
            const root = document.getElementById('app');
            if (!script?.textContent || !root) return;
            const initialPage = JSON.parse(script.textContent);
            initialPage.props.auth.user = {
                id: 1,
                name: 'Preview User',
                email: 'preview@example.test',
            };
            script.textContent = JSON.stringify(initialPage);
            root.removeAttribute('data-server-rendered');
            observer.disconnect();
        });
        observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    expect(
        await page.locator('script[data-page="app"]').textContent(),
    ).toContain('Preview User');
    await expect(
        page.getByRole('link', { name: 'Dashboard', exact: true }),
    ).toHaveAttribute('href', /\/dashboard$/);
    await expect(
        page.getByRole('link', { name: 'Register', exact: true }),
    ).toHaveCount(0);
});
