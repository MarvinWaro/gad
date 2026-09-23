import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function consent(page: Page) {
    await page.goto('/surveys/ra-9262');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'RA 9262',
    );
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Continue' }).click();
}

async function details(page: Page, minor = false) {
    await page
        .getByLabel(/Are you answering/)
        .selectOption(minor ? 'minor-under-legal-care' : 'self');
    await page.locator('#age').fill(minor ? '15' : '25');
    await page.locator('#sex').selectOption('female');
    await page.locator('#respondent_group').selectOption('student');
    await page.locator('#region_id').selectOption({ index: 1 });
    await page.locator('#cluster_id').selectOption({ index: 1 });
    await page.locator('#hei_id').selectOption({ index: 1 });
    if (minor)
        await page.getByLabel(/this minor is under my legal care/).check();
    await page.getByRole('button', { name: 'Continue' }).click();
}

for (const width of [375, 768, 1280, 1536]) {
    test(`RA 9262 wizard is accessible and fits ${width}px`, async ({
        page,
    }) => {
        await page.setViewportSize({ width, height: 900 });
        const submissions: string[] = [];
        page.on('request', (request) => {
            if (
                request.method() === 'POST' &&
                request.url().endsWith('/responses')
            )
                submissions.push(request.url());
        });
        await consent(page);
        await expect(page.locator('input[type="email"]')).toHaveCount(0);
        await details(page, true);
        await expect(
            page.getByRole('heading', { name: 'Violence Experiences' }),
        ).toBeVisible();
        await expect(page.getByRole('checkbox')).toHaveCount(22);
        await page
            .getByLabel('Physical Violence (Pisikal na Karahasan)', {
                exact: true,
            })
            .check();
        await expect(
            page.locator('fieldset').getByRole('checkbox'),
        ).toHaveCount(16);
        await page
            .getByLabel('Other Relative (Specify)', { exact: true })
            .check();
        await page.getByLabel(/Specify Other Relative/).fill('Aunt');
        const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(result.violations).toEqual([]);
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        ).toBeTruthy();
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(
            page.getByText('Minor under my legal care', { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText(
                'These details and experiences belong to the minor under your legal care.',
            ),
        ).toBeVisible();
        expect(submissions).toEqual([]);
    });
}

test('RA 9262 validates minor details and links experience errors to controls', async ({
    page,
}) => {
    await consent(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('link', { name: 'Choose who you are answering for.' })
        .click();
    await expect(page.getByLabel(/Are you answering/)).toBeFocused();
    await page
        .getByLabel(/Are you answering/)
        .selectOption('minor-under-legal-care');
    await page.getByLabel("Minor's age").fill('18');
    await expect(page.locator('.survey-error-summary')).toContainText(
        'Enter an age between 1 and 17.',
    );
    await details(page, true);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('link', {
            name: 'Choose an experience or select the none option.',
        })
        .click();
    const physical = page.getByLabel(
        'Physical Violence (Pisikal na Karahasan)',
        { exact: true },
    );
    await expect(physical).toBeFocused();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('link', { name: /Choose at least one perpetrator/ })
        .click();
    await expect(
        page.getByLabel('Current Husband/Partner', { exact: true }),
    ).toBeFocused();
    await page.getByLabel('Other Relative (Specify)', { exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('link', { name: /Provide the requested details/ })
        .click();
    await expect(page.getByLabel(/Specify Other Relative/)).toBeFocused();
    await page
        .getByLabel('I have not experienced any of the above', { exact: true })
        .check();
    await expect(physical).not.toBeChecked();
    await expect(page.locator('fieldset')).toHaveCount(0);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(
        page.getByRole('heading', { name: 'Review your response' }),
    ).toBeVisible();
});

test('RA 9262 submission appears in admin responses and CSV', async ({
    page,
}) => {
    await consent(page);
    await details(page, true);
    await page
        .getByLabel('Physical Violence (Pisikal na Karahasan)', { exact: true })
        .check();
    await page.getByLabel('Other Relative (Specify)', { exact: true }).check();
    await page.getByLabel(/Specify Other Relative/).fill('Aunt');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('button', { name: 'Submit anonymous response' })
        .click();
    await expect(
        page.getByRole('heading', {
            name: 'Thank you for sharing your experience.',
        }),
    ).toBeVisible();
    const reference = await page
        .locator('.survey-confirmation code')
        .innerText();
    expect(reference).toMatch(/^RA9262-[A-Z0-9]{10}$/);
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/admin/surveys');
    const row = page.getByRole('row').filter({ hasText: 'RA 9262' });
    const responsesLink = row.locator('a[href$="/responses"]');
    const responsesUrl = await responsesLink.getAttribute('href');
    expect(responsesUrl).toBeTruthy();
    await responsesLink.click();
    await expect(page.getByText(reference, { exact: true })).toBeVisible();
    const csv = await page.request.get(`${responsesUrl}/export`);
    expect(csv.ok()).toBeTruthy();
    expect(await csv.text()).toContain('physical-violence: Aunt');
    expect(await csv.text()).toContain(reference);
    expect(await csv.text()).toContain('Minor under my legal care');
    await page
        .getByRole('link', { name: `View ${reference}`, exact: true })
        .click();
    await expect(
        page.getByText('Minor under my legal care', { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText('Physical Violence (Pisikal na Karahasan)', {
            exact: true,
        }),
    ).toBeVisible();
    await expect(
        page.getByText('Specified perpetrator details: Aunt'),
    ).toBeVisible();
});

test('each landing card advertises participation only where the survey is open', async ({
    page,
}) => {
    await page.goto('/');

    // Derive the expectation from what the server actually published, so this
    // does not break every time a survey is seeded, published or archived.
    const open = await page.evaluate(() => {
        const el = document.querySelector('script[data-page]');
        return JSON.parse(el?.textContent ?? '{}').props?.openSurveys ?? [];
    });
    expect(Array.isArray(open)).toBeTruthy();

    const cards = page.locator('#surveys .law-card');
    await expect(cards).toHaveCount(4);

    for (const [slug, label] of [
        ['ra-7877', 'RA 7877'],
        ['ra-9262', 'RA 9262'],
        ['ra-9710', 'RA 9710'],
        ['ra-11313', 'RA 11313'],
    ]) {
        const link = cards.filter({ hasText: label }).getByRole('link');
        await expect(link).toHaveText(
            open.includes(slug) ? 'Take the Survey' : 'Opening soon',
        );
        await expect(link).toHaveAttribute('href', `/surveys/${slug}`);
    }
});
