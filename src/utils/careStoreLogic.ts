export type DoseStatus = 'done' | 'due' | 'upcoming';

export interface Dose {
  id: string;
  name: string;
  amount: string;
  detail: string;
  time: string;
  status: DoseStatus;
}

export interface ParentInstruction {
  id: string;
  title: string;
  detail: string;
  fromRecording: boolean;
  isDemo?: boolean;
}

export interface DraftInstruction {
  id: string;
  title: string;
  detail: string;
  approved: boolean;
}

export interface StoryChoice {
  id: string;
  label: string;
  isCorrect: boolean;
  symbol: string;
}

export interface StoryPage {
  id: string;
  title: string;
  expression: string;
  scene: string;
  speech: string;
  more: string;
  question: string;
  choices: StoryChoice[];
  reveal: string;
  symbol?: string;
  tryTitle?: string;
  tryDetail?: string;
}

export type BearMoodKey = 'sick' | 'tired' | 'steady' | 'bright';

export interface BearMoodInfo {
  key: BearMoodKey;
  level: number;
  title: string;
  detail: string;
  color: string;
  soft: string;
}

export const THEME = {
  bg: '#FAF6F0',
  card: '#FFFFFF',
  cream: '#F5EADF',
  border: '#E8E2D8',
  borderSoft: '#EFEAE1',
  teal: '#0E5A54',
  tealDark: '#0B4742',
  tealSoft: '#E6F4F1',
  tealBorder: '#BCE3DC',
  terra: '#E06D38',
  terraSoft: '#FDF0E6',
  terraBorder: '#F4D2BA',
  pinkSoft: '#FAF0F3',
  pinkBorder: '#F4D0DC',
  text: '#163835',
  muted: '#556B68',
  subtle: '#7E908D',
} as const;

export const PUPPY_GOAL = 17;
export const MAX_CUPS = 8;
export const MAX_COLD_TREATS = 3;
export const MAX_REST = 2;

export function getBearMood(wellness: number, companionName: string): BearMoodInfo {
  const safeName = companionName.trim() || 'Kare';
  const clamped = Math.max(0, Math.min(3, Math.round(wellness)));

  switch (clamped) {
    case 3:
      return {
        key: 'bright',
        level: 3,
        title: `${safeName} feels bright`,
        detail: `Care steps are helping. ${safeName} can bounce.`,
        color: '#1B8A4A',
        soft: '#E7F6EC',
      };
    case 2:
      return {
        key: 'steady',
        level: 2,
        title: `${safeName} feels steady`,
        detail: `${safeName} is okay. The next care step keeps it that way.`,
        color: THEME.teal,
        soft: THEME.tealSoft,
      };
    case 1:
      return {
        key: 'tired',
        level: 1,
        title: `${safeName} is getting tired`,
        detail: `A care step is waiting. ${safeName} needs help soon.`,
        color: '#C47B12',
        soft: '#FBF3E0',
      };
    default:
      return {
        key: 'sick',
        level: 0,
        title: `${safeName} is feeling sick`,
        detail: `A missed care step took stars away. Help ${safeName} feel better.`,
        color: '#C4483A',
        soft: '#FDECEA',
      };
  }
}

interface ClockTime {
  label: string;
  minutes: number;
}

const WORD_HOURS: Array<[string, number]> = [
  ['twelve', 12],
  ['eleven', 11],
  ['ten', 10],
  ['nine', 9],
  ['eight', 8],
  ['seven', 7],
  ['six', 6],
  ['five', 5],
  ['four', 4],
  ['three', 3],
  ['two', 2],
  ['one', 1],
];

export function parseClockMinutes(hour: number, minute: number, meridiem: string): number {
  const clampedHour = Math.min(Math.max(hour, 1), 12) % 12;
  const offset = meridiem.toUpperCase() === 'PM' ? 12 * 60 : 0;
  return offset + clampedHour * 60 + Math.min(Math.max(minute, 0), 59);
}

export function extractAmountFromText(text: string): string {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(ml|milliliters?)\b/i);
  if (!match) return '';
  return `${match[1]} mL`;
}

