# Event certificates

People checked in at a GAD event (`docs/event-check-in.md`) get a soft-copy certificate. Their office designs it, uses it on the event and releases it. People are notified and download a PDF from **Settings → My certificates**, and anyone can check a certificate's number on the public verify page. This is the fourth step of event registration by QR, after the Virtual ID, the scanner and (still to come) Join.

## Who does what

- **The permissions** are in the Certificates group:
    - `certificates.view`, `certificates.create`, `certificates.update` and `certificates.delete`, for designs and signatories
    - `certificates.release`, for using a design on an event, releasing, updating and withdrawing
- **Who holds them:** Administrator and CHED Focal. `RbacSeeder` gives them on a fresh install; `2026_10_21_000004_let_offices_give_event_certificates` gives them on an existing one.
- **Scope follows place.**
    - A signatory and a design belong to one regional office, or to the Central Office (no region).
    - A CHED Focal works on their own region's; national staff work on all of them.
    - An event uses only its own office's designs: a region's events take that region's designs, and every-region events take the Central Office's (`ManageEventCertificate::attach`). So a design only ever prints its own office's signatories.
    - Releasing follows the event's office (`GadEventCertificatePolicy::release`). Deadlines give no certificates.
- **Where staff find it:** Settings → Events → Certificates and Signatories. Everyone has Settings → Account → My certificates.

## Signatories

Settings → Signatories (`settings/certificate-signatories`, `ManageSignatory`).

- **Fields:** a name and position, as certificates print them, and an e-signature: a PNG or JPG, 300 × 80 to 4000 × 4000 px, under 2 MB, on a white or transparent background.
- **Consent:** uploading a signature needs the box "The signatory allowed this e-signature to be used on PHLGADIS certificates", and every upload is logged.
- **Kept privately:**
    - Files sit on the private `certificates` disk (Spaces `…/certificate-files` in production).
    - They are handed out only through signed links that work for two hours (`CertificateFiles::url`, `CertificateFileController`). Only staff of the office see them, and only holders of a released certificate get them inside its data.
    - They never appear on the verify page.
- **Changes:**
    - A new signature never deletes the old file, which released certificates may still print.
    - A signatory on a design can't be removed or moved to another office until they are taken off it.
    - Removing one is a soft delete: released certificates keep naming them.

What protects signatures is this privacy and the verify QR. Anyone can screenshot any certificate, wherever its PDF is made.

## Designs

Settings → Certificates (`settings/certificates`, `ManageCertificateDesign`).

- **Kind** (`CertificateKind`):
    - **Certificate of Participation:** "is presented to".
    - **Certificate of Appearance:** "This is to certify that".
    - Speakers' certificates stay with the office.
    - An event gives at most one design of each kind.
