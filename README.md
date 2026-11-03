# KareBEAR — Pre-Op Surgical Preparation, Post-Op Recovery & Cast Care Prototype

KareBEAR is an accessible, bilingual (`EN` reviewed demo / `FR` flagged for clinical review) React + TypeScript prototype that supports children (ages `3–6`, `7–9`, and `10–12`) and their caregivers through:
1. **Pre-Op Prep Hub (Main Experience):** 8 illustrated hospital equipment and procedure lessons grounded in Boston Children's Hospital and AAP HealthyChildren guidance, with age-band adaptation, natural narration (`gemini-3.8-flash-lite-tts` with `Kore` voice + browser speech fallback), comprehension checks, and **Explain it to Kare** (`Type`, `Talk` via `gemini-3.8-live`, and `Record` via `gemini-3.5-transcribe`).
2. **Adult-Activated Post-Op Recovery Mode:** Caregiver-gated post-op appointment capture (with pre-recording consent, live mic recording, audio upload, or sample tonsillectomy discharge fixture), side-by-side immutable **Original Machine Transcript** vs. editable **Caregiver-Corrected Transcript**, **Timestamped Uncertainty Flags** that block unresolved medication tasks, a 4-part **Plain-Language Summary**, a **3-Page Post-Op Bear Story** with staleness propagation, **Caregiver-Confirmed Recovery Tasks** (preserving missing schedule fields like `"twice daily"` without inventing clock times), and an **Idempotent Positive Reward Ledger**.
3. **Parent & Caregiver Resources:** Verified pediatric hospital sources (Boston Children's Hospital, AAP HealthyChildren, SickKids AboutKidsHealth), a session-only care-team contact scratchpad, and an intentionally empty reserved section for future IRB-approved parent testimonials.
4. **Cast Demo (Regression):** The complete 8-screen Non-Waterproof Arm Cast Journey (`S1`–`S8`) preserved intact for regression testing.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run the full-stack development server (Port 3000)
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run the 10-part automated unit test suite
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

- `src/utils/surgeryDataModel.ts` — Pure TypeScript data model and guardrails for `PresentationPreferences`, `PreOpLessonItem`, `MachineTranscriptObject`, `CorrectedTranscriptObject`, `TranscriptUncertaintyFlag`, `PlainLanguageSummaryDraft`, `BearStoryDraft`, `PostOpCareTask`, `RewardLedgerState`, staleness propagation (`propagateTranscriptEditStaleness`, `propagateSummaryEditStaleness`), uncertainty blocking (`isItemBlockedByUncertainty`), idempotent rewards (`awardRewardForOccurrence`, `revokeRewardOccurrence`), and the false-reassurance phrase filter (`detectDisallowedReassurancePhrases`).
- `src/data/surgeryContent.ts` — Complete bilingual (`en` / `fr`) and age-adapted (`3-6`, `7-9`, `10-12`) content store for all 8 Pre-Op lessons, verified clinical sources (`VERIFIED_SOURCES`), the fictional post-op tonsillectomy discharge fixture (`SAMPLE_MACHINE_TRANSCRIPT`, `INITIAL_UNCERTAINTY_FLAGS`, `INITIAL_SUMMARY_DRAFT`, `INITIAL_POSTOP_TASKS`), grounded story builder (`buildGroundedStoryDraftFromSummary`), cosmetic rewards (`COSMETIC_REWARDS`), and 5-minute peer evaluation tasks (`HOST_PEER_EVALUATION_TASKS`).
- `src/components/PreOpScreens.tsx` — `CaregiverSetupModal`, `ActivatePostOpModal`, `PreOpHubScreen`, and `PreOpLessonDetailScreen`.
- `src/components/PostOpScreens.tsx` — `PostOpWorkspace` with sub-tabs for **1. Caregiver Workspace (Record, Review & Release Story)** and **2. Child & Caregiver Dashboard (Kare Story, Tasks & Rewards)**.
- `src/components/ParentResourcesScreen.tsx` — Verified sources, session-only care-team contacts, and reserved empty parent testimonials section.
- `src/components/ListenButton.tsx` — Natural narration button calling `POST /api/tts` (`gemini-3.8-flash-lite-tts`, voice `'Kore'`, cached by `text|language|voice|version`) with automatic browser `speechSynthesis` (`en-CA` / `fr-CA`) fallback.
- `src/mascot/` — Canonical layered SVG vector mascot (`KareMascot.tsx`, `kareArtwork.ts`, `MascotRuntimeContext.tsx`, `mascotStateArbiter.ts`) enforcing `speaking > listening > gesture > idle` priority across all journeys.
- `server.ts` — Express + Vite + WebSocket server handling `/api/tts`, `/api/appointment/transcribe`, `/api/appointment/summarize`, `/api/appointment/story`, `/api/explain/chat`, `/api/explain/transcribe`, and `/api/live`.
- `EVIDENCE.md` — Full five-column evidence traceability table (`Source → Finding → Design Decision → Limitation → Proposed Test`).
