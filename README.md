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
- `server.ts` — Express + WebSocket backend server securing Gemini API calls (`POST /api/explain/chat` with `gemini-3.8-flash`, `POST /api/explain/transcribe` with `gemini-3.5-transcribe`, and WebSocket `/api/live` with `gemini-3.8-live` real-time voice and speech captions).
- `src/utils/explainKareLogic.ts` — Grounded prompt builder, out-of-scope clinical guardrail (`FIXED_OUT_OF_SCOPE_MESSAGE`), learning-point coverage detector, and deterministic fallback responder when the microphone or API is unavailable.
- `src/components/ExplainItToKarePanel.tsx` — Unified low-fidelity **“Explain it to Kare”** activity panel offering **Type to Kare**, **Talk to Kare**, and **Record Answer (Optional)** in one shared experience with live captions, transcript confirmation, and suggested caregiver observations.
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
  - Keeps all three core care instructions locked on while allowing caregivers to toggle supplemental `"More about this"` detail per step, `"Explain it to Kare"` prompts, and `"Listen"` read-aloud buttons.
  - Clarifies that caregiver approval means permission to show the child the demonstration content, not clinical validation.
- **Interleaved learning & comprehension check sequence (`S6 ↔ S7`)**:
  - Follows **Learn (`S6`) → Comprehension Check (`S7`) → Supportive Feedback / Revisit → Next Point** for each recovery step.
  - 1st incorrect answer shows supportive feedback and a **“Look again”** button that opens `S6` with the **“Take another look”** banner.
  - 2nd incorrect answer explains the correct answer, allows progress to the next step, and flags the point for caregiver discussion.
- **Shared “Explain it to Kare” Activity (`S6`, `S7`, `S8`)**:
  - Offers **Type to Kare** (`gemini-3.8-flash`), **Talk to Kare** (`gemini-3.8-live` real-time voice with child + Kare captions, microphone permission handling, obvious **End Conversation** control, and 1-click typed fallback), and **Record Answer (Optional)** (`gemini-3.5-transcribe` with editable transcript review and confirmation before generating feedback).
  - Supports **“Explain this page another way”** and responding warmly to the child’s own explanation with one short question at a time.
  - Strictly grounds responses in the supplied SickKids lesson material and intercepts out-of-scope medical questions with a fixed caregiver/care-team redirect message.
  - Tracks which expected learning points were covered vs. remain unclear, with a direct link back to the relevant explanation (`S6`), presented as **suggested observations for caregiver review, not validated comprehension scores**.
- **Consistent state & Caregiver Summary (`S8`)**:
  - Separately tracks and displays: (1) **Any incorrect attempt**, (2) **Whether the answer was eventually correct**, (3) **Whether caregiver discussion is still needed**, and (4) **Suggested “Explain it to Kare” learning-point observations**.
  - `Back` preserves progress and attempt history; `Home` returns to the menu; starting a new recovery session clears previous recovery results; `Reset Demo` resets all in-memory state.

