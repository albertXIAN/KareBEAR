/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure state machine and helper functions for KareBEAR V0 prototype.
 * Decoupled from React components for deterministic unit testing via node:test.
 */

import {
  RECOVERY_POINTS,
  STORY_PAGES,
  type RecoveryPointContent,
} from '../data/demoContent';
import type {
  ExplainMessage,
  PointExplainObservation,
} from './explainKareLogic';

export type ScreenId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8';

export type FeedbackState =
  | 'idle'
  | 'correct'
  | 'first-incorrect'
  | 'second-incorrect-explained';

export interface PointAttemptState {
  pointId: string;
  incorrectAttemptsCount: number;
  hadIncorrectAttempt: boolean;
  eventuallyCorrect: boolean;
  needsCaregiverDiscussion: boolean;
  completed: boolean;
  currentSelectedChoiceId: string | null;
  currentFeedbackState: FeedbackState;
}

export interface CaregiverPreferences {
  supplementalDetailByPointId: Record<string, boolean>;
  showExplainPrompts: boolean;
  enableReadAloud: boolean;
}

export interface DemoState {
  currentScreen: ScreenId;
  // Journey 1: Hospital Story
  storyPageIndex: number;
  expandedStoryMoreById: Record<string, boolean>;
  selectedStoryFeelingId: string | null;
  selectedStoryEnjoymentId: string | null;

  // Journey 2: Grown-up Review & Home Care Comprehension
  caregiverApproved: boolean;
  caregiverPreferences: CaregiverPreferences;
  expandedOriginalWordingByPointId: Record<string, boolean>;
  expandedLearnMoreByPointId: Record<string, boolean>;
  activeRecoveryIndex: number;
  isRetryLearnMode: boolean;
  pointAttempts: Record<string, PointAttemptState>;
  explainObservationsByPointId: Record<string, PointExplainObservation>;
  selectedRecoveryEnjoymentId: string | null;
}

export interface CaregiverSummaryTotals {
  totalPoints: number;
  completedPoints: number;
  firstTryCorrectCount: number;
  hadIncorrectAttemptCount: number;
  eventuallyCorrectCount: number;
  ResolvedOnRetryCount: number;
  needsCaregiverDiscussionCount: number;
  pointsNeedingDiscussion: RecoveryPointContent[];
  pointsSolvedOnRetry: RecoveryPointContent[];
  pointsCorrectFirstTry: RecoveryPointContent[];
}

export function createInitialPointAttempts(
  points: RecoveryPointContent[] = RECOVERY_POINTS
): Record<string, PointAttemptState> {
  const map: Record<string, PointAttemptState> = {};
  for (const point of points) {
    map[point.id] = {
      pointId: point.id,
      incorrectAttemptsCount: 0,
      hadIncorrectAttempt: false,
      eventuallyCorrect: false,
      needsCaregiverDiscussion: false,
      completed: false,
      currentSelectedChoiceId: null,
      currentFeedbackState: 'idle',
    };
  }
  return map;
}

export function createInitialCaregiverPreferences(
  points: RecoveryPointContent[] = RECOVERY_POINTS
): CaregiverPreferences {
  const supplementalDetailByPointId: Record<string, boolean> = {};
  for (const point of points) {
    supplementalDetailByPointId[point.id] = true;
  }
  return {
    supplementalDetailByPointId,
    showExplainPrompts: true,
    enableReadAloud: true,
  };
}

export function createInitialExplainObservations(
  points: RecoveryPointContent[] = RECOVERY_POINTS
): Record<string, PointExplainObservation> {
  const map: Record<string, PointExplainObservation> = {};
  for (const point of points) {
    map[point.id] = {
      pointId: point.id,
      coveredLearningPointIds: [],
      messages: [
        {
          id: `init-${point.id}`,
          role: 'kare',
          text: `Hi! Let's practice Step ${point.stepNumber} together. ${point.explainToCaregiverPrompt}`,
          source: 'typed',
          timestamp: 0,
        },
      ],
      lastUpdated: null,
    };
  }
  return map;
}

export function createInitialDemoState(): DemoState {
  return {
    currentScreen: 'S1',
    storyPageIndex: 0,
    expandedStoryMoreById: {},
    selectedStoryFeelingId: null,
    selectedStoryEnjoymentId: null,
    caregiverApproved: false,
    caregiverPreferences: createInitialCaregiverPreferences(),
    expandedOriginalWordingByPointId: {},
    expandedLearnMoreByPointId: {},
    activeRecoveryIndex: 0,
    isRetryLearnMode: false,
    pointAttempts: createInitialPointAttempts(),
    explainObservationsByPointId: createInitialExplainObservations(),
    selectedRecoveryEnjoymentId: null,
  };
}

