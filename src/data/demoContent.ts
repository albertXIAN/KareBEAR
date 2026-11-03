/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single editable content store for KareBEAR V0 Clickable Prototype.
 * All child-facing story pages, recovery points, comprehension checks,
 * caregiver guidance, and SickKids source grounding live here.
 */

export type KareExpression = 'waving' | 'calm' | 'celebrating' | 'encouraging';

export type BearVariant = 'companion' | 'doctor' | 'checklist';

export const BEAR_ASSETS: Record<
  BearVariant,
  { src: string; alt: string; label: string }
> = {
  companion: {
    src: '/assets/aistudio/unknown_7e14f926.png',
    alt: 'Kare the honey-brown bear sitting warmly with a red heart on its chest',
    label: 'Kare Companion Bear',
  },
  doctor: {
    src: '/assets/aistudio/unknown_5bda4a1f.png',
    alt: 'Kare the bear in a white coat with a stethoscope, pointer, and tablet at a clinic desk',
    label: 'Kare Clinic & Teaching Bear',
  },
  checklist: {
    src: '/assets/aistudio/unknown_dbe30f69.png',
    alt: 'Kare the bear wearing glasses and holding a health checklist clipboard and pencil',
    label: 'Kare Checklist Bear',
  },
};

export type StorySceneProp =
  | 'reception-wristband'
  | 'xray-camera'
  | 'doctor-chart'
  | 'cast-wrap'
  | 'going-home';

export type RecoverySceneProp =
  | 'keep-cast-dry'
  | 'no-objects-inside'
  | 'finger-warning-signs';

export interface StoryPageContent {
  id: string;
  pageNumber: number;
  title: string;
  kareSpeech: string;
  speechNeedsReviewFlag: boolean;
  moreAboutThis?: string;
  moreAboutNeedsReviewFlag?: boolean;
  kareExpression: KareExpression;
  sceneProp: StorySceneProp;
}

export interface ComprehensionChoice {
  id: string;
  label: string;
  isCorrect: boolean;
  iconType: 'water' | 'play-dry' | 'remove-cast' | 'pencil' | 'tell-adult' | 'wait' | 'shake';
}

export interface ExpectedLearningPoint {
  id: string;
  label: string;
  childFriendlyHint: string;
  keywords: string[];
}

export const FIXED_OUT_OF_SCOPE_MESSAGE =
  'I can only help with the cast care steps in our lesson today. Please ask your grown-up, nurse, or doctor about that!';

export interface RecoveryPointContent {
  id: string;
  stepNumber: number;
  shortTitle: string;
  childInstruction: string;
  needsClinicalReviewFlag: boolean;
  moreAboutThis: string;
  moreAboutNeedsReviewFlag: boolean;
  alwaysIncludedBadge: string;
  originalSourceWording: string;
  sourceCitationLabel: string;
  sourceUrl: string;
  explainToCaregiverPrompt: string;
  expectedLearningPoints: ExpectedLearningPoint[];
  kareLearnExpression: KareExpression;
  sceneProp: RecoverySceneProp;
  comprehensionCheck: {
    id: string;
    scenarioQuestion: string;
    choices: ComprehensionChoice[];
    correctFeedback: string;
    firstIncorrectFeedback: string;
    secondIncorrectExplanation: string;
  };
}

export interface FeelingOption {
  id: string;
  label: string;
  faceType: 'worried' | 'little-worried' | 'ready';
}

export interface EnjoymentOption {
  id: string;
  label: string;
  faceType: 'not-really' | 'ok' | 'yes';
}

export interface FacilitatorTask {
  id: string;
  title: string;
  durationLabel: string;
  participantPrompt: string;
  developerVerificationNote: string;
}

export const SICKKIDS_SOURCE_INFO = {
  organization: 'The Hospital for Sick Children (SickKids) — AboutKidsHealth',
  articleTitle: 'Cast care: Arm or leg cast (Non-waterproof cast guidance)',
  url: 'https://www.aboutkidshealth.ca/cast-care-arm-or-leg-cast',
  castTypeNotice:
    'This demonstration concerns a non-waterproof cast (such as a plaster cast or standard fiberglass cast without a waterproof liner).',
  scopeNotice:
    'These three recovery points are selected learning examples for demonstration testing, not a complete clinical care plan. Important topics such as limb elevation, finger movement, cast damage, and pain management are excluded from V0 and can be reviewed in the full SickKids guidance.',
  approvalNotice:
    'Caregiver approval in this prototype means permission to show your child this demonstration content. It does not mean the simplified wording has been clinically validated.',
  reviewFlagLegend:
    '⚑ Marks simplified or unverified clinical wording that requires formal clinical review before real patient use.',
};

