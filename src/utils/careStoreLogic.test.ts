import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAmountFromText,
  parseClockTimeFromText,
  buildInstructionDoses,
  extractLocalStepsFromTranscript,
  buildStoryPagesForInstructions,
  buildPrepPages,
  getBearMood,
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
