import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

const pdf = {
    name: 'fictional-signed-report.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF',
    ),
};

test('HEI completes monitoring, CHED returns it, and a signed revision is reviewed', async ({
    page,
    browser,
}, testInfo) => {
    test.setTimeout(180_000);
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
    await page.getByLabel('Academic year', { exact: true }).fill('2026-2027');
    await page.getByRole('button', { name: 'Continue to report' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Monitoring report',
    );
    // The HEI Home feed's InfiniteScroll emits a scroll-prop error when an
    // Inertia visit leaves Home. Track errors from the report workflow onward.
    errors.length = 0;
    const reportUrl = page.url();
    await page
        .getByLabel('Address', { exact: true })
        .fill('Fictional campus address');
    await page.getByRole('link', { name: 'Records', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await page.getByLabel('Date Accomplished').fill('2026-09-29');
    await expect(page.locator('textarea[id]:not(#address)')).toHaveCount(20);
    await expect(
        page.getByLabel('a. Hiring of administrators/faculty/personnel'),
    ).toBeVisible();
    await expect(page.getByLabel('b. Admission of students')).toBeVisible();
    await expect(
        page.getByLabel(/a\. Programs for PWDs, Senior Citizens/),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /^7\. GAD Corner/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /^8\. Breastfeeding area/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /^9\. Child-minding area/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /^10\. Sex-Disaggregated/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /^12\. Support to Gender/ }),
    ).toBeVisible();
    await expect(page.getByText('7. Facilities')).toHaveCount(0);
    await page
        .getByLabel('Membership composition', { exact: false })
        .fill('Fictional institutional narrative. '.repeat(70));
    await page
        .getByLabel('Breastfeeding area: actual situation')
        .fill('Fictional facility narrative.');
    await page
        .getByLabel('a. Hiring of administrators/faculty/personnel')
        .fill('Fictional hiring practices.');
    await page
        .getByLabel('President', { exact: true })
        .fill('Fictional President');
    await page
        .getByLabel('GAD Focal Person', { exact: true })
        .fill('Fictional Focal Person');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByText(/^Saved /)).toBeVisible();
    await expect(page.getByText(/3 of 20 responses entered/)).toBeVisible();
    const sections = page.getByRole('navigation', { name: 'Report sections' });
    const cornerLink = sections.getByRole('link', { name: /^7\. GAD Corner/ });
    await cornerLink.click();
    await expect(cornerLink).toHaveAttribute('aria-current', 'location');
    await page
        .locator('#section-data')
        .evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await expect(
        sections.getByRole('link', { name: /^10\. Sex-Disaggregated/ }),
    ).toHaveAttribute('aria-current', 'location');
    const signatureLink = sections.getByRole('link', {
        name: 'Signatories & submission',
    });
    await signatureLink.focus();
    await page.keyboard.press('Enter');
    await expect(signatureLink).toHaveAttribute('aria-current', 'location');
    await page.locator('#signed-pdf').scrollIntoViewIfNeeded();
    await expect(signatureLink).toHaveAttribute('aria-current', 'location');
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
                fullPage: false,
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
    await page.setViewportSize({ width: 375, height: 800 });
    const mobileLink = sections.getByRole('link', {
        name: /^12\. Support to Gender/,
    });
    await mobileLink.click();
    await expect(mobileLink).toHaveAttribute('aria-current', 'location');
    const navGeometry = await mobileLink.evaluate((link) => {
        const bounds = link.getBoundingClientRect();
        const navBounds = link.parentElement!.getBoundingClientRect();
        return {
            left: bounds.left,
            right: bounds.right,
            navLeft: navBounds.left,
            navRight: navBounds.right,
            navTop: navBounds.top,
            scrollLeft: link.parentElement!.scrollLeft,
        };
    });
    expect(navGeometry.left).toBeGreaterThanOrEqual(navGeometry.navLeft - 1);
    expect(navGeometry.right).toBeLessThanOrEqual(navGeometry.navRight + 1);
    expect(navGeometry.navTop).toBeGreaterThanOrEqual(60);
    expect(navGeometry.navTop).toBeLessThan(120);
    const sectionTop = await page
        .locator('#section-gedsi')
        .evaluate((element) => element.getBoundingClientRect().top);
    const navBottom = await sections.evaluate(
        (element) => element.getBoundingClientRect().bottom,
    );
    expect(sectionTop).toBeGreaterThanOrEqual(navBottom - 1);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const popup = page.waitForEvent('popup');
    await page.getByRole('link', { name: /Print \/ Save PDF/ }).click();
    const printPage = await popup;
    await expect(printPage.getByRole('heading', { level: 1 })).toHaveText(
        'Compliance to CMO No. 01, s. 2015',
    );
    await printPage.emulateMedia({ media: 'print' });
    await expect(
        printPage.getByRole('button', { name: 'Print / Save PDF' }),
    ).toBeHidden();
    await expect(
        printPage.getByRole('rowheader', { name: /^7\) GAD Corner/ }),
    ).toBeVisible();
    await expect(
        printPage.getByRole('rowheader', { name: /^8\) Breastfeeding area/ }),
    ).toBeVisible();
    await expect(
        printPage.getByRole('rowheader', { name: /^9\) Child-minding area/ }),
    ).toBeVisible();
    await expect(
        printPage.getByText('a. Hiring of administrators/faculty/personnel'),
    ).toBeVisible();
    await expect(printPage.getByText('b. Admission of students')).toBeVisible();
    await expect(
        printPage.getByText(/a\. Programs for PWDs, Senior Citizens/),
    ).toBeVisible();
    await printPage.screenshot({
        path: testInfo.outputPath('monitoring-print-preview.png'),
        fullPage: true,
    });
    await printPage.pdf({
        path: testInfo.outputPath('monitoring-long-answers.pdf'),
        format: 'A4',
    });
    await printPage.close();
    const confirmation = page.getByRole('checkbox', {
        name: /I confirm that this PDF/,
    });
    const submit = page.getByRole('button', { name: 'Submit for review' });
    await confirmation.check();
    await expect(confirmation).toBeChecked();
    await expect(submit).toBeDisabled();
    await page
        .getByLabel('Upload signed PDF', { exact: true })
        .setInputFiles(pdf);
    await expect(confirmation).toBeChecked();
    await page.getByRole('button', { name: 'Attach PDF' }).click();
    await expect(
        page.getByRole('link', { name: /fictional-signed-report.pdf/ }),
    ).toBeVisible();
    await page
        .getByLabel('Replace signed PDF', { exact: true })
        .setInputFiles(pdf);
    await expect(confirmation).not.toBeChecked();
    await expect(submit).toBeDisabled();
    await page.getByRole('button', { name: 'Attach PDF' }).click();
    await confirmation.check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByRole('button', { name: 'Save draft' })).toHaveCount(
        0,
    );
    await expect(page.getByText('Submitted', { exact: true })).toBeVisible();

    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await login(admin, 'browser-admin@example.test');
    await admin
        .getByRole('link', { name: 'Monitoring Reports', exact: true })
        .click();
    await admin.getByRole('link', { name: 'View report', exact: true }).click();
    await admin
        .getByLabel('Decision', { exact: true })
        .selectOption('returned');
    await admin
        .getByLabel('Correction notes (required)')
        .fill('Please include the training dates.');
    await admin.getByRole('button', { name: 'Save review decision' }).click();
    await expect(
        admin.getByRole('heading', { name: 'Returned for correction' }),
    ).toBeVisible();

    await page.goto(reportUrl);
    await expect(
        page.getByText('Please include the training dates.'),
    ).toBeVisible();
    await page
        .locator('#gfps-membership')
        .fill('Training completed on September 10, 2026.');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText(/^Saved /)).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Attach PDF' }),
    ).toBeDisabled();
    await confirmation.check();
    await expect(confirmation).toBeChecked();
    await page
        .getByLabel('Upload signed PDF', { exact: true })
        .setInputFiles(pdf);
    await expect(
        page.getByRole('button', { name: 'Attach PDF' }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Attach PDF' }).click();
    await expect(
        page.getByRole('link', { name: /fictional-signed-report.pdf/ }),
    ).toBeVisible();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByText('Submitted', { exact: true })).toBeVisible();
    await admin.reload();
    await admin.getByRole('button', { name: 'Save review decision' }).click();
    await expect(
        admin.getByText('Reviewed', { exact: true }).first(),
    ).toBeVisible();
    await page.goto('/records');
    await expect(
        page.getByRole('article').getByText('Reviewed', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'View report' }).click();
    await page
        .getByLabel('History', { exact: true })
        .selectOption({ label: 'Revision 1 · Submitted' });
    await expect(page.locator('#gfps-membership')).toHaveValue(
        'Fictional institutional narrative. '.repeat(70).trim(),
    );
    expect(errors).toEqual([]);
    await adminContext.close();
});

test('reviewer access is explicit and keyboard usable', async ({ page }) => {
    await login(page, 'browser-admin@example.test');
    await page.goto('/admin/monitoring/access');
    await expect(
        page.getByRole('heading', { name: 'Reviewer access' }),
    ).toBeVisible();
    const national = page.getByRole('checkbox', {
        name: 'National access — all regions',
    });
    await expect(national).not.toBeChecked();
    await national.focus();
    await page.keyboard.press('Space');
    await expect(national).toBeChecked();
    await page.getByRole('button', { name: 'Save access' }).click();
    await expect(
        page.getByRole('button', { name: 'Save access' }),
    ).toBeDisabled();
    await page.reload();
    await expect(national).toBeChecked();
    await national.uncheck();
    await page.getByRole('button', { name: 'Save access' }).click();
    await expect(
        page.getByRole('button', { name: 'Save access' }),
    ).toBeDisabled();
});
