/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareBEAR Pre-Op & Post-Op Data, Versioning, Review, and Reward Ledger Model.
 *
 * Enforces:
 * - Explicit separation between presentation preferences (ageBand, language, detailLevel)
 *   and clinical source facts.
 * - Immutable raw machine transcript vs. editable corrected transcript.
 * - Explicit version & staleness propagation: editing a transcript or summary
 *   automatically marks downstream summaries, stories, narration, and tasks as 'stale',
 *   preventing unreviewed or unresolved material from remaining released to the child view.
 * - Caregiver-only medication/task confirmation and idempotent positive reward accounting.
 * - Phrase filter flagging false reassurance promises ("it won't hurt", "you'll get better soon").
 */

import type { KareCostumePreset } from '../mascot/kareArtwork';

/* -------------------------------------------------------------------------- */
/* 1. PRESENTATION PREFERENCES & JOURNEY MODE                                 */
/* -------------------------------------------------------------------------- */

/**
 * Prototype age bands (documented as design assumptions pending pediatric evaluation).
 * Changes vocabulary, sentence length, and visual scaffolding — never clinical facts.
 */
export type AgeBand = '3-6' | '7-9' | '10-12';

/**
 * Supported demonstration languages.
 * English ('en') and French ('fr') are fully provided across core screens and lessons;
 * newly generated French clinical translations are flagged 'needs-clinical-review'.
 */
export type AppLanguage = 'en' | 'fr';

/**
 * Reading detail level kept independent of chronological age band.
 */
export type DetailPreference = 'simple' | 'extra-detail';

export interface PresentationPreferences {
  ageBand: AgeBand;
  language: AppLanguage;
  detailLevel: DetailPreference;
  narrationEnabled: boolean;
}

export type JourneyMode = 'pre-op' | 'post-op' | 'cast-demo';

export interface PostOpActivationState {
  isActivated: boolean;
  activatedAt: number | null;
  confirmedAdultUnderstanding: boolean;
}

/* -------------------------------------------------------------------------- */
/* 2. PRE-OP PREPARATION LESSONS MODEL                                        */
/* -------------------------------------------------------------------------- */

export type ContentReviewStatus =
  | 'reviewed-demo'
  | 'needs-clinical-review'
  | 'unreviewed-ai-draft'
  | 'stale';

export interface PreOpLessonVariant {
  title: string;
  shortSubtitle: string;
  whatItIs: Record<AgeBand, string>;
  whatYouMaySeeOrFeel: Record<AgeBand, string>;
  sourceGroundedExplanation: Record<AgeBand, string>;
  extraDetail: string;
  askOrExplainPrompt: string;
  comprehensionQuestion: string;
  comprehensionChoices: {
    id: string;
    text: string;
    isCorrect: boolean;
    supportiveFeedback: string;
  }[];
  expectedTeachBackPoints: {
    id: string;
    label: string;
    childFriendlyHint: string;
    keywords: string[];
  }[];
}

export interface PreOpLessonItem {
  id: string;
  stepNumber: number;
  iconEmoji: string;
  sceneBadgeText: Record<AppLanguage, string>;
  karePreset: KareCostumePreset;
  contentVersion: number;
  reviewStatus: Record<AppLanguage, ContentReviewStatus>;
  sourceReferenceIds: string[];
  variants: Record<AppLanguage, PreOpLessonVariant>;
}

/* -------------------------------------------------------------------------- */
/* 3. POST-OP APPOINTMENT CAPTURE, TRANSCRIPTS & UNCERTAINTY FLAGS            */
/* -------------------------------------------------------------------------- */

export type AppointmentCaptureState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'ready'
  | 'error';

export interface TranscriptSegment {
  id: string;
  timestampLabel: string;
  speaker: 'Clinician' | 'Caregiver';
  text: string;
}

export interface MachineTranscriptObject {
  id: string;
  version: number;
  sourceType: 'live-recording' | 'uploaded-audio' | 'sample-fixture';
  createdAt: number;
  verbatimText: string;
  segments: TranscriptSegment[];
}

export interface CorrectedTranscriptObject {
  id: string;
  version: number;
  basedOnMachineVersion: number;
  lastEditedAt: number;
  editedText: string;
  segments: TranscriptSegment[];
}

export type UncertaintyCategory =
  | 'unclear-speech'
  | 'ambiguous-medication'
  | 'conflicting-statement'
  | 'missing-detail';

export interface TranscriptUncertaintyFlag {
  id: string;
  segmentId: string;
  timestampLabel: string;
  category: UncertaintyCategory;
  description: Record<AppLanguage, string>;
  sourceExcerpt: string;
  blocksTaskOrStoryIds: string[];
  resolvedByCaregiver: boolean;
  caregiverClarificationNote: string;
}

