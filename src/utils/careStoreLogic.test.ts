import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { animationSceneForPage, animationCaption, STORY_ANIMATIONS } from './storyAnimations.ts';
import {
  extractAmountFromText,
  parseClockTimeFromText,
  buildInstructionDoses,
  extractLocalStepsFromTranscript,
  buildStoryPagesForInstructions,
  buildPrepPages,
  getBearMood,
  adaptStoryPageForAge,
  CORE_STORY_PAGES,
  TUTORIAL_STORY_PAGE,
  SAMPLE_VISIT_TRANSCRIPT,
} from './careStoreLogic.ts';

describe('KareBEAR careStoreLogic', () => {
  it('extracts mL amounts and clock times from parent instructions', () => {
    assert.equal(extractAmountFromText('Give 7.5 milliliters at 8:00 AM'), '7.5 mL');
    assert.equal(extractAmountFromText('Take 5 mL with water'), '5 mL');
    assert.equal(extractAmountFromText('Quiet rest on a pillow'), '');

    const numericClock = parseClockTimeFromText('Give medicine at 8:30 am');
    assert.deepEqual(numericClock, { label: '8:30 AM', minutes: 510 });

    const wordClock = parseClockTimeFromText('Offer sips at nine in the morning');
    assert.deepEqual(wordClock, { label: '9:00 AM', minutes: 540 });
  });

  it('sorts scheduled doses chronologically and assigns first open dose as due', () => {
    const instructions = [
      {
        id: 'step-late',
        title: 'Evening check',
        detail: 'Check comfort at 8:00 PM',
        fromRecording: false,
      },
      {
        id: 'step-early',
        title: 'Morning dose',
        detail: 'Give 5 mL at 8:00 AM',
        fromRecording: true,
      },
      {
        id: 'step-untimed',
        title: 'Quiet story time',
        detail: 'Rest with a book',
        fromRecording: false,
      },
    ];

    const doses = buildInstructionDoses(instructions, []);
    assert.equal(doses.length, 3);
    assert.equal(doses[0].id, 'step-early');
    assert.equal(doses[0].status, 'due');
    assert.equal(doses[0].amount, '5 mL');
    assert.equal(doses[1].id, 'step-late');
    assert.equal(doses[1].status, 'upcoming');
    assert.equal(doses[2].id, 'step-untimed');
    assert.equal(doses[2].status, 'upcoming');
  });

  it('extracts actionable care steps from a clinical visit transcript', () => {
    const steps = extractLocalStepsFromTranscript(SAMPLE_VISIT_TRANSCRIPT);
    assert.ok(steps.length >= 3);
    assert.ok(steps[0].detail.includes('5 mL'));
  });

  it('substitutes companion bear name in story and pre-op pages', () => {
    const prepPages = buildPrepPages('Emma', 'Sunny');
    assert.equal(prepPages.length, 11);
    assert.ok(prepPages[0].title.includes('Sunny'));
    assert.ok(prepPages[0].speech.includes('Emma'));

    const storyPages = buildStoryPagesForInstructions(
      [
        {
          id: 's1',
          title: 'Cold water sip',
          detail: 'Drink 1 cup of cool water at 9:00 AM.',
          fromRecording: false,
        },
      ],
      'Sunny'
    );
    assert.equal(storyPages.length, 6);
    assert.equal(storyPages[0].title, 'Cold water sip');
    assert.ok(storyPages[1].speech.length > 0);
  });

  it('computes bear mood levels accurately', () => {
    assert.equal(getBearMood(3, 'Mochi').key, 'bright');
    assert.equal(getBearMood(2, 'Mochi').key, 'steady');
    assert.equal(getBearMood(1, 'Mochi').key, 'tired');
    assert.equal(getBearMood(0, 'Mochi').key, 'sick');
  });
});


describe('Questions for ages 5–8', () => {
  const bank = [...CORE_STORY_PAGES, TUTORIAL_STORY_PAGE, ...buildPrepPages('Emma')];

  it('keeps one correct answer, stable identities, and two or three distinct choices at the age boundary', () => {
    for (const age of [5, 6, 7, 8]) {
      for (const page of bank) {
        const adapted = adaptStoryPageForAge(page, age);
        assert.equal(adapted.id, page.id);
        assert.equal(adapted.choices.length, age <= 6 ? 2 : 3);
        assert.equal(adapted.choices.filter(choice => choice.isCorrect).length, 1);
        assert.equal(new Set(adapted.choices.map(choice => choice.label)).size, adapted.choices.length);
        assert.ok(adapted.choices.every(choice => page.choices.some(original => original.id === choice.id)));
        assert.deepEqual(adaptStoryPageForAge(page, age), adapted, 'choices must not move during a retry');
      }
    }
  });

  it('uses every answer position across the tour without mutating the source bank', () => {
    const before = JSON.stringify(CORE_STORY_PAGES);
    for (const age of [5, 8]) {
      const positions = new Set(buildPrepPages('Emma', 'Sunny', age).map(page => page.choices.findIndex(choice => choice.isCorrect)));
      assert.equal(positions.size, age <= 6 ? 2 : 3);
    }
    for (const age of ['', 'not-an-age', 0, NaN]) {
      assert.equal(adaptStoryPageForAge(TUTORIAL_STORY_PAGE, age).choices.length, 3);
    }
    assert.equal(JSON.stringify(CORE_STORY_PAGES), before);
  });

  it('preserves a parent’s exact instruction in a conversation without inventing medical answers', () => {
    const detail = 'Do not drink until the nurse says it is safe. Ask Kare’s nurse about the 9:00 AM check.';
    const pages = buildStoryPagesForInstructions([{ id: 'special', title: 'Ask the nurse', detail, fromRecording: false }], 'Sunny', 5);
    const activity = pages[0];
    assert.equal(activity.id, 'parent-special');
    assert.equal(activity.interaction, 'talk');
    assert.deepEqual(activity.choices, []);
    assert.ok(activity.speech.includes(detail));
    assert.ok(activity.reveal.includes(detail));
    assert.deepEqual(adaptStoryPageForAge(activity, 5), activity);
  });

  it('offers a conversation instead of a pretend quiz when no care plan exists', () => {
    const [page] = buildStoryPagesForInstructions([], 'Sunny', 6);
    assert.equal(page.interaction, 'talk');
    assert.deepEqual(page.choices, []);
    assert.ok(page.question.length > 0);
  });
});


describe('Story animation integration', () => {
  it('connects authored stories to demos without interpreting parent-written instructions', () => {
    const authored = [...CORE_STORY_PAGES, TUTORIAL_STORY_PAGE, ...buildPrepPages('Emma')];
    for (const page of authored) {
      const scene = animationSceneForPage(page.id);
      assert.ok(scene && STORY_ANIMATIONS[scene], `Missing scene for ${page.id}`);
    }
    const [parentPage] = buildStoryPagesForInstructions([{ id: 'prep-cuff', title: 'Medicine and IV', detail: 'Ask our nurse before changing anything.', fromRecording: false }]);
    for (const id of [parentPage.id, 'unknown', 'constructor', '__proto__']) {
      assert.equal(animationSceneForPage(id), undefined);
    }
  });

  it('reads the chosen bear name literally in every caption', () => {
    assert.equal(animationCaption('{bear} watches. Ask {bear}.', '  $&  '), '$& watches. Ask $&.');
    assert.equal(animationCaption('{bear} watches.', '   '), 'Kare watches.');
    assert.equal(animationCaption('A helper is here.', 'Sunny'), 'A helper is here.');
  });
});
