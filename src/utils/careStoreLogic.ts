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
  interaction?: 'talk';
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
    title: page.interaction === 'talk' ? page.title : swap(page.title),
    scene: swap(page.scene),
    speech: page.interaction === 'talk' ? page.speech : swap(page.speech),
    more: page.interaction === 'talk' ? page.more : swap(page.more),
    question: page.interaction === 'talk' ? page.question : swap(page.question),
    choices: page.choices.map((c) => ({ ...c, label: swap(c.label) })),
    reveal: page.interaction === 'talk' ? page.reveal : swap(page.reveal),
    tryTitle: page.tryTitle ? swap(page.tryTitle) : undefined,
    tryDetail: page.tryDetail ? swap(page.tryDetail) : undefined,
  };
}

// Keep choices stable while a child thinks, without putting every answer in one slot.
// Ages 5–6 see two choices; ages 7–8 see three. Older profiles retain three.
export function adaptStoryPageForAge(page: StoryPage, childAge: string | number = 7): StoryPage {
  if (page.interaction === 'talk' || page.choices.length < 2) return page;
  const parsedAge = Number(childAge);
  const age = Number.isFinite(parsedAge) && parsedAge >= 1 ? parsedAge : 7;
  const seed = Array.from(page.id).reduce((sum, char) => sum + char.codePointAt(0)!, 0);
  let choices = [...page.choices];
  if (age <= 6) {
    const correct = choices.find((choice) => choice.isCorrect);
    const others = choices.filter((choice) => !choice.isCorrect);
    if (correct && others.length) choices = [correct, others[seed % others.length]];
  }
  const offset = seed % choices.length;
  return { ...page, choices: [...choices.slice(offset), ...choices.slice(0, offset)] };
}

export const CORE_STORY_PAGES: StoryPage[] = [
  {
    "id": "rest",
    "title": "A quiet afternoon",
    "expression": "Encouraging",
    "scene": "Kare picks something to do while resting.",
    "speech": "My grown-up says it is time to rest. I can still have fun with a book or a drawing.",
    "more": "Your grown-up can help you choose an activity that fits your care plan.",
    "question": "It is rest time. What could Kare choose?",
    "choices": [
      {
        "id": "rest-run",
        "label": "A game of tag",
        "isCorrect": false,
        "symbol": "figure.run"
      },
      {
        "id": "rest-quiet",
        "label": "Drawing on the sofa",
        "isCorrect": true,
        "symbol": "pencil"
      },
      {
        "id": "rest-shout",
        "label": "A jumping game",
        "isCorrect": false,
        "symbol": "figure.play"
      }
    ],
    "reveal": "Drawing lets Kare play while resting. A book or a quiet game could work too."
  },
  {
    "id": "medicine",
    "title": "A medicine question",
    "expression": "Encouraging",
    "scene": "Kare checks with a grown-up.",
    "speech": "My grown-up checks the medicine and measures it for me. If I have a question, I can ask.",
    "more": "Your grown-up follows the care team’s instructions for how much medicine to give and when.",
    "question": "Kare wonders if it is medicine time. What comes first?",
    "choices": [
      {
        "id": "med-adult",
        "label": "Ask a grown-up to check",
        "isCorrect": true,
        "symbol": "person.fill"
      },
      {
        "id": "med-alone",
        "label": "Check the colour of the bottle",
        "isCorrect": false,
        "symbol": "pills.fill"
      },
      {
        "id": "med-guess",
        "label": "Try to remember yesterday’s time",
        "isCorrect": false,
        "symbol": "clock"
      }
    ],
    "reveal": "Ask a grown-up to check the plan. The bottle’s colour or a remembered time cannot tell you when to take medicine."
  },
  {
    "id": "sips",
    "title": "One sip at a time",
    "expression": "Encouraging",
    "scene": "Kare has a cup nearby.",
    "speech": "My care plan says to take small sips of cool water. I can take a little, then pause.",
    "more": "Tell a grown-up if drinking hurts or you cannot drink. They can help.",
    "question": "Kare is practising small sips. Which way matches?",
    "choices": [
      {
        "id": "sip-hot",
        "label": "Finish the cup in one gulp",
        "isCorrect": false,
        "symbol": "mug.fill"
      },
      {
        "id": "sip-cold",
        "label": "Take a little sip, then pause",
        "isCorrect": true,
        "symbol": "drop.fill"
      },
      {
        "id": "sip-none",
        "label": "Save all the sips for later",
        "isCorrect": false,
        "symbol": "clock"
      }
    ],
    "reveal": "A little sip and a pause match Kare’s plan. Your grown-up helps you follow your own drinking plan."
  },
  {
    "id": "treat",
    "title": "Snack detective",
    "expression": "Encouraging",
    "scene": "Kare and a grown-up choose a snack.",
    "speech": "My care plan says soft, cool foods today. My grown-up helps me find a snack that fits.",
    "more": "Different children have different food plans. Check yours with a grown-up.",
    "question": "Which snack is soft and cool?",
    "choices": [
      {
        "id": "treat-chips",
        "label": "Crunchy crackers",
        "isCorrect": false,
        "symbol": "fork.knife"
      },
      {
        "id": "treat-pop",
        "label": "Smooth, chilled yogurt",
        "isCorrect": true,
        "symbol": "snowflake"
      },
      {
        "id": "treat-toast",
        "label": "Warm, crunchy toast",
        "isCorrect": false,
        "symbol": "fork.knife"
      }
    ],
    "reveal": "Smooth, chilled yogurt is soft and cool. A grown-up checks whether it fits your food plan."
  },
  {
    "id": "speak",
    "title": "Say what you feel",
    "expression": "Encouraging",
    "scene": "Kare tells a grown-up what is happening.",
    "speech": "If something hurts or feels wrong, I tell my grown-up. I do not need special words.",
    "more": "If you cannot drink, have bleeding, or have trouble breathing, tell a grown-up right away.",
    "question": "Drinking hurts. What could Kare say to get help?",
    "choices": [
      {
        "id": "help-wait",
        "label": "“Can we read a book?”",
        "isCorrect": false,
        "symbol": "book.fill"
      },
      {
        "id": "help-tell",
        "label": "“It hurts when I swallow.”",
        "isCorrect": true,
        "symbol": "bubble.left.fill"
      },
      {
        "id": "help-extra",
        "label": "“What time is it?”",
        "isCorrect": false,
        "symbol": "clock"
      }
    ],
    "reveal": "“It hurts when I swallow” tells a grown-up what is wrong. You can point to where it hurts too."
  }
];