/* -------------------------------------------------------------------------- */
/* 4. PLAIN-LANGUAGE SUMMARY & VERSIONED STORY DRAFT                          */
/* -------------------------------------------------------------------------- */

export interface SummaryLinkedItem {
  id: string;
  text: string;
  sourceSegmentId: string;
  timestampLabel: string;
  sourceQuote: string;
  hasUnresolvedUncertainty?: boolean;
}

export interface PlainLanguageSummaryDraft {
  id: string;
  version: number;
  basedOnTranscriptVersion: number;
  reviewStatus: 'unreviewed' | 'reviewed' | 'stale';
  reviewedAt: number | null;
  whatWasDiscussed: SummaryLinkedItem[];
  whatToDo: SummaryLinkedItem[];
  whenToSeekHelp: SummaryLinkedItem[];
  questionsToClarify: SummaryLinkedItem[];
}

export interface BearStoryPage {
  id: string;
  pageNumber: number;
  title: string;
  bodyText: string;
  extraDetailText: string;
  sourceSummaryItemId: string;
  sourceQuote: string;
  karePreset: KareCostumePreset;
}

export interface BearStoryDraft {
  id: string;
  version: number;
  originatingSummaryVersion: number;
  language: AppLanguage;
  ageBand: AgeBand;
  detailLevel: DetailPreference;
  status: 'draft' | 'released' | 'stale';
  releasedAt: number | null;
  narrationVersion: number;
  flaggedReassuranceWarnings: string[];
  pages: BearStoryPage[];
}

/* -------------------------------------------------------------------------- */
/* 5. POST-OP CARE TASKS & IDEMPOTENT REWARD LEDGER                           */
/* -------------------------------------------------------------------------- */

export type CareTaskCategory =
  | 'hydration-nutrition'
  | 'rest-activity'
  | 'medication-caregiver-only'
  | 'symptom-check';

export type CareTaskApprovalState =
  | 'draft'
  | 'blocked-unresolved'
  | 'confirmed-for-child'
  | 'stale';

export interface PostOpCareTask {
  id: string;
  occurrenceId: string;
  sourceSummaryItemId: string;
  sourceSegmentId: string;
  timestampLabel: string;
  exactSourceInstruction: string;
  category: CareTaskCategory;
  title: Record<AppLanguage, string>;
  childFriendlyDescription: Record<AppLanguage, Record<AgeBand, string>>;
  /** Explicitly preserves supplied vs missing schedule/dose fields without inventing values */
  suppliedFields: {
    medicationOrItemName: string;
    doseSupplied: string | null; // null = missing in source
    frequencySupplied: string | null;
    clockTimesSupplied: string[] | null; // e.g. "twice daily" does NOT invent clock times!
    durationSupplied: string | null;
    routeSupplied: string | null;
  };
  unresolvedWarning: Record<AppLanguage, string> | null;
  approvalState: CareTaskApprovalState;
  /** Child can signal readiness or ask for help, but cannot confirm medication administration */
  childAskedHelpOrReady: boolean;
  /** Only a caregiver can confirm that a task/medication occurrence was completed */
  caregiverConfirmedCompletion: boolean;
  caregiverConfirmedAt: number | null;
  pointsValue: number;
}

export interface RewardLedgerEntry {
  occurrenceId: string;
  label: string;
  pointsDelta: number;
  status: 'active' | 'corrected-revoked';
  timestamp: number;
  correctionReason?: string;
}

export interface CosmeticRewardItem {
  id: string;
  name: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
  costPoints: number;
  iconEmoji: string;
  mascotAccessoryPreview?: KareCostumePreset;
}

export interface RewardLedgerState {
  entries: Record<string, RewardLedgerEntry>;
  unlockedCosmeticIds: string[];
  equippedCosmeticId: string | null;
}

/* -------------------------------------------------------------------------- */
/* 6. PURE FUNCTIONS: STALENESS, GUARDRAILS & IDEMPOTENT REWARD ACCOUNTING    */
/* -------------------------------------------------------------------------- */

const DISALLOWED_REASSURANCE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bit\s+won'?t\s+hurt\b/i, label: 'it won\'t hurt' },
  { pattern: /\bcannot\s+hurt\b/i, label: 'cannot hurt' },
  { pattern: /\bpainless\b/i, label: 'painless' },
  {
    pattern: /\byou(?:'ll|\s+will)\s+get\s+better\s+soon\b/i,
    label: 'you\'ll get better soon',
  },
  {
    pattern: /\beverything\s+will\s+be\s+fine\b/i,
    label: 'everything will be fine',
  },
  {
    pattern: /\bguaranteed\s+to\b/i,
    label: 'guaranteed outcome',
  },
  {
    pattern: /\bne\s+fera\s+pas\s+mal\b/i,
    label: 'ne fera pas mal (promise of no pain)',
  },
];

