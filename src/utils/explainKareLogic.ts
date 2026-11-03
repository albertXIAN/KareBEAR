/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared grounding, prompt construction, out-of-scope guardrails, and learning-point
 * observation helpers for the "Explain it to Kare" activity (Typed, Live Voice, and Recorded Answer).
 */

import {
  FIXED_OUT_OF_SCOPE_MESSAGE,
  RECOVERY_POINTS,
  SICKKIDS_SOURCE_INFO,
  STORY_PAGES,
  type ExpectedLearningPoint,
  type RecoveryPointContent,
} from '../data/demoContent';

export type ExplainInteractionSource = 'typed' | 'live-voice' | 'recorded-audio' | 'rephrase';

export interface ExplainMessage {
  id: string;
  role: 'kare' | 'child';
  text: string;
  source: ExplainInteractionSource;
  timestamp: number;
  isOutOfScopeRedirect?: boolean;
}

export interface PointExplainObservation {
  pointId: string;
  coveredLearningPointIds: string[];
  messages: ExplainMessage[];
  lastUpdated: number | null;
}

export interface ExplainTurnResult {
  reply: string;
  isOutOfScope: boolean;
  newlyCoveredPointIds: string[];
  allCoveredPointIds: string[];
  unclearLearningPoints: ExpectedLearningPoint[];
  usedFallback?: boolean;
}

const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
  /\b(tylenol|advil|ibuprofen|acetaminophen|motrin|aspirin|morphine|medicine|medication|pill|pills|dose|dosage|mg|ml|antibiotic|ointment|cream|lotion|powder)\b/i,
  /\b(diagnos(e|is)|is it broken|did i break|fracture type|surgery|operation|anesthesia|anaesthesia|stitch|stitches)\b/i,
  /\b(how many weeks|when does the cast come off|when can i take it off|cut the cast|saw the cast|remove the cast)\b/i,
  /\b(waterproof cast|can i swim in a pool|gore-tex|fiberglass liner)\b/i,
  /\b(fever|infection|pus|bleeding|blood)\b/i,
  /\b(weather|homework|video game|minecraft|roblox|math|joke|pokemon|recipe)\b/i,
];

/**
 * Checks whether a learner's question or input asks for out-of-scope clinical advice
 * (diagnoses, medications, timelines, or topics outside the supplied lesson material).
 */
