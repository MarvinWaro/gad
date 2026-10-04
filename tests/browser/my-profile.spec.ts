import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function logIn(page: import('@playwright/test').Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

test('My Profile shows my activity and keeps account settings available', async ({
    page,
}) => {
    await logIn(page, 'browser-admin@example.test');
    await page.locator('[data-test="sidebar-menu-button"]').click();
    await page.getByRole('menuitem', { name: 'My Profile' }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('h1#profile-name')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Posts' })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    // Your own profile: the follower counts, and no Follow button.
    await expect(
        page.getByRole('button', { name: '0 followers' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Follow/ })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Activity' }).click();
    const activity = page.getByRole('list', {
        name: 'Your activity, newest first',
    });
    await expect(activity.getByRole('article').first()).toContainText(
        'Logged in',
    );

    // The Badges tab holds every badge, and says how to earn the rest.
    await page
        .getByRole('region', { name: 'Achievements Beta' })
        .getByRole('button', { name: /^(See all badges|How to earn badges)$/ })
        .click();
    await expect(page.getByRole('tab', { name: /^Badges/ })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await expect(
        page.getByRole('region', { name: 'Still to earn' }),
    ).toContainText('different days');

    await page.getByRole('tab', { name: 'About' }).click();
    await expect(
        page.getByRole('heading', { name: 'Profile details' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Manage account details' }).click();
    await expect(page).toHaveURL(/settings\/profile$/);
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    // The old address still finds it.
    await page.goto('/settings/profile?view=my-profile');
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('[data-test="profile-cover"]')).toHaveText('');

    const photo = page.getByRole('button', {
        name: 'Profile picture options',
    });
    await photo.click();
    await expect(
        page.getByRole('menuitem', { name: 'Choose profile picture' }),
    ).toBeVisible();
    await expect(
        page.getByRole('menuitem', { name: 'See profile picture' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    for (const width of [375, 768, 1280, 1536]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('body')).toHaveJSProperty(
            'scrollWidth',
            await page.locator('body').evaluate((body) => body.clientWidth),
        );
        const cover = await page
            .locator('[data-test="profile-cover"]')
            .boundingBox();
        const main = await page.locator('main').boundingBox();
        const appBar = await page.locator('main > header').boundingBox();
        expect(cover).not.toBeNull();
        expect(main).not.toBeNull();
        expect(appBar).not.toBeNull();
        const leftGutter = cover!.x - main!.x;
        const rightGutter = main!.x + main!.width - (cover!.x + cover!.width);
        if (width >= 1280) {
            expect(leftGutter).toBeGreaterThan(0);
        } else {
            expect(leftGutter).toBeCloseTo(0, 0);
        }
        expect(rightGutter).toBeCloseTo(leftGutter, 0);
        expect(cover!.y).toBeCloseTo(appBar!.y + appBar!.height, 0);
        const photoBox = await photo.boundingBox();
        expect(photoBox).not.toBeNull();
        expect(photoBox!.width).toBeCloseTo(
            width >= 1024 ? 160 : width >= 640 ? 144 : 112,
            0,
        );
        expect(photoBox!.y).toBeLessThan(cover!.y + cover!.height);
        const achievements = await page
            .getByRole('region', { name: 'Achievements Beta' })
            .boundingBox();
        expect(achievements).not.toBeNull();
        expect(achievements!.x).toBeGreaterThan(cover!.x);
        expect(achievements!.x + achievements!.width).toBeLessThan(
            cover!.x + cover!.width,
        );
    }
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const accessibility = await new AxeBuilder({ page })
        .include('main')
        .analyze();
    expect(accessibility.violations).toEqual([]);
});

test('HEI members see their own posts on their profile', async ({ page }) => {
    const text = 'Browser test: our campus GAD orientation for new students.';
    await logIn(page, 'browser-monitoring@example.test');
    await page.getByRole('button', { name: /^Share a GAD activity/ }).click();
    const composer = page.getByRole('dialog');
    await composer.getByLabel('Post text').fill(text);
    await composer.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(composer).toBeHidden({ timeout: 20_000 });

    await page.goto('/profile');
    await expect(
        page.getByRole('heading', { name: 'Fictional Monitoring Member' }),
    ).toBeVisible();
    await expect(page.getByText('Browser Test HEI').first()).toBeVisible();
    await expect(page.getByText(text)).toBeVisible();
    await expect(page.getByText('HEI Focal').first()).toBeVisible();
});

test('choosing a profile picture crops and saves it right on the profile', async ({
    page,
}) => {
    await logIn(page, 'browser-monitoring@example.test');
    await page.goto('/profile');

    const photo = page.getByRole('button', {
        name: 'Profile picture options',
    });
    await photo.click();
    const chooser = page.waitForEvent('filechooser');
    await page
        .getByRole('menuitem', { name: 'Choose profile picture' })
        .click();
    await (await chooser).setFiles('public/assets/img/ched12_building.jpg');
    const cropper = page.getByRole('dialog', { name: 'Crop profile photo' });
    await expect(cropper).toBeVisible();
    await cropper.getByRole('button', { name: 'Apply' }).click();
    await expect(cropper).toBeHidden({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/profile$/);
    await expect(photo.locator('img')).toBeVisible();

    await photo.click();
    await page.getByRole('menuitem', { name: 'See profile picture' }).click();
    const viewer = page.getByRole('dialog');
    await expect(
        viewer.getByRole('img', {
            name: 'Fictional Monitoring Member’s profile photo',
        }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(photo).toBeFocused();
});
