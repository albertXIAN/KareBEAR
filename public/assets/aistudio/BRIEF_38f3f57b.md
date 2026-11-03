# BRIEF.md: KareBEAR V0 Clickable Prototype

Status: design brief for a V0 prototype. No application code yet.
Target builders: Google AI Studio (first build) and Codex (refinement).

---

## 1. Product purpose, users, and assumptions

**Purpose.** KareBEAR helps a child and caregiver understand a hospital procedure before it happens and remember recovery instructions afterward. A friendly bear companion, Kare, presents approved care information as short illustrated story pages and simple comprehension checks.

**Users.**

* **Child:** feels anxious about unfamiliar hospital experiences; needs short, concrete, reassuring explanations.
* **Caregiver:** may struggle with medical language; wants to control what the child sees and help them prepare.
* **Healthcare staff (indirect):** have limited time; supply the reviewed source wording the app simplifies. Staff do not use V0.

**Inputs this brief builds on.** The design responds to earlier co-creation sessions with community partners and to consultation with technical advisors. These are *not* results from our prototype workshop, which has not happened yet.

**Working assumptions (to be validated):**

* **A1.** Children are aged 7 to 12 and use the app together with a caregiver, not alone.
* **A2.** Use happens on a tablet or laptop, at home, the day before the visit (Journey 1) and after returning home (Journey 2).
* **A3.** One reading level serves the whole age range in V0. Older or more curious children use optional "More about this" detail instead of a separate age version.
* **A4.** The caregiver is the person who opens the grown-up section. V0 has no login, so this is trust-based.
* **A5.** Interface language is English (Canadian spelling). Other languages are out of scope for V0.

---

## 2. Recommended sample journey and rationale

**Recommendation: "Getting a cast for a broken arm"** (X-ray and cast fitting at a fracture clinic or emergency department), followed by **"Caring for your cast at home."**

**Why this journey:**

