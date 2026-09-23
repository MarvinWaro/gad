import { expect, test } from '@playwright/test';

test('survey sections collapse and option editors accept new lines', async ({
    page,
}) => {
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