- **Background:** one of three fixed designs, drawn as vectors in `lib/certificate-page.ts` in the `paper` tokens: Classic frame, Flow (the Virtual ID's shapes) and Side band. The middle and the signatories' row stay plain.
- **Wording:** up to 400 characters, printed after the lead, the name and the institution. It may use these blanks, and any other is refused:

| Blank        | Prints                                                                |
| ------------ | --------------------------------------------------------------------- |
| `{event}`    | The event's title, in bold                                            |
| `{dates}`    | The event's dates, such as "October 14–16, 2026"                      |
| `{days}`     | The days the person was checked in, such as "October 14 and 16, 2026" |
| `{venue}`    | The event's location                                                  |
| `{released}` | The day it was given, as "15th day of October 2026"                   |

- **Default wording:** each kind starts with its own (`CertificateKind::defaultBody`). It is ours, not an official text; give the office's standard wording to make it the default.
- **Logos:** the CHED seal and Bagong Pilipinas are always printed, as on the Monitoring letterhead. Up to three extra logos (PNG or JPG, under 1 MB), such as a partner HEI's, sit between them.
- **Letterhead:** "Republic of the Philippines", the Office of the President and CHED lines, then the office's own name and city from Settings → Regions. The Central Office prints the national lines only.
- **Signatories:** one to three of the design's own office, left to right in the order chosen. The layout places one, two or three automatically in a fixed row.
- **The editor** shows a live preview: the real PDF with a sample name and event, drawn by pdf.js a moment after each change, plus "Download sample PDF".
- **Locks:** once used on an event a design keeps its kind and office. Once released it can't be deleted. "Duplicate" makes a copy to change, such as for the other kind or a new director.

## Releasing

From the design's "Used on events", or "Use on an event", staff open the event's release page (`settings/event-certificates/{id}`, `ManageEventCertificate`).

- **Who gets one:** everyone checked in on at least one of the event's days. This rule lives in one place, `GadEventCertificate::eligibleUsers()`, until the GAD Secretariat settles it.
- **Release certificates** is never automatic. It is refused when no one is checked in, when the design has no signatory, or when the wording uses `{venue}` and the event has none.
- **What a release keeps:** the first release writes `gad_event_certificates.snapshot`, which holds:
    - the design: its kind, background, wording, logos and signatories with their signature files
    - the office's letterhead lines
    - the event's title, dates and venue

    Later changes to the design, a signatory or the event never rewrite certificates already given. A change of director starts a new design.

- **Each certificate** (`certificates`) gets:
    - a random number, `CERT-XXXX-XXXX` in the participant code's alphabet (`CertificateNumber`)
    - the person's name, affiliation, region and HEI as they were
- **Notices:** each person is notified ("released your Certificate of Participation for …", `NotificationKind::CertificateReleased`). The notices are written at once; no queue worker is needed.
- **Release to N more:** people checked in after the release get theirs with this button, and only they are notified.
- **Update released certificates:** for corrections, such as a misspelt name or event title. It writes the snapshot again from the design and event as they are now, and refreshes each holder's name and affiliation from their account.
- **Withdraw:** a certificate given by mistake, such as from a wrong check-in. It leaves the person's list, and its verify page says it was withdrawn. It can be restored.
- **Removing:** a design can be taken off an event before release only. An event with released certificates can't be deleted, so their verify pages keep working.
- **The list:** the people given it, searchable by name or number and filterable by region and HEI, 20 a page. Staff can download anyone's PDF to print on request.

## The PDF

Made in the browser with the app's pdfmake loader, like the Monitoring report and the Virtual ID:

- `lib/certificate-pdf.ts` lays it out.
- `lib/certificate-page.ts` holds the page and its backgrounds, and `lib/certificate-text.ts` the words.
- `lib/certificate-pdf-download.ts` loads the pictures and saves the file or draws the preview.

What the PDF prints:

- **Page:** A4 landscape (841.89 × 595.28 pt), with fonts TeX Gyre Bonum (letterhead, title, name and wording) and Liberation Sans Narrow (the number).
- **The name** is always in capitals (`Certificate::printedName`, the one place this rule lives), shrunk to stay on one line.
- **The verify block**, at the bottom right: "Certificate no. …", the address, and a QR (level M) that opens `/verify/{number}`.
- **Its data** comes from `GET /certificates/{certificate}/document` (`CertificateDocumentResource`), for the holder or the office's staff. Each download is logged.
- **File name:** `PHLGADIS-Certificate-{number}.pdf`.

## Verifying

`/verify` and `/verify/{number}` (`CertificateVerificationController`) are public, throttled to 30 a minute, and kept out of search engines (`X-Robots-Tag` and a robots meta).

- **Numbers typed loosely still match,** like participant codes: any case, spaces, and I, L and O.
- **For a genuine certificate,** it shows:
    - whether it stands or was withdrawn
    - the kind, the name in capitals and the affiliation
    - the event, its dates and venue
    - the office that gave it and the day it was released
- **Never shown:** an email, an account or a participant code.
- **Numbers are random,** so the page can't be walked through.

## Logged

ActivityModule `certificates` covers:

- signatories and designs created, updated and deleted
- a design used on or taken off an event
- a release, with how many were given
- an update of released certificates
- a certificate withdrawn or restored (`Withdrawn`, `Restored`)
- each download (`Downloaded`)

Entries are filed under the region, or for a certificate, the holder's place.

## API-ready

The rules are in actions any `/api/v1` can call:

- `ManageSignatory`, `ManageCertificateDesign` and `ManageEventCertificate`

Each shape has one resource:

- `CertificateSignatoryResource` and `CertificateDesignResource`
- `EventCertificateResource` and `CertificateHolderResource`
- `MyCertificateResource`, `CertificateDocumentResource` and `CertificateVerificationResource`

Records are ULIDs, and kinds are fixed codes (`participation`, `appearance`).

## Tests

- `tests/Feature/Certificates/` covers signatories, designs, release, My certificates and verify.
- `tests/Unit/CertificateNumberTest.php`
- `tests/frontend/certificates.test.ts` covers the date phrases, the blanks, the layout and the backgrounds.
- `tests/browser/certificates.spec.ts` covers the whole flow, a download, verifying, and both themes at 375 and 1440 px. Its fixtures in `tests/browser/server.php` are "Fixture Certificate Workshop" and its participant.

## Not built yet

- Speakers' and other kinds of certificate.
- Requiring every day of a multi-day event, if the GAD Secretariat decides so (change `eligibleUsers()`).
- Join: once it exists, decide whether only those who joined get certificates.
- A downloadable list of everyone given an event's certificate.