export const UI_COPY = {
  appName: 'KareBEAR',
  demoFooterNote: 'Demo content for testing. Not medical advice.',
  nonWaterproofTag: 'Non-waterproof arm cast example',
  home: {
    greeting: "Hi, I'm Kare! What would you like to do?",
    subtitle:
      'Explore with your child while waiting for a cast fitting, or review and customize how home care examples are presented.',
    storyCard: {
      id: 'journey-hospital-story',
      title: 'Read the hospital story',
      subtitle: 'For you and your child: what happens when you get a cast',
      badge: '5 short pages · Together with your child',
    },
    recoveryCard: {
      id: 'journey-home-care',
      title: 'Grown-ups: home care steps',
      subtitle: 'Check and approve what your child will learn',
      badge: '3 core examples · Caregiver review first',
    },
  },
  story: {
    moreAboutButton: 'More about this',
    hideMoreAboutButton: 'Hide extra detail',
    listenButton: 'Listen',
    stopListeningButton: 'Stop reading',
    nextButton: 'Next',
    backButton: 'Back',
    finishTitle: 'You finished the story!',
    finishSubtitle: "Thank you for reading with me. You can ask your grown-up or nurse any questions you have.",
    feelingsQuestion: 'How do you feel about getting your cast now?',
    optionalBadge: 'Optional — you can skip this anytime',
    backToHomeButton: 'Back to home',
  },
  grownUpReview: {
    screenTitle: 'Grown-ups: Review Home Care Learning Examples',
    introText:
      'Here is what Kare will teach your child about caring for a non-waterproof arm cast. All three core care steps are always included in this demonstration. You can adjust the supplemental detail and presentation settings below before handing the device to your child.',
    alwaysIncludedText: 'Always included in this demonstration.',
    seeOriginalWording: 'See original wording & SickKids source',
    hideOriginalWording: 'Hide original wording',
    supplementalToggleLabel: 'Include "More about this" extra detail for my child',
    presentationSectionTitle: 'Presentation preferences for your child',
    explainPromptToggleLabel:
      'Include "Explain in your own words to your grown-up" prompt on each step (unrecorded)',
    listenToggleLabel: 'Show "Listen" read-aloud button on child screens',
    approveButton: 'Approve for my child',
  },
  handover: {
    title: 'Approved. Now give the device to your child.',
    subtitle:
      'Sit together as your child learns each care example with Kare, tries the comprehension check, and explains each idea in their own words.',
    startButton: 'Start with Kare',
  },
  learn: {
    retryBanner: 'Take another look',
    retrySubtitle: "Let's read this part one more time together before trying the comprehension check again.",
    nextToCheckButton: 'Go to comprehension check',
    retryToCheckButton: 'Try the comprehension check again',
    explainBoxTitle: 'Talk together (in your own words)',
    explainBoxNote: 'No microphone or grading — just share with your grown-up!',
  },
  comprehension: {
    badge: 'Comprehension check',
    lookAgainButton: 'Look again',
    nextPointButton: 'Next step',
    finishJourneyButton: 'See your finish page',
    explainAfterCheckTitle: 'Tell your grown-up in your own words:',
  },
  finishSummary: {
    childCelebrationTitle: 'Great job learning with Kare!',
    childPrompt: 'Tell your grown-up one thing you will do to take care of your cast.',
    childPromptNote: 'Speak in your own words — nothing is recorded or scored.',
    enjoymentQuestion: 'Did you like learning with Kare?',
    caregiverSectionTitle: 'Grown-up Summary: Comprehension & Discussion Guide',
    caregiverSectionIntro:
      'This summary tracks first-try answers, retries, and which non-waterproof cast care examples still need a conversation together.',
    talkTogetherHeading: 'Talk about these together:',
    allClearMessage: 'Your child answered all comprehension checks on the first try. Keep reinforcing these habits daily!',
  },
};