/**
 * Starts or resumes Journey 1 (Hospital Story) at page 1.
 */
export function startStoryJourney(state: DemoState): DemoState {
  return {
    ...state,
    currentScreen: 'S2',
    storyPageIndex: 0,
  };
}

/**
 * Starts a new Journey 2 (Home Care Steps) session.
 * Clarification 3: "Starting a new recovery session clears the previous recovery results."
 */
export function startNewRecoverySession(state: DemoState): DemoState {
  return {
    ...state,
    currentScreen: 'S4',
    caregiverApproved: false,
    caregiverPreferences: createInitialCaregiverPreferences(),
    expandedOriginalWordingByPointId: {},
    expandedLearnMoreByPointId: {},
    activeRecoveryIndex: 0,
    isRetryLearnMode: false,
    pointAttempts: createInitialPointAttempts(),
    explainObservationsByPointId: createInitialExplainObservations(),
    selectedRecoveryEnjoymentId: null,
  };
}

/**
 * Jumps directly to a specific recovery point's Learn page (S6) and expands its
 * supplemental explanation so the child and caregiver can review the relevant material.
 */
export function navigateToPointExplanation(
  state: DemoState,
  pointId: string
): DemoState {
  const index = RECOVERY_POINTS.findIndex((p) => p.id === pointId);
  if (index === -1) return state;

  return {
    ...state,
    currentScreen: 'S6',
    activeRecoveryIndex: index,
    isRetryLearnMode: false,
    expandedLearnMoreByPointId: {
      ...state.expandedLearnMoreByPointId,
      [pointId]: true,
    },
  };
}

/**
 * Appends messages and updates covered learning points for a recovery step in the shared
 * "Explain it to Kare" state.
 */
export function appendExplainObservationTurn(
  state: DemoState,
  pointId: string,
  newMessages: ExplainMessage[],
  coveredLearningPointIds: string[]
): DemoState {
  const existing = state.explainObservationsByPointId[pointId] ?? {
    pointId,
    coveredLearningPointIds: [],
    messages: [],
    lastUpdated: null,
  };

  const mergedCovered = Array.from(
    new Set([...existing.coveredLearningPointIds, ...coveredLearningPointIds])
  );

  return {
    ...state,
    explainObservationsByPointId: {
      ...state.explainObservationsByPointId,
      [pointId]: {
        pointId,
        coveredLearningPointIds: mergedCovered,
        messages: [...existing.messages, ...newMessages],
        lastUpdated: Date.now(),
      },
    },
  };
}

/**
 * Home returns to S1 menu while preserving in-memory state.
 */
export function navigateHome(state: DemoState): DemoState {
  return {
    ...state,
    currentScreen: 'S1',
  };
}

/**
 * Back preserves progress and attempt history while moving to the previous logical screen/step.
 */
export function navigateBack(state: DemoState): DemoState {
  switch (state.currentScreen) {
    case 'S1':
      return state;

    case 'S2': {
      if (state.storyPageIndex > 0) {
        return {
          ...state,
          storyPageIndex: state.storyPageIndex - 1,
        };
      }
      return {
        ...state,
        currentScreen: 'S1',
      };
    }

    case 'S3':
      return {
        ...state,
        currentScreen: 'S2',
        storyPageIndex: Math.max(0, STORY_PAGES.length - 1),
      };

    case 'S4':
      return {
        ...state,
        currentScreen: 'S1',
      };

    case 'S5':
      return {
        ...state,
        currentScreen: 'S4',
      };

    case 'S6': {
      // If we are in retry mode on S6, Back returns to the comprehension check S7 for the current point
      if (state.isRetryLearnMode) {
        return {
          ...state,
          currentScreen: 'S7',
          isRetryLearnMode: false,
        };
      }
      // If on a later recovery point's Learn page, Back returns to the previous point's Comprehension Check (S7)
      // while preserving all attempt history.
      if (state.activeRecoveryIndex > 0) {
        return {
          ...state,
          currentScreen: 'S7',
          activeRecoveryIndex: state.activeRecoveryIndex - 1,
          isRetryLearnMode: false,
        };
      }
      // On the first recovery point's Learn page, Back returns to Handover (S5)
      return {
        ...state,
        currentScreen: 'S5',
      };
    }

    case 'S7': {
      // Back from a Comprehension Check returns to that same point's Learn page (S6)
      // while preserving attempt history.
      return {
        ...state,
        currentScreen: 'S6',
        isRetryLearnMode: false,
      };
    }

    case 'S8': {
      // Back from Summary returns to the last point's Comprehension Check (S7), preserving attempt history.
      return {
        ...state,
        currentScreen: 'S7',
        activeRecoveryIndex: Math.max(0, RECOVERY_POINTS.length - 1),
        isRetryLearnMode: false,
      };
    }

    default:
      return state;
  }
}

