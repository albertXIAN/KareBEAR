# KareBEAR V0 — Clickable React & TypeScript Prototype

KareBEAR V0 is an interactive, accessible prototype helping a child (ages 7–12) and their caregiver prepare for a hospital cast-fitting visit (**Journey 1**) and practice selected home-care instructions for a **non-waterproof arm cast** (**Journey 2**).

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server (Port 3000)
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run unit tests (State machine & summary logic)
```bash
npx --yes tsx --test src/utils/demoState.test.ts
```

### 4. Type-check and build for production
```bash
npm run lint
npm run build
```

---

## Key Architecture & Files

- `src/data/demoContent.ts` — Single editable content store with stable IDs for all 5 hospital story pages, 3 non-waterproof cast recovery learning examples, comprehension checks, SickKids (AboutKidsHealth) source grounding, and facilitator scenario tasks.
- `src/utils/demoState.ts` — Pure state machine managing navigation (`S1`–`S8`), `Back` history preservation, `Home` and `Reset Demo` behaviour, per-point attempt tracking (`hadIncorrectAttempt`, `eventuallyCorrect`, `needsCaregiverDiscussion`), and caregiver summary totals.
- `src/utils/demoState.test.ts` — Automated `node:test` suite verifying Journey 1, Journey 2 (1st-try correct, 1st-incorrect retry, 2nd-incorrect explanation & caregiver flag), `Back`, `Home`, and session reset rules.
- `src/components/KareIllustration.tsx` — Consistent SVG illustration of Kare the bear (honey-brown bear, deep teal scrub top `#1F6F6B`, gentle orange left-arm cast `#F2994A`) across 4 expressions (`waving`, `calm`, `celebrating`, `encouraging`) and scene props.
- `src/components/StoryScreens.tsx` — Screens `S1` (Home), `S2` (Story Pages 1–5), and `S3` (Story Finish with optional feelings and enjoyment faces).
- `src/components/RecoveryScreens.tsx` — Screens `S4` (Grown-up Review with SickKids grounding and supplemental detail controls), `S5` (Handover), `S6` (Learn Page with normal and retry banner modes), `S7` (Comprehension Check), and `S8` (Finish & Caregiver Summary).
- `EVIDENCE.md` — Full traceability mapping (`Source → finding/recommendation → design decision → limitation → proposed test`) separating clinical guidance, stakeholder feedback, technical advice, accessibility standards, and design hypotheses.

---

## What Is Implemented vs. Simulated in V0

### Implemented End-to-End
- **Eight screen templates (`S1`–`S8`)** with responsive landscape layouts (`1024×768` tablet and `1366×768` / `1440×900` laptop), large buttons ($\ge 56\text{px}$ tall), keyboard navigation, and visible focus rings.
- **Clarified source authority & caregiver controls (`S4`)**:
  - Specifies a **non-waterproof arm cast** and frames the 3 steps as **selected learning examples, not a complete care plan**, grounded in and linked to **SickKids (AboutKidsHealth)** cast care guidance.
  - Replaces *"Your care team marked this as important"* with **“Always included in this demonstration.”**
  - Keeps all three core care instructions locked on while allowing caregivers to toggle supplemental `"More about this"` detail per step, `"Explain in your own words"` prompts, and `"Listen"` read-aloud buttons.
  - Clarifies that caregiver approval means permission to show the child the demonstration content, not clinical validation.
- **Interleaved learning & comprehension check sequence (`S6 ↔ S7`)**:
  - Follows **Learn (`S6`) → Comprehension Check (`S7`) → Supportive Feedback / Revisit → Next Point** for each recovery step.
  - Invites the child to explain each point to their caregiver in their own words (without recording speech or grading).
  - 1st incorrect answer shows supportive feedback and a **“Look again”** button that opens `S6` with the **“Take another look”** banner.
  - 2nd incorrect answer explains the correct answer, allows progress to the next step, and flags the point for caregiver discussion.
- **Consistent state & Caregiver Summary (`S8`)**:
  - Separately tracks and displays: (1) **Any incorrect attempt**, (2) **Whether the answer was eventually correct**, and (3) **Whether caregiver discussion is still needed**.
  - `Back` preserves progress and attempt history; `Home` returns to the menu; starting a new recovery session clears previous recovery results; `Reset Demo` resets all in-memory state.

### Simulated / Out of Scope in V0
- **Fixed demonstration content**: All story pages, recovery instructions, and SickKids source excerpts are static in-app data (`src/data/demoContent.ts`). Items marked `⚑ Needs clinical review` require formal clinical sign-off before patient use.
- **In-memory session only**: No login, backend database, live AI generation, or patient-data collection. Refreshing the browser or clicking **Reset Demo** clears all state.
- **Read-aloud (`"Listen"`)**: Uses the browser's built-in Web Speech API (`window.speechSynthesis`) when available, and hides automatically if unsupported.
- **Own-words explanation**: Spoken face-to-face between child and caregiver; no microphone recording or automated speech grading is performed.