export const STORY_PAGES: StoryPageContent[] = [
  {
    id: 'story-1-arriving',
    pageNumber: 1,
    title: 'Arriving at the clinic',
    kareSpeech:
      "Hi, I'm Kare! Today I'm getting a cast on my arm. It's OK to feel nervous. You can hold your grown-up's hand.",
    speechNeedsReviewFlag: false,
    moreAboutThis: 'At the front desk, you may get a wristband with your name on it.',
    moreAboutNeedsReviewFlag: true,
    kareExpression: 'waving',
    sceneProp: 'reception-wristband',
  },
  {
    id: 'story-2-xray',
    pageNumber: 2,
    title: 'Picture of your bones (X-ray)',
    kareSpeech:
      "First, I get an X-ray. It's a special picture of my bones. I stay very still while it's taken.",
    speechNeedsReviewFlag: true,
    moreAboutThis:
      "Taking the picture does not hurt. Moving your arm into place might feel sore. It's OK to say so.",
    moreAboutNeedsReviewFlag: true,
    kareExpression: 'calm',
    sceneProp: 'xray-camera',
  },
  {
    id: 'story-3-doctor',
    pageNumber: 3,
    title: 'Meeting the doctor',
    kareSpeech:
      'A doctor looks at my X-ray and tells me what they see. I can ask questions too!',
    speechNeedsReviewFlag: false,
    moreAboutThis:
      'Good questions to ask: What happened to my bone? How long will I have my cast?',
    moreAboutNeedsReviewFlag: false,
    kareExpression: 'calm',
    sceneProp: 'doctor-chart',
  },
  {
    id: 'story-4-cast',
    pageNumber: 4,
    title: 'Putting the cast on',
    kareSpeech:
      'Now my cast goes on. First a soft layer, then a wrap that gets hard. It might feel warm for a little while.',
    speechNeedsReviewFlag: true,
    moreAboutThis: 'Some hospitals let you pick a cast colour.',
    moreAboutNeedsReviewFlag: true,
    kareExpression: 'encouraging',
    sceneProp: 'cast-wrap',
  },
  {
    id: 'story-5-going-home',
    pageNumber: 5,
    title: 'Ready to go home',
    kareSpeech:
      'My cast helps keep my arm still while it heals. My grown-up will learn how to care for it at home.',
    speechNeedsReviewFlag: true,
    moreAboutThis: undefined,
    moreAboutNeedsReviewFlag: false,
    kareExpression: 'celebrating',
    sceneProp: 'going-home',
  },
];

