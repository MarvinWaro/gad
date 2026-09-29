import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

async function saved(page: Page) {
    await expect(page.getByText(/^All changes saved/)).toBeVisible({
        timeout: 15_000,
    });
}

/** Finalize, download the PDF for signing, and send it back as the signed copy. */
async function signAndSubmit(page: Page, pdfPath: string) {
    await page.getByRole('button', { name: 'Finalize for signing' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Finalize for signing' }).click();
    await expect(
        page.getByRole('heading', { name: 'Print and sign' }),
    ).toBeVisible();
    const code = await page
        .getByText(/^[0-9A-F]{4}-[0-9A-F]{4}$/)
        .first()
        .textContent();
    expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);

    const download = page.waitForEvent('download');
    await page
        .getByRole('button', { name: 'Download PDF for signing' })
        .click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
        /^GAD-Monitoring-Report_Browser-Test-HEI_\d{4}-\d{4}_S[12]_Rev\d\.pdf$/,
    );
    await file.saveAs(pdfPath);
    const bytes = await readFile(pdfPath);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');

    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await page
        .getByRole('checkbox', { name: /This PDF is signed by the President/ })
        .check();
    await page.getByRole('button', { name: 'Submit to CHED' }).click();
    await expect(
        page.getByRole('heading', { name: 'Submitted to CHED' }),
    ).toBeVisible();

    return code;
}

test('HEI fills in, signs and submits a report; CHED returns it, then reviews the correction', async ({
    page,
    browser,
}, testInfo) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (error) =>
        errors.push(`${page.url()}: ${error.message}`),
    );
    await login(page, 'browser-monitoring@example.test');
    await page
        .getByRole('link', { name: 'Monitoring Report', exact: true })
        .first()
        .click();
    await expect(
        page.getByRole('heading', { name: 'Your GAD work, on record.' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Continue to report' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'GAD monitoring report',
    );
    // The HEI Home feed's InfiniteScroll emits a scroll-prop error when an
    // Inertia visit leaves Home. Track errors from the report workflow onward.
    errors.length = 0;
    const reportUrl = page.url();

    // Twenty answers, labelled as the official form numbers them.
    await expect(page.locator('textarea[id^="field-answers-"]')).toHaveCount(
        20,
    );
    await expect(
        page.getByLabel(/a\. Hiring of administrators\/faculty\/personnel/),
    ).toBeVisible();
    await expect(page.getByLabel(/b\. Admission of students/)).toBeVisible();
    await expect(
        page.getByLabel(/a\. Programs for PWDs, Senior Citizens/),
    ).toBeVisible();
    const sections = page.getByRole('navigation', { name: 'Report sections' });
    for (const name of [
        /^7\) GAD Corner/,
        /^8\) Breastfeeding area/,
        /^10\) Sex-Disaggregated/,
        /^12\. Support to Gender/,
    ]) {
        await expect(sections.getByRole('link', { name })).toBeVisible();
    }

    // Answers save as they are typed, and are there after a reload.
    const narrative = 'Fictional institutional narrative. '.repeat(70).trim();
    await page.getByLabel('Address', { exact: true }).fill('Fictional campus');
    await page.getByLabel(/Membership composition/).fill(narrative);
    await page
        .getByLabel(/Breastfeeding area: Status of compliance/)
        .fill('Fictional facility narrative.');
    await page
        .getByLabel(/a\. Hiring of administrators/)
        .fill('Fictional hiring practices.');
    await page
        .getByLabel('President', { exact: true })
        .fill('Fictional President');
    await page
        .getByLabel('GAD Focal Person', { exact: true })
        .fill('Fictional Focal Person');
    await saved(page);
    await expect(page.getByText('3 of 20 answered')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/Membership composition/)).toHaveValue(
        narrative,
    );

    // Leaving saves first, and Back shows the saved answers.
    await page
        .getByLabel(/Breastfeeding area: Status of compliance/)
        .fill('Fictional facility, now with a lactation room.');
    await page.getByRole('link', { name: 'Records', exact: true }).click();
    await expect(page).toHaveURL(/\/records$/);
    await page.goBack();
    await expect(
        page.getByLabel(/Breastfeeding area: Status of compliance/),
    ).toHaveValue('Fictional facility, now with a lactation room.');

    const cornerLink = sections.getByRole('link', { name: /^7\) GAD Corner/ });
    await cornerLink.click();
    await expect(cornerLink).toHaveAttribute('aria-current', 'location');

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
            await page.setViewportSize({ width, height: 1000 });
            await page.evaluate(() => window.scrollTo(0, 0));
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth,
                ),
            ).toBe(true);
            await page.screenshot({
                path: testInfo.outputPath(`monitoring-${theme}-${width}.png`),
            });
        }
        expect(
            (
                await new AxeBuilder({ page })
                    .include('main')
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .analyze()
            ).violations,
        ).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );
    await page.setViewportSize({ width: 1440, height: 1000 });

    // Blank requirements are listed before finalizing, and can be skipped.
    await page.getByRole('button', { name: 'Finalize for signing' }).click();
    await expect(
        page.getByText(/17 of 20 requirements are blank/),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();

    const firstCode = await signAndSubmit(
        page,
        testInfo.outputPath('monitoring-report.pdf'),
    );
    await expect(page.getByText(firstCode ?? '').first()).toBeVisible();
    await page.screenshot({
        path: testInfo.outputPath('monitoring-submitted.png'),
        fullPage: true,
    });

    // CHED returns it with a note.
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await login(admin, 'browser-admin@example.test');
    await admin.getByRole('link', { name: 'Monitoring', exact: true }).click();
    await admin.getByRole('link', { name: /^Review/ }).click();
    await expect(admin.getByTitle('Signed copy, revision 1')).toBeVisible();
    await admin.screenshot({
        path: testInfo.outputPath('monitoring-review-1440.png'),
    });
    await admin.getByRole('button', { name: 'Return for correction' }).click();
    await admin
        .getByLabel('What should the HEI correct?')
        .fill('Please include the training dates.');
    await admin.getByRole('button', { name: 'Return to the HEI' }).click();
    await expect(admin.getByText('Not submitted yet')).toBeVisible();

    // The HEI corrects revision 2 and sends a new signed copy.
    await page.goto(reportUrl);
    await expect(
        page.getByRole('heading', { name: 'Returned for correction' }),
    ).toBeVisible();
    await expect(
        page.getByText('Please include the training dates.'),
    ).toBeVisible();
    await page
        .getByLabel(/Membership composition/)
        .fill('Training completed on September 10, 2026.');
    await saved(page);
    const secondCode = await signAndSubmit(
        page,
        testInfo.outputPath('monitoring-report-revision-2.pdf'),
    );
    expect(secondCode).not.toBe(firstCode);

    // CHED marks the correction reviewed.
    await admin.reload();
    await admin.getByRole('button', { name: 'Mark as reviewed' }).click();
    await admin
        .getByRole('dialog')
        .getByRole('button', { name: 'Mark as reviewed' })
        .click();
    await expect(
        admin.getByText('Reviewed', { exact: true }).first(),
    ).toBeVisible();

    // Records show the outcome; History keeps the first submission as it was.
    await page.goto('/records');
    await expect(
        page.getByRole('listitem').getByText('Reviewed', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: /^View/ }).click();
    await page
        .getByLabel('History', { exact: true })
        .selectOption({ index: 1 });
    await expect(page.getByText(narrative)).toBeVisible();

    expect(errors).toEqual([]);
    await adminContext.close();
});
