import AxeBuilder from '@axe-core/playwright';
import {
    expect,
    test,
    type Page,
    type Response,
    type TestInfo,
} from '@playwright/test';

/**
 * GAD Quest (Beta): a CHED Focal writes and opens a quest; an HEI account
 * plays the fixture quest from tests/browser/server.php one question at a
 * time and earns a badge; the focal reads the results.
 */

async function logIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

/** Fits 375px and 1440px in both themes, with no axe violations. */
async function checkBothThemes(page: Page, testInfo: TestInfo, name: string) {
    for (const theme of ['light', 'dark']) {
        await page.evaluate(
            (value) =>
                document.documentElement.classList.toggle(
                    'dark',
                    value === 'dark',
                ),
            theme,
        );
        for (const width of [375, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        document.documentElement.clientWidth,
                ),
            ).toBe(true);
            await page.screenshot({
                path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
                fullPage: true,
            });
        }
        const scan = await new AxeBuilder({ page })
            .include('main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
}

test('a CHED Focal writes a quest of five questions and opens it', async ({
    page,
}, testInfo) => {
    await logIn(page, 'browser-quest-focal@example.test');
    await page.goto('/quests/manage');
    await expect(
        page.getByRole('heading', { level: 1, name: 'GAD Quest Beta' }),
    ).toBeVisible();
    // A CHED Focal both plays and runs quests.
    await expect(
        page
            .getByRole('navigation', { name: 'GAD Quest' })
            .getByRole('link', { name: 'Manage' }),
    ).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'New quest' }).click();
    await expect(page).toHaveURL(/\/quests\/manage\/create$/);
    await expect(
        page.getByText('For HEIs and staff of Regional Office XII'),
    ).toBeVisible();
    await page.getByLabel('Title').fill('Browser Safe Spaces Quest');

    for (const number of [1, 2, 3, 4, 5]) {
        const question = page.getByRole('group', {
            name: `Question ${number}`,
        });
        await question
            .getByLabel('Question', { exact: true })
            .fill(`Browser question ${number}?`);
        // Two choices are enough for a true-or-false question.
        await question.getByRole('button', { name: 'Remove choice D' }).click();
        await question.getByRole('button', { name: 'Remove choice C' }).click();
        await question
            .getByLabel(`Choice A of question ${number}`)
            .fill('True');
        await question
            .getByLabel(`Choice B of question ${number}`)
            .fill('False');
        if (number === 2) {
            await question.getByLabel('Choice B is correct').check();
        }
        await question
            .getByLabel('Why this is the answer')
            .fill(`Browser explanation ${number}.`);
    }

    await page.getByRole('button', { name: 'Save as draft' }).click();
    await expect(page).toHaveURL(/\/quests\/manage\/[0-9A-Z]{26}$/i);
    await expect(
        page.getByRole('heading', { name: 'Browser Safe Spaces Quest' }),
    ).toBeVisible();
    await expect(page.getByText('This quest is a draft')).toBeVisible();
    // The answers, for checking before opening: question 2's is False.
    const second = page
        .getByRole('region', { name: 'Questions and answers' })
        .getByRole('listitem')
        .filter({ hasText: 'Browser question 2?' });
    await expect(second.getByText('(correct)')).toHaveCount(1);
    await expect(second).toContainText('False (correct)');

    await checkBothThemes(page, testInfo, 'quest-results-draft');

    await page.getByRole('button', { name: 'Open quest' }).click();
    await expect(page.getByText('Quest open.')).toBeVisible();
    await expect(page.getByText('This quest is a draft')).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Close', exact: true }),
    ).toBeVisible();
});

