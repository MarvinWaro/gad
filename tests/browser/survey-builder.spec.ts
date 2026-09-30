import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function openRa9262Draft(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/admin/surveys');
    await page
        .getByRole('row')
        .filter({ hasText: 'RA 9262' })
        .getByRole('link', { name: 'Edit the draft for RA 9262 Survey' })
        .click();
}

test('the top bar stays in view, and the section rails stop below it', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openRa9262Draft(page);
    const bar = page.locator('header').filter({
        has: page.getByRole('button', { name: 'Toggle sidebar' }),
    });
    const railHeading = page.getByRole('heading', { name: 'Survey details' });
    await expect(railHeading).toBeVisible();

    // On desktop it holds just inside the inset card's 8px frame.
    await page.mouse.wheel(0, 1400);
    await expect.poll(async () => (await bar.boundingBox())?.y).toBe(8);
    const barBox = (await bar.boundingBox())!;
    const railBox = (await railHeading.boundingBox())!;
    expect(railBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height + 24);

    // On a phone it sits at the very top.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.mouse.wheel(0, 400);
    await expect.poll(async () => (await bar.boundingBox())?.y).toBe(0);
    await expect(
        bar.getByRole('button', { name: 'Toggle sidebar' }),
    ).toBeVisible();
});

// Inertia rebuilds a page from its history entry on Back, so the list once
// kept showing what it had before the draft was saved or published.
test('going back to the survey list shows the saved changes', async ({
    page,
}) => {
    await openRa9262Draft(page);

    const lawTitle = page.getByLabel('Law title', { exact: true });
    const original = await lawTitle.inputValue();
    const edited = `${original} (edited)`;

    await lawTitle.fill(edited);
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('Unsaved changes')).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/surveys$/);
    await expect(
        page.getByRole('row').filter({ hasText: 'RA 9262' }),
    ).toContainText(edited);

    // Put the title back. The first save's toast may still cover Save draft,
    // so submit with Enter from the field.
    await page.goForward();
    await lawTitle.fill(original);
    const restored = page.waitForResponse(
        (response) =>
            response.request().method() === 'PUT' &&
            response.url().includes('/admin/surveys/'),
    );
    await lawTitle.press('Enter');
    await restored;
    await expect(page.getByText('Unsaved changes')).toHaveCount(0);
});

test('survey sections collapse and option editors accept new lines', async ({
    page,
}) => {
    await openRa9262Draft(page);

    const respondent = page.getByRole('button', {
        name: /Respondent details.*7 questions/i,
    });
    const violence = page.getByRole('button', {
        name: /Violence Experiences.*1 question/i,
    });
    await expect(respondent).toHaveAttribute('aria-expanded', 'true');
    await expect(violence).toHaveAttribute('aria-expanded', 'false');

    await violence.focus();
    await page.keyboard.press('Space');
    await expect(violence).toHaveAttribute('aria-expanded', 'true');
    await expect(respondent).toHaveAttribute('aria-expanded', 'false');

    const experiences = page.getByLabel('Experiences', { exact: true });
    const perpetrators = page.getByLabel('Perpetrators', { exact: true });
    await experiences.focus();
    await experiences.press('Control+End');
    await experiences.press('Enter');
    await expect(experiences).toHaveValue(/\n$/);
    await experiences.press('Shift+Enter');
    await expect(experiences).toHaveValue(/\n\n$/);
    await experiences.type('New experience from editor');

    await perpetrators.focus();
    await perpetrators.press('Control+End');
    await perpetrators.press('Shift+Enter');
    await expect(perpetrators).toHaveValue(/\n$/);
    await perpetrators.type('New perpetrator from editor');

    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('Unsaved changes')).toHaveCount(0);
    await page.reload();
    await violence.click();
    await expect(page.getByLabel('Experiences', { exact: true })).toHaveValue(
        /New experience from editor$/,
    );
    await expect(page.getByLabel('Perpetrators', { exact: true })).toHaveValue(
        /New perpetrator from editor$/,
    );
});

// The answer key is also what the builder used to tell questions apart, so
// each keystroke rebuilt the question and dropped the cursor.
test('an answer key can be typed out, and saves without builder-only keys', async ({
    page,
}) => {
    await openRa9262Draft(page);

    const answerKey = page.getByLabel('Answer key').first();
    await answerKey.click();
    await answerKey.press('End');
    await page.keyboard.type('-check');
    await expect(answerKey).toHaveValue('answering_for-check');
    await expect(answerKey).toBeFocused();

    // Put it back, then save: the draft goes out exactly as it is stored.
    await answerKey.fill('answering_for');
    const saved = page.waitForRequest(
        (request) =>
            request.method() === 'PUT' &&
            request.url().includes('/admin/surveys/'),
    );
    await page.getByRole('button', { name: 'Save draft' }).click();
    const payload = (await saved).postDataJSON();
    expect(JSON.stringify(payload)).not.toContain('clientKey');
    expect(payload.definition.sections[0].questions[0].id).toBe(
        'answering_for',
    );
    await expect(page.getByText('Unsaved changes')).toHaveCount(0);
});

// Someone who may only view surveys reads the draft; nothing looks editable.
test('without the update permission the draft is view only', async ({
    page,
}, testInfo) => {
    await page.goto('/login');
    await page
        .getByLabel('Email address')
        .fill('browser-survey-viewer@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/admin/surveys');

    const row = page.getByRole('row').filter({ hasText: 'RA 9262' });
    await expect(
        row.getByRole('link', { name: 'Edit the draft for RA 9262 Survey' }),
    ).toHaveCount(0);
    await row
        .getByRole('link', { name: 'View the draft for RA 9262 Survey' })
        .click();

    await expect(page.getByText('View only', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Survey title')).not.toBeEditable();
    await expect(page.getByLabel('Privacy notice')).not.toBeEditable();
    for (const name of ['Save draft', 'Add section', /^Remove this/]) {
        await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
    await page.screenshot({
        path: testInfo.outputPath('survey-view-only.png'),
        fullPage: true,
    });

    // Sections still open, to read every question.
    const violence = page.getByRole('button', {
        name: /Violence Experiences.*1 question/i,
    });
    await violence.click();
    await expect(violence).toHaveAttribute('aria-expanded', 'true');
    await expect(
        page.getByLabel('Experiences', { exact: true }),
    ).not.toBeEditable();

    expect(
        (
            await new AxeBuilder({ page })
                .include('main')
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                .analyze()
        ).violations,
    ).toEqual([]);
});