/**
 * Advances one story page in S2, or transitions to S3 after the final page.
 */
export function advanceStoryPage(state: DemoState): DemoState {
  if (state.currentScreen !== 'S2') return state;
  if (state.storyPageIndex + 1 < STORY_PAGES.length) {
    return {
      ...state,
      storyPageIndex: state.storyPageIndex + 1,
    };
  }
  return {
    ...state,
    currentScreen: 'S3',
  };
}

/**
 * Approves caregiver review on S4 and moves to S5 Handover.
 */
export function approveCaregiverReview(state: DemoState): DemoState {
  return {
    ...state,
    caregiverApproved: true,
    currentScreen: 'S5',
  };
}

/**
 * Starts child recovery learning from S5 Handover -> S6 first recovery point.
 */
export function startChildRecoverySteps(state: DemoState): DemoState {
  return {
    ...state,
    currentScreen: 'S6',
    activeRecoveryIndex: 0,
    isRetryLearnMode: false,
  };
}

/**
 * Moves from S6 Learn page to S7 Comprehension Check for the current recovery point.
 * When returning from retry mode ("Try the comprehension check again"), resets the active selection
 * so the child can pick fresh, while preserving prior attempt history (`hadIncorrectAttempt: true`, `incorrectAttemptsCount: 1`).
 */
export function goToComprehensionCheckFromLearn(state: DemoState): DemoState {
  const currentPoint = RECOVERY_POINTS[state.activeRecoveryIndex];
  if (!currentPoint) return state;

  const existingAttempt = state.pointAttempts[currentPoint.id];
  const shouldResetActiveChoice =
    state.isRetryLearnMode ||
    existingAttempt?.currentFeedbackState === 'first-incorrect';

  const updatedAttempt: PointAttemptState = existingAttempt
    ? {
        ...existingAttempt,
        currentSelectedChoiceId: shouldResetActiveChoice
          ? null
          : existingAttempt.currentSelectedChoiceId,
        currentFeedbackState: shouldResetActiveChoice
          ? 'idle'
          : existingAttempt.currentFeedbackState,
      }
    : {
        pointId: currentPoint.id,
        incorrectAttemptsCount: 0,
        hadIncorrectAttempt: false,
        eventuallyCorrect: false,
        needsCaregiverDiscussion: false,
        completed: false,
        currentSelectedChoiceId: null,
        currentFeedbackState: 'idle',
      };

  return {
    ...state,
    currentScreen: 'S7',
    isRetryLearnMode: false,
    pointAttempts: {
      ...state.pointAttempts,
      [currentPoint.id]: updatedAttempt,
    },
  };
}

/**
 * Evaluates a selected choice on S7 Comprehension Check.
 * Tracks separately:
 * - hadIncorrectAttempt (any incorrect attempt)
 * - eventuallyCorrect (whether the answer was eventually correct)
 * - needsCaregiverDiscussion (whether caregiver discussion is still needed after 2nd incorrect attempt)
 */
