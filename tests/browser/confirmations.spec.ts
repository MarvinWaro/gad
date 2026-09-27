import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

test('archiving a survey asks first, and restoring it does not', async ({
    page,
}) => {
    await signIn(page);
    await page.goto('/admin/surveys');
    const row = page.getByRole('row').filter({ hasText: 'RA 7877' });
    const archive = row.getByRole('button', {
        name: 'Archive this survey and close it to the public',
    });

    // Cancel leaves it open to the public.
    await archive.click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('Archive RA 7877 Survey?');
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toHaveCount(0);
    await expect(row).not.toContainText('Archived');

    await archive.click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Archive' })
        .click();
    await expect(row).toContainText('Archived');

    // Reopening needs no warning; the other specs need RA 7877 open.
    await row
        .getByRole('button', {
            name: 'Restore this survey so the public can reach it',
        })
        .click();
    await expect(row).not.toContainText('Archived');
});

test('a post is deleted from its menu through the confirmation, and so is a comment', async ({
    page,
}) => {
    await signIn(page);
    await page.goto('/community');

    const text = `Confirmation check ${Date.now()}`;
    await page
        .locator(
            'section[aria-label="Create a post"] button[aria-haspopup="dialog"]',
        )
        .first()
        .click();
    await page.getByRole('dialog').locator('textarea').fill(text);
    await page
        .getByRole('dialog')
        .getByRole('button', { name: /^Post$/ })
        .click();
    const post = page.locator('article', { hasText: text });
    await expect(post).toBeVisible();

    // A comment, deleted from inside the post's window.
    await post.getByRole('button', { name: /^Comment/ }).click();
    const postWindow = page.getByRole('dialog');
    const box = postWindow.getByPlaceholder(/^Comment as/);
    await box.fill('A comment to remove');
    await box.press('Enter');
    await expect(postWindow.getByText('A comment to remove')).toBeVisible();
    await postWindow
        .getByRole('button', { name: /^Delete comment by/ })
        .click();
    const commentConfirm = page.getByRole('alertdialog');
    await expect(commentConfirm).toContainText('Delete this comment?');
    await commentConfirm.getByRole('button', { name: 'Delete' }).click();
    await expect(postWindow.getByText('A comment to remove')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // "Delete post" in the menu opens the confirmation by the options button.
    await post.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('menuitem', { name: 'Delete post' }).click();
    const postConfirm = page.getByRole('alertdialog');
    await expect(postConfirm).toContainText('Delete this post?');
    await expect(
        postConfirm.getByRole('button', { name: 'Cancel' }),
    ).toBeFocused();
    await postConfirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(postConfirm).toHaveCount(0);
    await expect(post).toBeVisible();

    await post.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('menuitem', { name: 'Delete post' }).click();
    await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Delete post' })
        .click();
    await expect(post).toHaveCount(0);
});