test('an HEI account plays a quest one question at a time and earns a badge', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, 'browser-quest-player@example.test');

    await page.goto('/quests');
    await expect(
        page.getByRole('heading', { level: 1, name: 'GAD Quest Beta' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Play: Fixture GAD Quest' }).click();
    await expect(
        page.getByRole('heading', { level: 1, name: 'Fixture GAD Quest' }),
    ).toBeVisible();
    await checkBothThemes(page, testInfo, 'quest-intro');
    await page.setViewportSize({ width: 1440, height: 900 });

    // What DevTools would show: every response the game's pages receive
    // before the first answer, and the page itself.
    const received: string[] = [];
    const record = async (response: Response) => {
        if (new URL(response.url()).pathname.startsWith('/quests/')) {
            received.push(await response.text().catch(() => ''));
        }
    };
    page.on('response', record);
    await page.reload();
    await page.getByRole('button', { name: 'Start the quest' }).click();
    await expect(
        page.getByText('Question 1 of 5', { exact: true }),
    ).toBeVisible();
    page.off('response', record);
    received.push(await page.content());
    // The first page holds its data HTML-escaped.
    const seen = received.join('\n').replaceAll('&quot;', '"');
    // The questions are there; no answer or explanation is.
    expect(seen).toContain('Fixture question 1?');
    expect(seen).not.toContain('Fixture explanation');
    expect(seen).not.toContain('is_correct');
    expect(seen).not.toMatch(/"correct"/);

    for (const step of [1, 2, 3, 4, 5]) {
        await expect(
            page.getByText(`Question ${step} of 5`, { exact: true }),
        ).toBeVisible();
        const prompt = page.locator('#question-prompt');
        await expect(prompt).toBeFocused();
        const number = (await prompt.textContent())!.match(/\d/)![0];
        // Every answer right but the last, by keyboard.
        const choice = page.getByRole('button', {
            name:
                step < 5 ? `Right answer ${number}` : `Wrong answer ${number}`,
        });
        await choice.focus();
        await page.keyboard.press('Enter');

        await expect(
            page.getByText(step < 5 ? 'Correct.' : 'Not quite.'),
        ).toBeVisible();
        await expect(
            page.getByText(`Fixture explanation ${number}.`),
        ).toBeVisible();
        if (step === 5) {
            await expect(
                page.getByText(`The answer is Right answer ${number}.`),
            ).toBeVisible();
            await checkBothThemes(page, testInfo, 'quest-feedback');
            await page.setViewportSize({ width: 1440, height: 900 });
        }
        const next = page.getByRole('button', {
            name: step < 5 ? 'Next question' : 'See your result',
        });
        await expect(next).toBeFocused();
        await page.keyboard.press('Enter');
    }

    await expect(
        page.getByRole('heading', { name: '4 of 5 correct' }),
    ).toBeVisible();
    await expect(
        page.getByText('You earned the Advocate badge.'),
    ).toBeVisible();
    await expect(
        page
            .getByRole('region', { name: 'Your answers' })
            .getByRole('listitem'),
    ).toHaveCount(5);
    // One attempt: no Play again.
    await expect(page.getByRole('button', { name: 'Play again' })).toHaveCount(
        0,
    );
    await checkBothThemes(page, testInfo, 'quest-result');

    // The badge stays on their profile, with its details a tap away.
    await page.goto('/profile');
    const achievements = page.getByRole('region', {
        name: 'Achievements Beta',
    });
    await achievements
        .getByRole('button', { name: /Fixture GAD Quest/ })
        .click();
    await page
        .getByRole('tabpanel', { name: /^Badges/ })
        .getByRole('button', { name: /Fixture GAD Quest/ })
        .click();
    await expect(page.getByRole('dialog')).toContainText('4 of 5 correct');
    await expect(page.getByRole('dialog')).toContainText('Regional Office XII');
});

test('the focal reads who played, by sex', async ({ page }, testInfo) => {
    await logIn(page, 'browser-quest-focal@example.test');
    await page.goto('/quests/manage');
    await page.getByRole('link', { name: 'Fixture GAD Quest' }).click();

    await expect(page.getByText('1 female · 0 male')).toBeVisible();
    const participant = page
        .getByRole('region', { name: 'Participants' })
        .getByRole('listitem')
        .filter({ hasText: 'Fictional Quest Player' });
    await expect(participant).toContainText('4 of 5');
    await expect(participant).toContainText('Advocate');
    await expect(participant).toContainText('Browser Test HEI');

    await checkBothThemes(page, testInfo, 'quest-results');
});
