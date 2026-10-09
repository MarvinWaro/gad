import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

test('the header links straight to the FAQ, with no dropdown', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button')).toHaveCount(0);
    await nav.getByRole('link', { name: 'FAQ', exact: true }).click();
    await expect(page).toHaveURL(/\/help\/faq$/);
    await expect(page).toHaveTitle('PHLGADIS | Frequently Asked Questions');
    await expect(
        page.getByRole('link', { name: 'Back to home' }),
    ).toHaveAttribute('href', '/');
});

test('the mobile menu links to the FAQ after the sections', async ({
    page,
}) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'FAQ' })
        .click();
    await expect(page).toHaveURL(/\/help\/faq$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('PHLGADIS logos switch to the compact lockup in dark mode', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const footerLogo = () =>
        page.locator('footer').getByRole('img', { name: /^PHLGADIS — / });

    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/about#logo');
    await expect(footerLogo()).toHaveAttribute(
        'src',
        '/assets/img/gadlogo.png',
    );

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await expect(footerLogo()).toHaveAttribute(
        'src',
        '/assets/img/gadlogo2.png',
    );
    await expect(
        page
            .getByRole('tabpanel', { name: 'The Logo' })
            .getByRole('img', { name: /^PHLGADIS — / }),
    ).toHaveAttribute('src', '/assets/img/gadlogo2.png');
});

// The old PHLGADIS FAQ's questions, in order (data/faq.ts).
const questions = [
    'What is the bulletin about ?',
    'What data do the surveys collect?',
    'Republic Act 7877 or Anti-Sexual Harassment Act, what is it about?',
    'Republic Act 9262 or Violence Against Women and Children, what is it about?',
    'Republic Act 9710 or Magna Carta of Women, what is it about?',
    'RA 11313 or Safe Spaces Act, what is it about?',
];

for (const colorScheme of ['light', 'dark'] as const) {
    for (const width of [375, 1280]) {
        test(`FAQ page fits ${width}px in ${colorScheme} mode`, async ({
            page,
        }, testInfo) => {
            await page.setViewportSize({ width, height: 900 });
            await page.emulateMedia({ colorScheme });
            await page.goto('/help/faq');
            await expect(page.getByRole('heading', { level: 1 })).toHaveText(
                'Frequently Asked Questions',
            );
            await expect(page.locator('.faq-objectives li')).toHaveCount(8);

            // Answers start closed and open from their question.
            const summaries = page.locator('.faq-item summary');
            await expect(summaries).toHaveText(questions);
            const answer = page.getByText(
                'It is an interactive slideshow of banners',
            );
            await expect(answer).toBeHidden();
            await summaries.first().click();
            await expect(answer).toBeVisible();

            const contact = page.getByRole('region', {
                name: 'Still have questions?',
            });
            await expect(
                contact.getByRole('link', { name: '+63 936 616 7199' }),
            ).toHaveAttribute('href', 'tel:+639366167199');
            await expect(
                contact.getByRole('link', { name: 'chedro12@ched.gov.ph' }),
            ).toHaveAttribute('href', 'mailto:chedro12@ched.gov.ph');
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth >
                        window.innerWidth,
                ),
            ).toBe(false);
            await page.screenshot({
                path: testInfo.outputPath(`faq-${colorScheme}-${width}.png`),
                fullPage: true,
            });

            const accessibility = await new AxeBuilder({ page })
                .withTags(wcag)
                .analyze();
            expect(accessibility.violations).toEqual([]);
        });
    }
}

test('a link to one answer opens it', async ({ page }) => {
    await page.goto('/help/faq#survey-data');
    await expect(page.locator('#survey-data')).toHaveJSProperty('open', true);
    await expect(page.locator('#bulletin')).toHaveJSProperty('open', false);
    // Answered the way the new survey works: an email is only optional.
    await expect(page.locator('#survey-data')).toContainText(
        'No name is collected, giving an email is optional',
    );
    await expect(page.locator('#survey-data')).not.toContainText(
        'email that will be collected',
    );
    // It names the office running the site (config/phlgadis.php).
    await expect(page.locator('#survey-data')).toContainText(
        'ask CHED Regional Office XII to access or delete your response',
    );
});

test('the header toggle switches the public site to dark and remembers it', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/');

    const html = page.locator('html');
    const theme = page.locator('.public-theme').first();
    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
    await expect(html).not.toHaveClass(/dark/);
    await expect(theme).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    await toggle.click();
    await expect(html).toHaveClass(/dark/);
    await expect(theme).toHaveCSS('background-color', 'rgb(20, 18, 23)');

    // Saved the way Settings → Appearance saves it, so the server renders
    // the next page dark from its first paint, and a reload keeps it.
    expect(await (await page.request.get('/')).text()).toMatch(
        /<html[^>]*class="dark"/,
    );
    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await expect(theme).toHaveCSS('background-color', 'rgb(20, 18, 23)');

    const accessibility = await new AxeBuilder({ page })
        .withTags(wcag)
        .analyze();
    expect(
        accessibility.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map((node) => node.target),
        })),
    ).toEqual([]);

    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
    await expect(theme).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});
