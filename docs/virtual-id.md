# Virtual ID

Every account has a Virtual ID: a wallet-size card in **Settings → Virtual ID** (`/settings/virtual-id`) with its name, photo, institution or CHED office, and a participant code with its QR. It is the first step of event registration by QR. Staff will scan it to check people in at GAD events.

## The participant code

- **Format:** `GAD-` followed by two groups of four characters, such as `GAD-7K2M-Q9XA`. It is GAD, not CHED: the ID is for GAD events and most holders are HEI people, so it must not read like a CHED employee ID.
- **Alphabet:** the characters come from Crockford's base32 (`0–9` and `A–Z` without I, L, O and U). That leaves nothing that reads like 1, 0 or V when someone types it in.
- **Random:** eight random characters give 40 bits, about 1.1 trillion codes (`App\Support\ParticipantCode::generate()`). The code never contains or encodes the account's number or its public ULID. The ULID is visible in profile addresses, so a QR built from it could be made by anyone.
- **Permanent:** it doesn't change if the person changes their name, photo, HEI or region. The card always shows the current profile.
- **Storage:** `users.participant_code`, unique.
    - New accounts get one when they are created (`User::booted`).
    - The migration `2026_10_19_000000_add_participant_code_to_users_table` gave every existing account one.
    - The column is nullable for the same reason as `users.ulid`: NOT NULL would rebuild the users table on SQLite, and its cascading foreign keys would delete posts.
- **Private:** the code is hidden from every serialized user (`#[Hidden]` on `User`). It leaves the server only on its owner's own Virtual ID page (`VirtualIdResource`), never in `auth.user`, search, follower lists or posts.

## The QR

`ParticipantCode::qrRows()` encodes it on the server, with the library Fortify's two-factor setup already uses (`bacon/bacon-qr-code`), and sends its modules as one string of 0s and 1s per row. The card draws them in whole pixels, so the squares stay sharp. It is built to read easily on a phone screen at a busy table:

- **It holds only the code.** Thirteen characters of uppercase letters, digits and `-` encode in alphanumeric mode.
- **It's the smallest QR there is:** version 1, 21 × 21 modules. That holds even at error correction **Q**, which reads through about 25% glare or damage.
- **It's plain:** black on white, with a four-module quiet zone, and no logo in the middle.
- **A phone camera shows only the code,** nothing personal.

`tests/Feature/Settings/VirtualIdTest.php` checks the version and mode.

## The card

`components/virtual-id-card.tsx` shows it; `lib/virtual-id.ts` lays it out and paints it; `lib/virtual-id-render.ts` loads its pictures and saves it.

- **Wallet size.** It is ISO/IEC 7810 ID-1, the size of a bank card (53.98 × 85.60 mm, held upright, with 3.18 mm corners). Every size on it is a fraction of its width, so it keeps those proportions on any screen.
- **One painter.** A canvas draws the screen, the saved image and the PDF, so what is saved is what is shown. The canvas carries the name, place and code as its accessible name.
- **One printed design in either theme** (the `paper` and `mark-*` tokens):
    - Flowing shapes in GAD purple and the ⚥ icon's blue and pink fill the top-left corner and a wave along the foot.
    - Everything else sits on white: the logos (CHED seal, Bagong Pilipinas, the ⚥ icon), the photo, the name and place, and the QR with nothing behind it.
- **Long names fit:**
    - The name and the institution or office keep their size while they fit, then take two balanced lines, then a smaller size, never cut off.
    - A long name and place shrink the QR first, never below a size phones read easily, then the photo.
    - `tests/frontend/virtual-id.test.ts` covers this, and the browser test checks a 50-character name at 320 and 375 px.
- **The photo comes from this site.** `GET /settings/virtual-id/photo` (`virtual-id.photo`) streams the owner's own photo from storage, because a canvas can only save pictures from its own site. The live photos are in the Spaces bucket.

## Saving it

- **Save as image:** a PNG, 1080 × 1713 px (about 500 dpi on the card). PNG is lossless, so the QR's edges stay sharp, which a JPG would blur.
- **Download PDF:** one page exactly 53.98 × 85.60 mm, the card filling it, to print at actual size, cut out and keep in a wallet. It uses the app's one pdfmake loader (`loadPdfMake` in `monitoring-pdf-download.ts`).
- **File names:** both are named `PHLGADIS-Virtual-ID-{code}`.

## Not built yet

- Resetting a code whose screenshot leaked.
- Event registration and check-in: Join, the staff scanner, and certificates.
