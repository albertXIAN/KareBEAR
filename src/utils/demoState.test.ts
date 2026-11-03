import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialDemoState,
  startStoryJourney,
  advanceStoryPage,
  navigateBack,
  navigateHome,
  startNewRecoverySession,
  approveCaregiverReview,
  startChildRecoverySteps,
  goToComprehensionCheckFromLearn,
  selectComprehensionChoice,
  openRetryLearnPage,
  advanceAfterComprehensionCheck,
  calculateCaregiverSummary,
} from './demoState';
import { RECOVERY_POINTS, STORY_PAGES } from '../data/demoContent';

test('Journey 1: advances through all 5 story pages to S3 and navigates Back cleanly', () => {
  let state = createInitialDemoState();
  assert.equal(state.currentScreen, 'S1');

  state = startStoryJourney(state);
  assert.equal(state.currentScreen, 'S2');
  assert.equal(state.storyPageIndex, 0);

  // Advance through pages 1..5
  for (let i = 0; i < STORY_PAGES.length - 1; i++) {
    state = advanceStoryPage(state);
    assert.equal(state.currentScreen, 'S2');
    assert.equal(state.storyPageIndex, i + 1);
  }

  // Final Next moves to S3 Story Finish
  state = advanceStoryPage(state);
  assert.equal(state.currentScreen, 'S3');

  // Back from S3 returns to Page 5 (index 4)
  state = navigateBack(state);
  assert.equal(state.currentScreen, 'S2');
  assert.equal(state.storyPageIndex, 4);
});

