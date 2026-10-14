import AxeBuilder from '@axe-core/playwright';
import {
    expect,
    test,
    type Browser,
    type Page,
    type TestInfo,
} from '@playwright/test';

/**
 * Event certificates (docs/certificates.md): a CHED Focal adds a signatory
 * with an e-signature, designs a certificate, uses it on an event and
 * releases it; the person checked in downloads theirs, and its number
 * checks out on the public verify page. The fixtures are in
 * tests/browser/server.php: "Fixture Certificate Workshop", which ended two
 * days ago, and the participant checked in to both of its days.
 */

/** A CHED Focal of Region XII. */
const STAFF = 'browser-quest-focal@example.test';
const ATTENDEE = 'fictional-certificate-participant@example.test';

async function logIn(browser: Browser, email: string): Promise<Page> {
    const page = await (await browser.newContext()).newPage();
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 20_000 });

    return page;
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
    await page.setViewportSize({ width: 1440, height: 900 });
}

/** A made-up signature, drawn as a PNG. */
async function signature(page: Page): Promise<Buffer> {
    const url = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 200;
        const context = canvas.getContext('2d')!;
        context.lineWidth = 6;
        context.lineCap = 'round';
        context.strokeStyle = '#1f2a6b';
        context.beginPath();
        context.moveTo(40, 140);
        context.bezierCurveTo(120, 20, 180, 190, 260, 90);
        context.bezierCurveTo(320, 20, 380, 170, 460, 80);
        context.lineTo(560, 120);
        context.stroke();

        return canvas.toDataURL('image/png');
    });

    return Buffer.from(url.split(',')[1], 'base64');
}

