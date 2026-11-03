/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareBEAR V0 Clickable Prototype — Main Application Shell
 *
 * Primary Experience:
 * - Pre-Operative Preparation Hub (8 illustrated hospital equipment & procedure lessons,
 *   adapted by age band 3-6 / 7-9 / 10-12, English / French, and Simple / Extra Detail).
 * - Adult-Activated Post-Operative Recovery Mode (caregiver appointment capture,
 *   immutable machine transcript vs. editable corrected transcript, uncertainty resolution,
 *   plain-language summary, versioned 3-page bear story release, caregiver-confirmed tasks,
 *   and idempotent positive rewards).
 * - Dedicated Parent Resources Tab (verified sources, session care-team contacts, reserved testimonials).
 *
 * Regression Area:
 * - Demo Examples: Non-Waterproof Arm Cast Journey (S1–S8) preserved intact.
 */

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  HeartPulse,
  Home as HomeIcon,
  Lock,
  RotateCcw,
  Settings,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import {
  RECOVERY_POINTS,
  SICKKIDS_SOURCE_INFO,
  STORY_PAGES,
  UI_COPY,
} from './data/demoContent';
import {
  buildGroundedStoryDraftFromSummary,
  INITIAL_POSTOP_TASKS,
  INITIAL_SUMMARY_DRAFT,
  INITIAL_UNCERTAINTY_FLAGS,
  PRE_OP_LESSONS,
  SAMPLE_MACHINE_TRANSCRIPT,
  SURGERY_UI_COPY,
  VERIFIED_SOURCES,
} from './data/surgeryContent';
import {
  awardRewardForOccurrence,
  calculateTotalPoints,
  detectDisallowedReassurancePhrases,
  propagateSummaryEditStaleness,
  propagateTranscriptEditStaleness,
  revokeRewardOccurrence,
  type BearStoryDraft,
  type CorrectedTranscriptObject,
  type MachineTranscriptObject,
  type PlainLanguageSummaryDraft,
  type PostOpActivationState,
  type PostOpCareTask,
  type PresentationPreferences,
  type RewardLedgerState,
  type TranscriptUncertaintyFlag,
} from './utils/surgeryDataModel';
import {
  advanceAfterComprehensionCheck,
  advanceStoryPage,
  appendExplainObservationTurn,
  approveCaregiverReview,
  createInitialDemoState,
  goToComprehensionCheckFromLearn,
  navigateBack,
  navigateHome,
  navigateToPointExplanation,
  openRetryLearnPage,
  selectComprehensionChoice,
  startChildRecoverySteps,
  startNewRecoverySession,
  startStoryJourney,
  type DemoState,
} from './utils/demoState';
import type {
  ExplainMessage,
  PointExplainObservation,
} from './utils/explainKareLogic';
import {
  S1HomeScreen,
  S2StoryPageScreen,
  S3StoryFinishScreen,
} from './components/StoryScreens';
import {
  S4GrownUpReviewScreen,
  S5HandoverScreen,
  S6LearnPageScreen,
  S7ComprehensionCheckScreen,
  S8FinishSummaryScreen,
} from './components/RecoveryScreens';
import {
  ActivatePostOpModal,
  CaregiverSetupModal,
  PreOpHubScreen,
  PreOpLessonDetailScreen,
} from './components/PreOpScreens';
import {
  PostOpWorkspace,
  type PostOpSubTab,
} from './components/PostOpScreens';
import { ParentResourcesScreen } from './components/ParentResourcesScreen';
import { FacilitatorModal } from './components/FacilitatorModal';
import { MascotDevPreviewModal } from './components/MascotDevPreviewModal';
import { KareMascot } from './mascot/KareMascot';
import {
  MascotRuntimeProvider,
  useMascotRuntime,
} from './mascot/MascotRuntimeContext';

type MainNavigationTab =
  | 'pre-op'
  | 'post-op'
  | 'parent-resources'
  | 'cast-demo';

const PREFS_STORAGE_KEY = 'karebear_presentation_prefs_v1';

const DEFAULT_PREFERENCES: PresentationPreferences = {
  ageBand: '7-9',
  language: 'en',
  detailLevel: 'simple',
  narrationEnabled: true,
};

