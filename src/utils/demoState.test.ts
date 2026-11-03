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
  appendExplainObservationTurn,
  navigateToPointExplanation,
} from './demoState';
import {
  FIXED_OUT_OF_SCOPE_MESSAGE,
  RECOVERY_POINTS,
  STORY_PAGES,
} from '../data/demoContent';
import {
  buildExplainKareSystemInstruction,
  detectCoveredPointsFromText,
  generateLocalExplainResponse,
  isInputOutOfScope,
} from './explainKareLogic';
import {
  resolveMascotState,
  rmsToMouthOpen,
} from '../mascot/mascotStateArbiter';
import {
  clampMouthOpen,
  resolveKareAccessories,
} from '../mascot/kareArtwork';
import {
  buildGroundedStoryDraftFromSummary,
  INITIAL_POSTOP_TASKS,
  INITIAL_SUMMARY_DRAFT,
  INITIAL_UNCERTAINTY_FLAGS,
  PRE_OP_LESSONS,
} from '../data/surgeryContent';
import {
  awardRewardForOccurrence,
  calculateTotalPoints,
  detectDisallowedReassurancePhrases,
  isItemBlockedByUncertainty,
  propagateSummaryEditStaleness,
  propagateTranscriptEditStaleness,
  revokeRewardOccurrence,
  type RewardLedgerState,
} from './surgeryDataModel';

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

test('Explain it to Kare: detects out-of-scope questions and returns fixed redirect message', () => {
  const p1 = RECOVERY_POINTS[0];

  assert.equal(isInputOutOfScope('How much ibuprofen or Tylenol should I take?'), true);
  assert.equal(isInputOutOfScope('When can I cut the cast off at home?'), true);
  assert.equal(isInputOutOfScope('Is my bone still broken or do I need surgery?'), true);
  assert.equal(isInputOutOfScope('I will keep my cast dry at bath time with a cover.'), false);

  const outOfScopeResult = generateLocalExplainResponse(
    p1,
    'What dose of pain medicine should Sam take?',
    'respond',
    []
  );
  assert.equal(outOfScopeResult.isOutOfScope, true);
  assert.equal(outOfScopeResult.reply, FIXED_OUT_OF_SCOPE_MESSAGE);
  assert.equal(outOfScopeResult.allCoveredPointIds.length, 0);
});

test('Explain it to Kare: tracks covered vs unclear learning points and supports review navigation', () => {
  const p1 = RECOVERY_POINTS[0]; // care-1-keep-dry (lp-1-keep-dry, lp-1-protect-skin)

  // Partial explanation covering keeping cast dry, leaving skin/padding unclear
  const turn1 = generateLocalExplainResponse(
    p1,
    'I will keep my cast out of the water and away from the sprinkler.',
    'respond',
    []
  );
  assert.equal(turn1.isOutOfScope, false);
  assert.ok(turn1.allCoveredPointIds.includes('lp-1-keep-dry'));
  assert.equal(turn1.unclearLearningPoints.length, 1);
  assert.equal(turn1.unclearLearningPoints[0].id, 'lp-1-protect-skin');

  // Second turn covering why wet padding hurts skin
  const turn2 = generateLocalExplainResponse(
    p1,
    'Because wet padding inside can hurt my skin, so my grown-up helps wrap it.',
    'respond',
    turn1.allCoveredPointIds
  );
  assert.equal(turn2.unclearLearningPoints.length, 0);
  assert.equal(turn2.allCoveredPointIds.length, 2);

  // Verify shared state persistence and navigateToPointExplanation
  let state = createInitialDemoState();
  state = appendExplainObservationTurn(
    state,
    p1.id,
    [
      {
        id: 'm1',
        role: 'child',
        text: 'Keep my cast dry',
        source: 'typed',
        timestamp: 100,
      },
    ],
    turn1.allCoveredPointIds
  );
  assert.deepEqual(
    state.explainObservationsByPointId[p1.id].coveredLearningPointIds,
    ['lp-1-keep-dry']
  );

  // Jump from S8 Summary back to Step 2's explanation on S6
  state = { ...state, currentScreen: 'S8' };
  state = navigateToPointExplanation(state, 'care-2-nothing-inside');
  assert.equal(state.currentScreen, 'S6');
  assert.equal(state.activeRecoveryIndex, 1);
  assert.equal(state.expandedLearnMoreByPointId['care-2-nothing-inside'], true);

  // Verify system instruction includes lesson, SickKids source, and expected learning points
  const sysPrompt = buildExplainKareSystemInstruction(p1, ['lp-1-keep-dry'], []);
  assert.ok(sysPrompt.includes(p1.childInstruction));
  assert.ok(sysPrompt.includes(p1.originalSourceWording));
  assert.ok(sysPrompt.includes(FIXED_OUT_OF_SCOPE_MESSAGE));
});