export const RECOVERY_POINTS: RecoveryPointContent[] = [
  {
    id: 'care-1-keep-dry',
    stepNumber: 1,
    shortTitle: 'Keep your non-waterproof cast dry',
    childInstruction: 'Keep your cast dry, even at bath time.',
    needsClinicalReviewFlag: true,
    moreAboutThis:
      'Water can soak the soft padding inside a non-waterproof cast and hurt your skin. Your grown-up can help wrap it before a bath.',
    moreAboutNeedsReviewFlag: true,
    alwaysIncludedBadge: 'Always included in this demonstration.',
    originalSourceWording:
      'SickKids (AboutKidsHealth) Cast Care Guidance: Keep your child’s non-waterproof cast clean and dry at all times. Do not submerge the cast in water during baths or swimming. Moisture trapped inside the padding can irritate or damage the skin underneath.',
    sourceCitationLabel: 'SickKids AboutKidsHealth — Keeping a non-waterproof cast dry',
    sourceUrl: 'https://www.aboutkidshealth.ca/cast-care-arm-or-leg-cast',
    explainToCaregiverPrompt:
      'Tell your grown-up in your own words why water should not get inside your cast.',
    expectedLearningPoints: [
      {
        id: 'lp-1-keep-dry',
        label: 'Keep the cast away from water (bath, shower, sprinkler, or pool)',
        childFriendlyHint: 'Mention keeping your cast out of water or staying dry.',
        keywords: ['dry', 'water', 'wet', 'bath', 'sprinkler', 'shower', 'pool', 'rain', 'soak'],
      },
      {
        id: 'lp-1-protect-skin',
        label: 'Explain why or how to stay dry (wet padding can hurt skin; wrap it or play dry games)',
        childFriendlyHint: 'Mention why wet padding is bad for your skin or how a grown-up helps cover it.',
        keywords: ['skin', 'padding', 'soft', 'wrap', 'cover', 'bag', 'hurt', 'sore', 'inside', 'another way', 'grown-up'],
      },
    ],
    kareLearnExpression: 'calm',
    sceneProp: 'keep-cast-dry',
    comprehensionCheck: {
      id: 'check-1-keep-dry',
      scenarioQuestion: 'Kare wants to run through the sprinkler. What should Kare do?',
      choices: [
        {
          id: 'c1-run',
          label: 'Run through it',
          isCorrect: false,
          iconType: 'water',
        },
        {
          id: 'c1-keep-dry',
          label: 'Keep the cast dry and play another way',
          isCorrect: true,
          iconType: 'play-dry',
        },
        {
          id: 'c1-take-off',
          label: 'Take the cast off first',
          isCorrect: false,
          iconType: 'remove-cast',
        },
      ],
      correctFeedback: 'Yes! You remembered. Kare is proud of you.',
      firstIncorrectFeedback: "Not quite, and that's OK! Let's look at that part again.",
      secondIncorrectExplanation:
        "Here's the answer: keep the cast dry and play another way. Let's talk about it with your grown-up.",
    },
  },
  {
    id: 'care-2-nothing-inside',
    stepNumber: 2,
    shortTitle: 'Nothing inside the cast',
    childInstruction: "Don't put anything inside your cast, even if it's itchy. Tell a grown-up instead.",
    needsClinicalReviewFlag: true,
    moreAboutThis:
      'Scratching inside with a pencil or ruler can hurt your skin under the cast. A grown-up knows safe ways to help.',
    moreAboutNeedsReviewFlag: true,
    alwaysIncludedBadge: 'Always included in this demonstration.',
    originalSourceWording:
      'SickKids (AboutKidsHealth) Cast Care Guidance: Never put anything underneath the cast to scratch itching skin (such as pens, rulers, coat hangers, or cotton swabs). Objects can break the skin, bunch up padding, and cause hidden sores or infection.',
    sourceCitationLabel: 'SickKids AboutKidsHealth — Skin care and itching under a cast',
    sourceUrl: 'https://www.aboutkidshealth.ca/cast-care-arm-or-leg-cast',
    explainToCaregiverPrompt:
      'Tell your grown-up in your own words what you will do if your arm feels itchy under the cast.',
    expectedLearningPoints: [
      {
        id: 'lp-2-no-objects',
        label: 'Never put pencils, rulers, or other objects inside the cast to scratch',
        childFriendlyHint: 'Mention not putting anything (like a pencil or ruler) inside the cast.',
        keywords: ['nothing', 'never', 'don\'t put', 'do not put', 'pencil', 'ruler', 'pen', 'stick', 'object', 'inside', 'poke', 'scratch'],
      },
      {
        id: 'lp-2-tell-grownup',
        label: 'Tell a grown-up when the cast feels itchy so they can help safely',
        childFriendlyHint: 'Mention telling a grown-up when your arm feels itchy.',
        keywords: ['grown-up', 'grown up', 'parent', 'mom', 'dad', 'adult', 'tell', 'ask', 'safe', 'hurt skin'],
      },
    ],
    kareLearnExpression: 'encouraging',
    sceneProp: 'no-objects-inside',
    comprehensionCheck: {
      id: 'check-2-nothing-inside',
      scenarioQuestion: "Kare's arm feels itchy under the cast. What should Kare do?",
      choices: [
        {
          id: 'c2-pencil',
          label: 'Push a pencil inside to scratch',
          isCorrect: false,
          iconType: 'pencil',
        },
        {
          id: 'c2-tell-adult',
          label: 'Tell a grown-up',
          isCorrect: true,
          iconType: 'tell-adult',
        },
      ],
      correctFeedback: 'Yes! You remembered. Kare is proud of you.',
      firstIncorrectFeedback: "Not quite, and that's OK! Let's look at that part again.",
      secondIncorrectExplanation:
        "Here's the answer: tell a grown-up. Let's talk about it with your grown-up.",
    },
  },
  {
    id: 'care-3-warning-signs',
    stepNumber: 3,
    shortTitle: 'Warning signs to tell a grown-up right away',
    childInstruction:
      'Tell a grown-up right away if your fingers feel tingly, numb, or cold, change colour, or if your arm hurts more.',
    needsClinicalReviewFlag: true,
    moreAboutThis:
      'Checking your fingers helps make sure your cast is not too tight. Always tell a grown-up right away if your hand feels strange.',
    moreAboutNeedsReviewFlag: true,
    alwaysIncludedBadge: 'Always included in this demonstration.',
    originalSourceWording:
      'SickKids (AboutKidsHealth) Urgent Warning Signs: Seek immediate medical attention if fingers or toes become blue, pale/white, cold, or swollen; if the child feels numbness or tingling ("pins and needles"); if pain worsens or the cast feels too tight; or if there is a foul odour or drainage.',
    sourceCitationLabel: 'SickKids AboutKidsHealth — When to seek immediate medical attention',
    sourceUrl: 'https://www.aboutkidshealth.ca/cast-care-arm-or-leg-cast',
    explainToCaregiverPrompt:
      'Tell your grown-up in your own words what finger or arm feelings mean you should speak up right away.',
    expectedLearningPoints: [
      {
        id: 'lp-3-finger-signs',
        label: 'Watch for warning signs (tingly, numb, or cold fingers, colour change, or hurting more)',
        childFriendlyHint: 'Mention warning signs like tingly, numb, cold, colour changes, or hurting more.',
        keywords: ['tingly', 'tingle', 'numb', 'cold', 'colour', 'color', 'blue', 'pale', 'hurt', 'tight', 'finger', 'strange', 'pins'],
      },
      {
        id: 'lp-3-tell-immediately',
        label: 'Tell a grown-up right away instead of waiting',
        childFriendlyHint: 'Mention telling a grown-up right away.',
        keywords: ['right away', 'immediately', 'grown-up', 'grown up', 'parent', 'mom', 'dad', 'adult', 'tell', 'speak up'],
      },
    ],
    kareLearnExpression: 'encouraging',
    sceneProp: 'finger-warning-signs',
    comprehensionCheck: {
      id: 'check-3-warning-signs',
      scenarioQuestion: "Kare's fingers feel tingly and cold. What should Kare do?",
      choices: [
        {
          id: 'c3-wait',
          label: 'Wait and see',
          isCorrect: false,
          iconType: 'wait',
        },
        {
          id: 'c3-tell-adult',
          label: 'Tell a grown-up right away',
          isCorrect: true,
          iconType: 'tell-adult',
        },
        {
          id: 'c3-shake',
          label: 'Shake the arm hard',
          isCorrect: false,
          iconType: 'shake',
        },
      ],
      correctFeedback: 'Yes! You remembered. Kare is proud of you.',
      firstIncorrectFeedback: "Not quite, and that's OK! Let's look at that part again.",
      secondIncorrectExplanation:
        "Here's the answer: tell a grown-up right away. Let's talk about it with your grown-up.",
    },
  },
];

