import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Every page on a 360px phone, the narrowest common Android width: nothing
 * scrolls sideways or sticks out, no text is under 12px, and form fields
 * are 16px so iOS does not zoom in on them (DESIGN.md).
 */

async function phone(browser: Browser, email?: string): Promise<Page> {
    const context = await browser.newContext({
        viewport: { width: 360, height: 780 },
        isMobile: true,
        hasTouch: true,
    });
    const page = await context.newPage();

    if (email) {
        await page.goto('/login');
        await page.getByLabel('Email address').fill(email);
        await page
            .getByLabel('Password', { exact: true })
            .fill('browser-password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL(/dashboard/);
    }

    return page;
}

async function checkPage(page: Page, path: string) {
    await page.goto(path);
    await page.waitForLoadState('load');
    // Let deferred props, fonts and entrance animations settle.
    await page.waitForTimeout(600);

    const problems = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const name = (el: Element) =>
            `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
        const skipped = (el: Element) =>
            Boolean(
                el.closest(
                    '.sr-only, [aria-hidden="true"], [hidden], .skip-link, svg, .recharts-wrapper',
                ),
            );
        // Inside a box that scrolls or clips on its own, such as a carousel.
        const contained = (el: Element) => {
            for (
                let p = el.parentElement;
                p && p !== document.body;
                p = p.parentElement
            ) {
                if (
                    /(auto|scroll|hidden|clip)/.test(
                        getComputedStyle(p).overflowX,
                    )
                )
                    return true;
            }
            return false;
        };
        const found: string[] = [];

        if (document.documentElement.scrollWidth > width) {
            found.push(
                `scrolls sideways by ${document.documentElement.scrollWidth - width}px`,
            );
        }

        for (const el of document.querySelectorAll('body *')) {
            const box = el.getBoundingClientRect();
            if (!box.width || !box.height || skipped(el)) continue;
            const style = getComputedStyle(el);
            if (style.visibility === 'hidden') continue;
            if (
                (box.right > width + 1 || box.left < -1) &&
                style.position !== 'fixed' &&
                !contained(el)
            ) {
                found.push(`sticks out: ${name(el)}`);
            }
            const ownText = [...el.childNodes].some(
                (node) =>
                    node.nodeType === 3 && (node.textContent ?? '').trim(),
            );
            if (ownText && parseFloat(style.fontSize) < 12) {
                found.push(`text under 12px: ${name(el)} ${style.fontSize}`);
            }
        }

        for (const el of document.querySelectorAll(
            'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea',
        )) {
            const style = getComputedStyle(el);
            if (
                el.getBoundingClientRect().width &&
                style.opacity !== '0' &&
                parseFloat(style.fontSize) < 16
            ) {
                found.push(`field under 16px: ${name(el)} ${style.fontSize}`);
            }
        }

        return found;
    });

    expect(problems, `${path} on a 360px phone`).toEqual([]);
}

test.describe.configure({ mode: 'serial' });

test('the public pages fit a 360px phone', async ({ browser }) => {
    test.setTimeout(180_000);
    const page = await phone(browser);
    for (const path of [
        '/',
        '/about',
        '/about/gad-herstory',
        '/help/faq',
        '/feedback',
        '/resources/definition-of-terms',
        '/resources/gad-enabling-republic-acts',
        '/resources/issuances',
        '/resources/manuals',
        '/surveys/ra-7877',
        '/surveys/ra-9262',
        '/login',
        '/register',
        '/forgot-password',
    ]) {
        await checkPage(page, path);
    }
});

test('the HEI pages fit a 360px phone', async ({ browser }) => {
    test.setTimeout(180_000);
    const page = await phone(browser, 'browser-monitoring@example.test');
    for (const path of [
        '/dashboard',
        '/events',
        '/records',
        '/records/training',
        '/records/compliance',
        '/monitoring',
        '/notifications',
        '/profile',
        '/settings/profile',
        '/settings/security',
        '/settings/appearance',
    ]) {
        await checkPage(page, path);
    }
});

test('the staff pages fit a 360px phone', async ({ browser }) => {
    test.setTimeout(240_000);
    const page = await phone(browser, 'browser-admin@example.test');
    for (const path of [
        '/dashboard',
        '/admin/monitoring',
        '/admin/monitoring/training',
        '/community',
        '/admin/events',
        '/admin/surveys',
        '/admin/carousels',
        '/admin/feedback',
        '/settings/users',
        '/settings/roles',
        '/settings/regions',
        '/settings/heis',
        '/settings/respondent-groups',
        '/settings/academic-years',
        '/settings/activity-logs',
        '/settings/ratings',
        '/settings/student-counts',
        '/notifications',
        '/profile',
    ]) {
        await checkPage(page, path);
    }

    // The survey builder, opened from the list.
    await page.goto('/admin/surveys');
    const edit = await page
        .locator('a[href*="/edit"]')
        .first()
        .getAttribute('href');
    await checkPage(page, edit!);
    await checkPage(page, edit!.replace('/edit', '/responses'));
});
