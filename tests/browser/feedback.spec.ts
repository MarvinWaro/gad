import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

async function noViolations(page: Page) {
    // Let the step's entrance and any colour transitions finish first.
    await page.evaluate(async () => {
        await Promise.all(
            document
                .getAnimations()
                .filter(
                    (animation) =>
                        animation.effect?.getComputedTiming().iterations !==
                        Infinity,
                )
                .map((animation) => animation.finished),
        );
    });
    const result = await new AxeBuilder({ page }).withTags(wcag).analyze();
    expect(
        result.violations.map(({ id, nodes }) => ({
            id,
            nodes: nodes.map((node) => node.target),
        })),
    ).toEqual([]);
}

async function fitsWidth(page: Page) {
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBeTruthy();
}

async function logInAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

test('the homepage leads to the feedback form', async ({ page }) => {
    await page.goto('/');
    await page
        .locator('#feedback')
        .getByRole('link', { name: 'Share feedback', exact: true })
        .click();
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(
        page.getByRole('heading', { level: 1, name: 'Share your feedback' }),
    ).toBeVisible();
});

for (const width of [360, 1280]) {
    test(`a visitor sends feedback in four steps at ${width}px`, async ({
        page,
    }, testInfo) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/feedback');
        await expect(
            page.getByText(
                'We would love to hear your thoughts or feedback on how we can improve your experience!',
            ),
        ).toBeVisible();
        await fitsWidth(page);

        // Nothing required is answered yet, so the summary says what to fix.
        await page.getByRole('button', { name: 'Continue' }).click();
        const summary = page.getByRole('alert');
        await expect(summary).toBeFocused();
        await expect(summary).toContainText('Choose a feedback type.');
        await expect(summary).toContainText('Tell us your feedback.');
        // Each item leads to its answer.
        await summary
            .getByRole('link', { name: 'Tell us your feedback.' })
            .click();
        await expect(
            page.getByRole('textbox', { name: 'Feedback', exact: true }),
        ).toBeFocused();

        // The type by keyboard: arrow keys move through the four tiles.
        await page
            .getByRole('radio', { name: 'Comments/Recommendations' })
            .focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(
            page.getByRole('radio', { name: 'Bug Reports' }),
        ).toBeChecked();
        await page
            .getByRole('textbox', { name: 'Feedback', exact: true })
            .fill('The export button on the reports page does nothing.');
        await expect(summary).toHaveCount(0);
        const reading = page.getByRole('radiogroup', {
            name: 'How difficult is reading characters on the screen?',
        });
        await reading.getByRole('radio', { name: 'Somewhat Easy' }).check();
        await page.getByRole('button', { name: /^Clear/ }).click();
        await expect(
            reading.getByRole('radio', { name: 'Somewhat Easy' }),
        ).not.toBeChecked();
        // Clearing keeps the keyboard on the question.
        await expect(
            reading.getByRole('radio', { name: 'Very Hard' }),
        ).toBeFocused();
        await reading.getByRole('radio', { name: 'Very Easy' }).check();
        await page.screenshot({
            path: testInfo.outputPath(`feedback-step-1-${width}.png`),
            fullPage: true,
        });
        await page.getByRole('button', { name: 'Continue' }).click();

        // Faces have descriptive names and still carry numeric values.
        await expect(
            page.getByRole('heading', { name: /Agreement/ }),
        ).toBeFocused();
        const terms = page.getByRole('radiogroup', {
            name: 'Use of terms throughout the system is consistent',
        });
        await terms
            .getByRole('radio', { name: 'Strongly Agree', exact: true })
            .check();
        await page.keyboard.press('ArrowLeft');
        const agree = terms.getByRole('radio', { name: 'Agree', exact: true });
        await expect(agree).toBeChecked();
        await expect(agree).toHaveValue('4');
        await expect(terms.locator('.feedback-face')).toHaveText([
            '😞',
            '🙁',
            '😐',
            '🙂',
            '😄',
        ]);
        const termsQuestion = terms.locator('..');
        await expect(termsQuestion.getByRole('status')).toHaveText(
            'Selected: Agree',
        );
        await termsQuestion.getByRole('button', { name: /^Clear/ }).click();
        await expect(agree).not.toBeChecked();
        await expect(termsQuestion.getByRole('status')).toBeEmpty();
        await expect(
            terms.getByRole('radio', {
                name: 'Strongly Disagree',
                exact: true,
            }),
        ).toBeFocused();
        await agree.check();
        await fitsWidth(page);
        await page.screenshot({
            path: testInfo.outputPath(`feedback-step-2-${width}.png`),
            fullPage: true,
        });
        await page.getByRole('button', { name: 'Continue' }).click();

        // The same faces describe difficulty, rather than agreement.
        await expect(
            page.getByRole('heading', { name: /Ease of use/ }),
        ).toBeFocused();
        const navigation = page.getByRole('radiogroup', {
            name: 'Navigation around the website',
        });
        await navigation
            .getByRole('radio', {
                name: 'Neither difficult nor easy',
                exact: true,
            })
            .check();
        await expect(
            navigation.getByRole('radio', {
                name: 'Neither difficult nor easy',
                exact: true,
            }),
        ).toHaveValue('3');
        await fitsWidth(page);
        await page.getByRole('button', { name: 'Continue' }).click();

        // The sender's details: region first, then its institutions.
        await expect(
            page.getByText('Please provide us with your details (optional)'),
        ).toBeVisible();
        const institution = page.getByRole('combobox', {
            name: 'Higher education institution',
        });
        await expect(institution).toBeDisabled();
        await page.getByRole('combobox', { name: 'Region' }).click();
        await page.getByRole('option', { name: 'Regional Office XII' }).click();
        await institution.click();
        await page.getByRole('option', { name: 'Browser Test HEI' }).click();
        await expect(institution).toContainText('Browser Test HEI');
        await page.getByLabel('Name').fill('Browser Feedback Sender');
        await fitsWidth(page);

        // Back to the first step from the progress bar, and forward again.
        await page
            .getByRole('button', { name: 'Your feedback, step 1, done' })
            .click();
        await expect(
            page.getByRole('textbox', { name: 'Feedback', exact: true }),
        ).toHaveValue('The export button on the reports page does nothing.');
        await page
            .getByRole('button', { name: 'Your details, step 4' })
            .click();
        await expect(page.getByLabel('Name')).toHaveValue(
            'Browser Feedback Sender',
        );

        const submission = page.waitForRequest(
            (request) =>
                new URL(request.url()).pathname === '/feedback' &&
                request.method() === 'POST',
        );
        await page.getByRole('button', { name: 'Send feedback' }).click();
        const submitted = (await submission).postDataJSON();
        expect(submitted.terms_consistent).toBe('4');
        expect(submitted.navigation_ease).toBe('3');
        expect(submitted.prompts_clear).toBe('');
        const thanks = page.getByRole('heading', {
            name: 'Thank you for your feedback.',
        });
        await expect(thanks).toBeFocused();
        await fitsWidth(page);
        expect(errors).toEqual([]);
    });
}