test('Mascot Kit Arbiter: enforces speaking > listening > gesture > idle priority and accessory resolution', () => {
  // 1. speaking overrides listening and gestures
  assert.equal(
    resolveMascotState({
      isSpeakingAudioPlaying: true,
      isMicrophoneListening: true,
      activeGesture: 'celebrating',
    }),
    'speaking'
  );

  // 2. listening overrides transient gestures when not speaking
  assert.equal(
    resolveMascotState({
      isSpeakingAudioPlaying: false,
      isMicrophoneListening: true,
      activeGesture: 'waving',
    }),
    'listening'
  );

  // 3. transient gestures apply when neither speaking nor listening
  assert.equal(
    resolveMascotState({
      isSpeakingAudioPlaying: false,
      isMicrophoneListening: false,
      activeGesture: 'encouraging',
    }),
    'encouraging'
  );

  // 4. idle when no audio, listening, or active gesture
  assert.equal(
    resolveMascotState({
      isSpeakingAudioPlaying: false,
      isMicrophoneListening: false,
      activeGesture: null,
    }),
    'idle'
  );

  // 5. mouthOpen clamping & RMS conversion
  assert.equal(clampMouthOpen(-0.4), 0);
  assert.equal(clampMouthOpen(0), 0);
  assert.equal(clampMouthOpen(0.55), 0.55);
  assert.equal(clampMouthOpen(1.6), 1);
  assert.equal(rmsToMouthOpen(0.001), 0);
  assert.ok(rmsToMouthOpen(0.08) > 0.2 && rmsToMouthOpen(0.08) < 0.9);
  assert.equal(rmsToMouthOpen(0.35), 1);

  // 6. Accessory presets and overrides
  const doctorCast = resolveKareAccessories('doctor-cast');
  assert.equal(doctorCast.coat, true);
  assert.equal(doctorCast.headset, true);
  assert.equal(doctorCast.cast, true);
  assert.equal(doctorCast.glasses, false);
  assert.equal(doctorCast.clipboard, false);

  const checklistWithCast = resolveKareAccessories('checklist', ['cast']);
  assert.equal(checklistWithCast.glasses, true);
  assert.equal(checklistWithCast.clipboard, true);
  assert.equal(checklistWithCast.cast, true);
});

test('Pre-Op Lessons: 8 bilingual age-adapted lessons with French review flags and zero false reassurance promises', () => {
  assert.equal(PRE_OP_LESSONS.length, 8);

  for (const lesson of PRE_OP_LESSONS) {
    assert.equal(lesson.reviewStatus.en, 'reviewed-demo');
    assert.equal(lesson.reviewStatus.fr, 'needs-clinical-review');

    for (const lang of ['en', 'fr'] as const) {
      const variant = lesson.variants[lang];
      assert.ok(variant.title.length > 0);
      for (const band of ['3-6', '7-9', '10-12'] as const) {
        assert.ok(variant.whatItIs[band].length > 10);
        assert.ok(variant.whatYouMaySeeOrFeel[band].length > 10);
        assert.ok(variant.sourceGroundedExplanation[band].length > 10);

        const combined = `${variant.whatItIs[band]} ${variant.whatYouMaySeeOrFeel[band]} ${variant.sourceGroundedExplanation[band]}`;
        assert.deepEqual(
          detectDisallowedReassurancePhrases(combined),
          [],
          `Lesson ${lesson.id} (${lang}, ${band}) must not contain false reassurance phrases`
        );
      }
    }
  }
});

test('Post-Op Staleness Propagation: editing transcript or summary marks downstream story and confirmed tasks stale', () => {
  const initialSummary = {
    ...INITIAL_SUMMARY_DRAFT,
    reviewStatus: 'reviewed' as const,
  };
  const releasedStory = {
    ...buildGroundedStoryDraftFromSummary(initialSummary, 'en', '7-9', 'simple', 1),
    status: 'released' as const,
    releasedAt: 12345,
  };
  const tasks = INITIAL_POSTOP_TASKS.map((t) =>
    t.id === 'task-sips-water'
      ? { ...t, approvalState: 'confirmed-for-child' as const }
      : t
  );

  // 1. Transcript edit marks summary, story, and confirmed tasks as 'stale'
  const afterTranscriptEdit = propagateTranscriptEditStaleness(
    initialSummary,
    releasedStory,
    tasks
  );
  assert.equal(afterTranscriptEdit.summary.reviewStatus, 'stale');
  assert.equal(afterTranscriptEdit.story?.status, 'stale');
  const sipTaskAfterTranscriptEdit = afterTranscriptEdit.tasks.find(
    (t) => t.id === 'task-sips-water'
  )!;
  assert.equal(sipTaskAfterTranscriptEdit.approvalState, 'stale');

  // 2. Summary edit marks released story and confirmed tasks as 'stale'
  const afterSummaryEdit = propagateSummaryEditStaleness(releasedStory, tasks);
  assert.equal(afterSummaryEdit.story?.status, 'stale');
  const sipTaskAfterSummaryEdit = afterSummaryEdit.tasks.find(
    (t) => t.id === 'task-sips-water'
  )!;
  assert.equal(sipTaskAfterSummaryEdit.approvalState, 'stale');
});

