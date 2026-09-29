import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];
// Uploading a photo on the single-threaded test server can take a while.
const posting = 20_000;
const photo = 'public/assets/img/ched12_building.jpg';
const disclaimer =
    'The content of this publication has not been approved by the United Nations and does not reflect the views of the United Nations or its officials or Member States.';

async function logIn(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

async function openComposer(page: Page, text: string) {
    await page.goto('/community');
    await page.getByRole('button', { name: /^Share an announcement/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Post text').fill(text);

    return dialog;
}

async function pick(dialog: Locator, names: (string | RegExp)[]) {
    await dialog.getByRole('button', { name: 'SDGs & ACHIEVE' }).click();
    await expect(
        dialog.getByRole('heading', { name: 'What does this support?' }),
    ).toBeVisible();

    for (const name of names) {
        await dialog.getByRole('button', { name }).click();
    }

    await dialog.getByRole('button', { name: 'Done' }).click();
}

function postCard(page: Page, text: string) {
    return page.getByRole('article').filter({ hasText: text });
}

async function scan(page: Page, selector: string) {
    const result = await new AxeBuilder({ page })
        .include(selector)
        .withTags(wcag)
        .analyze();
    expect(result.violations).toEqual([]);
}

test('a post shows the SDGs and A.C.H.I.E.V.E. items it supports on its photos', async ({
    page,
}) => {
    const text = 'Browser test: gender-responsive research colloquium.';
    await logIn(page);
    const dialog = await openComposer(page, text);
    await page.locator('input[type="file"]').setInputFiles(photo);
    await pick(dialog, [
        'Goal 5: Gender Equality',
        'Goal 4: Quality Education',
        /Advanced and Accessible Lifelong Learning/,
    ]);

    // The preview shows the badges as the feed will; they reopen the picker.
    const preview = dialog.getByRole('button', {
        name: /^Edit what this supports: Goal 4: Quality Education, Goal 5: Gender Equality, and A\.C\.H\.I\.E\.V\.E\. A/,
    });
    await expect(preview).toBeVisible();
    await dialog.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: posting });

    const card = postCard(page, text);
    const badges = card.getByRole('button', {
        name: 'Supports Goal 4: Quality Education, Goal 5: Gender Equality, and A.C.H.I.E.V.E. A: Advanced and Accessible Lifelong Learning',
    });
    await expect(badges).toBeVisible();

    // One row for the whole post, in its photos' bottom-right corner.
    const tile = card.getByRole('button', { name: /^Photo 1 of 1/ });
    const frame = await tile.boundingBox();
    const row = await badges.boundingBox();
    expect(frame && row).toBeTruthy();
    expect(row!.x + row!.width).toBeGreaterThan(frame!.x + frame!.width - 40);
    expect(row!.y + row!.height).toBeGreaterThan(frame!.y + frame!.height - 40);

    await badges.click();
    const details = page.locator('[data-slot="popover-content"]');
    await expect(details).toContainText('This post supports');
    await expect(
        details.getByRole('link', { name: /Gender Equality/ }),
    ).toHaveAttribute(
        'href',
        'https://www.un.org/sustainabledevelopment/gender-equality/',
    );
    await expect(
        details.getByRole('link', {
            name: /Advanced and Accessible Lifelong Learning/,
        }),
    ).toHaveAttribute('href', '/about#achieve');
    await expect(
        details.getByRole('link', { name: /^United Nations/ }),
    ).toHaveAttribute('href', 'https://www.un.org/sustainabledevelopment');
    await expect(details).toContainText(disclaimer);
    await page.keyboard.press('Escape');
    await expect(details).toHaveCount(0);
    await expect(badges).toBeFocused();

    // The full-size viewer shows the photo alone.
    await tile.click();
    const viewer = page.getByRole('dialog', { name: /^Photos shared by/ });
    await expect(
        viewer.getByRole('img', { name: /^Photo 1 of 1/ }),
    ).toBeVisible();
    await expect(viewer.getByRole('button', { name: /^Supports/ })).toHaveCount(
        0,
    );
});

test('a post without photos shows its badges under the text', async ({
    page,
}) => {
    const text = 'Browser test: coastal clean-up with partner schools.';
    await logIn(page);
    const dialog = await openComposer(page, text);
    await pick(dialog, [
        'Goal 14: Life Below Water',
        /Effective and Efficient/,
    ]);
    await expect(
        dialog.getByRole('button', {
            name: /^Edit what this supports: Goal 14: Life Below Water/,
        }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: posting });

    await expect(
        postCard(page, text).getByRole('button', {
            name: 'Supports Goal 14: Life Below Water and A.C.H.I.E.V.E. E: Effective and Efficient Public Service',
        }),
    ).toBeVisible();
});

test('a post supports at most three SDGs and three agenda items', async ({
    page,
}) => {
    await logIn(page);
    await page.goto('/community');
    await page.getByRole('button', { name: 'SDGs & ACHIEVE' }).click();
    const dialog = page.getByRole('dialog', {
        name: 'What does this support?',
    });

    for (const name of [
        'Goal 1: No Poverty',
        'Goal 4: Quality Education',
        'Goal 5: Gender Equality',
    ]) {
        await dialog.getByRole('button', { name }).click();
    }

    // The fourth icon stays in full colour but no longer responds.
    const fourth = dialog.getByRole('button', {
        name: 'Goal 10: Reduced Inequalities',
    });
    await expect(fourth).toHaveAttribute('aria-disabled', 'true');
    await fourth.click({ force: true });
    await expect(fourth).toHaveAttribute('aria-pressed', 'false');
    await expect(dialog).toContainText('You can pick up to 3 SDGs.');
    await expect(fourth.locator('img')).toHaveCSS('opacity', '1');

    // Removing one frees a place.
    await dialog.getByRole('button', { name: 'Goal 1: No Poverty' }).click();
    await fourth.click();
    await expect(fourth).toHaveAttribute('aria-pressed', 'true');

    for (const name of [
        /Advanced and Accessible/,
        /Centralized One-Nation/,
        /Harmonized SDG-Based/,
    ]) {
        await dialog.getByRole('button', { name }).click();
    }
    await expect(
        dialog.getByRole('button', { name: /Vitalized Policies/ }),
    ).toBeDisabled();
    await expect(dialog).toContainText(
        'You can pick up to 3 A.C.H.I.E.V.E. items.',
    );
});

for (const colorScheme of ['light', 'dark'] as const) {
    test(`the badges, their details and the picker are accessible in ${colorScheme} mode`, async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        const text = `Browser test: accessibility check in ${colorScheme} mode.`;
        await logIn(page);
        const dialog = await openComposer(page, text);
        await page.locator('input[type="file"]').setInputFiles(photo);
        await dialog.getByRole('button', { name: 'SDGs & ACHIEVE' }).click();
        await dialog
            .getByRole('button', { name: 'Goal 13: Climate Action' })
            .click();
        await dialog
            .getByRole('button', { name: /Vitalized Policies/ })
            .click();
        await scan(page, '[role="dialog"]');
        await dialog.getByRole('button', { name: 'Done' }).click();
        await dialog.getByRole('button', { name: 'Post', exact: true }).click();
        await expect(dialog).toHaveCount(0, { timeout: posting });

        const card = postCard(page, text);
        const labelledBy = await card.getAttribute('aria-labelledby');
        await card.getByRole('button', { name: /^Supports Goal 13/ }).click();
        await expect(
            page.locator('[data-slot="popover-content"]'),
        ).toBeVisible();
        await scan(page, `article[aria-labelledby="${labelledBy}"]`);
        await scan(page, '[data-slot="popover-content"]');
    });
}

