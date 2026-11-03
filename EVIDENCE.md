# EVIDENCE.md — KareBEAR Pre-Op, Post-Op & Cast Demo Evidence, Design Decisions, Limitations & Proposed Tests

This document maps the inputs behind the **KareBEAR Surgical Preparation, Post-Operative Recovery, and Cast Care Prototype** using the five-part traceability structure:

$$\text{Source} \rightarrow \text{Finding or Recommendation} \rightarrow \text{Design Decision} \rightarrow \text{Limitation} \rightarrow \text{Proposed Test}$$

To prevent conflating unvalidated choices with clinical or empirical facts, entries are separated into five categories:
1. **Clinical & Health Literacy Research / Published Guidance**
2. **Stakeholder Feedback (Community Partner Co-Creation Sessions)**
3. **Technical & Implementation Advice**
4. **Accessibility Standards (WCAG 2.2 AA)**
5. **Working Assumptions & Design Choices Requiring Evaluation** (including age bands `3–6`, `7–9`, `10–12`, bilingual French demo strings, the Kare mascot, colour preferences, and sentence-length targets)

> **Boundary Rule:** All research notes, 5-minute peer evaluation tasks, and implementation details are kept strictly outside child-facing screens (accessible via the Host Guide / Facilitator Modal and this file).

---

## 1. Clinical & Health Literacy Research / Published Guidance

| Source | Finding or Recommendation | Design Decision | Limitation | Proposed Test |
|---|---|---|---|---|
| **Boston Children's Hospital** — *Preparing Your Child for Surgery (#7551)* & **AAP HealthyChildren.org** — *Anesthesia and Children: The Day of the Procedure* | Children experience less pre-operative distress when they know what hospital staff wear (scrubs, gown), what routine vital-sign tools feel like (BP cuff hug, stethoscope, thermometer, height/weight scale), and how sleep medicine (mask vs. IV) works, without false promises like `"it won't hurt"`. Furthermore, IV placement timing (before vs. after mask induction) and NPO fasting cutoffs vary by hospital protocol. | Implemented all **8 Pre-Op Preparation Lessons** (`preop-1-scrubs` through `preop-8-iv`) with concrete sensory descriptions, explicit variability notes on mask vs. IV timing, zero invented NPO hour cutoffs, and an automated phrase filter (`detectDisallowedReassurancePhrases`) that blocks `"it won't hurt"` and `"you'll get better soon"`. | Prototype copy in English is reviewed demonstration material; French translations are marked `⚑ Needs clinical review` (`needs-clinical-review`). | Pediatric child-life specialist and bilingual clinical review comparing all 8 lessons (`3–6`, `7–9`, `10–12` in EN & FR) against local hospital pre-op protocols. |
| **Post-Operative Discharge Communication & Medication Safety Literature** | Audio discharge instructions frequently contain clinician self-corrections, references to printed sheets for weight-based doses, or general phrases like `"twice daily"` without specific clock times. Inventing missing doses or clock times poses a severe medication safety hazard. | Built a **4-step Caregiver Post-Op Workspace**: (1) explicit consent + audio capture/fixture, (2) side-by-side immutable **Original Machine Transcript** and editable **Corrected Transcript**, (3) explicit **Timestamped Uncertainty Flags** (`[00:45]` acetaminophen dose on printed sheet; `[01:16]` amoxicillin `"twice daily"` missing dose/clock times) that block linked tasks until clarified by the caregiver, and (4) a 4-part **Plain-Language Summary** linked to exact quotes. | Does not parse PDF/paper discharge sheets or connect to an EHR; relies on the caregiver checking their printed discharge sheet. | 5-Minute Peer Evaluation Task 2: verify whether evaluators identify the blocked medication tasks, inspect `clockTimesSupplied: null` for `"twice daily"`, and understand why caregiver clarification is required. |
| **SickKids (AboutKidsHealth)** — *Cast care: Arm or leg cast* (`https://www.aboutkidshealth.ca/cast-care-arm-or-leg-cast`) | Non-waterproof casts must be kept completely dry, must never have objects inserted inside to scratch itching skin, and require urgent assessment if circulation/nerve warning signs appear. | Preserved the complete **Non-Waterproof Arm Cast Journey (`S1`–`S8`)** under the **Cast Demo (Regression)** tab (`?journey=cast&autostart=1` also supported) with direct links to SickKids guidance. | Covers three selected learning examples for a non-waterproof arm cast, not a complete care plan. | Regression testing (`src/utils/demoState.test.ts` Subtests 1–5) + browser verification. |

---

## 2. Stakeholder Feedback (Community Partner Co-Creation Sessions)