* It is common for children aged 7 to 12 and easy to picture.
* It has a clear, short sequence (check in, X-ray, see the doctor, cast goes on, go home) that fits five story pages.
* It includes sensory moments children worry about (staying still, the cast feeling warm) that a story can prepare them for.
* Recovery instructions are behavioural and concrete (keep it dry, don't poke inside, tell a grown-up about warning signs). They can be checked with simple scenario questions and do not involve medication doses.
* Kare can wear a cast too, which lets the bear model the experience.

**Alternatives considered:**

* *Tonsillectomy or day surgery:* higher anxiety and higher value, but involves fasting rules, anaesthesia, pain medication, and bleeding warnings. Too much clinical content needing review for V0.
* *MRI:* good for procedure preparation, but has no real recovery phase, so it cannot support Journey 2.

**Tradeoff.** A cast is lower stakes than surgery, so V0 tests the interaction model more than the emotional ceiling of the concept. The same screen templates can later carry a surgical journey.

---

## 3. Minimal screen list

Eight screens. Screens 2, 6, and 7 are templates reused with different content.

**Global elements on every screen except Home:**

* Top bar: KareBEAR logo, a "Home" button (top left), and a progress indicator where relevant (for example "Page 2 of 5").
* Bottom bar: "Back" (bottom left) and one primary action (bottom right).
* Footer note: "Demo content for testing. Not medical advice."
* "Listen" button on child-facing pages (optional; see section 9).

| ID | Screen | Purpose | Content | Primary action | Destination |
|----|--------|---------|---------|----------------|-------------|
| S1 | Home | Choose a journey | Kare waving, greeting, two large cards: "Read the hospital story" (for you and your child) and "Grown-ups: home care steps" (check and approve what your child will learn) | Tap a card | S2 page 1, or S4 |
| S2 | Story page (x5) | Show what happens at the hospital | One comic panel, Kare speech bubble (1 to 3 short sentences), "More about this" expandable detail, progress "Page n of 5" | "Next" | Next story page, or S3 after page 5 |
| S3 | Story finish | Close the story and capture feelings | Kare celebrating, "You finished the story!", feelings question with three faces, optional enjoyment question | "Back to home" | S1 |
| S4 | Grown-up review | Caregiver checks and approves child content | Intro line, three recovery points. Each shows the child-friendly version, a "See original wording" toggle, and an "Include for my child" checkbox (safety point locked on) | "Approve for my child" | S5 |
| S5 | Handover | Mark approval and pass the device | Confirmation tick, "Approved. Now give the device to your child." Kare waiting | "Start with Kare" | S6 first approved point |
| S6 | Learn page (x approved points) | Child learns one recovery point | Illustration of Kare, one point in 1 to 2 sentences, optional "More about this", progress "Step n of N". In retry mode, banner "Take another look" | "Next" (or "Try the question again" in retry mode) | Next learn page; after last, S7 question 1; in retry mode, back to the same S7 question |
| S7 | Check question (x approved points) | Teach-back check | Short scenario with Kare, two or three large picture answer buttons. Shows correct or incorrect feedback in place | Choose an answer, then "Next" or "Look again" | Next question, S6 retry, or S8 |
| S8 | Finish and summary | Celebrate, check enjoyment, inform caregiver | Child part: celebration, "Tell your grown-up one thing you will do", enjoyment faces. Grown-up part (below a divider): what was approved and which points needed another look | "Back to home" | S1 |

---

## 4. User flows

### Flow 1: Explore the hospital story (caregiver and child together)

1. **S1 Home** → "Read the hospital story".
2. **S2 pages 1 to 5** → "Next" on each. "Back" returns one page. "More about this" expands extra detail in place without leaving the page. "Listen" reads the page aloud.
3. **S3 Story finish** → child picks a feeling face (optional, never blocks progress) → "Back to home".

Story page content (all marked ⚑ need reviewed source material; see section 9):

| Page | Kare says | More about this |
|------|-----------|-----------------|
| 1 Arriving | "Hi, I'm Kare! Today I'm getting a cast on my arm. It's OK to feel nervous. You can hold your grown-up's hand." | "At the front desk, you may get a wristband with your name on it. ⚑" |
| 2 X-ray | "First, I get an X-ray. It's a special picture of my bones. I stay very still while it's taken. ⚑" | "Taking the picture does not hurt. Moving your arm into place might feel sore. It's OK to say so. ⚑" |
| 3 The doctor | "A doctor looks at my X-ray and tells me what they see. I can ask questions too!" | "Good questions to ask: What happened to my bone? How long will I have my cast?" |
| 4 The cast | "Now my cast goes on. First a soft layer, then a wrap that gets hard. It might feel warm for a little while. ⚑" | "Some hospitals let you pick a cast colour. ⚑" |
| 5 Going home | "My cast helps keep my arm still while it heals. ⚑ My grown-up will learn how to care for it at home." | none |

### Flow 2: Approve recovery steps, then teach-back (caregiver, then child)

1. **S1 Home** → "Grown-ups: home care steps".
2. **S4 Grown-up review.** Caregiver reads three points. They may open "See original wording" to compare with the source text. They may untick optional points. Point 3 shows a lock icon and "Your care team marked this as important" and cannot be unticked.
3. "Approve for my child" → **S5 Handover** → "Start with Kare".
4. **S6 Learn pages**, one per approved point → "Next" through each.
5. **S7 Check questions**, one per approved point, in the same order.
   * **Correct:** answer button turns soft teal with a tick, Kare happy, feedback text, "Next".
   * **Incorrect (first try):** answer button gets a soft orange outline with a gentle icon, Kare encouraging, feedback text, "Look again" → **S6 for that point in retry mode** → "Try the question again" → **the same S7 question**, answer choices reset.
   * **Incorrect (second try):** the correct answer is highlighted and explained ("Here's the answer..."), the point is flagged for the caregiver summary, and "Next" continues. This avoids a frustrating loop.
6. **S8 Finish and summary.** Child picks an enjoyment face (optional). Grown-up section lists approved points and any that needed another look, with "Talk about these together" → "Back to home".

**Rules:**

* "Approve for my child" is always enabled because the locked safety point guarantees at least one item.
* If the caregiver unticks a point, its learn page and question are skipped.
* Approval and answers last only for the browser session. Returning to Home and choosing "Grown-ups: home care steps" again starts a fresh review.

Recovery points (child version shown to child, original wording shown to caregiver on request):

| # | Child-friendly version | Original wording | Include setting |
|---|------------------------|------------------|-----------------|
| 1 | "Keep your cast dry, even at bath time. ⚑" | [Placeholder: reviewed hospital instruction] | Optional, ticked by default |
| 2 | "Don't put anything inside your cast, even if it's itchy. Tell a grown-up instead. ⚑" | [Placeholder: reviewed hospital instruction] | Optional, ticked by default |
| 3 | "Tell a grown-up right away if your fingers feel tingly, numb, or cold, change colour, or if your arm hurts more. ⚑" | [Placeholder: reviewed hospital instruction] | Locked on (safety) |

Check questions:

| # | Scenario | Answers (✓ = correct) |
|---|----------|-----------------------|
| 1 | "Kare wants to run through the sprinkler. What should Kare do?" | "Run through it" / "Keep the cast dry and play another way" ✓ / "Take the cast off first" |
| 2 | "Kare's arm feels itchy under the cast. What should Kare do?" | "Push a pencil inside to scratch" / "Tell a grown-up" ✓ |
| 3 | "Kare's fingers feel tingly and cold. What should Kare do?" | "Wait and see" / "Tell a grown-up right away" ✓ / "Shake the arm hard" |

**Consequential tradeoffs:**

* **Locked safety point vs full caregiver control.** Partners asked for caregiver control, but letting a caregiver hide warning signs could remove essential information. V0 locks one point and explains why. The workshop should test whether caregivers accept this.
* **Three points, not more.** Real cast instructions are longer (for example, raising the arm). Three points keep Task B within five minutes. The excluded content is listed in section 9.
* **Multiple choice vs true teach-back.** Choosing an answer checks recognition, not explanation in the child's own words. V0 adds a spoken "Tell your grown-up" prompt at the end without recording it, because speech recognition is out of scope.
* **Learn all, then check all.** Grouping questions after the learn pages is a better test of memory than asking immediately after each point, at the cost of slightly harder questions.

---

## 5. Interface wording and visual guidelines

### Wording principles

* Sentences of 12 words or fewer for child text. One idea per sentence.
* Plain words: "picture of your bones" before "X-ray", "grown-up" for caregiver in child text.
* Kare speaks in first person ("I", "me"). Never "wrong", "fail", or "bad". Never promise outcomes ("it won't hurt", "you'll be better in a week").
* Grown-up text is plain and direct, addressed as "you" and "your child".

### Example wording

| Moment | Text |
|--------|------|
| Home greeting | "Hi, I'm Kare! What would you like to do?" |
| Home card 1 | Title "Read the hospital story". Subtitle "For you and your child: what happens when you get a cast" |
| Home card 2 | Title "Grown-ups: home care steps". Subtitle "Check and approve what your child will learn" |
| S4 intro | "Here is what Kare will teach your child. Read each step. Untick anything you'd like to leave out for now." |
| Locked point | "Always included. Your care team marked this as important." |
| S5 | "Approved. Now give the device to your child." |
| Correct | "Yes! You remembered. Kare is proud of you." |
| Incorrect, first try | "Not quite, and that's OK! Let's look at that part again." |
| Retry banner | "Take another look" |
| Incorrect, second try | "Here's the answer: tell a grown-up. Let's talk about it with your grown-up." |
| Feelings question (S3) | "How do you feel about your hospital visit now?" Faces: "Worried", "A little worried", "Ready" |
| Enjoyment question (S8) | "Did you like learning with Kare?" Faces: "Not really", "It was OK", "Yes!" |
| S8 grown-up summary | "Your child finished 3 steps. Talk about these together: Keep your cast dry." |

### Visual guidelines

| Role | Colour | Use |
|------|--------|-----|
| Background | Warm cream `#FFF8EC` | All screens |
| Text | Warm ink `#3A2E26` | All body text (12.4:1 on cream) |
| Primary | Deep teal `#1F6F6B` | Primary buttons with white text (5.9:1), headings (5.6:1 on cream) |
| Accent | Gentle orange `#F2994A` | Fills, Kare's cast, highlights. Text on orange must be ink (5.9:1). Never orange text on cream (2.1:1, fails) |
| Correct state | Soft teal `#DDF1EE` + tick icon | Correct answer |
| Try again state | Soft orange `#FDE8D4` + gentle arrow icon | Incorrect answer. No red anywhere |

* **Type:** rounded sans serif (for example Nunito or Atkinson Hyperlegible). Child text at least 22px, grown-up text at least 18px, line height 1.5.
* **Buttons:** at least 56px tall, full words, icon plus label. One primary action per screen, always bottom right. "Back" always bottom left.
* **Feedback** never relies on colour alone: always icon plus text plus Kare's expression.
* **Kare:** round honey-brown bear, teal scrub top, orange cast on the left arm. Same proportions on every screen. Four expressions: waving, calm, celebrating, encouraging. Use simple flat SVG illustrations; placeholders are acceptable if clearly labelled.
* **Layout:** landscape first for tablet (1024 x 768) and laptop (1366 x 768). Illustration on the left, text and actions on the right. No horizontal scrolling. Respect reduced motion settings.

---

## 6. Participant-facing scenario tasks

Read aloud or hand to participants. These contain no button names or navigation steps.

**Task A (about 5 minutes).**
"Imagine you are a parent. Your 8-year-old, Sam, hurt their arm and is going to the hospital tomorrow to get a cast. Sam is nervous and has lots of questions. Use KareBEAR with Sam to find out what will happen at the hospital. When you're done, let the app know how Sam is feeling."

**Task B (about 5 minutes).**
"Sam is home now with a cast. The hospital has sent instructions for looking after it. Before Sam sees anything, make sure you're comfortable with what KareBEAR will teach. Then help Sam check that they understand. Pretend Sam gets one answer wrong the first time."

---

## 7. Host-only expected action sequences

Hosts observe silently and must not explain the interface.

**Task A expected sequence:**

1. S1: select "Read the hospital story".
2. S2: advance through pages 1 to 5 with "Next". Optional: open "More about this", use "Listen", use "Back".
3. S3: select a feelings face.
4. S3: select "Back to home" (or stop at S3; task counts as complete once a face is selected).

* **Success:** reaches S3 and selects a feeling within 5 minutes without host help.
* **Watch for:** hesitation on Home choice; whether "More about this" is noticed; whether participants try to tap the comic panel instead of "Next".

**Task B expected sequence:**

1. S1: select "Grown-ups: home care steps".
2. S4: read the three points. Optional: open "See original wording", untick point 1 or 2, try to untick point 3 and read the lock message.
3. S4: select "Approve for my child".
4. S5: select "Start with Kare".
5. S6: advance through each learn page with "Next".
6. S7: choose an incorrect answer on one question → read feedback → select "Look again".
7. S6 (retry mode): select "Try the question again".
8. S7: choose the correct answer → "Next" → complete remaining questions.
9. S8: select an enjoyment face; read the grown-up summary showing the point that needed another look.

* **Success:** approval completed, at least one retry completed, S8 reached within 5 minutes without host help.
* **Watch for:** whether caregivers understand the checkbox and lock; whether "Look again" is chosen or skipped; whether caregivers notice the summary.

---

## 8. Observable acceptance criteria

The prototype is ready for the workshop when each of these can be seen in a browser:

**Navigation**

* [ ] Home shows exactly two journey cards with the labels in section 5.
* [ ] Every screen except Home has a working "Home" button and, where a previous screen exists, a "Back" button.
* [ ] Story shows "Page n of 5"; learn pages and questions show their step count.
* [ ] No dead ends: every screen has a forward path to Home.

**Journey 1**

* [ ] Five story pages display in order, each with Kare, 1 to 3 sentences, and working "More about this" where content exists.
* [ ] S3 feelings faces are selectable, show a selected state, and are optional.

**Journey 2**

* [ ] S4 shows three points, each with a working "See original wording" toggle.
* [ ] Points 1 and 2 can be unticked; point 3 cannot and shows the lock message.
* [ ] Unticked points do not appear in S6 or S7.
* [ ] An incorrect first answer shows the "Not quite" feedback and a "Look again" button that opens the matching learn page with the "Take another look" banner.
* [ ] "Try the question again" returns to the same question with choices reset.
* [ ] An incorrect second answer reveals the correct answer and allows continuing.
* [ ] S8 lists approved points and names any point that needed another look.

**Content and safety**

* [ ] The demo footer appears on every content screen.
* [ ] No medication names, doses, treatment recommendations, timelines, or recovery promises appear anywhere.
* [ ] All ⚑ items match this brief exactly or are visibly marked as placeholders.

**Accessibility and layout**

* [ ] Text and button contrast meets at least 4.5:1 (values in section 5).
* [ ] All actions work with mouse, touch, and keyboard (Tab, Enter, visible focus).
* [ ] Layout works at 1024 x 768 and 1366 x 768 without horizontal scrolling.
* [ ] Buttons are at least 56px tall.

**Technical**

* [ ] Single-page web app, no login, no backend, no network calls for content.
* [ ] All content lives in one editable data file or object, so wording can be replaced without touching layout code.
* [ ] State resets on page refresh.

---

## 9. Simulated vs unresolved

### Simulated in V0

* All story, recovery, and original-wording content is fixed demo content.
* Caregiver approval is stored in session memory only and is not tied to a real person.
* The "care team" lock is hardcoded, not set by real clinicians.
* "Listen" uses the browser's built-in text-to-speech if available. It is a nice-to-have and not part of the acceptance criteria. If it is not available, the button is hidden.
* The caregiver summary is local and is not saved or shared.

### Medical wording that needs reviewed source material

Every line marked ⚑ in section 4, specifically:

* Wristband and check-in practice.
* What happens during the X-ray and whether a caregiver can stay nearby.
* Cast application steps, warmth, and colour choice.
* "Helps keep my arm still while it heals."
* All three recovery points and their original wording.
* The full list of warning signs in point 3.

Excluded from V0 on purpose: arm elevation, activity limits, how long the cast stays on, follow-up appointments, cast removal, pain relief. These need source material before they can be added.

### Unresolved

* **Age fit:** whether one reading level works across 7 to 12 or needs younger and older versions.
* **Grown-up gate:** whether the caregiver section needs a lightweight barrier to stop children entering it.
* **Locked content:** whether caregivers accept a point they cannot remove, and who decides which points are locked.
* **Content pipeline:** how clinicians supply, review, and update source wording, and how essential information is checked after simplification.
* **Narration:** voice quality, consistency, and whether recorded human narration is needed.
* **Language:** French and other languages for Canadian families.
* **Illustration:** final art style and who produces it.
* **Link to the non-tech solution:** how the app and the paper activity booklet reference each other.