test('an office designs, releases and its certificate is downloaded and verified', async ({
    browser,
}, testInfo) => {
    test.setTimeout(240_000);
    const staff = await logIn(browser, STAFF);

    // A signatory, with the e-signature and the signatory's consent.
    await staff.goto('/settings/certificate-signatories');
    await staff.getByRole('button', { name: 'Add signatory' }).click();
    const signatoryDialog = staff.getByRole('dialog');
    await signatoryDialog
        .getByLabel('Name')
        .fill('Fictional Regional Director');
    await signatoryDialog.getByLabel('Position').fill('Regional Director');
    await signatoryDialog.locator('input[type="file"]').setInputFiles({
        name: 'signature.png',
        mimeType: 'image/png',
        buffer: await signature(staff),
    });
    await signatoryDialog.getByRole('checkbox').check();
    await signatoryDialog
        .getByRole('button', { name: 'Add signatory' })
        .click();
    await expect(signatoryDialog).toHaveCount(0);
    // Its e-signature loads through a signed link.
    const tile = staff.getByRole('img', {
        name: 'E-signature of Fictional Regional Director',
    });
    await expect(tile).toBeVisible();
    expect(
        await tile.evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBe(600);

    // A design, signed by them, with its preview drawn from the PDF.
    await staff.goto('/settings/certificates');
    await staff.getByRole('link', { name: 'New certificate' }).click();
    await staff
        .getByLabel('Name in your list')
        .fill('Fixture Workshop Certificate');
    // The background cards are labels over a radio each.
    await staff.getByText('Flow', { exact: true }).click();
    await expect(staff.getByLabel('Flow')).toBeChecked();
    await staff.getByLabel('Signatories').click();
    await staff
        .getByRole('option', {
            name: 'Fictional Regional Director, Regional Director',
        })
        .click();
    await staff.getByRole('button', { name: 'Create certificate' }).click();
    await expect(
        staff.getByRole('heading', { name: 'Fixture Workshop Certificate' }),
    ).toBeVisible();
    await expect(
        staff.getByRole('img', {
            name: /^Preview of the Certificate of Participation/,
        }),
    ).toBeVisible({ timeout: 30_000 });
    await checkBothThemes(staff, testInfo, 'certificate-editor');

    // An e-signature gone from storage: the preview is still drawn, without
    // it, and says so; a sample isn't made without it.
    await staff.route('**/certificate-files/signatures/**', (route) =>
        route.fulfill({ status: 404 }),
    );
    await staff.reload();
    await expect(
        staff.getByRole('img', {
            name: /^Preview of the Certificate of Participation/,
        }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
        staff.getByText(
            "The e-signature of Fictional Regional Director couldn't be loaded, so the preview leaves it out",
        ),
    ).toBeVisible();
    await staff.getByRole('button', { name: 'Download sample PDF' }).click();
    await expect(
        staff.getByText(/so the sample wasn’t made\. Upload it again\./),
    ).toBeVisible();
    await staff.unroute('**/certificate-files/signatures/**');
    await staff.reload();

    // Used on the workshop, then released to the one person checked in.
    await staff.getByRole('button', { name: 'Use on an event' }).click();
    const useDialog = staff.getByRole('dialog');
    await useDialog
        .getByLabel('Search events by title')
        .fill('Fixture Certificate');
    await useDialog.getByLabel(/Fixture Certificate Workshop/).check();
    await useDialog.getByRole('button', { name: 'Use on this event' }).click();
    await expect(staff).toHaveURL(/\/settings\/event-certificates\//);
    // It goes out by itself; the browser run has no scheduler, so staff release it now.
    await expect(
        staff.getByText(
            /goes out by itself within a minute to everyone present on every day: 1 person/,
        ),
    ).toBeVisible();

    await staff.getByRole('button', { name: 'Release now' }).click();
    await staff
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Release now' })
        .click();
    await expect(
        staff.getByText('Fictional Certificate Participant', { exact: true }),
    ).toBeVisible();
    const number = (
        await staff
            .getByText(/^No\. CERT-/)
            .first()
            .textContent()
    )?.replace('No. ', '');
    expect(number).toMatch(/^CERT-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

    const staffDownload = staff.waitForEvent('download');
    await staff
        .getByRole('button', {
            name: 'Download the certificate of Fictional Certificate Participant',
        })
        .click();
    expect((await staffDownload).suggestedFilename()).toBe(
        `PHLGADIS-Certificate-${number}.pdf`,
    );
    await checkBothThemes(staff, testInfo, 'certificate-release');

    // The person checked in finds it in My certificates, and downloads it.
    const attendee = await logIn(browser, ATTENDEE);
    await attendee.goto('/settings/my-certificates');
    await expect(
        attendee.getByText('Certificate of Participation'),
    ).toBeVisible();
    await expect(
        attendee
            .getByRole('region', { name: 'Certificates', exact: true })
            .getByText('Fixture Certificate Workshop'),
    ).toBeVisible();
    // The event they joined says it gave them one.
    await expect(
        attendee.getByRole('region', { name: 'Events you joined' }),
    ).toContainText('Certificate ready');
    const download = attendee.waitForEvent('download');
    await attendee
        .getByRole('button', { name: /^Download Certificate of Participation/ })
        .click();
    const file = await download;
    expect(file.suggestedFilename()).toBe(`PHLGADIS-Certificate-${number}.pdf`);
    const pdf = await file.createReadStream();
    let size = 0;
    for await (const chunk of pdf) {
        size += (chunk as Buffer).length;
    }
    expect(size).toBeGreaterThan(20_000);
    await checkBothThemes(attendee, testInfo, 'my-certificates');

    // Anyone with the number sees that it stands.
    const guest = await (await browser.newContext()).newPage();
    await guest.goto(`/verify/${number}`);
    await expect(guest.getByText('This certificate is genuine')).toBeVisible();
    await expect(
        guest.getByText('FICTIONAL CERTIFICATE PARTICIPANT'),
    ).toBeVisible();
    await expect(guest.getByText('Fixture Certificate Workshop')).toBeVisible();
    await checkBothThemes(guest, testInfo, 'certificate-verify');

    await guest.getByLabel('Certificate number').fill('CERT-0000-0000');
    await guest.getByRole('button', { name: 'Check' }).click();
    await expect(
        guest.getByText('No certificate has this number'),
    ).toBeVisible();
});
