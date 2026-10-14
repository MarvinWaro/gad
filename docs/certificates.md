# Event certificates

People checked in at a GAD event (`docs/event-check-in.md`) on every one of its days get a soft-copy certificate. Their office designs it and uses it on the event, and it goes out by itself when the event ends. People are notified and download a PDF from **Settings → My certificates**, to print at home or school, and anyone can check a certificate's number on the public verify page. Someone who missed a day asks for one; guests without an account get theirs from staff. This is the fourth step of event registration by QR, after the Virtual ID, Join (`docs/event-registration.md`) and the scanner.

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

- **Fields:** a name and position, as certificates print them, and an e-signature: a PNG or JPG under 5 MB, from 100 × 30 to 8000 × 8000 px, kept loose so a phone photo or a scan goes through. A white or transparent background prints best.
- **Consent:** uploading a signature needs the box "The signatory allowed this e-signature to be used on PHLGADIS certificates", and every upload is logged.
- **Kept privately:**
    - Files sit on the private `certificates` disk (Spaces `…/certificate-files` in production).
    - They are handed out only through signed links that work for two hours (`CertificateFiles::url`, `CertificateFileController`). Only staff of the office see them, and only holders of a released certificate get them inside its data.
    - They never appear on the verify page.
- **A file gone from storage** (such as a removed bucket) is a 404, not a server error, and the storage error is logged.
    - The editor's preview is still drawn without it, and names what is missing (the e-signature of whom, or which extra logo). The signatory's tile says "Signature not found. Upload it again."
    - No certificate is downloaded without it. The download is refused and names what is missing (`MissingPicturesError` in `lib/certificate-pdf-download.ts`).
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
- **Pairs** (decided on 2026-10-14): a design makes its pair of the other kind with **Make its Certificate of …** (`ManageCertificateDesign::pair`, `certificate_designs.paired_with_id`, kept once on the one made from the other). The pair starts with the same office, background, logos and signatories and that kind's own wording, and each is edited on its own. Using either on an event puts both on it, unless the event gives that kind already (`ManageEventCertificate::attachWithPair`); taking one off before release takes its pair too. A design has at most one pair.

## Releasing

From the design's "Used on events", or "Use on an event", staff open the event's release page (`settings/event-certificates/{id}`, `ManageEventCertificate`).