test('adding photos from inside a post opens the picker without sharing it', async ({
    page,
}) => {
    const text = 'Browser test: still a draft.';
    await logIn(page);
    const dialog = await openComposer(page, text);
    const sent: string[] = [];
    page.on('request', (request) => {
        if (
            request.method() === 'POST' &&
            new URL(request.url()).pathname === '/posts'
        ) {
            sent.push(request.url());
        }
    });
    const addPhotos = dialog.getByRole('button', {
        name: 'Photos',
        exact: true,
    });

    // Once to add the first photo, and again with a photo already in.
    for (const count of [1, 2]) {
        const [chooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            addPhotos.click(),
        ]);
        await chooser.setFiles(photo);
        await expect(
            dialog.getByRole('button', {
                name: new RegExp(`of ${count} to post`),
            }),
        ).toHaveCount(count);
    }

    await expect(
        dialog.getByRole('heading', { name: 'Create post' }),
    ).toBeVisible();
    expect(sent).toEqual([]);
});

/** A photo drawn in the page: brand purple, with a mustard band on top. */
async function drawPhoto(
    page: Page,
    width: number,
    height: number,
    type: 'image/png' | 'image/jpeg',
) {
    const dataUrl = await page.evaluate(
        ([w, h, format]) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const context = canvas.getContext('2d')!;
            context.fillStyle = '#7030a8';
            context.fillRect(0, 0, w, h);
            context.fillStyle = '#d9a441';
            context.fillRect(0, 0, w, h / 4);

            return canvas.toDataURL(format);
        },
        [width, height, type] as const,
    );

    return Buffer.from(dataUrl.split(',')[1], 'base64');
}