export const FEELING_OPTIONS: FeelingOption[] = [
  { id: 'feeling-worried', label: 'Worried', faceType: 'worried' },
  { id: 'feeling-little-worried', label: 'A little worried', faceType: 'little-worried' },
  { id: 'feeling-ready', label: 'Ready', faceType: 'ready' },
];

export const ENJOYMENT_OPTIONS: EnjoymentOption[] = [
  { id: 'enjoy-not-really', label: 'Not really', faceType: 'not-really' },
  { id: 'enjoy-ok', label: 'It was OK', faceType: 'ok' },
  { id: 'enjoy-yes', label: 'Yes!', faceType: 'yes' },
];

export const FACILITATOR_TASKS: FacilitatorTask[] = [
  {
    id: 'task-a',
    title: 'Task A — Waiting for Cast Assessment & Fitting (About 5 minutes)',
    durationLabel: '~5 minutes',
    participantPrompt:
      'Imagine you are a parent at the hospital fracture clinic or emergency department. Your 8-year-old, Sam, hurt their arm and is already waiting for assessment and a cast fitting. Sam is nervous and has lots of questions. Use KareBEAR with Sam to find out what will happen during the visit. When you are done, let the app know how Sam is feeling if Sam wants to share.',
    developerVerificationNote:
      'Frames the hospital scenario as a child already at the clinic waiting for assessment/cast fitting (never advising a delay until tomorrow after an acute injury). Feelings and enjoyment questions are optional and never block completion.',
  },
  {
    id: 'task-b',
    title: 'Task B — Non-Waterproof Cast Home Care Review & Comprehension Checks (About 5 minutes)',
    durationLabel: '~5 minutes',
    participantPrompt:
      'Sam is ready to go home with a non-waterproof arm cast. Before Sam uses KareBEAR, review the selected home care learning examples, check the original SickKids guidance if you wish, and choose your detail preferences. Then pass the device to Sam and go through each learning step, comprehension check, and own-words explanation together.',
    developerVerificationNote:
      'Participant prompt contains no instructions to deliberately make mistakes. First-incorrect (revisit learn page) and second-incorrect (reveal answer + flag for caregiver discussion) branches are verified separately in automated developer unit and browser tests.',
  },
];