export function isInputOutOfScope(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Detects which expected learning points for a recovery step are mentioned in the learner's text.
 */
export function detectCoveredPointsFromText(
  point: RecoveryPointContent,
  learnerText: string,
  existingCoveredIds: string[] = []
): string[] {
  const normalized = learnerText.toLowerCase();
  const covered = new Set<string>(existingCoveredIds);

  // Guard against false positives if the child states the opposite action
  const saysPutObjectInside =
    /\b(i will put|i'll put|push a pencil|use a pencil to scratch|put a ruler inside)\b/i.test(
      normalized
    ) && !/\b(not|never|don't|do not|no)\b/i.test(normalized);

  const saysGetCastWet =
    /\b(run through the sprinkler|get it wet|swim with my cast|put it in water)\b/i.test(
      normalized
    ) && !/\b(not|never|don't|do not|no|keep.*dry|stay.*dry)\b/i.test(normalized);

  for (const lp of point.expectedLearningPoints) {
    if (lp.id === 'lp-2-no-objects' && saysPutObjectInside) {
      continue;
    }
    if (lp.id === 'lp-1-keep-dry' && saysGetCastWet) {
      continue;
    }

    const matchCount = lp.keywords.filter((kw) =>
      normalized.includes(kw.toLowerCase())
    ).length;

    if (matchCount >= 1) {
      covered.add(lp.id);
    }
  }

  return Array.from(covered);
}

/**
 * Builds the shared system instruction used across "Type to Kare" (gemini-3.8-flash)
 * and "Talk to Kare" (gemini-3.8-live), grounding Kare in the exact same current lesson,
 * source excerpts, expected learning points, and conversation history.
 */
export function buildExplainKareSystemInstruction(
  point: RecoveryPointContent,
  coveredPointIds: string[] = [],
  conversationHistory: ExplainMessage[] = []
): string {
  const storySummary = STORY_PAGES.map(
    (p) => `Page ${p.pageNumber} (${p.title}): "${p.kareSpeech}" ${p.moreAboutThis ?? ''}`
  ).join('\n');

  const expectedPointsList = point.expectedLearningPoints
    .map((lp) => {
      const status = coveredPointIds.includes(lp.id) ? 'COVERED' : 'STILL UNCLEAR / NOT YET MENTIONED';
      return `- [${lp.id}] (${status}): ${lp.label} (Hint for child: ${lp.childFriendlyHint})`;
    })
    .join('\n');

  const recentTranscript =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-8)
          .map((m) => `${m.role === 'kare' ? 'Kare' : 'Child'}: ${m.text}`)
          .join('\n')
      : 'No messages yet.';

  return [
    'You are Kare, a gentle, warm, friendly honey-brown bear companion wearing a non-waterproof orange arm cast.',
    'You are helping a child (aged 7 to 12) and their grown-up practice explaining one hospital cast-care lesson in the child\'s own words.',
    '',
    'DELIVERY & TONE RULES:',
    '- Keep your delivery warm, gently paced, clear, and encouraging.',
    '- Use short sentences (around 12 words or fewer per sentence when possible).',
    '- Ask at most ONE short question at a time.',
    '- Never say "wrong", "fail", or "bad", and never give a numeric score or grade.',
    '- Ground every response strictly in the supplied lesson material below.',
    '',
    'STRICT SAFETY & OUT-OF-SCOPE BOUNDARY:',
    `- If the child or user asks about anything outside the supplied educational material (such as medication doses, pain pills, whether a bone is broken, diagnoses, when the cast comes off, swimming with waterproof casts, or unrelated topics), you MUST respond ONLY with this fixed message: "${FIXED_OUT_OF_SCOPE_MESSAGE}"`,
    '- Do NOT generate diagnoses, medication advice, timelines, or new treatment instructions.',
    '',
    `CURRENT LESSON (Step ${point.stepNumber} of ${RECOVERY_POINTS.length}: ${point.shortTitle}):`,
    `- Child-facing instruction: "${point.childInstruction}"`,
    `- Extra detail ("More about this"): "${point.moreAboutThis}"`,
    `- Prompt for child: "${point.explainToCaregiverPrompt}"`,
    `- Grounded SickKids Source Excerpt (${point.sourceCitationLabel}): "${point.originalSourceWording}"`,
    `- Cast context: ${SICKKIDS_SOURCE_INFO.castTypeNotice}`,
    '',
    'EXPECTED LEARNING POINTS FOR THIS STEP:',
    expectedPointsList,
    '',
    'HOSPITAL STORY CONTEXT (for reference if child mentions their visit):',
    storySummary,
    '',
    'SHARED CONVERSATION HISTORY SO FAR:',
    recentTranscript,
  ].join('\n');
}

/**
 * Deterministic grounded fallback used when the Gemini API is unavailable or when
 * running offline/hermetic tests. Preserves the full "Explain it to Kare" experience.
 */
export function generateLocalExplainResponse(
  point: RecoveryPointContent,
  userMessage: string,
  mode: 'respond' | 'rephrase',
  existingCoveredIds: string[] = []
): ExplainTurnResult {
  if (mode === 'rephrase') {
    const firstUnclear =
      point.expectedLearningPoints.find((lp) => !existingCoveredIds.includes(lp.id)) ??
      point.expectedLearningPoints[0];

    const rephrasedByStep: Record<string, string> = {
      'care-1-keep-dry':
        'Here is another way to think about it: my cast has soft padding inside that acts like a sponge. If water gets in during a bath or from a sprinkler, it stays wet and can make my skin sore. How can you and your grown-up help keep your cast dry?',
      'care-2-nothing-inside':
        'Here is another way to think about it: even if my arm feels super itchy under the cast, poking a pencil or ruler inside can scratch my hidden skin. What is a safer thing to do when your cast feels itchy?',
      'care-3-warning-signs':
        'Here is another way to think about it: your fingers peek out of the cast so you can check how they feel. If they feel tingly, numb, or cold, change colour, or if your arm hurts more, who should you tell right away?',
    };

    const reply =
      rephrasedByStep[point.id] ??
      `${point.childInstruction} ${point.moreAboutThis} Can you tell me ${firstUnclear.childFriendlyHint.toLowerCase()}`;

    const unclearLearningPoints = point.expectedLearningPoints.filter(
      (lp) => !existingCoveredIds.includes(lp.id)
    );

    return {
      reply,
      isOutOfScope: false,
      newlyCoveredPointIds: [],
      allCoveredPointIds: existingCoveredIds,
      unclearLearningPoints,
      usedFallback: true,
    };
  }

  // Check out-of-scope guardrail first
  if (isInputOutOfScope(userMessage)) {
    const unclearLearningPoints = point.expectedLearningPoints.filter(
      (lp) => !existingCoveredIds.includes(lp.id)
    );
    return {
      reply: FIXED_OUT_OF_SCOPE_MESSAGE,
      isOutOfScope: true,
      newlyCoveredPointIds: [],
      allCoveredPointIds: existingCoveredIds,
      unclearLearningPoints,
      usedFallback: true,
    };
  }

  const allCoveredPointIds = detectCoveredPointsFromText(
    point,
    userMessage,
    existingCoveredIds
  );
  const newlyCoveredPointIds = allCoveredPointIds.filter(
    (id) => !existingCoveredIds.includes(id)
  );
  const unclearLearningPoints = point.expectedLearningPoints.filter(
    (lp) => !allCoveredPointIds.includes(lp.id)
  );

  if (unclearLearningPoints.length === 0) {
    return {
      reply:
        'Thank you for explaining that so clearly! You covered all the key parts of this step. Would you like to share this idea with your grown-up too?',
      isOutOfScope: false,
      newlyCoveredPointIds,
      allCoveredPointIds,
      unclearLearningPoints: [],
      usedFallback: true,
    };
  }

  const nextToAsk = unclearLearningPoints[0];
  const encouragement =
    newlyCoveredPointIds.length > 0
      ? 'Nice job explaining that part!'
      : 'Thank you for sharing your thoughts with me!';

  const followUpQuestionByLpId: Record<string, string> = {
    'lp-1-keep-dry': 'What should we do around bath water or sprinklers so the cast stays dry?',
    'lp-1-protect-skin': 'Why is it important to keep water away from the soft padding inside your cast?',
    'lp-2-no-objects': 'Why should we keep pencils or other objects out of the cast?',
    'lp-2-tell-grownup': 'Who can you tell if your arm feels itchy under the cast?',
    'lp-3-finger-signs': 'What feelings in your fingers or arm are warning signs to watch for?',
    'lp-3-tell-immediately': 'When your fingers feel tingly or cold, how quickly should you tell a grown-up?',
  };

  const question =
    followUpQuestionByLpId[nextToAsk.id] ??
    `Can you also tell me: ${nextToAsk.childFriendlyHint}`;

  return {
    reply: `${encouragement} ${question}`,
    isOutOfScope: false,
    newlyCoveredPointIds,
    allCoveredPointIds,
    unclearLearningPoints,
    usedFallback: true,
  };
}