export function parseClockTimeFromText(text: string): ClockTime | null {
  const numericMatch = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (numericMatch) {
    const hour = parseInt(numericMatch[1], 10);
    const minute = numericMatch[2] ? parseInt(numericMatch[2], 10) : 0;
    const rawMeridiem = numericMatch[3].toLowerCase();
    const meridiem = rawMeridiem.startsWith('p') ? 'PM' : 'AM';
    const minStr = String(minute).padStart(2, '0');
    return {
      label: `${hour}:${minStr} ${meridiem}`,
      minutes: parseClockMinutes(hour, minute, meridiem),
    };
  }

  const lower = text.toLowerCase();
  for (const [word, hour] of WORD_HOURS) {
    const pattern = new RegExp(
      `\\b${word}(?:\\s+o'?clock)?(?:\\s+in\\s+the)?\\s+(morning|afternoon|evening|night)\\b`,
      'i'
    );
    const match = lower.match(pattern);
    if (match) {
      const period = match[1].toLowerCase();
      const meridiem = period === 'morning' ? 'AM' : 'PM';
      return {
        label: `${hour}:00 ${meridiem}`,
        minutes: parseClockMinutes(hour, 0, meridiem),
      };
    }
  }

  if (lower.includes('noon')) {
    return { label: '12:00 PM', minutes: 12 * 60 };
  }
  if (lower.includes('midnight')) {
    return { label: '12:00 AM', minutes: 0 };
  }
  return null;
}

export function parseTimeLabelMinutes(label: string): number | null {
  return parseClockTimeFromText(label)?.minutes ?? null;
}

export function buildInstructionDoses(
  instructions: ParentInstruction[],
  previousDoses: Dose[] = []
): Dose[] {
  const doneIds = new Set(
    previousDoses.filter((d) => d.status === 'done').map((d) => d.id)
  );

  const parsed = instructions.map((instruction, index) => {
    const combined = `${instruction.title} ${instruction.detail}`;
    const clock = parseClockTimeFromText(combined);
    const amount = extractAmountFromText(combined);
    const name = instruction.title.trim() || 'Care step';
    const detail = instruction.detail.trim() || name;

    return {
      index,
      minutes: clock ? clock.minutes : null,
      dose: {
        id: instruction.id,
        name,
        amount,
        detail,
        time: clock ? clock.label : '',
        status: (doneIds.has(instruction.id) ? 'done' : 'upcoming') as DoseStatus,
      },
    };
  });

  parsed.sort((lhs, rhs) => {
    if (lhs.minutes !== null && rhs.minutes !== null) {
      if (lhs.minutes !== rhs.minutes) return lhs.minutes - rhs.minutes;
      return lhs.index - rhs.index;
    }
    if (lhs.minutes !== null) return -1;
    if (rhs.minutes !== null) return 1;
    return lhs.index - rhs.index;
  });

  const doses = parsed.map((p) => p.dose);
  return normalizeDueDose(doses);
}

export function normalizeDueDose(doses: Dose[]): Dose[] {
  let assignedDue = false;
  return doses.map((dose) => {
    if (dose.status === 'done') {
      return dose;
    }
    if (!assignedDue) {
      assignedDue = true;
      return { ...dose, status: 'due' };
    }
    return { ...dose, status: 'upcoming' };
  });
}