export const TUTORIAL_STORY_PAGE: StoryPage = {
  "id": "tour-practice",
  "title": "Let’s try one",
  "expression": "Encouraging",
  "scene": "Kare is choosing a quiet activity.",
  "speech": "Let’s help me choose. You can tap Listen to hear the words. We can work it out together.",
  "more": "There is no hurry. You can look at the story again whenever you want.",
  "question": "Kare wants a quiet game. Which one fits?",
  "choices": [
    {
      "id": "tour-alone",
      "label": "Playing drums",
      "isCorrect": false,
      "symbol": "speaker.wave.3.fill"
    },
    {
      "id": "tour-adult",
      "label": "Making a puzzle",
      "isCorrect": true,
      "symbol": "puzzlepiece.fill"
    },
    {
      "id": "tour-none",
      "label": "A running race",
      "isCorrect": false,
      "symbol": "figure.run"
    }
  ],
  "reveal": "A puzzle is a quiet way to play. You helped Kare choose!"
};

export function buildPrepPages(childName: string, companionName = 'Kare', childAge: string | number = 7): StoryPage[] {
  const name = childName.trim();
  const hello = name ? `Hi, ${name}. I'm Kare.` : "Hi. I'm Kare.";
  const rawPages: StoryPage[] = [
  {
    "id": "prep-welcome",
    "title": "A tour with Kare",
    "expression": "Encouraging",
    "scene": "Kare explores the hospital with you.",
    "speech": `${hello} Before an operation, you may meet new people and see new things. Let’s find out about them together.`,
    "more": "It is OK to feel curious, worried, or both. You can tell a grown-up how you feel.",
    "question": "Kare feels worried. What could Kare say?",
    "choices": [
      {
        "id": "prep-welcome-alone",
        "label": "“Where is my coat?”",
        "isCorrect": false,
        "symbol": "tshirt.fill"
      },
      {
        "id": "prep-welcome-adult",
        "label": "“I feel worried. Can you help?”",
        "isCorrect": true,
        "symbol": "bubble.left.fill"
      },
      {
        "id": "prep-welcome-none",
        "label": "“What time is lunch?”",
        "isCorrect": false,
        "symbol": "clock"
      }
    ],
    "reveal": "Saying “I feel worried” helps your grown-up understand. You can ask for a hand to hold.",
    "symbol": "heart.fill",
    "tryTitle": "Breathe with Kare",
    "tryDetail": "Try one slow breath in and one slow breath out. You can stop whenever you want."
  },
  {
    "id": "prep-scrubs",
    "title": "Meet a helper",
    "expression": "Encouraging",
    "scene": "Kare meets someone wearing scrubs.",
    "speech": "Scrubs are the clothes many hospital helpers wear. Their name badge can tell you who they are.",
    "more": "You can ask, “What is your name? What do you do?”",
    "question": "Where could Kare look for a helper’s name?",
    "choices": [
      {
        "id": "prep-scrubs-scary",
        "label": "On their shoes",
        "isCorrect": false,
        "symbol": "shoe.fill"
      },
      {
        "id": "prep-scrubs-clothes",
        "label": "On their name badge",
        "isCorrect": true,
        "symbol": "person.crop.rectangle"
      },
      {
        "id": "prep-scrubs-sleep",
        "label": "On their bag",
        "isCorrect": false,
        "symbol": "bag.fill"
      }
    ],
    "reveal": "A name badge helps you find out who someone is. You can ask them to read it to you.",
    "symbol": "person.2.fill",
    "tryTitle": "Say hello",
    "tryDetail": "Try asking your grown-up, “What is your name?” Then tell them yours."
  },
  {
    "id": "prep-gown",
    "title": "Your hospital clothes",
    "expression": "Encouraging",
    "scene": "Kare gets a gown and a clothes bag.",
    "speech": "A hospital gown is a loose piece of clothing. It helps the care team check your body. Your own clothes wait in a bag.",
    "more": "You can ask for help changing, or tell someone if you feel cold.",
    "question": "Where do Kare’s own clothes wait during the operation?",
    "choices": [
      {
        "id": "prep-gown-trouble",
        "label": "On the weighing scale",
        "isCorrect": false,
        "symbol": "scalemass.fill"
      },
      {
        "id": "prep-gown-care",
        "label": "In a bag with Kare’s name",
        "isCorrect": true,
        "symbol": "bag.fill"
      },
      {
        "id": "prep-gown-wrong",
        "label": "On the food tray",
        "isCorrect": false,
        "symbol": "fork.knife"
      }
    ],
    "reveal": "A bag with your name keeps your clothes together so they are ready when you need them.",
    "symbol": "tshirt.fill",
    "tryTitle": "Pack for later",
    "tryDetail": "Pretend to fold a shirt and put it in a bag. What would help you find your bag again?"
  },
  {
    "id": "prep-measure",
    "title": "How tall? How much?",
    "expression": "Encouraging",
    "scene": "Kare meets a ruler and a scale.",
    "speech": "A ruler measures how tall I am. A scale checks how much I weigh. These numbers help the team plan my care.",
    "more": "Your grown-up or a helper can show you where to stand.",
    "question": "The helper wants to know how tall Kare is. Which tool helps?",
    "choices": [
      {
        "id": "prep-measure-contest",
        "label": "A weighing scale",
        "isCorrect": false,
        "symbol": "scalemass.fill"
      },
      {
        "id": "prep-measure-size",
        "label": "A height ruler",
        "isCorrect": true,
        "symbol": "ruler.fill"
      },
      {
        "id": "prep-measure-home",
        "label": "A thermometer",
        "isCorrect": false,
        "symbol": "thermometer.medium"
      }
    ],
    "reveal": "A height ruler measures how tall you are. A scale measures weight, and a thermometer checks temperature.",
    "symbol": "ruler.fill",
    "tryTitle": "Stand tall",
    "tryDetail": "Stand with your feet flat and look ahead. Pretend a helper is measuring your height."
  },
  {
    "id": "prep-thermometer",
    "title": "A temperature check",
    "expression": "Encouraging",
    "scene": "Kare meets the thermometer.",
    "speech": "A thermometer checks how warm my body is. A helper may put it near my forehead, ear, or under my arm.",
    "more": "The helper will show you what to do. Some thermometers beep when they finish.",
    "question": "Which tool checks how warm Kare’s body is?",
    "choices": [
      {
        "id": "prep-thermo-shout",
        "label": "A stethoscope",
        "isCorrect": false,
        "symbol": "stethoscope"
      },
      {
        "id": "prep-thermo-warm",
        "label": "A thermometer",
        "isCorrect": true,
        "symbol": "thermometer.medium"
      },
      {
        "id": "prep-thermo-wrong",
        "label": "A weighing scale",
        "isCorrect": false,
        "symbol": "scalemass.fill"
      }
    ],
    "reveal": "A thermometer checks your temperature. That tells the helper how warm your body is.",
    "symbol": "thermometer.medium",
    "tryTitle": "Be still, then wiggle",
    "tryDetail": "Practise holding still for a moment. When your grown-up says “done,” have a wiggle."
  },
  {
    "id": "prep-stethoscope",
    "title": "Listen to a heartbeat",
    "expression": "Encouraging",
    "scene": "Kare meets the stethoscope.",
    "speech": "A stethoscope helps the nurse hear my heart and breathing. Its round end may feel cool on my skin.",
    "more": "You can ask the nurse what they are listening for.",
    "question": "What does a stethoscope help the nurse check?",
    "choices": [
      {
        "id": "prep-steth-thoughts",
        "label": "Body temperature",
        "isCorrect": false,
        "symbol": "thermometer.medium"
      },
      {
        "id": "prep-steth-heart",
        "label": "Heartbeat and breathing",
        "isCorrect": true,
        "symbol": "heart.fill"
      },
      {
        "id": "prep-steth-alarm",
        "label": "Body weight",
        "isCorrect": false,
        "symbol": "scalemass.fill"
      }
    ],
    "reveal": "A stethoscope carries sounds from inside your body, like your heartbeat and breathing.",
    "symbol": "stethoscope",
    "tryTitle": "Make a heartbeat",
    "tryDetail": "Tap a gentle thump-thump on your knee. That is a rhythm a heartbeat can make."
  },
  {
    "id": "prep-cuff",
    "title": "A squeeze on your arm",
    "expression": "Encouraging",
    "scene": "Kare tries a blood pressure cuff.",
    "speech": "A cuff wraps around my arm. It fills with air, feels tight, then loosens. It checks my blood pressure.",
    "more": "Tell the helper if the squeeze hurts or feels uncomfortable.",
    "question": "The cuff has filled with air. What happens next?",
    "choices": [
      {
        "id": "prep-cuff-stay",
        "label": "It checks Kare’s height",
        "isCorrect": false,
        "symbol": "ruler.fill"
      },
      {
        "id": "prep-cuff-release",
        "label": "The air comes out and it loosens",
        "isCorrect": true,
        "symbol": "arrow.left.and.right"
      },
      {
        "id": "prep-cuff-break",
        "label": "It listens to Kare’s breathing",
        "isCorrect": false,
        "symbol": "stethoscope"
      }
    ],
    "reveal": "The cuff loosens as the air comes out. Tell the helper how your arm feels.",
    "symbol": "arrow.left.and.right",
    "tryTitle": "Squeeze, then relax",
    "tryDetail": "Gently squeeze your own hand, then let it relax. You are in charge of this pretend squeeze."
  },
  {
    "id": "prep-vitals",
    "title": "Checking your body",
    "expression": "Encouraging",
    "scene": "The helper writes down Kare’s checks.",
    "speech": "Temperature, heartbeat, breathing, and blood pressure are called vital signs. They help the team see how my body is doing.",
    "more": "The team may check them again later to see what has changed.",
    "question": "Why might a nurse check Kare’s temperature again?",
    "choices": [
      {
        "id": "prep-vitals-punish",
        "label": "To find out how tall Kare is",
        "isCorrect": false,
        "symbol": "ruler.fill"
      },
      {
        "id": "prep-vitals-check",
        "label": "To see if it has changed",
        "isCorrect": true,
        "symbol": "thermometer.medium"
      },
      {
        "id": "prep-vitals-lose",
        "label": "To find out when Kare last ate",
        "isCorrect": false,
        "symbol": "fork.knife"
      }
    ],
    "reveal": "A new check shows whether your temperature has changed. The team uses checks to follow how you are doing.",
    "symbol": "list.clipboard.fill",
    "tryTitle": "Remember a check",
    "tryDetail": "Point to your arm or chest. Tell your grown-up one check you remember."
  },
  {
    "id": "prep-iv",
    "title": "Meet the IV",
    "expression": "Encouraging",
    "scene": "Kare sees a small tube and a bag.",
    "speech": "An IV is a small, soft tube that goes into a vein. It can give my body fluid or medicine. Putting it in may pinch or sting.",
    "more": "A nurse looks after the IV. Tell them if it hurts or feels uncomfortable. You can ask to hold a hand.",
    "question": "What does an IV help the team give Kare?",
    "choices": [
      {
        "id": "prep-iv-allday",
        "label": "A temperature check",
        "isCorrect": false,
        "symbol": "thermometer.medium"
      },
      {
        "id": "prep-iv-pinch",
        "label": "Fluid or medicine",
        "isCorrect": true,
        "symbol": "drop.fill"
      },
      {
        "id": "prep-iv-pull",
        "label": "A heartbeat check",
        "isCorrect": false,
        "symbol": "heart.fill"
      }
    ],
    "reveal": "Fluid or medicine can travel through the little tube into your body. A nurse looks after it.",
    "symbol": "bag.fill",
    "tryTitle": "Choose some support",
    "tryDetail": "Would you like to look away or hold a hand? Practise asking for what would help you."
  },
  {
    "id": "prep-mask",
    "title": "Meet the mask",
    "expression": "Encouraging",
    "scene": "Kare learns about medicine for the operation.",
    "speech": "Some children get medicine through a mask over their nose and mouth. It helps them sleep during the operation. The care team watches over them.",
    "more": "The team will explain how you will get your medicine and who can stay with you.",
    "question": "What is the medicine in this mask for?",
    "choices": [
      {
        "id": "prep-mask-play",
        "label": "Checking how tall Kare is",
        "isCorrect": false,
        "symbol": "ruler.fill"
      },
      {
        "id": "prep-mask-rest",
        "label": "Helping Kare sleep during the operation",
        "isCorrect": true,
        "symbol": "moon.stars.fill"
      },
      {
        "id": "prep-mask-hair",
        "label": "Listening to Kare’s heartbeat",
        "isCorrect": false,
        "symbol": "stethoscope"
      }
    ],
    "reveal": "This medicine helps you sleep during the operation. The care team looks after you while it works.",
    "symbol": "facemask.fill",
    "tryTitle": "Practise a slow breath",
    "tryDetail": "Try a slow breath in and out. Ask your grown-up what you would like the team to explain."
  },
  {
    "id": "prep-ready",
    "title": "Your turn to ask",
    "expression": "Encouraging",
    "scene": "Kare is ready with a question.",
    "speech": "You have met some hospital helpers and tools. You can always ask what something is or what will happen next.",
    "more": "You do not need to remember every word. Asking for help is part of learning.",
    "question": "Kare sees a new tool. Which question helps Kare learn about it?",
    "choices": [
      {
        "id": "prep-ready-hide",
        "label": "“Where is my bag?”",
        "isCorrect": false,
        "symbol": "bag.fill"
      },
      {
        "id": "prep-ready-ask",
        "label": "“What does this do?”",
        "isCorrect": true,
        "symbol": "bubble.left.fill"
      },
      {
        "id": "prep-ready-trouble",
        "label": "“What time is lunch?”",
        "isCorrect": false,
        "symbol": "clock"
      }
    ],
    "reveal": "“What does this do?” invites the helper to explain. You can also ask them to show you first.",
    "symbol": "hands.and.sparkles.fill",
    "tryTitle": "Ask your question",
    "tryDetail": "Pick one thing from the tour. What would you like to ask about it?"
  }
];
  return rawPages.map((page) => adaptStoryPageForAge(substituteCompanionName(page, companionName), childAge));
}

