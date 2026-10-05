# Website feedback

The old PHLGADIS footer asked "We value your feedback" and linked to a Google Form, "PHLGADIS Version 2 Website Feedback". Its answers never reached the system. The form is now a page of PHLGADIS: `/feedback`, linked from the homepage's "Share feedback" button and from the footer. Staff read the answers under **Public site → Feedback** (`/admin/feedback`).

## The questions

The questions, their options and their order are copied word for word from the live Google Form (https://docs.google.com/forms/d/e/1FAIpQLSf6t7CVv7m_DwRX6ZyDxvdpGYxFon2ETS9Oy_iBmHadChFvvg/viewform, read on 2026-10-02), including its capitals ("A little Confusing", "User Friendliness of the system").

- **Step 1, Your feedback:**
    - Feedback Type (required): Comments/Recommendations, Questions, Bug Reports or Feature Request.
    - Feedback (required).
    - Suggestions for improvement.
    - How difficult is reading characters on the screen? (four choices)
    - What is your opinion about organization of information on the screen? (four choices)
- **Step 2, Agreement:** "Please state your level of agreement for the following:" Five statements, each from 1 (Strongly Disagree) to 5 (Strongly Agree).
- **Step 3, Ease of use:** "How difficult are the following operations?" Three operations, each from 1 (Very Difficult) to 5 (Very Easy).
- **Step 4, Your details:** "Please provide us with your details (optional)": Email, Name, Region, and the institution.
    - The old form had a free-text Region; here it is picked from the active regions in the database.
    - The institution is new. It lists the chosen region's active HEIs.

Only the type and the feedback are required, as on the old form.

**Signed-in visitors** find their region and institution filled in (their HEI's, or their office's region). Their name and email are left blank, so sending them is their choice.

**The step names** ("Agreement", "Ease of use") are this system's, not the old form's.

**Scale presentation:** the five scores appear as native emoji faces (😞 🙁 😐 🙂 😄), from unhappy to happy, in both the form and staff's Details. Each face has a descriptive name for the question: Strongly Disagree / Disagree / Neutral / Agree / Strongly Agree, or Very Difficult / Difficult / Neither difficult nor easy / Easy / Very Easy. Hover and the selected-answer line show the words. Only the presentation changes: stored scores stay 1–5, averages and counts remain numeric, and CSV answers keep their existing wording. The four-choice reading and layout questions keep their original words.

**One definition.** The questions live in `App\Support\FeedbackQuestions`, and the types in `App\Enums\FeedbackType` (codes `comment`, `question`, `bug`, `feature`). The public page, the admin page, validation (`StoreSiteFeedbackRequest`) and the export all read them.

## What is stored

`site_feedback` holds:

- the type and the feedback
- the suggestions
- one nullable score per rated question
- the optional email and name
- the region and HEI

The HEI's cluster is kept with them, never asked of the visitor and never shown (`App\Actions\Feedback\SubmitSiteFeedback`).

No account, IP address or browser details are kept. Submissions are not written to the activity log, for the same reason as survey answers.

**Spam:** `POST /feedback` is limited to 5 an hour per address. It has its own limit (`RateLimiter::for('feedback')`), so answering the law surveys or rating the site never uses it up. A hidden `website` field catches bots: they are thanked, and nothing is stored.

## Who reads it

Three permissions, in the "Website feedback" group: `feedback.view`, `feedback.export` and `feedback.delete`. All three go to the **Administrator** role only. Settings → Roles can give them to other roles.

**Place decides which feedback** (`SiteFeedback::scopeVisibleTo`):

- Feedback that names a region shows to that region's office and to the Central Office.
- Feedback that names no region is about the system as a whole, so every office sees it.
- An account without an office sees only feedback that names no region.

**Notifications:** staff who may read feedback are told, by the same rule. There is one grouped notice that counts up while it is unread: "3 new website feedback responses". It names no sender, and it opens the list. HEIs are never told about feedback that names them.

## The admin page

`/admin/feedback` (`Admin\SiteFeedbackController`, `SiteFeedbackResource`). Its filters are Search (feedback, suggestions, name, email), Type, and the place filters. The filters apply to the figures and the list alike, worked out in SQL by `App\Services\SiteFeedbackSummary`.

**The figures:**

- feedback received
- the average agreement
- the average ease of use
- how many left a name or email
- the types, whose rows also filter the list
- how the two reading and layout questions were answered
- each statement's average, with a "View answer counts" table

**The list:** 20 a page, newest first. "Details" opens the full text and every answer, the sender's email as a link, and Delete. Deleting asks first and is logged.

**The CSV export:** it follows the filters. It has one column per question, headed by the question's wording, and answers in words or "4 of 5". Formula-like cells are prefixed with an apostrophe (`App\Support\CsvCell`, shared with the site ratings export). The export is logged.
