import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// All four laws are seeded now, so no slug is permanently unpublished. Find
// one that is closed right now; if every survey is live, there is no
// not-yet-open state to scan and the check reports that rather than failing.
async function closedSurvey(page: import('@playwright/test').Page) {
    await page.goto('/');
    const open: string[] = await page.evaluate(() => {
        const el = document.querySelector('script[data-page]');
        return JSON.parse(el?.textContent ?? '{}').props?.openSurveys ?? [];
    });

    return (
        ['ra-11313', 'ra-9710', 'ra-9262', 'ra-7877'].find(
            (slug) => !open.includes(slug),
        ) ?? null
    );
}

for (const width of [375, 768, 1280, 1536]) {
    test(`unpublished survey state fits ${width}px`, async ({ page }) => {
        const slug = await closedSurvey(page);
        test.skip(
            slug === null,
            'Every survey is published in this environment.',
        );

        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/surveys/${slug}`);

        await expect(
            page.getByRole('heading', {
                name: 'Survey questionnaire coming next',
            }),
        ).toBeVisible();
        await expect(page.locator('form')).toHaveCount(0);
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        ).toBeTruthy();
    });
}

test('unpublished survey state meets automated WCAG AA checks', async ({
    page,
}) => {
    const slug = await closedSurvey(page);
    test.skip(slug === null, 'Every survey is published in this environment.');

    await page.goto(`/surveys/${slug}`);
    const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

    expect(result.violations).toEqual([]);
});

// The scans above only ever reach the not-yet-open state. Once a survey is
// published the questionnaire itself is what respondents use, so scan that too
// rather than leaving the live form uncovered.
test('the published RA 7877 questionnaire meets automated WCAG AA checks', async ({
    page,
}) => {
    await page.goto('/surveys/ra-7877');
    await expect(page.locator('form')).toBeVisible();

    const consent = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
    expect(consent.violations).toEqual([]);

    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByLabel(/^Age/)).toBeVisible();

    const details = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
    expect(details.violations).toEqual([]);
});

// Every respondent-facing control must be reachable by its visible label, or
// assistive technology cannot name the field being answered.
test('respondent detail fields are reachable by their visible labels', async ({
    page,
}) => {
    await page.goto('/surveys/ra-7877');
    await expect(page.locator('form')).toBeVisible();

    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Continue/ }).click();

    for (const label of [
        /^Age/,
        /^Sex/,
        /^Respondent group/,
        /^Region/,
        /^Cluster/,
        /^Name of HEI/,
    ]) {
        await expect(page.getByLabel(label)).toHaveCount(1);
    }
});

test('survey choices open in a rounded accessible menu', async ({ page }) => {
    await page.goto('/surveys/ra-7877');
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Continue/ }).click();

    const sex = page.getByRole('combobox', { name: /^Sex/ });
    await sex.click();
    const menu = page.getByRole('listbox');
    await expect(menu).toBeVisible();
    expect(
        await page
            .locator('[data-slot="select-content"]')
            .evaluate((element) => getComputedStyle(element).borderRadius),
    ).toBe('10px');
    await page.getByRole('option', { name: 'Female', exact: true }).click();
    await expect(sex).toContainText('Female');
});

// A cluster with no institutions used to leave a required, empty, enabled
// dropdown with no way forward.
test('a cluster with no institutions explains itself instead of dead-ending', async ({
    page,
}) => {
    await page.goto('/surveys/ra-7877');
    await expect(page.locator('form')).toBeVisible();

    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByLabel(/^Region/).click();
    await page.getByRole('option').nth(1).click();

    const cluster = page.getByLabel(/^Cluster/);
    await cluster.click();
    const clusterCount = await page.getByRole('option').count();
    await page.keyboard.press('Escape');
    const hei = page.getByLabel(/^Name of HEI/);

    for (let index = 1; index < clusterCount; index += 1) {
        await cluster.click();
        await page.getByRole('option').nth(index).click();

        if (await hei.isDisabled()) {
            // Empty: locked, and the reason plus a route forward is on screen.
            await expect(hei).toContainText('No institutions available');
            await expect(
                page.getByText('No institutions are listed for this cluster'),
            ).toBeVisible();
        } else {
            await hei.click();
            expect(await page.getByRole('option').count()).toBeGreaterThan(1);
            await page.keyboard.press('Escape');
        }
    }
});

// A summary that only says "review the highlighted fields" leaves the
// respondent hunting. Each problem has to name its field and jump to it.
test('validation errors name the field at fault and link to it', async ({
    page,
}) => {
    await page.goto('/surveys/ra-7877');
    await expect(page.locator('form')).toBeVisible();

    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByLabel(/^Age/)).toBeVisible();

    // Nothing filled in, so continuing must not advance the step.
    await page.getByRole('button', { name: /Continue/ }).click();
    const summary = page.locator('.survey-error-summary');
    await expect(summary).toBeVisible();

    const entries = summary.locator('.survey-error-list a');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);

    // Every entry is a real sentence, not a generic nudge.
    for (const text of await entries.allInnerTexts()) {
        expect(text.trim()).toMatch(/^(Enter|Choose|Tell|Confirm)/);
    }

    // The offending controls are marked for assistive technology too.
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(count);

    // Following an entry moves focus to the control it names.
    const target = await entries.first().getAttribute('href');
    await entries.first().click();
    await expect(page.locator(':focus')).toHaveAttribute(
        'id',
        (target ?? '').replace('#', ''),
    );

    // Fixing one clears just that entry, live.
    await page.getByLabel(/^Age/).fill('23');
    await expect(entries).toHaveCount(count - 1);
});