| Source | Finding or Recommendation | Design Decision | Limitation | Proposed Test |
|---|---|---|---|---|
| **Community partner co-creation sessions** | Caregivers need control over presentation (age band, language, reading detail, narration) and must review and approve any post-op summary or story before it reaches the child view. Furthermore, switching to post-op mode must never imply clinical discharge authorization. | Added (1) **Caregiver Setup Modal** saving only non-sensitive presentation preferences (`ageBand`, `language`, `detailLevel`, `narrationEnabled`), (2) **Adult Post-Op Mode Activation Modal** with a mandatory disclaimer checkbox stating that mode switching does not detect surgery completion or medical discharge, and (3) **Staleness Propagation** (`propagateTranscriptEditStaleness`, `propagateSummaryEditStaleness`) that immediately marks downstream summaries, stories, and confirmed tasks as `'stale'` whenever upstream text is edited. | Caregiver gates are trust-based adult checkboxes suitable for a co-used family prototype rather than cryptographic authentication. | Peer Evaluation Tasks 1 & 2: test whether adults notice the `'stale'` badge after editing a transcript segment and re-verify before releasing the story. |
| **Positive-only companion feedback** | Gamified health apps that make a mascot sad, sick, or disappointed when tasks are missed create guilt and anxiety for recovering children. | Enforced a **Positive-Only Companion Rule** and an **Idempotent Event Ledger** (`awardRewardForOccurrence`, `revokeRewardOccurrence`): Kare only celebrates confirmed steps (`+10 pts` per unique `occurrenceId`), never multiplies points on repeated taps, and never enters a sad or punitive state when a caregiver corrects/undoes a record. | Cosmetic rewards are limited to 3 cozy look presets (`neutral`, `checklist`, `doctor`). | Unit test Subtest 10 + UI check of confirmar/undo task completion in the Post-Op Dashboard. |

---

## 3. Technical & Implementation Advice

| Source | Finding or Recommendation | Design Decision | Limitation | Proposed Test |
|---|---|---|---|---|
| **Server-side Gemini API & TTS Architecture** | Keep all `@google/genai` calls on the server (`server.ts`), separate TTS delivery style instructions (`speechMetadata.style`) from spoken text, cache generated audio by `(text, language, voice, version)`, and fall back cleanly when offline or without an API key. | Implemented `POST /api/tts` (`gemini-3.8-flash-lite-tts`, voice `'Kore'`, SHA-256 server cache + client data-URL cache + browser `speechSynthesis` fallback), `POST /api/appointment/transcribe` (`gemini-3.5-transcribe`), `POST /api/appointment/summarize` (`gemini-3.8-flash`), and `POST /api/appointment/story` (`gemini-3.8-flash` + `buildGroundedStoryDraftFromSummary`), alongside the existing `/api/explain/*` and `/api/live` endpoints. | In-memory server TTS cache resets on server restart; browser `speechSynthesis` voice timbre varies by OS when fallback is used. | Verify `ListenButton` across EN and FR lessons and post-op story pages, and verify all 10 unit tests in `src/utils/demoState.test.ts`. |
| **Microphone lifecycle & privacy** | Microphone access must never start on page load, must require pre-recording consent for appointment capture, must close all `MediaStreamTrack`s on Stop/Cancel/navigation/unmount, and must never persist recordings or transcripts to `localStorage`. | Enforced `stopMediaTracksCleanly()` across `PostOpWorkspace`, `ExplainItToKarePanel`, and `MascotRuntimeContext`, and restricted `localStorage['karebear_presentation_prefs_v1']` strictly to `{ ageBand, language, detailLevel, narrationEnabled }`. | Session-only appointment data is cleared if the browser tab is refreshed or when `Discard Session Transcript & Notes` is clicked. | Browser inspection of `window.localStorage` confirming zero transcripts, audio, or child PII are stored. |

---

## 4. Accessibility Standards (WCAG 2.2 AA)

| Source | Finding or Recommendation | Design Decision | Limitation | Proposed Test |
|---|---|---|---|---|
| **WCAG 2.2 AA — Contrast, Target Size, Keyboard Access & Reduced Motion** | Body text requires $\ge 4.5:1$ contrast, large touch targets ($\ge 48\text{px}–56\text{px}$), semantic landmarks/modals, and `prefers-reduced-motion` support. | Preserved the Warm Cream `#FFF8EC`, Warm Ink `#3A2E26`, Deep Teal `#1F6F6B`, and Gentle Orange `#E76F51`/`#FDE8D4` palette across all Pre-Op, Post-Op, Parent Resources, and Cast Demo screens, with `prefers-reduced-motion` support in both global CSS and `kare-mascot.css`. | High-contrast dark theme is not included. | Playwright verification across desktop (`1280×800`) and mobile (`390×844`) viewports with zero console/page errors. |

---

## 5. Working Assumptions & Design Choices Requiring Evaluation

| Source | Finding or Recommendation | Design Decision | Limitation | Proposed Test |
|---|---|---|---|---|
| **Working Assumption — Three Age Bands (`3–6`, `7–9`, `10–12`) & Separate Detail Toggle** | Chronological age does not always match reading comfort or desire for clinical detail. | Separated `ageBand` (`3–6`, `7–9`, `10–12`) from `detailLevel` (`simple` vs. `extra-detail`) in `CaregiverSetupModal` so a 6-year-old can still view extra detail with a parent, or an anxious 11-year-old can choose simple sentences first. | Age-band sentence adaptations are prototype hypotheses awaiting pediatric child-life usability testing. | 5-Minute Peer Evaluation Task 1 comparing `3–6` vs. `10–12` and EN vs. FR on Pre-Op lessons. |
| **No Fabricated Parent Testimonials or Hospital Contacts** | Presenting invented parent quotes or unverified phone numbers in a clinical prototype misleads families. | Created a dedicated **Parent Resources** tab listing verified sources (`VERIFIED_SOURCES`), a session-only care-team contact scratchpad, and an explicitly empty **Reserved Parent Testimonials** section. | Contains no pre-populated local hospital phone numbers; families must refer to their printed discharge sheet. | Inspect Parent Resources tab to confirm zero fabricated testimonials. |