export function extractLocalStepsFromTranscript(transcript: string): Array<{ title: string; detail: string }> {
  const cleaned = transcript.replace(/\r?\n/g, ' ');
  const parts = cleaned
    .split(/[.!?;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const results: Array<{ title: string; detail: string }> = [];

  for (const part of parts) {
    const lower = part.toLowerCase();
    const isActionable =
      lower.includes('sip') ||
      lower.includes('water') ||
      lower.includes('drink') ||
      lower.includes('medicine') ||
      lower.includes('dose') ||
      lower.includes('ml') ||
      lower.includes('popsicle') ||
      lower.includes('soft') ||
      lower.includes('rest') ||
      lower.includes('quiet') ||
      lower.includes('call') ||
      lower.includes('bleed') ||
      lower.includes('fever') ||
      lower.includes('keep') ||
      lower.includes('dry') ||
      lower.includes('cast') ||
      lower.includes('elevat') ||
      lower.includes('give') ||
      lower.includes('take') ||
      lower.includes('offer');

    if (!isActionable) continue;

    const words = part.split(/\s+/).slice(0, 4).join(' ');
    const title = words.charAt(0).toUpperCase() + words.slice(1);
    const detail = part.endsWith('.') ? part : `${part}.`;
    results.push({ title, detail });
    if (results.length >= 6) break;
  }

  if (results.length === 0 && transcript.trim().length > 0) {
    const trimmed = transcript.trim();
    const words = trimmed.split(/\s+/).slice(0, 4).join(' ');
    results.push({
      title: words.charAt(0).toUpperCase() + words.slice(1),
      detail: trimmed.endsWith('.') ? trimmed : `${trimmed}.`,
    });
  }

  return results;
}

export function substituteCompanionName(page: StoryPage, companionName: string): StoryPage {
  const trimmed = companionName.trim();
  if (!trimmed || trimmed === 'Kare') return page;

  const swap = (text: string) =>
    text.replace(/Kare's/g, `${trimmed}'s`).replace(/\bKare\b/g, trimmed);

  return {
    ...page,
    title: swap(page.title),
    scene: swap(page.scene),
    speech: swap(page.speech),
    more: swap(page.more),
    question: swap(page.question),
    choices: page.choices.map((c) => ({ ...c, label: swap(c.label) })),
    reveal: swap(page.reveal),
    tryTitle: page.tryTitle ? swap(page.tryTitle) : undefined,
    tryDetail: page.tryDetail ? swap(page.tryDetail) : undefined,
  };
}

export const CORE_STORY_PAGES: StoryPage[] = [
  {
    id: 'rest',
    title: 'Resting',
    expression: 'Calm',
    scene: 'Kare sits quietly with a soft pillow.',
    speech: 'My throat feels sore after the hospital. Quiet rest helps my body heal.',
    more: 'Stories, drawing, and cuddles are good quiet games today.',
    question: 'What helps Kare heal today?',
    choices: [
      { id: 'rest-run', label: 'Running fast outside', isCorrect: false, symbol: 'figure.run' },
      { id: 'rest-quiet', label: 'Quiet rest with a pillow', isCorrect: true, symbol: 'bed.double.fill' },
      { id: 'rest-shout', label: 'Shouting with friends', isCorrect: false, symbol: 'speaker.wave.3.fill' },
    ],
    reveal: "Here's the answer: quiet rest with a pillow. Let's talk about it together.",
  },
  {
    id: 'medicine',
    title: 'Medicine time',
    expression: 'Encouraging',
    scene: 'A grown-up checks the medicine cup.',
    speech: 'A grown-up measures my medicine and checks the clock. I take it with their help.',
    more: 'Kids never take medicine by themselves.',
    question: "Who gives Kare's medicine?",
    choices: [
      { id: 'med-adult', label: 'A grown-up checks and gives it', isCorrect: true, symbol: 'checkmark.shield.fill' },
      { id: 'med-alone', label: 'Kare takes it alone', isCorrect: false, symbol: 'hand.raised.fill' },
      { id: 'med-guess', label: 'A friend guesses the amount', isCorrect: false, symbol: 'questionmark.circle' },
    ],
    reveal: "Here's the answer: a grown-up checks and gives it. Let's talk about it together.",
  },
  {
    id: 'sips',
    title: 'Small cold sips',
    expression: 'Gentle',
    scene: 'Kare holds a cool cup of water.',
    speech: 'Small cold sips feel better than one big gulp. I drink a little water, then I rest my throat.',
    more: 'If the cups stay empty by the afternoon, tell a grown-up.',
    question: "Which drink is gentler for Kare's throat?",
    choices: [
      { id: 'sip-hot', label: 'A big gulp of hot soup', isCorrect: false, symbol: 'mug.fill' },
      { id: 'sip-cold', label: 'A small sip of cold water', isCorrect: true, symbol: 'drop.fill' },
      { id: 'sip-none', label: 'No drinks today', isCorrect: false, symbol: 'nosign' },
    ],
    reveal: "Here's the answer: a small sip of cold water. Let's talk about it together.",
  },
  {
    id: 'treat',
    title: 'A cold treat',
    expression: 'Cheerful',
    scene: 'A popsicle can soothe a sore throat.',
    speech: 'A popsicle can soothe my throat. Crunchy snacks can wait until a grown-up says they are OK.',
    more: 'Cold and soft is kinder than chips or dry toast right now.',
    question: 'Kare is hungry. Which snack is kinder today?',
    choices: [
      { id: 'treat-chips', label: 'Crunchy chips', isCorrect: false, symbol: 'fork.knife' },
      { id: 'treat-pop', label: 'A cold popsicle', isCorrect: true, symbol: 'snowflake' },
      { id: 'treat-toast', label: 'Dry toast', isCorrect: false, symbol: 'birthday.cake' },
    ],
    reveal: "Here's the answer: a cold popsicle. Let's talk about it together.",
  },
  {
    id: 'speak',
    title: 'Tell a grown-up',
    expression: 'Serious',
    scene: 'Kare speaks up when something feels wrong.',
    speech: 'If I cannot drink, or something feels wrong, I tell a grown-up right away. They know who to call.',
    more: 'Speak up right away for bleeding, trouble breathing, or being too sleepy to sip.',
    question: 'Kare cannot sip and feels very sleepy. What should happen?',
    choices: [
      { id: 'help-wait', label: 'Wait until tomorrow', isCorrect: false, symbol: 'clock' },
      { id: 'help-tell', label: 'Tell a grown-up right away', isCorrect: true, symbol: 'phone.fill' },
      { id: 'help-extra', label: 'Take extra medicine alone', isCorrect: false, symbol: 'pills.fill' },
    ],
    reveal: "Here's the answer: tell a grown-up right away. Let's talk about it together.",
  },
];

export const TUTORIAL_STORY_PAGE: StoryPage = {
  id: 'tour-practice',
  title: 'How a page works',
  expression: 'Encouraging',
  scene: 'Kare is practicing with you.',
  speech:
    'Read what I say, then answer the question. A first miss means look again. A second miss shows the answer so you can talk with a grown-up.',
  more: 'Story answers do not add stars. Finished to-dos add stars.',
  question: 'Who helps with a care step?',
  choices: [
    { id: 'tour-alone', label: 'The child, all alone', isCorrect: false, symbol: 'person.fill' },
    { id: 'tour-adult', label: 'A grown-up', isCorrect: true, symbol: 'heart.fill' },
    { id: 'tour-none', label: 'Nobody', isCorrect: false, symbol: 'nosign' },
  ],
  reveal: "Here's the answer: a grown-up helps with a care step. Let's talk about it together.",
};

export function buildPrepPages(childName: string, companionName = 'Kare'): StoryPage[] {
  const name = childName.trim();
  const hello = name ? `Hi, ${name}. I'm Kare.` : "Hi. I'm Kare.";
  const rawPages: StoryPage[] = [
    {
      id: 'prep-welcome',
      title: 'A tour with Kare',
      expression: 'Calm',
      scene: 'Kare waves in a quiet room.',
      speech: `${hello} Before an operation, you may see new clothes, soft beeps, and helpers. We can meet them one at a time. A grown-up stays with you.`,
      more: 'Wiggly, shy, and brave can all be true at once. You can hold a hand.',
      question: 'Who can stay with you on this tour?',
      choices: [
        { id: 'prep-welcome-alone', label: 'You have to go alone', isCorrect: false, symbol: 'person.fill' },
        { id: 'prep-welcome-adult', label: 'A grown-up', isCorrect: true, symbol: 'heart.fill' },
        { id: 'prep-welcome-none', label: 'Nobody you know', isCorrect: false, symbol: 'nosign' },
      ],
      reveal: "Here's the answer: a grown-up stays with you. Let's talk about it together.",
      symbol: 'heart.fill',
      tryTitle: 'Breathe with Kare',
      tryDetail:
        'Breathe in as the circle grows. Breathe out as it rests. You can do this whenever something feels new.',
    },
    {
      id: 'prep-scrubs',
      title: 'Helpers in scrubs',
      expression: 'Encouraging',
      scene: 'Kare sees helpers in matching clothes.',
      speech:
        'Hospital helpers wear scrubs. Scrubs are clean, comfy clothes for taking care of people. A name badge tells you who they are. You can ask, “What is your job?”',
      more: 'Nurses, doctors, and other helpers may all wear scrubs. The color helps you see who works here.',
      question: 'What are scrubs?',
      choices: [
        { id: 'prep-scrubs-scary', label: 'Clothes that mean someone is mean', isCorrect: false, symbol: 'exclamationmark.triangle' },
        { id: 'prep-scrubs-clothes', label: 'Clean clothes helpers wear', isCorrect: true, symbol: 'tshirt.fill' },
        { id: 'prep-scrubs-sleep', label: 'Pajamas you must sleep in', isCorrect: false, symbol: 'moon.fill' },
      ],
      reveal: "Here's the answer: scrubs are clean clothes helpers wear. Let's talk about it together.",
      symbol: 'person.2.fill',
      tryTitle: 'Find the helper',
      tryDetail: 'Look for a person, a name badge, and scrubs. That person is here to help.',
    },
    {
      id: 'prep-gown',
      title: 'The hospital gown',
      expression: 'Calm',
      scene: 'Kare changes with a grown-up nearby.',
      speech:
        'You change into a gown. It is a loose shirt that opens in the back so helpers can take care of you. Your clothes wait in a bag. A grown-up can help you change.',
      more: 'The open back is for care. You can ask for another gown if you want a second layer.',
      question: 'Why do kids change into a gown?',
      choices: [
        { id: 'prep-gown-trouble', label: 'Because they are in trouble', isCorrect: false, symbol: 'exclamationmark' },
        { id: 'prep-gown-care', label: 'So helpers can take care of them', isCorrect: true, symbol: 'hands.and.sparkles.fill' },
        { id: 'prep-gown-wrong', label: 'Because their clothes are bad', isCorrect: false, symbol: 'tshirt' },
      ],
      reveal: "Here's the answer: the gown helps helpers take care of you. Let's talk about it together.",
      symbol: 'tshirt.fill',
      tryTitle: 'Pack the clothes',
      tryDetail: 'Your shirt and pants go in a bag with your name. They wait for you. The gown is just for now.',
    },
    {
      id: 'prep-measure',
      title: 'Height and weight',
      expression: 'Cheerful',
      scene: 'Kare stands by a ruler and a scale.',
      speech:
        'Helpers check how tall you are and how much you weigh. You may stand on a scale and next to a ruler. Shoes sometimes come off. This is not a test. There is no failing.',
      more: 'They learn the size of your body so they can take care of you. Every body is a good body to measure.',
      question: 'Why do helpers check height and weight?',
      choices: [
        { id: 'prep-measure-contest', label: 'To see who wins a contest', isCorrect: false, symbol: 'trophy.fill' },
        { id: 'prep-measure-size', label: 'To learn the size of your body', isCorrect: true, symbol: 'ruler.fill' },
        { id: 'prep-measure-home', label: 'To decide if you can leave', isCorrect: false, symbol: 'door.left.hand.open' },
      ],
      reveal: "Here's the answer: height and weight tell helpers the size of your body. Let's talk about it together.",
      symbol: 'ruler.fill',
      tryTitle: 'Stand tall with Kare',
      tryDetail: 'Feet flat. Shoulders soft. The numbers are about your body today. You cannot get them wrong.',
    },
    {
      id: 'prep-thermometer',
      title: 'The thermometer',
      expression: 'Encouraging',
      scene: 'Kare holds still for one beep.',
      speech:
        'A thermometer checks how warm your body is. It might touch your forehead, rest under your arm, or sit by your ear. It often beeps when it is done. The beep means finished.',
      more: 'Hold still like a statue for a moment. Then you can wiggle again.',
      question: 'What does a thermometer check?',
      choices: [
        { id: 'prep-thermo-shout', label: 'How loud you can shout', isCorrect: false, symbol: 'speaker.wave.3.fill' },
        { id: 'prep-thermo-warm', label: 'How warm your body is', isCorrect: true, symbol: 'thermometer.medium' },
        { id: 'prep-thermo-wrong', label: 'Whether you did something wrong', isCorrect: false, symbol: 'xmark' },
      ],
      reveal: "Here's the answer: a thermometer checks how warm your body is. Let's talk about it together.",
      symbol: 'thermometer.medium',
      tryTitle: 'Wait for the beep',
      tryDetail: 'Still for a second. Beep. Done. The number tells helpers how your body is doing today.',
    },
    {
      id: 'prep-stethoscope',
      title: 'The stethoscope',
      expression: 'Cheerful',
      scene: 'Kare hears a soft heartbeat.',
      speech:
        'A stethoscope lets a helper hear your heart and your breathing. The round part can feel cool on your skin. It does not pinch. You can ask if you may listen too.',
      more: 'A heart can sound like a soft drum. Breathing can sound like a little wind.',
      question: 'What can a helper hear with a stethoscope?',
      choices: [
        { id: 'prep-steth-thoughts', label: 'Your thoughts', isCorrect: false, symbol: 'brain' },
        { id: 'prep-steth-heart', label: 'Your heart and breathing', isCorrect: true, symbol: 'stethoscope' },
        { id: 'prep-steth-alarm', label: 'A secret alarm', isCorrect: false, symbol: 'bell.fill' },
      ],
      reveal: "Here's the answer: a stethoscope listens to your heart and breathing. Let's talk about it together.",
      symbol: 'stethoscope',
      tryTitle: 'Listen for the drum',
      tryDetail: 'Thump-thump. That is a heart saying hello. Cool metal warms up quickly.',
    },
    {
      id: 'prep-cuff',
      title: 'The blood pressure cuff',
      expression: 'Calm',
      scene: "A cuff gives Kare's arm a short hug.",
      speech:
        'A blood pressure cuff wraps around your arm like a hug. It squeezes, then lets go. The squeeze can feel tight for a few breaths. Then it loosens. It is checking how strongly your heart pushes.',
      more: 'Your arm is not stuck. If the squeeze feels like too much, tell the helper.',
      question: 'What does the cuff do after it squeezes?',
      choices: [
        { id: 'prep-cuff-stay', label: 'It stays tight all day', isCorrect: false, symbol: 'lock.fill' },
        { id: 'prep-cuff-release', label: 'It lets go', isCorrect: true, symbol: 'arrow.left.and.right' },
        { id: 'prep-cuff-break', label: 'It means the arm is hurt', isCorrect: false, symbol: 'bandage.fill' },
      ],
      reveal: "Here's the answer: the cuff squeezes, then lets go. Let's talk about it together.",
      symbol: 'arrow.left.and.right',
      tryTitle: 'Squeeze, then let go',
      tryDetail: 'Tight for a moment. Then loose. The hug is finished when the cuff relaxes.',
    },
    {
      id: 'prep-vitals',
      title: 'Taking vitals',
      expression: 'Encouraging',
      scene: 'Kare finishes a set of body checks.',
      speech:
        'Vitals are the body checks together: warmth, heartbeat, breathing, and blood pressure. Helpers write them down to see how you are doing today. Vitals are a hello to your body.',
      more: 'You might have vitals more than once. That means the helpers are being careful.',
      question: 'What are vitals?',
      choices: [
        { id: 'prep-vitals-punish', label: 'A punishment', isCorrect: false, symbol: 'nosign' },
        { id: 'prep-vitals-check', label: 'Checks of how your body is doing', isCorrect: true, symbol: 'list.clipboard.fill' },
        { id: 'prep-vitals-lose', label: 'A game you can lose', isCorrect: false, symbol: 'flag.checkered' },
      ],
      reveal: "Here's the answer: vitals are checks of how your body is doing. Let's talk about it together.",
      symbol: 'list.clipboard.fill',
      tryTitle: 'Count the checks',
      tryDetail: 'Warmth. Heart. Breathing. Blood pressure. Four hellos. Then the helper writes them down.',
    },
    {
      id: 'prep-iv',
      title: 'The IV and the pole',
      expression: 'Calm',
      scene: 'A tall pole holds a bag beside Kare.',
      speech:
        'An IV is a tiny soft straw that can give your body a drink of water or medicine. Placing it can feel like a quick pinch. Then the pinch is over, and the straw stays still. The tall pole holds the bag up high so the drink can drip. The pole has wheels, so you can walk with a grown-up.',
      more: 'Looking away and squeezing a hand is a good plan. Leave the straw in place. A helper takes it out when it is time.',
      question: 'What happens with an IV?',
      choices: [
        { id: 'prep-iv-allday', label: 'The pinch lasts all day', isCorrect: false, symbol: 'clock.fill' },
        { id: 'prep-iv-pinch', label: 'A quick pinch, then a helper removes it later', isCorrect: true, symbol: 'hand.raised.fill' },
        { id: 'prep-iv-pull', label: 'You should pull it out', isCorrect: false, symbol: 'hand.draw' },
      ],
      reveal: "Here's the answer: the pinch is quick, and a helper takes the IV out later. Let's talk about it together.",
      symbol: 'bag.fill',
      tryTitle: 'Watch the bag',
      tryDetail: 'The bag hangs up high. Drip, drip. The pole rolls with you. The straw stays until a helper says it is done.',
    },
    {
      id: 'prep-mask',
      title: 'The anaesthesia mask',
      expression: 'Calm',
      scene: 'Kare holds a soft mask with a grown-up close.',
      speech:
        'The anaesthesia mask is a soft cup over your nose and mouth. It gives sleepy air so your body can rest during the operation. Breathe slowly, like fogging a window. A grown-up can hold your hand. You wake up when it is time.',
      more: 'The mask might smell like plastic, or like something sweet. Smells can differ. You can ask for a story while you breathe.',
      question: 'What is the sleepy air for?',
      choices: [
        { id: 'prep-mask-play', label: 'So you can run around the room', isCorrect: false, symbol: 'figure.run' },
        { id: 'prep-mask-rest', label: 'So your body can rest, then you wake up', isCorrect: true, symbol: 'moon.stars.fill' },
        { id: 'prep-mask-hair', label: 'So your hair grows faster', isCorrect: false, symbol: 'comb.fill' },
      ],
      reveal: "Here's the answer: the sleepy air helps your body rest during the operation, and you wake up afterward. Let's talk about it together.",
      symbol: 'facemask.fill',
      tryTitle: 'Fog the window',
      tryDetail: 'Slow breath in. Slow breath out, like fog on a window. A hand can stay in yours the whole time.',
    },
    {
      id: 'prep-ready',
      title: 'You know the way',
      expression: 'Cheerful',
      scene: 'Kare smiles beside you.',
      speech:
        'You met the scrubs, the gown, the measuring, the thermometer, the stethoscope, the cuff, the vitals, the IV pole, and the mask. When something looks new, you can ask what it is. When you want a hand, you can say so.',
      more: 'Nervous and ready can sit side by side. You can play this tour again any time.',
      question: 'What can you do when something feels new?',
      choices: [
        { id: 'prep-ready-hide', label: 'Hide the question', isCorrect: false, symbol: 'eye.slash' },
        { id: 'prep-ready-ask', label: 'Ask what it is, and hold a hand', isCorrect: true, symbol: 'bubble.left.and.heart.fill' },
        { id: 'prep-ready-trouble', label: 'Decide you are in trouble', isCorrect: false, symbol: 'exclamationmark' },
      ],
      reveal: "Here's the answer: ask what it is, and you can hold a hand. Let's talk about it together.",
      symbol: 'hands.and.sparkles.fill',
      tryTitle: 'Practice the question',
      tryDetail: 'Try saying, “What is that?” and “Can I hold your hand?” Both questions are welcome.',
    },
  ];

  return rawPages.map((p) => substituteCompanionName(p, companionName));
}

export function buildStoryPagesForInstructions(
  instructions: ParentInstruction[],
  companionName = 'Kare'
): StoryPage[] {
  if (instructions.length === 0) {
    const waitingPage: StoryPage = {
      id: 'waiting-for-parent',
      title: 'Kare is getting ready',
      expression: 'Gentle',
      scene: 'Kare sits with a notebook.',
      speech:
        'A grown-up is adding your care steps. When they save them, I will tell you about each one here.',
      more: 'Hand this to a grown-up if you are ready to add care steps together.',
      question: 'Who adds the care steps to KareBEAR?',
      choices: [
        { id: 'wait-adult', label: 'A grown-up', isCorrect: true, symbol: 'checkmark.shield.fill' },
        { id: 'wait-bear', label: 'Kare makes them up', isCorrect: false, symbol: 'pawprint.fill' },
        { id: 'wait-guess', label: 'We guess by ourselves', isCorrect: false, symbol: 'questionmark.circle' },
      ],
      reveal: "Here's the answer: a grown-up adds the care steps. Let's talk about it together.",
    };
    return [substituteCompanionName(waitingPage, companionName)];
  }

  const customPages: StoryPage[] = instructions.map((instruction) => {
    const page: StoryPage = {
      id: `parent-${instruction.id}`,
      title: instruction.title,
      expression: instruction.fromRecording ? 'Listening' : 'Encouraging',
      scene: instruction.fromRecording
        ? 'From the care visit recording, checked by a grown-up.'
        : 'Added by a grown-up for home care.',
      speech: `Here is a care step from your grown-up: ${instruction.detail}`,
      more: 'Do this step with a grown-up. Ask them if any part feels confusing.',
      question: `What is the "${instruction.title}" step about?`,
      choices: [
        {
          id: `parent-correct-${instruction.id}`,
          label: `${instruction.detail} With a grown-up.`,
          isCorrect: true,
          symbol: 'checkmark.circle.fill',
        },
        {
          id: `parent-skip-${instruction.id}`,
          label: 'Skip it and do not tell anyone',
          isCorrect: false,
          symbol: 'xmark.circle',
        },
        {
          id: `parent-alone-${instruction.id}`,
          label: 'Try to do medical steps all alone',
          isCorrect: false,
          symbol: 'hand.raised.fill',
        },
      ],
      reveal: `Here's the answer: ${instruction.detail} A grown-up helps with this step. Let's talk about it together.`,
    };
    return substituteCompanionName(page, companionName);
  });

  const corePages = CORE_STORY_PAGES.map((p) => substituteCompanionName(p, companionName));
  return [...customPages, ...corePages];
}

export const SAMPLE_TONSILLECTOMY_STEPS: ParentInstruction[] = [
  {
    id: 'demo-med-morning',
    title: 'Morning pain medicine',
    detail: 'Give 5 mL liquid acetaminophen at 8:00 AM with a cool sip of water.',
    fromRecording: true,
    isDemo: true,
  },
  {
    id: 'demo-cold-sips',
    title: 'Cool water sips',
    detail: 'Offer small cold sips every hour at 10:30 AM to keep the throat moist.',
    fromRecording: true,
    isDemo: true,
  },
  {
    id: 'demo-afternoon-pop',
    title: 'Afternoon cold popsicle',
    detail: 'Offer a soft cold popsicle at 2:00 PM and avoid crunchy chips or toast.',
    fromRecording: false,
    isDemo: true,
  },
  {
    id: 'demo-evening-med',
    title: 'Evening comfort dose',
    detail: 'Check temperature and give 5 mL comfort medicine at 8:00 PM before quiet bedtime stories.',
    fromRecording: true,
    isDemo: true,
  },
];

export const SAMPLE_CAST_CARE_STEPS: ParentInstruction[] = [
  {
    id: 'cast-dry',
    title: 'Keep the cast dry',
    detail: 'This non-waterproof cast must stay dry at 8:30 AM bath time using a sealed cover.',
    fromRecording: false,
    isDemo: true,
  },
  {
    id: 'cast-elevate',
    title: 'Raise on soft pillows',
    detail: 'Rest the cast on soft pillows above heart level at 1:00 PM while reading or watching a show.',
    fromRecording: false,
    isDemo: true,
  },
  {
    id: 'cast-wiggle',
    title: 'Wiggle fingers & toes',
    detail: 'Wiggle fingers or toes at 6:00 PM and tell a grown-up right away if anything feels too tight or tingly.',
    fromRecording: true,
    isDemo: true,
  },
];

export const SAMPLE_VISIT_TRANSCRIPT =
  'Give 5 mL of pain medicine at 8:00 AM and again at 2:00 PM with a grown-up. Offer small cold sips of water throughout the morning so the throat stays comfortable. Give a soft cold popsicle in the afternoon and avoid crunchy snacks. Call the care clinic right away if you see bright red bleeding or a fever over 101.5.';