for (const colorScheme of ['light', 'dark'] as const) {
    test(`the feedback form meets WCAG AA in ${colorScheme} mode`, async ({
        page,
    }, testInfo) => {
        await page.emulateMedia({ colorScheme });
        await page.goto('/feedback');
        await page.getByRole('radio', { name: 'Feature Request' }).check();
        await noViolations(page);
        await page.screenshot({
            path: testInfo.outputPath(`feedback-${colorScheme}.png`),
            fullPage: true,
        });

        await page
            .getByRole('textbox', { name: 'Feedback', exact: true })
            .fill('A calendar export.');
        await page.getByRole('button', { name: 'Continue' }).click();
        await page
            .getByRole('radiogroup', { name: 'Prompts for inputs are clear' })
            .getByRole('radio', { name: 'Neutral', exact: true })
            .check();
        await noViolations(page);
        await page.screenshot({
            path: testInfo.outputPath(`feedback-agreement-${colorScheme}.png`),
            fullPage: true,
        });

        // Scale answers remain optional, including the ease-of-use step.
        await page.getByRole('button', { name: 'Continue' }).click();
        await page
            .getByRole('radiogroup', { name: 'Navigation around the website' })
            .getByRole('radio', { name: 'Very Easy', exact: true })
            .check();
        await noViolations(page);
        await page.getByRole('button', { name: /^Clear/ }).click();
        await page.getByRole('button', { name: 'Continue' }).click();
        await noViolations(page);
        await page.getByRole('button', { name: 'Send feedback' }).click();
        await expect(
            page.getByRole('heading', { name: 'Thank you for your feedback.' }),
        ).toBeVisible();
        await noViolations(page);
    });
}