export function buildStoryPagesForInstructions(
  instructions: ParentInstruction[],
  companionName = 'Kare',
  childAge: string | number = 7
): StoryPage[] {
  if (instructions.length === 0) {
    return [substituteCompanionName({
      id: 'waiting-for-parent',
      title: 'Let’s get ready together',
      expression: 'Gentle',
      scene: 'Kare sits with a notebook.',
      speech: 'Your grown-up can add the steps from your care team. Then we can practise them together.',
      more: 'If something hurts or feels wrong, tell a grown-up.',
      question: 'What would you like to ask your grown-up about your care?',
      interaction: 'talk',
      choices: [],
      reveal: 'Your grown-up can help you get started with your care steps.',
    }, companionName)];
  }

  const customPages: StoryPage[] = instructions.map((instruction) => substituteCompanionName({
    id: `parent-${instruction.id}`,
    title: instruction.title,
    expression: 'Encouraging',
    scene: 'A care step to practise with your grown-up.',
    speech: `Your grown-up’s care step: ${instruction.detail}`,
    more: 'Read or listen together. Your grown-up can explain any new words.',
    question: 'Show or tell your grown-up: how will you do this step together?',
    interaction: 'talk',
    choices: [],
    reveal: `Keep this step handy: ${instruction.detail}`,
  }, companionName));

  const corePages = CORE_STORY_PAGES.map((page) => adaptStoryPageForAge(substituteCompanionName(page, companionName), childAge));
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