/** Splices in an Exif block holding `orientation`, as phone cameras do. */
function withOrientation(jpeg: Buffer, orientation: number) {
    const tiff = Buffer.alloc(26);
    tiff.write('MM', 0, 'latin1');
    tiff.writeUInt16BE(42, 2);
    tiff.writeUInt32BE(8, 4); // The first directory follows the header.
    tiff.writeUInt16BE(1, 8); // One entry: Orientation, a SHORT.
    tiff.writeUInt16BE(0x0112, 10);
    tiff.writeUInt16BE(3, 12);
    tiff.writeUInt32BE(1, 14);
    tiff.writeUInt16BE(orientation, 18);
    const exif = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
    const marker = Buffer.alloc(4);
    marker.writeUInt16BE(0xffe1, 0);
    marker.writeUInt16BE(exif.length + 2, 2);

    return Buffer.concat([jpeg.subarray(0, 2), marker, exif, jpeg.subarray(2)]);
}

test('a lone portrait photo shows whole, in its own shape', async ({
    page,
}) => {
    await logIn(page);
    await page.goto('/community');
    const cases = [
        {
            text: 'Browser test: a portrait photo.',
            file: {
                name: 'portrait.png',
                mimeType: 'image/png',
                buffer: await drawPhoto(page, 600, 1000, 'image/png'),
            },
        },
        {
            // Landscape pixels that the phone marked "turn right".
            text: 'Browser test: a phone photo turned by its Exif tag.',
            file: {
                name: 'phone.jpg',
                mimeType: 'image/jpeg',
                buffer: withOrientation(
                    await drawPhoto(page, 1000, 600, 'image/jpeg'),
                    6,
                ),
            },
        },
    ];

    for (const { text, file } of cases) {
        const dialog = await openComposer(page, text);
        await page.locator('input[type="file"]').setInputFiles(file);
        // The preview has no stored size; it takes its shape once loaded.
        const preview = dialog.getByRole('button', { name: /^Photo 1 of 1/ });
        await expect
            .poll(async () => {
                const box = (await preview.boundingBox())!;

                return box.height > box.width;
            })
            .toBe(true);
        await dialog.getByRole('button', { name: 'Post', exact: true }).click();
        await expect(dialog).toHaveCount(0, { timeout: posting });

        const tile = postCard(page, text).getByRole('button', {
            name: /^Photo 1 of 1/,
        });
        await expect(tile.getByRole('img')).toHaveCSS('object-fit', 'contain');
        // Upright 3:5, as tall as that shape asks, up to 80% of the screen.
        // (The tile, not the photo, which zooms slightly under the pointer.)
        const box = (await tile.boundingBox())!;
        const viewport = page.viewportSize()!;
        expect(box.height).toBeCloseTo(
            Math.min((box.width * 5) / 3, viewport.height * 0.8, 704),
            0,
        );
    }
});