test('an admin reads the feedback under Public site → Feedback', async ({
    page,
}, testInfo) => {
    await page.goto('/feedback');
    await page.getByRole('radio', { name: 'Questions' }).check();
    await page
        .getByRole('textbox', { name: 'Feedback', exact: true })
        .fill('Where do I find the GAD agenda template?');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('radiogroup', {
            name: 'Use of terms throughout the system is consistent',
        })
        .getByRole('radio', { name: 'Agree', exact: true })
        .check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('radiogroup', { name: 'Navigation around the website' })
        .getByRole('radio', { name: 'Very Easy', exact: true })
        .check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Email').fill('asker@example.test');
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(
        page.getByRole('heading', { name: 'Thank you for your feedback.' }),
    ).toBeVisible();

    await logInAsAdmin(page);
    await page
        .getByRole('link', { name: 'Feedback', exact: true })
        .first()
        .click();
    await expect(page).toHaveURL(/\/admin\/feedback$/);
    await expect(
        page.getByRole('heading', { level: 1, name: 'Website feedback' }),
    ).toBeVisible();

    const row = page
        .getByRole('listitem')
        .filter({ hasText: 'Where do I find the GAD agenda template?' });
    await expect(row).toContainText('Questions');
    await expect(row).toContainText('asker@example.test');
    await row.getByRole('button', { name: /^Details/ }).click();
    await expect(row).toContainText(
        'Use of terms throughout the system is consistent',
    );
    const termsAnswer = row
        .locator('dt')
        .filter({ hasText: 'Use of terms throughout the system is consistent' })
        .locator('+ dd');
    await expect(termsAnswer).toHaveText('🙂Agree');
    const navigationAnswer = row
        .locator('dt')
        .filter({ hasText: 'Navigation around the website' })
        .locator('+ dd');
    await expect(navigationAnswer).toHaveText('😄Very Easy');
    await expect(
        row
            .locator('dt')
            .filter({ hasText: 'Prompts for inputs are clear' })
            .locator('+ dd'),
    ).toHaveText('Not answered');
    await expect(
        row.getByRole('link', { name: 'asker@example.test' }),
    ).toHaveAttribute('href', 'mailto:asker@example.test');

    // The type rows narrow the list.
    await page
        .getByRole('button', { name: /^Questions/, pressed: false })
        .click();
    await expect(page).toHaveURL(/type=question/);
    await expect(
        page.getByRole('button', { name: /^Questions/, pressed: true }),
    ).toBeVisible();

    await noViolations(page);
    await page.screenshot({
        path: testInfo.outputPath('feedback-admin.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 360, height: 900 });
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    await fitsWidth(page);
    await noViolations(page);
    await page.screenshot({
        path: testInfo.outputPath('feedback-admin-mobile-dark.png'),
        fullPage: true,
    });
});