test('Post-Op Tasks & Uncertainties: blocks unresolved tasks and never invents missing doses or clock times', () => {
  const flags = INITIAL_UNCERTAINTY_FLAGS.map((f) => ({ ...f }));

  // Acetaminophen and Amoxicillin tasks are initially blocked by unresolved uncertainty flags
  assert.equal(
    isItemBlockedByUncertainty('task-acetaminophen', flags),
    true
  );
  assert.equal(
    isItemBlockedByUncertainty('task-amoxicillin', flags),
    true
  );
  assert.equal(isItemBlockedByUncertainty('task-sips-water', flags), false);

  // Verify Amoxicillin "Twice daily" preserves frequencySupplied='Twice daily' but clockTimesSupplied=null and doseSupplied=null
  const amoxTask = INITIAL_POSTOP_TASKS.find(
    (t) => t.id === 'task-amoxicillin'
  )!;
  assert.equal(amoxTask.suppliedFields.doseSupplied, null);
  assert.equal(amoxTask.suppliedFields.frequencySupplied, 'Twice daily');
  assert.equal(amoxTask.suppliedFields.clockTimesSupplied, null);

  // Verify Acetaminophen preserves missing doseSupplied=null
  const acetTask = INITIAL_POSTOP_TASKS.find(
    (t) => t.id === 'task-acetaminophen'
  )!;
  assert.equal(acetTask.suppliedFields.doseSupplied, null);

  // Resolving flags unblocks the tasks
  const resolvedFlags = flags.map((f) => ({ ...f, resolvedByCaregiver: true }));
  assert.equal(
    isItemBlockedByUncertainty(
      'task-acetaminophen',
      resolvedFlags
    ),
    false
  );
});

test('Idempotent Positive Reward Ledger & Phrase Filter: awards once per occurrenceId and supports record correction', () => {
  let ledger: RewardLedgerState = {
    entries: {},
    unlockedCosmeticIds: [],
    equippedCosmeticId: null,
  };

  assert.equal(calculateTotalPoints(ledger), 0);

  // Award 10 points for occurrence-1
  ledger = awardRewardForOccurrence(
    ledger,
    'occ-postop-1-fluids',
    10,
    'Sip clear fluids'
  );
  assert.equal(calculateTotalPoints(ledger), 10);

  // Repeated taps with same occurrenceId are idempotent no-ops (never multiply points)
  ledger = awardRewardForOccurrence(
    ledger,
    'occ-postop-1-fluids',
    10,
    'Sip clear fluids'
  );
  ledger = awardRewardForOccurrence(
    ledger,
    'occ-postop-1-fluids',
    10,
    'Sip clear fluids'
  );
  assert.equal(calculateTotalPoints(ledger), 10);

  // Award second distinct occurrence
  ledger = awardRewardForOccurrence(
    ledger,
    'occ-postop-2-rest',
    10,
    'Quiet play and rest'
  );
  assert.equal(calculateTotalPoints(ledger), 20);

  // Revoke first occurrence as a caregiver record correction
  ledger = revokeRewardOccurrence(ledger, 'occ-postop-1-fluids');
  assert.equal(calculateTotalPoints(ledger), 10);
  assert.equal(
    ledger.entries['occ-postop-1-fluids'].status,
    'corrected-revoked'
  );

  // Re-confirming after correction restores active status cleanly
  ledger = awardRewardForOccurrence(
    ledger,
    'occ-postop-1-fluids',
    10,
    'Sip clear fluids'
  );
  assert.equal(calculateTotalPoints(ledger), 20);

  // Phrase filter catches false reassurance promises
  const badWarnings = detectDisallowedReassurancePhrases(
    "Don't worry, it won't hurt and you'll get better soon!"
  );
  assert.equal(badWarnings.length, 2);
});