function loadInitialPreferences(): PresentationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<PresentationPreferences>;
    return {
      ageBand:
        parsed.ageBand === '3-6' ||
        parsed.ageBand === '7-9' ||
        parsed.ageBand === '10-12'
          ? parsed.ageBand
          : '7-9',
      language: parsed.language === 'fr' ? 'fr' : 'en',
      detailLevel:
        parsed.detailLevel === 'extra-detail' ? 'extra-detail' : 'simple',
      narrationEnabled:
        typeof parsed.narrationEnabled === 'boolean'
          ? parsed.narrationEnabled
          : true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function createInitialCorrectedTranscript(
  machine: MachineTranscriptObject
): CorrectedTranscriptObject {
  return {
    id: `ct-${machine.id}`,
    version: 1,
    basedOnMachineVersion: machine.version,
    lastEditedAt: machine.createdAt,
    editedText: machine.verbatimText,
    segments: machine.segments.map((s) => ({ ...s })),
  };
}

function createInitialPreOpExplainMap(): Record<string, PointExplainObservation> {
  const map: Record<string, PointExplainObservation> = {};
  for (const lesson of PRE_OP_LESSONS) {
    map[lesson.id] = {
      pointId: lesson.id,
      messages: [],
      coveredLearningPointIds: [],
      lastUpdated: null,
    };
  }
  return map;
}

function AppShell() {
  const {
    renderMode,
    triggerTransientGesture,
    stopAllMascotMedia,
  } = useMascotRuntime();

  // 1. Presentation Preferences (only non-sensitive preferences saved locally)
  const [preferences, setPreferences] = useState<PresentationPreferences>(
    loadInitialPreferences
  );
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // 2. Main Navigation Tab (Surgery Pre-Op is the default main experience)
  const [activeTab, setActiveTab] = useState<MainNavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('journey') === 'cast') {
        return 'cast-demo';
      }
    }
    return 'pre-op';
  });

  // 3. Pre-Op Preparation State
  const [selectedPreOpLessonId, setSelectedPreOpLessonId] = useState<
    string | null
  >(null);
  const [preOpSelectedChoices, setPreOpSelectedChoices] = useState<
    Record<string, string>
  >({});
  const [preOpCompletedIds, setPreOpCompletedIds] = useState<string[]>([]);
  const [preOpExplainObservations, setPreOpExplainObservations] = useState<
    Record<string, PointExplainObservation>
  >(createInitialPreOpExplainMap);

  // 4. Adult Post-Op Activation & Post-Op Session State (Transient Memory Only)
  const [isActivatePostOpModalOpen, setIsActivatePostOpModalOpen] =
    useState(false);
  const [postOpActivation, setPostOpActivation] =
    useState<PostOpActivationState>({
      isActivated: false,
      activatedAt: null,
      confirmedAdultUnderstanding: false,
    });
  const [postOpSubTab, setPostOpSubTab] = useState<PostOpSubTab>(
    'caregiver-appointment'
  );
  const [recordingConsentChecked, setRecordingConsentChecked] = useState(false);
  const [machineTranscript, setMachineTranscript] =
    useState<MachineTranscriptObject | null>(SAMPLE_MACHINE_TRANSCRIPT);
  const [correctedTranscript, setCorrectedTranscript] =
    useState<CorrectedTranscriptObject | null>(() =>
      createInitialCorrectedTranscript(SAMPLE_MACHINE_TRANSCRIPT)
    );
  const [uncertaintyFlags, setUncertaintyFlags] = useState<
    TranscriptUncertaintyFlag[]
  >(() => INITIAL_UNCERTAINTY_FLAGS.map((f) => ({ ...f })));
  const [summaryDraft, setSummaryDraft] = useState<PlainLanguageSummaryDraft>(
    () => ({ ...INITIAL_SUMMARY_DRAFT })
  );
  const [storyDraft, setStoryDraft] = useState<BearStoryDraft>(() =>
    buildGroundedStoryDraftFromSummary(
      INITIAL_SUMMARY_DRAFT,
      DEFAULT_PREFERENCES.language,
      DEFAULT_PREFERENCES.ageBand,
      DEFAULT_PREFERENCES.detailLevel,
      1
    )
  );
  const [careTasks, setCareTasks] = useState<PostOpCareTask[]>(() =>
    INITIAL_POSTOP_TASKS.map((t) => ({ ...t }))
  );
  const [rewardLedger, setRewardLedger] = useState<RewardLedgerState>({
    entries: {},
    unlockedCosmeticIds: [],
    equippedCosmeticId: null,
  });

  // 5. Cast Demo State (Preserved intact for regression testing)
  const [castState, setCastState] = useState<DemoState>(() => {
    const initial = createInitialDemoState();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' && params.get('journey') === 'cast') {
        return startStoryJourney(initial);
      }
    }
    return initial;
  });

  const [isFacilitatorModalOpen, setIsFacilitatorModalOpen] = useState(false);
  const [isMascotPreviewModalOpen, setIsMascotPreviewModalOpen] = useState(
    () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('mascotPreview') === '1';
      }
      return false;
    }
  );

  // Stop speech synthesis and scroll to top on navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [
    activeTab,
    selectedPreOpLessonId,
    postOpSubTab,
    castState.currentScreen,
    castState.storyPageIndex,
    castState.activeRecoveryIndex,
  ]);

  /* ------------------------------------------------------------------------ */
  /* PREFERENCES & SETUP HANDLERS                                             */
  /* ------------------------------------------------------------------------ */
  const handleSavePreferences = (next: PresentationPreferences) => {
    setPreferences(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }

    // Re-adapt the current story draft presentation if it hasn't been manually edited
    setStoryDraft((prev) => {
      const rebuilt = buildGroundedStoryDraftFromSummary(
        summaryDraft,
        next.language,
        next.ageBand,
        next.detailLevel,
        prev.version + 1
      );
      return {
        ...rebuilt,
        status: prev.status,
        releasedAt: prev.releasedAt,
      };
    });
  };

  /* ------------------------------------------------------------------------ */
  /* PRE-OP HANDLERS                                                          */
  /* ------------------------------------------------------------------------ */
  const handleSelectPreOpLesson = (lessonId: string) => {
    stopAllMascotMedia('waving');
    setSelectedPreOpLessonId(lessonId);
    setPreOpCompletedIds((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
  };

  const handleSelectPreOpChoice = (lessonId: string, choiceId: string) => {
    setPreOpSelectedChoices((prev) => ({ ...prev, [lessonId]: choiceId }));
    setPreOpCompletedIds((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
  };

  const handleRecordPreOpExplainTurn = (
    pointId: string,
    newMessages: ExplainMessage[],
    coveredIds: string[]
  ) => {
    setPreOpExplainObservations((prev) => {
      const existing = prev[pointId] ?? {
        pointId,
        messages: [],
        coveredLearningPointIds: [],
        lastUpdated: null,
      };
      return {
        ...prev,
        [pointId]: {
          pointId,
          messages: [...existing.messages, ...newMessages],
          coveredLearningPointIds: Array.from(
            new Set([...existing.coveredLearningPointIds, ...coveredIds])
          ),
          lastUpdated: Date.now(),
        },
      };
    });
  };

  /* ------------------------------------------------------------------------ */
  /* POST-OP HANDLERS (STALENESS, UNCERTAINTIES, STORY RELEASE, REWARDS)      */
  /* ------------------------------------------------------------------------ */
  const handleConfirmActivatePostOp = () => {
    setIsActivatePostOpModalOpen(false);
    stopAllMascotMedia('waving');
    setPostOpActivation({
      isActivated: true,
      activatedAt: Date.now(),
      confirmedAdultUnderstanding: true,
    });
    setActiveTab('post-op');
    setPostOpSubTab('caregiver-appointment');
  };

  const handleLoadSampleFixture = () => {
    setMachineTranscript(SAMPLE_MACHINE_TRANSCRIPT);
    setCorrectedTranscript(
      createInitialCorrectedTranscript(SAMPLE_MACHINE_TRANSCRIPT)
    );
    setUncertaintyFlags(INITIAL_UNCERTAINTY_FLAGS.map((f) => ({ ...f })));
    setSummaryDraft({ ...INITIAL_SUMMARY_DRAFT });
    setStoryDraft(
      buildGroundedStoryDraftFromSummary(
        INITIAL_SUMMARY_DRAFT,
        preferences.language,
        preferences.ageBand,
        preferences.detailLevel,
        storyDraft.version + 1
      )
    );
    setCareTasks(INITIAL_POSTOP_TASKS.map((t) => ({ ...t })));
  };

  const handleLiveTranscriptCaptured = (liveMt: MachineTranscriptObject) => {
    setMachineTranscript(liveMt);
    setCorrectedTranscript(createInitialCorrectedTranscript(liveMt));
    const propagated = propagateTranscriptEditStaleness(
      summaryDraft,
      storyDraft,
      careTasks
    );
    setSummaryDraft(propagated.summary);
    if (propagated.story) setStoryDraft(propagated.story);
    setCareTasks(propagated.tasks);
  };

  const handleDiscardSessionData = () => {
    stopAllMascotMedia(null);
    setRecordingConsentChecked(false);
    setMachineTranscript(null);
    setCorrectedTranscript(null);
    setUncertaintyFlags([]);
    setSummaryDraft({
      ...INITIAL_SUMMARY_DRAFT,
      version: summaryDraft.version + 1,
      reviewStatus: 'unreviewed',
      reviewedAt: null,
      whatWasDiscussed: [],
      whatToDo: [],
      whenToSeekHelp: [],
      questionsToClarify: [],
    });
    setStoryDraft((prev) => ({
      ...prev,
      status: 'stale',
      releasedAt: null,
    }));
  };

  const handleEditTranscriptSegment = (segmentId: string, newText: string) => {
    if (!correctedTranscript) return;
    const nextSegments = correctedTranscript.segments.map((s) =>
      s.id === segmentId ? { ...s, text: newText } : s
    );
    const nextVersion = correctedTranscript.version + 1;
    setCorrectedTranscript({
      ...correctedTranscript,
      version: nextVersion,
      lastEditedAt: Date.now(),
      editedText: nextSegments.map((s) => `${s.speaker}: ${s.text}`).join('\n'),
      segments: nextSegments,
    });

    // Automatically mark downstream summary, story, and confirmed tasks as 'stale'
    const propagated = propagateTranscriptEditStaleness(
      summaryDraft,
      storyDraft,
      careTasks
    );
    setSummaryDraft(propagated.summary);
    if (propagated.story) setStoryDraft(propagated.story);
    setCareTasks(propagated.tasks);
  };

  const handleResolveUncertaintyFlag = (
    flagId: string,
    resolved: boolean,
    clarificationNote: string
  ) => {
    const nextFlags = uncertaintyFlags.map((f) =>
      f.id === flagId
        ? {
            ...f,
            resolvedByCaregiver: resolved,
            caregiverClarificationNote: clarificationNote,
          }
        : f
    );
    setUncertaintyFlags(nextFlags);

    // Update task approval state when blocking flags change
    setCareTasks((prevTasks) =>
      prevTasks.map((task) => {
        const stillBlocked = nextFlags.some(
          (fl) =>
            !fl.resolvedByCaregiver &&
            fl.blocksTaskOrStoryIds.includes(task.id)
        );
        if (!stillBlocked && task.approvalState === 'blocked-unresolved') {
          return { ...task, approvalState: 'draft' };
        }
        if (stillBlocked && task.approvalState !== 'blocked-unresolved') {
          return { ...task, approvalState: 'blocked-unresolved' };
        }
        return task;
      })
    );
  };

  const handleEditSummaryItem = (
    section:
      | 'whatWasDiscussed'
      | 'whatToDo'
      | 'whenToSeekHelp'
      | 'questionsToClarify',
    itemId: string,
    newText: string
  ) => {
    const nextSummary: PlainLanguageSummaryDraft = {
      ...summaryDraft,
      version: summaryDraft.version + 1,
      reviewStatus: 'unreviewed',
      reviewedAt: null,
      [section]: summaryDraft[section].map((item) =>
        item.id === itemId ? { ...item, text: newText } : item
      ),
    };
    setSummaryDraft(nextSummary);

    // Editing the summary marks any downstream story & confirmed tasks as 'stale'
    const propagated = propagateSummaryEditStaleness(storyDraft, careTasks);
    if (propagated.story) setStoryDraft(propagated.story);
    setCareTasks(propagated.tasks);
  };

  const handleMarkSummaryReviewed = () => {
    const reviewedSummary: PlainLanguageSummaryDraft = {
      ...summaryDraft,
      reviewStatus: 'reviewed',
      reviewedAt: Date.now(),
    };
    setSummaryDraft(reviewedSummary);
  };

  const handleEditStoryPage = (
    pageId: string,
    field: 'title' | 'bodyText' | 'extraDetailText',
    value: string
  ) => {
    setStoryDraft((prev) => {
      const nextPages = prev.pages.map((p) =>
        p.id === pageId ? { ...p, [field]: value } : p
      );
      const allText = nextPages
        .map((p) => `${p.title} ${p.bodyText} ${p.extraDetailText}`)
        .join(' ');
      const warnings = detectDisallowedReassurancePhrases(allText);
      return {
        ...prev,
        version: prev.version + 1,
        narrationVersion: prev.narrationVersion + 1,
        status: prev.status === 'released' ? 'draft' : prev.status,
        flaggedReassuranceWarnings: warnings,
        pages: nextPages,
      };
    });
  };

  const handleReleaseStoryToChild = () => {
    if (
      summaryDraft.reviewStatus !== 'reviewed' ||
      storyDraft.flaggedReassuranceWarnings.length > 0
    ) {
      return;
    }
    setStoryDraft((prev) => ({
      ...prev,
      originatingSummaryVersion: summaryDraft.version,
      status: 'released',
      releasedAt: Date.now(),
    }));
    setPostOpSubTab('postop-dashboard');
  };

  const handleApproveTaskForChild = (taskId: string) => {
    setCareTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, approvalState: 'confirmed-for-child' } : t
      )
    );
  };

  const handleChildTapReadyOrHelp = (taskId: string) => {
    setCareTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, childAskedHelpOrReady: !t.childAskedHelpOrReady }
          : t
      )
    );
  };

  const handleCaregiverConfirmTask = (taskId: string) => {
    const target = careTasks.find((t) => t.id === taskId);
    if (!target) return;

    setCareTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              approvalState: 'confirmed-for-child',
              caregiverConfirmedCompletion: true,
              caregiverConfirmedAt: Date.now(),
            }
          : t
      )
    );

    // Idempotent reward award keyed by unique occurrenceId
    setRewardLedger((prevLedger) =>
      awardRewardForOccurrence(
        prevLedger,
        target.occurrenceId,
        target.pointsValue,
        target.title[preferences.language]
      )
    );
  };

  const handleCaregiverRevokeTask = (taskId: string) => {
    const target = careTasks.find((t) => t.id === taskId);
    if (!target) return;

    setCareTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              caregiverConfirmedCompletion: false,
              caregiverConfirmedAt: null,
            }
          : t
      )
    );

    setRewardLedger((prevLedger) =>
      revokeRewardOccurrence(
        prevLedger,
        target.occurrenceId,
        preferences.language === 'fr'
          ? 'Correction du dossier par le parent'
          : 'Caregiver record correction'
      )
    );
  };

  const handleUnlockOrEquipCosmetic = (
    cosmeticId: string,
    costPoints: number
  ) => {
    setRewardLedger((prev) => {
      const total = calculateTotalPoints(prev);
      const alreadyUnlocked = prev.unlockedCosmeticIds.includes(cosmeticId);
      if (!alreadyUnlocked && total < costPoints) {
        return prev;
      }
      return {
        ...prev,
        unlockedCosmeticIds: alreadyUnlocked
          ? prev.unlockedCosmeticIds
          : [...prev.unlockedCosmeticIds, cosmeticId],
        equippedCosmeticId:
          prev.equippedCosmeticId === cosmeticId ? null : cosmeticId,
      };
    });
  };

  /* ------------------------------------------------------------------------ */
  /* CAST DEMO REGRESSION HANDLERS                                            */
  /* ------------------------------------------------------------------------ */
  const handleCastNavigateHome = () => {
    stopAllMascotMedia('waving');
    setCastState((prev) => navigateHome(prev));
  };

  const handleCastNavigateBack = () => {
    stopAllMascotMedia(null);
    setCastState((prev) => navigateBack(prev));
  };

  const handleResetAllDemo = () => {
    stopAllMascotMedia('waving');
    setSelectedPreOpLessonId(null);
    setPreOpSelectedChoices({});
    setPreOpCompletedIds([]);
    setPreOpExplainObservations(createInitialPreOpExplainMap());
    setPostOpActivation({
      isActivated: false,
      activatedAt: null,
      confirmedAdultUnderstanding: false,
    });
    handleLoadSampleFixture();
    setRewardLedger({
      entries: {},
      unlockedCosmeticIds: [],
      equippedCosmeticId: null,
    });
    setCastState(createInitialDemoState());
    setActiveTab('pre-op');
  };

  const lang = preferences.language;
  const navCopy = SURGERY_UI_COPY[lang].topNav;
  const activePreOpLesson = PRE_OP_LESSONS.find(
    (l) => l.id === selectedPreOpLessonId
  );

  return (
    <div
      data-screen={
        activeTab === 'cast-demo' ? castState.currentScreen : activeTab
      }
      className="min-h-screen flex flex-col justify-between bg-[#FFF8EC] text-[#3A2E26]"
    >
      {/* GLOBAL HEADER & MODE SWITCHER */}
      <header className="border-b-2 border-[#3A2E26]/15 bg-[#FFFDF8] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-3">
          {/* Top Row: Brand + Quick Setup + Reset */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  stopAllMascotMedia('waving');
                  setSelectedPreOpLessonId(null);
                  setActiveTab('pre-op');
                }}
                aria-label="KareBEAR Home"
                className="inline-flex items-center gap-2.5 font-child text-2xl font-extrabold tracking-tight text-[#1F6F6B] hover:underline whitespace-nowrap cursor-pointer"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1F6F6B]/30 bg-white p-0.5">
                  <KareMascot
                    size="xs"
                    preset="neutral"
                    state="idle"
                    renderMode={renderMode}
                    decorative={true}
                    className="h-8 w-8"
                  />
                </span>
                <span>{UI_COPY.appName}</span>
              </button>

              <span className="hidden sm:inline-block rounded-lg border border-[#1F6F6B]/30 bg-[#DDF1EE]/60 px-2.5 py-1 text-xs font-extrabold text-[#1F6F6B]">
                {lang.toUpperCase()} · {preferences.ageBand} yrs ·{' '}
                {preferences.detailLevel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-3.5 py-2 text-sm font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{navCopy.setupBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFacilitatorModalOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#3A2E26]/25 bg-[#FFF8EC] px-3.5 py-2 text-sm font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/50 cursor-pointer"
              >
                <span>
                  {lang === 'fr' ? 'Guide Animateur' : 'Host Guide'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetAllDemo}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-3.5 py-2 text-sm font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#FDE8D4]/60 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{navCopy.resetBtn}</span>
              </button>
            </div>
          </div>

          {/* Second Row: Main Experience Navigation Tabs */}
          <nav
            aria-label="Primary application sections"
            className="flex flex-wrap items-center gap-2 border-t border-[#3A2E26]/10 pt-2.5"
          >
            <button
              type="button"
              onClick={() => {
                stopAllMascotMedia(null);
                setSelectedPreOpLessonId(null);
                setActiveTab('pre-op');
              }}
              aria-current={activeTab === 'pre-op' ? 'page' : undefined}
              className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition-colors cursor-pointer ${
                activeTab === 'pre-op'
                  ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                  : 'border-[#3A2E26]/20 bg-[#FFF8EC] text-[#3A2E26] hover:bg-[#DDF1EE]/60'
              }`}
            >
              <HeartPulse className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{navCopy.preOpHub}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!postOpActivation.isActivated) {
                  setIsActivatePostOpModalOpen(true);
                } else {
                  stopAllMascotMedia(null);
                  setActiveTab('post-op');
                }
              }}
              aria-current={activeTab === 'post-op' ? 'page' : undefined}
              className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition-colors cursor-pointer ${
                activeTab === 'post-op'
                  ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                  : postOpActivation.isActivated
                  ? 'border-[#E76F51] bg-[#FDE8D4]/60 text-[#3A2E26] hover:bg-[#FDE8D4]'
                  : 'border-[#3A2E26]/20 bg-[#FFF8EC] text-[#3A2E26] hover:bg-[#FDE8D4]/50'
              }`}
            >
              {postOpActivation.isActivated ? (
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-[#E76F51]" aria-hidden="true" />
              )}
              <span>
                {postOpActivation.isActivated
                  ? navCopy.postOpHub
                  : navCopy.activatePostOpBtn}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAllMascotMedia(null);
                setActiveTab('parent-resources');
              }}
              aria-current={
                activeTab === 'parent-resources' ? 'page' : undefined
              }
              className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition-colors cursor-pointer ${
                activeTab === 'parent-resources'
                  ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                  : 'border-[#3A2E26]/20 bg-[#FFF8EC] text-[#3A2E26] hover:bg-[#DDF1EE]/60'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{navCopy.parentResources}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAllMascotMedia(null);
                setActiveTab('cast-demo');
              }}
              aria-current={activeTab === 'cast-demo' ? 'page' : undefined}
              className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors cursor-pointer ${
                activeTab === 'cast-demo'
                  ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                  : 'border-[#3A2E26]/20 bg-[#FFF8EC] text-[#3A2E26] hover:bg-[#DDF1EE]/60'
              }`}
            >
              <Stethoscope className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{navCopy.castDemo}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-8 sm:py-5">
        {/* 1. PRE-OP PREPARATION HUB & 8 LESSONS */}
        {activeTab === 'pre-op' && !activePreOpLesson && (
          <PreOpHubScreen
            preferences={preferences}
            completedLessonIds={preOpCompletedIds}
            postOpActivation={postOpActivation}
            onSelectLesson={handleSelectPreOpLesson}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
            onRequestActivatePostOp={() => setIsActivatePostOpModalOpen(true)}
            onOpenPostOpDashboard={() => {
              setActiveTab('post-op');
              setPostOpSubTab('postop-dashboard');
            }}
            onOpenParentResources={() => setActiveTab('parent-resources')}
            onOpenCastDemo={() => setActiveTab('cast-demo')}
            onOpenFacilitatorModal={() => setIsFacilitatorModalOpen(true)}
          />
        )}

        {activeTab === 'pre-op' && activePreOpLesson && (
          <PreOpLessonDetailScreen
            lesson={activePreOpLesson}
            preferences={preferences}
            selectedChoiceId={
              preOpSelectedChoices[activePreOpLesson.id] ?? null
            }
            observation={
              preOpExplainObservations[activePreOpLesson.id] ?? {
                pointId: activePreOpLesson.id,
                messages: [],
                coveredLearningPointIds: [],
                lastUpdated: null,
              }
            }
            onSelectChoice={handleSelectPreOpChoice}
            onRecordExplainTurn={handleRecordPreOpExplainTurn}
            onBackToHub={() => setSelectedPreOpLessonId(null)}
            onSelectLesson={handleSelectPreOpLesson}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
          />
        )}

        {/* 2. ADULT-ACTIVATED POST-OP RECOVERY WORKSPACE */}
        {activeTab === 'post-op' && (
          <PostOpWorkspace
            preferences={preferences}
            activeSubTab={postOpSubTab}
            onChangeSubTab={setPostOpSubTab}
            captureState="ready"
            recordingConsentChecked={recordingConsentChecked}
            onToggleRecordingConsent={setRecordingConsentChecked}
            machineTranscript={machineTranscript}
            correctedTranscript={correctedTranscript}
            uncertaintyFlags={uncertaintyFlags}
            summaryDraft={summaryDraft}
            storyDraft={storyDraft}
            careTasks={careTasks}
            rewardLedger={rewardLedger}
            onLoadSampleFixture={handleLoadSampleFixture}
            onLiveTranscriptCaptured={handleLiveTranscriptCaptured}
            onDiscardSessionData={handleDiscardSessionData}
            onEditTranscriptSegment={handleEditTranscriptSegment}
            onResolveUncertaintyFlag={handleResolveUncertaintyFlag}
            onUpdateSummaryFromServer={(nextSummary) => {
              setSummaryDraft(nextSummary);
              const propagated = propagateSummaryEditStaleness(
                storyDraft,
                careTasks
              );
              if (propagated.story) setStoryDraft(propagated.story);
              setCareTasks(propagated.tasks);
            }}
            onEditSummaryItem={handleEditSummaryItem}
            onMarkSummaryReviewed={handleMarkSummaryReviewed}
            onUpdateStoryDraft={setStoryDraft}
            onEditStoryPage={handleEditStoryPage}
            onReleaseStoryToChild={handleReleaseStoryToChild}
            onApproveTaskForChild={handleApproveTaskForChild}
            onChildTapReadyOrHelp={handleChildTapReadyOrHelp}
            onCaregiverConfirmTask={handleCaregiverConfirmTask}
            onCaregiverRevokeTask={handleCaregiverRevokeTask}
            onUnlockOrEquipCosmetic={handleUnlockOrEquipCosmetic}
            onReturnToPreOp={() => {
              setSelectedPreOpLessonId(null);
              setActiveTab('pre-op');
            }}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
          />
        )}

        {/* 3. DEDICATED PARENT RESOURCES TAB */}
        {activeTab === 'parent-resources' && (
          <ParentResourcesScreen language={preferences.language} />
        )}

        {/* 4. DEMO EXAMPLES: NON-WATERPROOF ARM CAST REGRESSION JOURNEY (S1–S8) */}
        {activeTab === 'cast-demo' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#1F6F6B]/30 bg-[#DDF1EE]/45 px-4 py-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                  Demo Examples · Regression Testing Area
                </span>
                <p className="text-sm font-bold text-[#3A2E26]">
                  Non-Waterproof Arm Cast Journey (S1–S8) — Preserved intact
                  alongside the primary Surgical Pre-Op &amp; Post-Op experience.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {castState.currentScreen !== 'S1' && (
                  <button
                    type="button"
                    onClick={handleCastNavigateHome}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border-2 border-[#1F6F6B] bg-[#FFFDF8] px-3.5 py-1.5 text-sm font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                  >
                    <HomeIcon className="h-4 w-4" aria-hidden="true" />
                    <span>Cast Demo Home (S1)</span>
                  </button>
                )}
              </div>
            </div>

            {castState.currentScreen === 'S1' && (
              <S1HomeScreen
                state={castState}
                onStartStory={() => {
                  stopAllMascotMedia('waving');
                  setCastState((prev) => startStoryJourney(prev));
                }}
                onStartNewRecovery={() => {
                  stopAllMascotMedia(null);
                  setCastState((prev) => startNewRecoverySession(prev));
                }}
                onResumeRecovery={() => {
                  const allCompleted = RECOVERY_POINTS.every(
                    (p) => castState.pointAttempts[p.id]?.completed
                  );
                  stopAllMascotMedia(allCompleted ? 'celebrating' : 'waving');
                  if (allCompleted) {
                    setCastState((prev) => ({ ...prev, currentScreen: 'S8' }));
                  } else if (castState.caregiverApproved) {
                    setCastState((prev) => ({ ...prev, currentScreen: 'S6' }));
                  } else {
                    setCastState((prev) => ({ ...prev, currentScreen: 'S4' }));
                  }
                }}
                onOpenFacilitatorModal={() => setIsFacilitatorModalOpen(true)}
                onOpenMascotPreviewModal={() =>
                  setIsMascotPreviewModalOpen(true)
                }
              />
            )}

            {castState.currentScreen === 'S2' && (
              <S2StoryPageScreen
                state={castState}
                onToggleMoreAbout={(pageId) =>
                  setCastState((prev) => ({
                    ...prev,
                    expandedStoryMoreById: {
                      ...prev.expandedStoryMoreById,
                      [pageId]: !prev.expandedStoryMoreById[pageId],
                    },
                  }))
                }
                onBack={handleCastNavigateBack}
                onNext={() => {
                  const isLastStoryPage =
                    castState.storyPageIndex >= STORY_PAGES.length - 1;
                  stopAllMascotMedia(isLastStoryPage ? 'celebrating' : null);
                  setCastState((prev) => advanceStoryPage(prev));
                }}
              />
            )}

            {castState.currentScreen === 'S3' && (
              <S3StoryFinishScreen
                state={castState}
                onSelectFeeling={(id) =>
                  setCastState((prev) => ({
                    ...prev,
                    selectedStoryFeelingId: id,
                  }))
                }
                onSelectEnjoyment={(id) =>
                  setCastState((prev) => ({
                    ...prev,
                    selectedStoryEnjoymentId: id,
                  }))
                }
                onBack={handleCastNavigateBack}
                onHome={handleCastNavigateHome}
              />
            )}

            {castState.currentScreen === 'S4' && (
              <S4GrownUpReviewScreen
                state={castState}
                onToggleOriginalWording={(pointId) =>
                  setCastState((prev) => ({
                    ...prev,
                    expandedOriginalWordingByPointId: {
                      ...prev.expandedOriginalWordingByPointId,
                      [pointId]:
                        !prev.expandedOriginalWordingByPointId[pointId],
                    },
                  }))
                }
                onToggleSupplementalDetail={(pointId) =>
                  setCastState((prev) => ({
                    ...prev,
                    caregiverPreferences: {
                      ...prev.caregiverPreferences,
                      supplementalDetailByPointId: {
                        ...prev.caregiverPreferences
                          .supplementalDetailByPointId,
                        [pointId]:
                          !prev.caregiverPreferences
                            .supplementalDetailByPointId[pointId],
                      },
                    },
                  }))
                }
                onToggleExplainPrompts={() =>
                  setCastState((prev) => ({
                    ...prev,
                    caregiverPreferences: {
                      ...prev.caregiverPreferences,
                      showExplainPrompts:
                        !prev.caregiverPreferences.showExplainPrompts,
                    },
                  }))
                }
                onToggleReadAloud={() =>
                  setCastState((prev) => ({
                    ...prev,
                    caregiverPreferences: {
                      ...prev.caregiverPreferences,
                      enableReadAloud:
                        !prev.caregiverPreferences.enableReadAloud,
                    },
                  }))
                }
                onBack={handleCastNavigateBack}
                onApprove={() => {
                  stopAllMascotMedia('waving');
                  setCastState((prev) => approveCaregiverReview(prev));
                }}
              />
            )}

            {castState.currentScreen === 'S5' && (
              <S5HandoverScreen
                onBack={handleCastNavigateBack}
                onStartWithKare={() => {
                  stopAllMascotMedia('waving');
                  setCastState((prev) => startChildRecoverySteps(prev));
                }}
              />
            )}

            {castState.currentScreen === 'S6' && (
              <S6LearnPageScreen
                state={castState}
                onToggleLearnMore={(pointId) =>
                  setCastState((prev) => ({
                    ...prev,
                    expandedLearnMoreByPointId: {
                      ...prev.expandedLearnMoreByPointId,
                      [pointId]: !prev.expandedLearnMoreByPointId[pointId],
                    },
                  }))
                }
                onRecordExplainTurn={(pointId, newMessages, coveredIds) =>
                  setCastState((prev) =>
                    appendExplainObservationTurn(
                      prev,
                      pointId,
                      newMessages,
                      coveredIds
                    )
                  )
                }
                onJumpToExplanation={(pointId) => {
                  stopAllMascotMedia(null);
                  setCastState((prev) =>
                    navigateToPointExplanation(prev, pointId)
                  );
                }}
                onBack={handleCastNavigateBack}
                onProceedToCheck={() => {
                  stopAllMascotMedia(null);
                  setCastState((prev) => goToComprehensionCheckFromLearn(prev));
                }}
              />
            )}

            {castState.currentScreen === 'S7' && (
              <S7ComprehensionCheckScreen
                state={castState}
                onSelectChoice={(pointId, choiceId) => {
                  const point = RECOVERY_POINTS.find((p) => p.id === pointId);
                  const choice = point?.comprehensionCheck.choices.find(
                    (c) => c.id === choiceId
                  );
                  if (choice?.isCorrect) {
                    triggerTransientGesture('celebrating', 2600);
                  } else {
                    triggerTransientGesture('encouraging', 2600);
                  }
                  setCastState((prev) =>
                    selectComprehensionChoice(prev, pointId, choiceId)
                  );
                }}
                onLookAgain={() => {
                  stopAllMascotMedia('encouraging');
                  setCastState((prev) => openRetryLearnPage(prev));
                }}
                onNextStep={() => {
                  const isFinalPoint =
                    castState.activeRecoveryIndex >= RECOVERY_POINTS.length - 1;
                  stopAllMascotMedia(isFinalPoint ? 'celebrating' : null);
                  setCastState((prev) => advanceAfterComprehensionCheck(prev));
                }}
                onBack={handleCastNavigateBack}
                onRecordExplainTurn={(pointId, newMessages, coveredIds) =>
                  setCastState((prev) =>
                    appendExplainObservationTurn(
                      prev,
                      pointId,
                      newMessages,
                      coveredIds
                    )
                  )
                }
                onJumpToExplanation={(pointId) => {
                  stopAllMascotMedia(null);
                  setCastState((prev) =>
                    navigateToPointExplanation(prev, pointId)
                  );
                }}
              />
            )}

            {castState.currentScreen === 'S8' && (
              <S8FinishSummaryScreen
                state={castState}
                onSelectEnjoyment={(id) =>
                  setCastState((prev) => ({
                    ...prev,
                    selectedRecoveryEnjoymentId: id,
                  }))
                }
                onRecordExplainTurn={(pointId, newMessages, coveredIds) =>
                  setCastState((prev) =>
                    appendExplainObservationTurn(
                      prev,
                      pointId,
                      newMessages,
                      coveredIds
                    )
                  )
                }
                onJumpToExplanation={(pointId) => {
                  stopAllMascotMedia(null);
                  setCastState((prev) =>
                    navigateToPointExplanation(prev, pointId)
                  );
                }}
                onBack={handleCastNavigateBack}
                onHome={handleCastNavigateHome}
              />
            )}
          </div>
        )}
      </main>

      {/* GLOBAL DEMO FOOTER */}
      <footer className="border-t border-[#3A2E26]/15 bg-[#FFFDF8] px-4 py-3 text-sm text-[#3A2E26]/85 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-[#3A2E26]">
            {UI_COPY.demoFooterNote}{' '}
            <span className="font-normal">
              (Educational preparation &amp; post-op discharge review prototype
              · Not medical advice or discharge authorization.)
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={VERIFIED_SOURCES['boston-childrens-7551'].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#1F6F6B] underline hover:text-[#3A2E26]"
            >
              <span>Boston Children’s Pre-Op Guide</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
            <a
              href={VERIFIED_SOURCES['aap-anesthesia-day'].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#1F6F6B] underline hover:text-[#3A2E26]"
            >
              <span>AAP HealthyChildren Anesthesia</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
            <a
              href={SICKKIDS_SOURCE_INFO.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#1F6F6B] underline hover:text-[#3A2E26]"
            >
              <span>SickKids Cast Care</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>

      {/* Caregiver Setup Modal (Age Band, Language, Detail Preference, Narration) */}
      <CaregiverSetupModal
        isOpen={isSetupModalOpen}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onClose={() => setIsSetupModalOpen(false)}
      />

      {/* Adult Post-Op Mode Activation Modal */}
      <ActivatePostOpModal
        isOpen={isActivatePostOpModalOpen}
        language={preferences.language}
        onConfirmActivate={handleConfirmActivatePostOp}
        onClose={() => setIsActivatePostOpModalOpen(false)}
      />

      {/* Host / Facilitator Modal (Strictly outside child screens) */}
      <FacilitatorModal
        isOpen={isFacilitatorModalOpen}
        onClose={() => setIsFacilitatorModalOpen(false)}
      />

      {/* Developer-Only Mascot Kit Preview Modal (Strictly outside child screens) */}
      <MascotDevPreviewModal
        isOpen={isMascotPreviewModalOpen}
        onClose={() => setIsMascotPreviewModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <MascotRuntimeProvider>
      <AppShell />
    </MascotRuntimeProvider>
  );
}