/**
 * Checks generated or edited story text for false reassurance promises
 * (per Technical Consultation recommendation by Melvin & Ellen).
 */
export function detectDisallowedReassurancePhrases(text: string): string[] {
  const found: string[] = [];
  for (const item of DISALLOWED_REASSURANCE_PATTERNS) {
    if (item.pattern.test(text)) {
      found.push(item.label);
    }
  }
  return found;
}

/**
 * Checks whether a task or story item is blocked by any unresolved uncertainty flag.
 */
export function isItemBlockedByUncertainty(
  itemId: string,
  flags: readonly TranscriptUncertaintyFlag[]
): boolean {
  return flags.some(
    (flag) =>
      !flag.resolvedByCaregiver && flag.blocksTaskOrStoryIds.includes(itemId)
  );
}

/**
 * Computes total active points from the idempotent reward ledger.
 * Never drops below 0 and never penalizes for unconfirmed tasks.
 */
export function calculateTotalPoints(ledger: RewardLedgerState): number {
  let sum = 0;
  for (const entry of Object.values(ledger.entries)) {
    if (entry.status === 'active') {
      sum += entry.pointsDelta;
    }
  }
  return Math.max(0, sum);
}

/**
 * Idempotently awards points once per unique occurrenceId.
 * Repeated taps, retries, or duplicate completion events for the same occurrenceId
 * return the unchanged ledger without multiplying rewards.
 */
export function awardRewardForOccurrence(
  ledger: RewardLedgerState,
  occurrenceId: string,
  points: number,
  label: string
): RewardLedgerState {
  if (!occurrenceId || points <= 0) return ledger;

  const existing = ledger.entries[occurrenceId];
  if (existing && existing.status === 'active') {
    // Idempotent no-op: already awarded for this unique occurrence
    return ledger;
  }

  return {
    ...ledger,
    entries: {
      ...ledger.entries,
      [occurrenceId]: {
        occurrenceId,
        label,
        pointsDelta: points,
        status: 'active',
        timestamp: Date.now(),
      },
    },
  };
}

/**
 * Record correction: revokes an accidental caregiver confirmation and recalculates
 * points to match valid event history (labelled as a record correction, never a penalty).
 */
export function revokeRewardOccurrence(
  ledger: RewardLedgerState,
  occurrenceId: string,
  reason = 'Caregiver record correction (accidental tap)'
): RewardLedgerState {
  const existing = ledger.entries[occurrenceId];
  if (!existing || existing.status === 'corrected-revoked') {
    return ledger;
  }

  return {
    ...ledger,
    entries: {
      ...ledger.entries,
      [occurrenceId]: {
        ...existing,
        status: 'corrected-revoked',
        correctionReason: reason,
        timestamp: Date.now(),
      },
    },
  };
}

/**
 * Propagates staleness when a caregiver edits the corrected transcript:
 * marks the summary, story draft, and confirmed tasks as 'stale' so outdated
 * guidance never remains silently approved or released to the child view.
 */
export function propagateTranscriptEditStaleness(
  summary: PlainLanguageSummaryDraft,
  story: BearStoryDraft | null,
  tasks: readonly PostOpCareTask[]
): {
  summary: PlainLanguageSummaryDraft;
  story: BearStoryDraft | null;
  tasks: PostOpCareTask[];
} {
  const nextSummary: PlainLanguageSummaryDraft = {
    ...summary,
    reviewStatus: 'stale',
  };

  const nextStory: BearStoryDraft | null = story
    ? {
        ...story,
        status: 'stale',
      }
    : null;

  const nextTasks: PostOpCareTask[] = tasks.map((t) =>
    t.approvalState === 'confirmed-for-child'
      ? { ...t, approvalState: 'stale' }
      : t
  );

  return {
    summary: nextSummary,
    story: nextStory,
    tasks: nextTasks,
  };
}

/**
 * Propagates staleness when a caregiver edits the plain-language summary:
 * marks any previously released story draft and confirmed tasks as 'stale',
 * requiring caregiver re-review before child release.
 */
export function propagateSummaryEditStaleness(
  story: BearStoryDraft | null,
  tasks: readonly PostOpCareTask[]
): {
  story: BearStoryDraft | null;
  tasks: PostOpCareTask[];
} {
  const nextStory: BearStoryDraft | null = story
    ? {
        ...story,
        status: 'stale',
      }
    : null;

  const nextTasks: PostOpCareTask[] = tasks.map((t) =>
    t.approvalState === 'confirmed-for-child'
      ? { ...t, approvalState: 'stale' }
      : t
  );

  return {
    story: nextStory,
    tasks: nextTasks,
  };
}
