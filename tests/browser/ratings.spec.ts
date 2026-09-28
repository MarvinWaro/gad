import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

async function rate(page: Page, stars: number, suggestion: string) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Rate PHLGADIS' }).click();
    const card = page.getByRole('dialog', {
        name: 'How would you rate PHLGADIS?',
    });
    await expect(card).toBeVisible();
    await expect(
        card.getByRole('button', { name: 'Submit feedback' }),
    ).toBeDisabled();
    await card
        .getByRole('radio', { name: new RegExp(`^${stars} stars?,`) })
        .check();
    await card.getByLabel(/Suggestions/).fill(suggestion);
    await card.getByRole('button', { name: 'Submit feedback' }).click();
    // The card is named by its heading, which becomes the thank-you.
    await expect(
        page.getByRole('dialog', { name: 'Thank you!' }).getByRole('status'),
    ).toBeVisible();
}

async function logIn(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

for (const colorScheme of ['light', 'dark'] as const) {
    test(`the Rate PHLGADIS card is accessible in ${colorScheme} mode`, async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        await page.goto('/');
        await page.getByRole('button', { name: 'Rate PHLGADIS' }).click();
        const card = page.getByRole('dialog', {
            name: 'How would you rate PHLGADIS?',
        });
        await expect(card).toContainText(
            'Anonymous: no name, email, or IP address is stored.',
        );
        await expect(card).toContainText(
            '1 = Needs improvement, 5 = Excellent',
        );
        // Picking stars says what they mean.
        await card.getByRole('radio', { name: /^4 stars,/ }).check();
        await expect(card).toContainText('Very good');

        const accessibility = await new AxeBuilder({ page })
            .include('[data-slot="popover-content"]')
            .withTags(wcag)
            .analyze();
        expect(accessibility.violations).toEqual([]);

        await page.keyboard.press('Escape');
        await expect(card).toHaveCount(0);
        await expect(
            page.getByRole('button', { name: 'Rate PHLGADIS' }),
        ).toBeFocused();
    });
}

test('a rating shows up in Settings → Site ratings, and the switch hides the button', async ({
    page,
}) => {
    await rate(page, 4, 'Browser test: add more GAD videos.');

    await logIn(page);
    await page.goto('/settings/ratings');
    await expect(
        page.getByRole('navigation', { name: 'Settings' }).getByRole('link', {
            name: 'Site ratings',
        }),
    ).toBeVisible();
    await expect(
        page.getByRole('cell', { name: 'Browser test: add more GAD videos.' }),
    ).toBeVisible();

    // The breakdown filters the list.
    await page.getByRole('button', { name: /^4 stars/ }).click();
    await expect(page).toHaveURL(/rating=4/);
    await expect(
        page.getByRole('heading', { name: /4-star rating/ }),
    ).toBeVisible();

    const scan = await new AxeBuilder({ page })
        .include('main')
        .withTags(wcag)
        .analyze();
    expect(scan.violations).toEqual([]);

    const toggle = page.getByRole('switch', { name: 'Rate PHLGADIS button' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await page.goto('/');
    await expect(
        page.getByRole('button', { name: 'Rate PHLGADIS' }),
    ).toHaveCount(0);

    // Leave the button on for the other tests.
    await page.goto('/settings/ratings');
    await page.getByRole('switch', { name: 'Rate PHLGADIS button' }).click();
    await expect(
        page.getByRole('switch', { name: 'Rate PHLGADIS button' }),
    ).toHaveAttribute('aria-checked', 'true');
});