- **Who gets one** (decided on 2026-10-14): everyone on the event's list (`docs/event-registration.md`) who was checked in on **every** one of its days, and the event's guests marked on every day. The rule lives in one place, `GadEventCertificate::eligibleUsers()` and `eligibleGuests()`, counted in SQL. The design page still counts who came at all (`earningCheckIns()`).
- **It goes out by itself when the event ends** (`certificates:release-due`, scheduled every minute; the server's scheduler must run). Each run gives it to everyone who earned it and doesn't hold it yet, so days marked from the paper sheet later still reach people. It skips a cancelled event, a deadline, a certificate that can't print (no signatory, or `{venue}` without a venue; the release page says why), and events that ended over 30 days ago (`ReleaseDueCertificates::RECENT_DAYS`), which wait for staff.
- **Release now:** staff may release before the event ends, and the release page keeps **Release to N more**. Either releases every kind the event gives at once, such as its Participation and Appearance (`ManageEventCertificate::releaseTogether`). A release is refused when no one has been present on every day, any of them can't print, or the event was cancelled.
- **What a release keeps:** the first release writes `gad_event_certificates.snapshot`, which holds:
    - the design: its kind, background, wording, logos and signatories with their signature files
    - the office's letterhead lines
    - the event's title, dates and venue

    Later changes to the design, a signatory or the event never rewrite certificates already given. A change of director starts a new design.

- **Each certificate** (`certificates`) gets:
    - a random number, `CERT-XXXX-XXXX` in the participant code's alphabet (`CertificateNumber`)
    - the person's name, affiliation, region and HEI as they were
- **Notices:** each person with an account is notified. A staff release says "released your Certificate of Participation for …" (`NotificationKind::CertificateReleased`); the automatic one speaks to them, "Your … is ready" (`CertificateReady`). The notices are written at once; no queue worker is needed.
- **Release to N more:** people who earned it after the release get theirs, and only they are notified.

## Requests from people who missed a day

Decided on 2026-10-14: a multi-day event's certificate goes to people present every day, and someone who came for part of it asks for one (`ManageCertificateRequest`, `certificate_requests`).

- **Who may ask:** someone checked in on at least one day who doesn't hold that certificate, once it went out, at an event that wasn't cancelled. Once per certificate: they pick the kind (Participation or Appearance, whichever the event gives) and say why, up to 500 characters. They ask from the event's page.
- **Who answers:** the staff who release the event's certificates (the CHED Focal of its region and the Admin), told by a notice (`CertificateRequested`). The release page lists requests, waiting ones first, with each person's days and reason.
- **Approve** gives them the certificate (`ManageEventCertificate::issueTo`) and tells them it was released. **Decline** tells them, with the office's note if it wrote one (`CertificateRequestDeclined`). Either is final.

## Guests

A guest without an account (`docs/event-registration.md`) marked on every day gets the certificate like anyone, with their name and organization as its holder. Staff give it by hand to a guest who missed a day, as guests can't ask. A guest's certificate has no account (`certificates.user_id` null, `gad_event_guest_id` set); only staff download it, to hand over or send, and its verify page works like any.

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
- **The verify block**, at the bottom right: "Certificate no. …", the address, and a QR that opens `/verify/{number}`.
    - **The QR** is 72 pt square (about 25 mm), with a four-module quiet zone, at level M (about 15% damage, as on a photocopy or a phone screen).
    - **Its modules come from the server** (`CertificateNumber::qrRows`, through the app's one encoder, `App\Support\QrCode`, which the Virtual ID uses too). The PDF draws them as one vector path (`qrSvg` in `lib/certificate-page.ts`), so the QR is sharp at any zoom, without seams between modules.
    - The editor's sample prints the same way, with `CertificateNumber::SAMPLE`.
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
- a release, with how many were given, by staff or by the System
- a request asked for, approved or declined (`Requested`, `Approved`, `Declined`)
- an update of released certificates
- a certificate withdrawn or restored (`Withdrawn`, `Restored`)
- each download (`Downloaded`)

Entries are filed under the region, or for a certificate, the holder's place.

## API-ready

The rules are in actions any `/api/v1` can call:

- `ManageSignatory`, `ManageCertificateDesign`, `ManageEventCertificate` and `ManageCertificateRequest`

Each shape has one resource:

- `CertificateSignatoryResource` and `CertificateDesignResource`
- `EventCertificateResource`, `CertificateHolderResource` (with `guest`) and `CertificateRequestResource`
- `MyCertificateResource`, `CertificateDocumentResource` and `CertificateVerificationResource`

Records are ULIDs, and kinds are fixed codes (`participation`, `appearance`).

## Tests

- `tests/Feature/Certificates/` covers signatories, designs, release, the automatic release (`AutoReleaseTest`), requests (`CertificateRequestTest`), My certificates and verify. Guests' certificates are in `tests/Feature/Admin/EventListKeepingTest.php`.
- `tests/Unit/CertificateNumberTest.php`
- `tests/frontend/certificates.test.ts` covers the date phrases, the blanks, the layout and the backgrounds.
- `tests/browser/certificates.spec.ts` covers the whole flow, a download, verifying, and both themes at 375 and 1440 px. Its fixtures in `tests/browser/server.php` are "Fixture Certificate Workshop" and its participant.

## Not built yet

- Speakers' and other kinds of certificate.
- A downloadable list of everyone given an event's certificate.
- Sending a guest's certificate to them from PHLGADIS.
