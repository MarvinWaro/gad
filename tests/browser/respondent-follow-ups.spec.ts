import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

async function chooseSelect(page: Page, id: string, value: string) {
    await page.locator(`#${id}`).click();
    await page
        .locator(`[data-slot="select-item"][data-value="${value}"]`)
        .click();
}

async function chooseSelectIndex(page: Page, id: string, index: number) {
    await page.locator(`#${id}`).click();
    await page.getByRole('option').nth(index).click();
}

test('an administrator gives a new group its own follow-up question, and a respondent answers it', async ({
    page,
}) => {
    await signIn(page);
    await page.goto('/settings/respondent-groups');

    // A new group…
    await page.getByRole('button', { name: 'Add group' }).click();
    const groupDialog = page.getByRole('dialog');
    await groupDialog.getByLabel('Name').fill('Civilian');
    await groupDialog.getByRole('button', { name: 'Add group' }).click();
    const row = page.locator('tr', { hasText: 'Civilian' });
    await expect(row).toBeVisible();

    // …that asks "Occupation", with an "Others" choice to specify.
    await page
        .getByRole('button', { name: 'Follow-up questions for Civilian' })
        .click();
    const editor = page.getByRole('dialog');
    await editor.getByRole('button', { name: 'Add question' }).click();
    await editor.getByLabel('Question 1').fill('Occupation');
    await editor.getByLabel('Choices').fill('Farmer\nVendor');
    await editor.getByLabel(/Add an “Others” choice/).check();
    await editor.getByRole('button', { name: 'Save questions' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(row).toContainText('Occupation');

    // A respondent picks Civilian, then Others, and says what they do.
    await page.goto('/surveys/ra-7877');
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#age').fill('34');
    await chooseSelect(page, 'sex', 'male');
    await page.locator('#gender_identity').check();
    await chooseSelect(page, 'respondent_group', 'civilian');
    await chooseSelect(page, 'group-answer-occupation', 'others');
    await page.getByLabel('Please specify').fill('Tricycle driver');
    await chooseSelectIndex(page, 'region_id', 1);
    await chooseSelectIndex(page, 'cluster_id', 1);
    await chooseSelectIndex(page, 'hei_id', 1);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByLabel('I have not experienced any of the above', { exact: true })
        .check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.survey-review')).toContainText(
        'Others: Tricycle driver',
    );
    await page
        .getByRole('button', { name: 'Submit anonymous response' })
        .click();
    const reference = await page
        .locator('.survey-confirmation code')
        .innerText();

    // The reviewer sees the answer on the response.
    await page.goto('/admin/surveys');
    await page
        .getByRole('row')
        .filter({ hasText: 'RA 7877' })
        .locator('a[href$="/responses"]')
        .click();
    await page
        .getByRole('link', { name: `View ${reference}`, exact: true })
        .click();
    await expect(page.getByText('Occupation', { exact: true })).toBeVisible();
    await expect(
        page.getByText('Others: Tricycle driver', { exact: true }),
    ).toBeVisible();
});