export function selectComprehensionChoice(
  state: DemoState,
  pointId: string,
  choiceId: string
): DemoState {
  const point = RECOVERY_POINTS.find((p) => p.id === pointId);
  if (!point) return state;

  const choice = point.comprehensionCheck.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const prevAttempt = state.pointAttempts[pointId] ?? {
    pointId,
    incorrectAttemptsCount: 0,
    hadIncorrectAttempt: false,
    eventuallyCorrect: false,
    needsCaregiverDiscussion: false,
    completed: false,
    currentSelectedChoiceId: null,
    currentFeedbackState: 'idle',
  };

  // Do not overwrite state if this point is already completed (either answered right or explained after 2nd incorrect)
  if (prevAttempt.completed) {
    return state;
  }

  if (choice.isCorrect) {
    const nextAttempt: PointAttemptState = {
      ...prevAttempt,
      currentSelectedChoiceId: choiceId,
      currentFeedbackState: 'correct',
      eventuallyCorrect: true,
      needsCaregiverDiscussion: false,
      completed: true,
    };
    return {
      ...state,
      pointAttempts: {
        ...state.pointAttempts,
        [pointId]: nextAttempt,
      },
    };
  }

  // Incorrect choice selected
  const newIncorrectCount = prevAttempt.incorrectAttemptsCount + 1;

  if (newIncorrectCount === 1) {
    // First incorrect answer: prompt to look again at the learn page
    const nextAttempt: PointAttemptState = {
      ...prevAttempt,
      incorrectAttemptsCount: 1,
      hadIncorrectAttempt: true,
      eventuallyCorrect: false,
      needsCaregiverDiscussion: false,
      completed: false,
      currentSelectedChoiceId: choiceId,
      currentFeedbackState: 'first-incorrect',
    };
    return {
      ...state,
      pointAttempts: {
        ...state.pointAttempts,
        [pointId]: nextAttempt,
      },
    };
  }

  // Second (or subsequent) incorrect answer: explain the answer, allow progress, and flag for caregiver discussion
  const nextAttempt: PointAttemptState = {
    ...prevAttempt,
    incorrectAttemptsCount: newIncorrectCount,
    hadIncorrectAttempt: true,
    eventuallyCorrect: false,
    needsCaregiverDiscussion: true,
    completed: true,
    currentSelectedChoiceId: choiceId,
    currentFeedbackState: 'second-incorrect-explained',
  };

  return {
    ...state,
    pointAttempts: {
      ...state.pointAttempts,
      [pointId]: nextAttempt,
    },
  };
}

/**
 * Triggered by "Look again" after a first incorrect attempt on S7.
 * Opens the matching S6 Learn page in retry mode with the "Take another look" banner.
 */
export function openRetryLearnPage(state: DemoState): DemoState {
  return {
    ...state,
    currentScreen: 'S6',
    isRetryLearnMode: true,
  };
}

/**
 * Advances from S7 Comprehension Check (once completed via correct answer or 2nd-try explanation)
 * to the next recovery point's S6 Learn page, or S8 Finish & Summary after the final point.
 */
export function advanceAfterComprehensionCheck(state: DemoState): DemoState {
  const currentPoint = RECOVERY_POINTS[state.activeRecoveryIndex];
  if (!currentPoint) return state;

  const attempt = state.pointAttempts[currentPoint.id];
  if (!attempt || !attempt.completed) {
    return state;
  }

  if (state.activeRecoveryIndex + 1 < RECOVERY_POINTS.length) {
    return {
      ...state,
      currentScreen: 'S6',
      activeRecoveryIndex: state.activeRecoveryIndex + 1,
      isRetryLearnMode: false,
    };
  }

  return {
    ...state,
    currentScreen: 'S8',
    isRetryLearnMode: false,
  };
}

/**
 * Calculates progress and Caregiver Summary totals directly from the actual RECOVERY_POINTS content
 * and current attempt state.
 */
export function calculateCaregiverSummary(
  state: DemoState,
  points: RecoveryPointContent[] = RECOVERY_POINTS
): CaregiverSummaryTotals {
  const pointsNeedingDiscussion: RecoveryPointContent[] = [];
  const pointsSolvedOnRetry: RecoveryPointContent[] = [];
  const pointsCorrectFirstTry: RecoveryPointContent[] = [];

  let completedPoints = 0;
  let hadIncorrectAttemptCount = 0;
  let eventuallyCorrectCount = 0;
  let needsCaregiverDiscussionCount = 0;

  for (const point of points) {
    const attempt = state.pointAttempts[point.id];
    if (!attempt) continue;

    if (attempt.completed) {
      completedPoints += 1;
    }
    if (attempt.hadIncorrectAttempt) {
      hadIncorrectAttemptCount += 1;
    }
    if (attempt.eventuallyCorrect) {
      eventuallyCorrectCount += 1;
    }
    if (attempt.needsCaregiverDiscussion) {
      needsCaregiverDiscussionCount += 1;
      pointsNeedingDiscussion.push(point);
    } else if (attempt.hadIncorrectAttempt && attempt.eventuallyCorrect) {
      pointsSolvedOnRetry.push(point);
    } else if (!attempt.hadIncorrectAttempt && attempt.eventuallyCorrect) {
      pointsCorrectFirstTry.push(point);
    }
  }

  return {
    totalPoints: points.length,
    completedPoints,
    firstTryCorrectCount: pointsCorrectFirstTry.length,
    hadIncorrectAttemptCount,
    eventuallyCorrectCount,
    ResolvedOnRetryCount: pointsSolvedOnRetry.length,
    needsCaregiverDiscussionCount,
    pointsNeedingDiscussion,
    pointsSolvedOnRetry,
    pointsCorrectFirstTry,
  };
}