test('members react with a heart, care, or clap, and see who reacted', async ({
    page,
}) => {
    const text = 'Browser test: Women’s Month forum on safe spaces.';
    await logIn(page);
    const dialog = await openComposer(page, text);
    await dialog.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: posting });

    const card = postCard(page, text);
    const summary = (label: string) =>
        card.getByRole('button', { name: new RegExp(`^${label}`) });
    await expect(summary('\\d+ reactions?:')).toHaveCount(0);

    // A click gives a heart, and the summary at the end of the row counts it.
    await card.getByRole('button', { name: 'React with Heart' }).click();
    await expect(summary('1 reaction: 1 Heart')).toBeVisible();

    // Resting the mouse on React opens the picker; Clap replaces the heart.
    // (The click above leaves the pointer on the button, so come back to it.)
    await page.mouse.move(0, 0);
    await card
        .getByRole('button', { name: 'Remove your Heart reaction' })
        .hover();
    const picker = page.getByRole('toolbar', { name: 'Reactions' });
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: 'Clap' }).click();
    await expect(picker).toHaveCount(0);
    await expect(summary('1 reaction: 1 Clap')).toBeVisible();

    // Hovering the summary names who reacted; selecting it lists everyone.
    await summary('1 reaction').hover();
    await expect(page.getByRole('tooltip')).toContainText('👏');
    await summary('1 reaction').click();
    const list = page.getByRole('dialog', { name: 'Reactions' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByRole('listitem')).toContainText('reacted with Clap');
    await scan(page, '[role="dialog"]');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    // Focus comes back to the summary without popping the names up again.
    await expect(summary('1 reaction')).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    // From the keyboard: the up arrow opens the picker on the current choice.
    await card
        .getByRole('button', { name: 'Remove your Clap reaction' })
        .focus();
    await page.keyboard.press('ArrowUp');
    await expect(picker.getByRole('button', { name: 'Clap' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(picker.getByRole('button', { name: 'Care' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(summary('1 reaction: 1 Care')).toBeVisible();
    await expect(
        card.getByRole('button', { name: 'Remove your Care reaction' }),
    ).toBeFocused();

    // On a phone the icons and the summary share one row.
    await page.setViewportSize({ width: 375, height: 812 });
    const row = (await card
        .getByRole('button', { name: 'Remove your Care reaction' })
        .locator('..')
        .boundingBox())!;
    const counted = (await summary('1 reaction').boundingBox())!;
    expect(
        Math.abs(counted.y + counted.height / 2 - (row.y + row.height / 2)),
    ).toBeLessThanOrEqual(1);
    expect(counted.x + counted.width).toBeLessThanOrEqual(row.x + row.width);
    await scan(page, 'article');

    // A click takes the reaction back.
    const takenBack = () =>
        page.waitForResponse(
            (response) =>
                response.request().method() === 'DELETE' &&
                response.url().endsWith('/reaction'),
        );
    let removed = takenBack();
    await card
        .getByRole('button', { name: 'Remove your Care reaction' })
        .click();
    await expect(
        card.getByRole('button', { name: 'React with Heart' }),
    ).toBeVisible();
    await expect(summary('\\d+ reactions?:')).toHaveCount(0);
    await removed;

    // A double tap gives and takes back. The two requests go in order, so
    // the server ends where the card does.
    removed = takenBack();
    await card.getByRole('button', { name: 'React with Heart' }).dblclick();
    await expect(
        card.getByRole('button', { name: 'React with Heart' }),
    ).toBeVisible();
    await removed;
    await page.reload();
    await expect(
        card.getByRole('button', { name: 'React with Heart' }),
    ).toBeVisible();
    await expect(summary('\\d+ reactions?:')).toHaveCount(0);
});

test('the feed opens on skeletons, then its first five posts', async ({
    page,
}) => {
    await logIn(page);
    // Hold the feed's own request (it follows the page) so the skeletons
    // can be seen.
    await page.route(
        (url) => url.pathname === '/community',
        async (route) => {
            if (
                route.request().headers()['x-inertia-partial-data'] === 'posts'
            ) {
                await new Promise((resolve) => setTimeout(resolve, 800));
            }
            await route.continue();
        },
    );
    await page.goto('/community');

    await expect(
        page.getByRole('heading', { name: 'HEI Gender Mainstreaming Efforts' }),
    ).toBeVisible();
    await expect(
        page.getByRole('status').filter({ hasText: 'Loading posts' }),
    ).toBeAttached();
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);

    await expect(page.getByRole('article')).toHaveCount(5);
    await expect(page.locator('div[aria-busy="true"]')).toHaveCount(0);
});

test('a photo shimmers in its place until it arrives', async ({ page }) => {
    const text = 'Browser test: a photo on a slow connection.';
    await logIn(page);
    const token = (await page.context().cookies()).find(
        (cookie) => cookie.name === 'XSRF-TOKEN',
    )!.value;
    const response = await page.request.post('/posts', {
        multipart: {
            body: text,
            'images[]': {
                name: 'building.jpg',
                mimeType: 'image/jpeg',
                buffer: readFileSync(photo),
            },
        },
        headers: { 'X-XSRF-TOKEN': decodeURIComponent(token) },
        maxRedirects: 0,
    });
    expect(response.status()).toBe(302);

    // Hold the photo, as a slow connection would.
    let releasePhoto = () => {};
    const photoHeld = new Promise<void>((resolve) => {
        releasePhoto = resolve;
    });
    await page.route('**/storage/posts/**', async (route) => {
        await photoHeld;
        await route.continue();
    });
    await page.goto('/community');

    const tile = postCard(page, text).getByRole('button', {
        name: /^Photo 1 of 1/,
    });
    await expect(tile.locator('.animate-pulse')).toBeVisible();
    releasePhoto();
    await expect(tile.locator('.animate-pulse')).toHaveCount(0);
    await expect(tile.getByRole('img')).toBeVisible();
});

test('the feed is called Gender Mainstreaming in both menus', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await logIn(page);
    await page.goto('/community');
    await expect(page).toHaveTitle(/^Gender Mainstreaming/);
    await expect(
        page.getByRole('link', { name: 'Gender Mainstreaming' }).first(),
    ).toBeVisible();

    // The top navigation still fits its row at the smallest desktop width.
    await page
        .getByRole('button', { name: 'Switch to top navigation' })
        .click();
    const topLink = page
        .getByRole('navigation')
        .getByRole('link', { name: 'Gender Mainstreaming' });
    await expect(topLink).toBeVisible();
    const box = (await topLink.boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(40);
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page
        .getByRole('button', { name: 'Switch to sidebar navigation' })
        .click();
});

test('older posts load by themselves as the reader scrolls, and the end says so', async ({
    page,
}) => {
    await logIn(page);
    await page.goto('/community');
    await expect(page.getByRole('article').first()).toBeVisible();
    // The eleven seed posts (tests/browser/server.php) are the oldest, so
    // the last of them is never on the first page.
    const oldest = postCard(page, 'Browser seed post 11:');
    const caughtUp = page.getByText('You’re all caught up');
    await expect(oldest).toHaveCount(0);
    await expect(caughtUp).toHaveCount(0);

    // Hold each next page a moment, so its skeleton shows below the posts.
    await page.route(
        (url) => url.pathname === '/community' && url.searchParams.has('page'),
        async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            await route.continue();
        },
    );
    await page.mouse.wheel(0, 20_000);
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
    await expect(page.getByRole('article').first()).toBeVisible();

    await expect(async () => {
        await page.mouse.wheel(0, 20_000);
        await expect(caughtUp).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
    await expect(oldest).toBeVisible();
    await expect(
        page.getByRole('button', { name: /view more|load more/i }),
    ).toHaveCount(0);
});

test('a reader coming back gets the posts shared while they were away', async ({
    page,
}) => {
    await page.clock.install();
    await logIn(page);
    await page.goto('/community');

    const setVisibility = (state: 'hidden' | 'visible') =>
        page.evaluate((value) => {
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => value,
            });
            document.dispatchEvent(new Event('visibilitychange'));
        }, state);
    // As if posted from another device: straight to the server.
    const postElsewhere = async (body: string) => {
        const token = (await page.context().cookies()).find(
            (cookie) => cookie.name === 'XSRF-TOKEN',
        )!.value;
        const response = await page.request.post('/posts', {
            form: { body },
            headers: { 'X-XSRF-TOKEN': decodeURIComponent(token) },
            maxRedirects: 0,
        });
        expect(response.status()).toBe(302);
    };
    let checks = 0;
    page.on('request', (request) => {
        if (request.url().includes('/posts/newer')) {
            checks += 1;
        }
    });

    // A short absence asks nothing.
    await setVisibility('hidden');
    await page.clock.fastForward('00:10');
    await setVisibility('visible');
    await page.waitForTimeout(300);
    expect(checks).toBe(0);

    // At the top of the feed, the new post loads straight in.
    const first = 'Browser test: shared while the reader was away.';
    await setVisibility('hidden');
    await postElsewhere(first);
    await page.clock.fastForward('00:31');
    await setVisibility('visible');
    await expect(postCard(page, first)).toBeVisible();
    expect(checks).toBe(1);

    // Further down, on a phone, a button offers it instead of moving the page.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.mouse.wheel(0, 2_000);
    await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(200);
    const second = 'Browser test: another post while the reader was away.';
    await setVisibility('hidden');
    await postElsewhere(second);
    await page.clock.fastForward('00:31');
    await setVisibility('visible');

    const offer = page.getByRole('button', { name: '1 new post' });
    await expect(offer).toBeVisible();
    await expect(postCard(page, second)).toHaveCount(0);
    const box = (await offer.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    await scan(page, 'div[aria-busy]');

    // Hold the reload a moment, so its loader shows.
    await page.route(
        (url) => url.pathname === '/community',
        async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            await route.continue();
        },
    );
    await offer.click();
    await expect(
        page.getByRole('status').filter({ hasText: 'Loading new posts' }),
    ).toBeAttached();
    await expect(page.locator('div[aria-busy="true"]')).toBeVisible();
    await expect(postCard(page, second)).toBeVisible();
    await expect(offer).toHaveCount(0);
    await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeLessThan(50);
});

test('the four composer shortcuts fit on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await logIn(page);
    await page.goto('/community');
    const composer = page.getByRole('region', { name: 'Create a post' });

    for (const name of ['Photos', 'Tag people', 'Feeling', 'SDGs & ACHIEVE']) {
        await expect(composer.getByRole('button', { name })).toBeVisible();
    }

    expect(
        await composer.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
        ),
    ).toBe(true);
});