test('Journey 2: tracks 1st-try correct, 1st-incorrect then retry-correct, and 2nd-incorrect separately', () => {
  let state = createInitialDemoState();
  state = startNewRecoverySession(state);
  assert.equal(state.currentScreen, 'S4');

  state = approveCaregiverReview(state);
  assert.equal(state.currentScreen, 'S5');
  assert.equal(state.caregiverApproved, true);

  state = startChildRecoverySteps(state);
  assert.equal(state.currentScreen, 'S6');
  assert.equal(state.activeRecoveryIndex, 0);

  // Point 1 (care-1-keep-dry): First try INCORRECT, then Look Again -> Retry -> Second try CORRECT
  const p1 = RECOVERY_POINTS[0];
  state = goToComprehensionCheckFromLearn(state);
  assert.equal(state.currentScreen, 'S7');

  const p1WrongChoice = p1.comprehensionCheck.choices.find((c) => !c.isCorrect)!;
  const p1RightChoice = p1.comprehensionCheck.choices.find((c) => c.isCorrect)!;

  state = selectComprehensionChoice(state, p1.id, p1WrongChoice.id);
  assert.equal(state.pointAttempts[p1.id].currentFeedbackState, 'first-incorrect');
  assert.equal(state.pointAttempts[p1.id].hadIncorrectAttempt, true);
  assert.equal(state.pointAttempts[p1.id].eventuallyCorrect, false);
  assert.equal(state.pointAttempts[p1.id].needsCaregiverDiscussion, false);
  assert.equal(state.pointAttempts[p1.id].completed, false);

  // Click "Look again" -> opens S6 in retry mode
  state = openRetryLearnPage(state);
  assert.equal(state.currentScreen, 'S6');
  assert.equal(state.isRetryLearnMode, true);

  // Click "Try the comprehension check again" -> returns to S7 with choices reset, history preserved
  state = goToComprehensionCheckFromLearn(state);
  assert.equal(state.currentScreen, 'S7');
  assert.equal(state.isRetryLearnMode, false);
  assert.equal(state.pointAttempts[p1.id].currentSelectedChoiceId, null);
  assert.equal(state.pointAttempts[p1.id].currentFeedbackState, 'idle');
  assert.equal(state.pointAttempts[p1.id].hadIncorrectAttempt, true);
  assert.equal(state.pointAttempts[p1.id].incorrectAttemptsCount, 1);

  // Now answer Point 1 correctly on retry
  state = selectComprehensionChoice(state, p1.id, p1RightChoice.id);
  assert.equal(state.pointAttempts[p1.id].currentFeedbackState, 'correct');
  assert.equal(state.pointAttempts[p1.id].hadIncorrectAttempt, true);
  assert.equal(state.pointAttempts[p1.id].eventuallyCorrect, true);
  assert.equal(state.pointAttempts[p1.id].needsCaregiverDiscussion, false);
  assert.equal(state.pointAttempts[p1.id].completed, true);

  // Advance to Point 2 Learn (S6)
  state = advanceAfterComprehensionCheck(state);
  assert.equal(state.currentScreen, 'S6');
  assert.equal(state.activeRecoveryIndex, 1);

  // Point 2 (care-2-nothing-inside): Two INCORRECT attempts -> reveals answer, allows progress, flags caregiver discussion
  const p2 = RECOVERY_POINTS[1];
  const p2WrongChoice = p2.comprehensionCheck.choices.find((c) => !c.isCorrect)!;

  state = goToComprehensionCheckFromLearn(state);
  assert.equal(state.currentScreen, 'S7');

  // 1st incorrect attempt on Point 2
  state = selectComprehensionChoice(state, p2.id, p2WrongChoice.id);
  assert.equal(state.pointAttempts[p2.id].currentFeedbackState, 'first-incorrect');

  // Revisit Learn page and return
  state = openRetryLearnPage(state);
  state = goToComprehensionCheckFromLearn(state);

  // 2nd incorrect attempt on Point 2
  state = selectComprehensionChoice(state, p2.id, p2WrongChoice.id);
  assert.equal(state.pointAttempts[p2.id].currentFeedbackState, 'second-incorrect-explained');
  assert.equal(state.pointAttempts[p2.id].hadIncorrectAttempt, true);
  assert.equal(state.pointAttempts[p2.id].eventuallyCorrect, false);
  assert.equal(state.pointAttempts[p2.id].needsCaregiverDiscussion, true);
  assert.equal(state.pointAttempts[p2.id].completed, true);

  // Advance to Point 3 Learn (S6)
  state = advanceAfterComprehensionCheck(state);
  assert.equal(state.currentScreen, 'S6');
  assert.equal(state.activeRecoveryIndex, 2);

  // Point 3 (care-3-warning-signs): First-try CORRECT
  const p3 = RECOVERY_POINTS[2];
  const p3RightChoice = p3.comprehensionCheck.choices.find((c) => c.isCorrect)!;

  state = goToComprehensionCheckFromLearn(state);
  state = selectComprehensionChoice(state, p3.id, p3RightChoice.id);
  assert.equal(state.pointAttempts[p3.id].hadIncorrectAttempt, false);
  assert.equal(state.pointAttempts[p3.id].eventuallyCorrect, true);
  assert.equal(state.pointAttempts[p3.id].needsCaregiverDiscussion, false);
  assert.equal(state.pointAttempts[p3.id].completed, true);

  // Advance to S8 Finish & Summary
  state = advanceAfterComprehensionCheck(state);
  assert.equal(state.currentScreen, 'S8');

  // Check Caregiver Summary distinctions
  const summary = calculateCaregiverSummary(state);
  assert.equal(summary.totalPoints, 3);
  assert.equal(summary.completedPoints, 3);
  assert.equal(summary.firstTryCorrectCount, 1); // Point 3
  assert.equal(summary.hadIncorrectAttemptCount, 2); // Point 1 and Point 2
  assert.equal(summary.eventuallyCorrectCount, 2); // Point 1 and Point 3
  assert.equal(summary.ResolvedOnRetryCount, 1); // Point 1
  assert.equal(summary.needsCaregiverDiscussionCount, 1); // Point 2
  assert.equal(summary.pointsNeedingDiscussion[0].id, p2.id);
  assert.equal(summary.pointsSolvedOnRetry[0].id, p1.id);
  assert.equal(summary.pointsCorrectFirstTry[0].id, p3.id);
});

test('Back preserves attempt history and starting a new recovery session clears previous results', () => {
  let state = createInitialDemoState();
  state = startNewRecoverySession(state);
  state = approveCaregiverReview(state);
  state = startChildRecoverySteps(state);
  state = goToComprehensionCheckFromLearn(state);

  const p1 = RECOVERY_POINTS[0];
  const p1RightChoice = p1.comprehensionCheck.choices.find((c) => c.isCorrect)!;
  state = selectComprehensionChoice(state, p1.id, p1RightChoice.id);
  state = advanceAfterComprehensionCheck(state); // Now on S6 for Point 2

  // Navigate Back to Point 1 S7 -> verify Point 1 attempt is still preserved
  state = navigateBack(state);
  assert.equal(state.currentScreen, 'S7');
  assert.equal(state.activeRecoveryIndex, 0);
  assert.equal(state.pointAttempts[p1.id].eventuallyCorrect, true);
  assert.equal(state.pointAttempts[p1.id].completed, true);

  // Navigate Home -> preserves state until a new recovery session is started
  state = navigateHome(state);
  assert.equal(state.currentScreen, 'S1');
  assert.equal(state.pointAttempts[p1.id].completed, true);

  // Starting a new recovery session clears previous recovery results
  state = startNewRecoverySession(state);
  assert.equal(state.currentScreen, 'S4');
  assert.equal(state.pointAttempts[p1.id].completed, false);
  assert.equal(state.pointAttempts[p1.id].eventuallyCorrect, false);
});
