/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareBEAR V0 Clickable Prototype — Main Application Shell
 */

import React, { useEffect, useState } from 'react';
import { Home as HomeIcon, RotateCcw, ExternalLink } from 'lucide-react';
import {
  BEAR_ASSETS,
  RECOVERY_POINTS,
  SICKKIDS_SOURCE_INFO,
  STORY_PAGES,
  UI_COPY,
} from './data/demoContent';
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
import { FacilitatorModal } from './components/FacilitatorModal';

export default function App() {
  const [state, setState] = useState<DemoState>(() => {
    const initial = createInitialDemoState();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return startStoryJourney(initial);
      }
    }
    return initial;
  });

  const [isFacilitatorModalOpen, setIsFacilitatorModalOpen] = useState(false);

  // Stop any active speech synthesis and scroll to top when changing screens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [
    state.currentScreen,
    state.storyPageIndex,
    state.activeRecoveryIndex,
    state.isRetryLearnMode,
  ]);

  const handleResetDemo = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState(createInitialDemoState());
  };

  const handleResumeRecoverySession = () => {
    // Resume at S8 if all points are completed, or at S6/S7 for the active point, or S4
    const allCompleted = RECOVERY_POINTS.every(
      (p) => state.pointAttempts[p.id]?.completed
    );
    if (allCompleted) {
      setState((prev) => ({ ...prev, currentScreen: 'S8' }));
    } else if (state.caregiverApproved) {
      setState((prev) => ({ ...prev, currentScreen: 'S6' }));
    } else {
      setState((prev) => ({ ...prev, currentScreen: 'S4' }));
    }
  };

  // Compute progress label for the top bar
  const getProgressLabel = (): string => {
    switch (state.currentScreen) {
      case 'S1':
        return 'Home Menu';
      case 'S2':
        return `Page ${state.storyPageIndex + 1} of ${STORY_PAGES.length}`;
      case 'S3':
        return 'Story Complete';
      case 'S4':
        return 'Grown-up Review';
      case 'S5':
        return 'Handover to Child';
      case 'S6':
        return `Step ${state.activeRecoveryIndex + 1} of ${RECOVERY_POINTS.length} · ${
          state.isRetryLearnMode ? 'Take Another Look' : 'Learn'
        }`;
      case 'S7':
        return `Step ${state.activeRecoveryIndex + 1} of ${RECOVERY_POINTS.length} · Comprehension check`;
      case 'S8':
        return 'Finish & Caregiver Summary';
      default:
        return '';
    }
  };

  return (
    <div
      data-screen={state.currentScreen}
      className="min-h-screen flex flex-col justify-between bg-[#FFF8EC] text-[#3A2E26]"
    >
      {/* GLOBAL TOP BAR */}
      <header className="border-b-2 border-[#3A2E26]/15 bg-[#FFFDF8] px-4 py-2.5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          {/* Zone 1: Brand + Home button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setState((prev) => navigateHome(prev))}
              aria-label="KareBEAR Home"
              className="inline-flex items-center gap-2.5 font-child text-2xl font-extrabold tracking-tight text-[#1F6F6B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <img
                src={BEAR_ASSETS.companion.src}
                alt=""
                aria-hidden="true"
                className="h-9 w-9 rounded-full border border-[#1F6F6B]/30 bg-white object-contain p-0.5"
              />
              <span>{UI_COPY.appName}</span>
            </button>

            {state.currentScreen !== 'S1' && (
              <button
                type="button"
                onClick={() => setState((prev) => navigateHome(prev))}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Home</span>
              </button>
            )}
          </div>

          {/* Zone 2: Progress Indicator */}
          <div
            aria-live="polite"
            className="text-base sm:text-lg font-bold text-[#3A2E26] whitespace-nowrap truncate"
          >
            {getProgressLabel()}
          </div>

          {/* Zone 3: Reset Demo Control */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#FDE8D4]/60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-8 sm:py-5">
        {state.currentScreen === 'S1' && (
          <S1HomeScreen
            state={state}
            onStartStory={() => setState((prev) => startStoryJourney(prev))}
            onStartNewRecovery={() =>
              setState((prev) => startNewRecoverySession(prev))
            }
            onResumeRecovery={handleResumeRecoverySession}
            onOpenFacilitatorModal={() => setIsFacilitatorModalOpen(true)}
          />
        )}

        {state.currentScreen === 'S2' && (
          <S2StoryPageScreen
            state={state}
            onToggleMoreAbout={(pageId) =>
              setState((prev) => ({
                ...prev,
                expandedStoryMoreById: {
                  ...prev.expandedStoryMoreById,
                  [pageId]: !prev.expandedStoryMoreById[pageId],
                },
              }))
            }
            onBack={() => setState((prev) => navigateBack(prev))}
            onNext={() => setState((prev) => advanceStoryPage(prev))}
          />
        )}

        {state.currentScreen === 'S3' && (
          <S3StoryFinishScreen
            state={state}
            onSelectFeeling={(id) =>
              setState((prev) => ({ ...prev, selectedStoryFeelingId: id }))
            }
            onSelectEnjoyment={(id) =>
              setState((prev) => ({ ...prev, selectedStoryEnjoymentId: id }))
            }
            onBack={() => setState((prev) => navigateBack(prev))}
            onHome={() => setState((prev) => navigateHome(prev))}
          />
        )}

        {state.currentScreen === 'S4' && (
          <S4GrownUpReviewScreen
            state={state}
            onToggleOriginalWording={(pointId) =>
              setState((prev) => ({
                ...prev,
                expandedOriginalWordingByPointId: {
                  ...prev.expandedOriginalWordingByPointId,
                  [pointId]: !prev.expandedOriginalWordingByPointId[pointId],
                },
              }))
            }
            onToggleSupplementalDetail={(pointId) =>
              setState((prev) => ({
                ...prev,
                caregiverPreferences: {
                  ...prev.caregiverPreferences,
                  supplementalDetailByPointId: {
                    ...prev.caregiverPreferences.supplementalDetailByPointId,
                    [pointId]:
                      !prev.caregiverPreferences.supplementalDetailByPointId[
                        pointId
                      ],
                  },
                },
              }))
            }
            onToggleExplainPrompts={() =>
              setState((prev) => ({
                ...prev,
                caregiverPreferences: {
                  ...prev.caregiverPreferences,
                  showExplainPrompts:
                    !prev.caregiverPreferences.showExplainPrompts,
                },
              }))
            }
            onToggleReadAloud={() =>
              setState((prev) => ({
                ...prev,
                caregiverPreferences: {
                  ...prev.caregiverPreferences,
                  enableReadAloud: !prev.caregiverPreferences.enableReadAloud,
                },
              }))
            }
            onBack={() => setState((prev) => navigateBack(prev))}
            onApprove={() => setState((prev) => approveCaregiverReview(prev))}
          />
        )}

        {state.currentScreen === 'S5' && (
          <S5HandoverScreen
            onBack={() => setState((prev) => navigateBack(prev))}
            onStartWithKare={() =>
              setState((prev) => startChildRecoverySteps(prev))
            }
          />
        )}

        {state.currentScreen === 'S6' && (
          <S6LearnPageScreen
            state={state}
            onToggleLearnMore={(pointId) =>
              setState((prev) => ({
                ...prev,
                expandedLearnMoreByPointId: {
                  ...prev.expandedLearnMoreByPointId,
                  [pointId]: !prev.expandedLearnMoreByPointId[pointId],
                },
              }))
            }
            onRecordExplainTurn={(pointId, newMessages, coveredIds) =>
              setState((prev) =>
                appendExplainObservationTurn(prev, pointId, newMessages, coveredIds)
              )
            }
            onJumpToExplanation={(pointId) =>
              setState((prev) => navigateToPointExplanation(prev, pointId))
            }
            onBack={() => setState((prev) => navigateBack(prev))}
            onProceedToCheck={() =>
              setState((prev) => goToComprehensionCheckFromLearn(prev))
            }
          />
        )}

        {state.currentScreen === 'S7' && (
          <S7ComprehensionCheckScreen
            state={state}
            onSelectChoice={(pointId, choiceId) =>
              setState((prev) =>
                selectComprehensionChoice(prev, pointId, choiceId)
              )
            }
            onLookAgain={() => setState((prev) => openRetryLearnPage(prev))}
            onNextStep={() =>
              setState((prev) => advanceAfterComprehensionCheck(prev))
            }
            onBack={() => setState((prev) => navigateBack(prev))}
            onRecordExplainTurn={(pointId, newMessages, coveredIds) =>
              setState((prev) =>
                appendExplainObservationTurn(prev, pointId, newMessages, coveredIds)
              )
            }
            onJumpToExplanation={(pointId) =>
              setState((prev) => navigateToPointExplanation(prev, pointId))
            }
          />
        )}

        {state.currentScreen === 'S8' && (
          <S8FinishSummaryScreen
            state={state}
            onSelectEnjoyment={(id) =>
              setState((prev) => ({ ...prev, selectedRecoveryEnjoymentId: id }))
            }
            onRecordExplainTurn={(pointId, newMessages, coveredIds) =>
              setState((prev) =>
                appendExplainObservationTurn(prev, pointId, newMessages, coveredIds)
              )
            }
            onJumpToExplanation={(pointId) =>
              setState((prev) => navigateToPointExplanation(prev, pointId))
            }
            onBack={() => setState((prev) => navigateBack(prev))}
            onHome={() => setState((prev) => navigateHome(prev))}
          />
        )}
      </main>

      {/* GLOBAL DEMO FOOTER */}
      <footer className="border-t border-[#3A2E26]/15 bg-[#FFFDF8] px-4 py-3 text-sm text-[#3A2E26]/85 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-[#3A2E26]">
            {UI_COPY.demoFooterNote}{' '}
            <span className="font-normal">
              ({UI_COPY.nonWaterproofTag} · Selected learning examples, not a complete care plan.)
            </span>
          </p>

          <a
            href={SICKKIDS_SOURCE_INFO.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#1F6F6B] underline hover:text-[#3A2E26]"
          >
            <span>SickKids AboutKidsHealth Cast Care Guidance</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </footer>

      {/* Adult / Facilitator Modal (Strictly outside child screens) */}
      <FacilitatorModal
        isOpen={isFacilitatorModalOpen}
        onClose={() => setIsFacilitatorModalOpen(false)}
      />
    </div>
  );
}
