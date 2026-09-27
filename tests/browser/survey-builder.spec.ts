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
