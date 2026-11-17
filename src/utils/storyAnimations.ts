// Each scene is a short, supervised demonstration, not a care-plan instruction.
// Keep these captions in sync with StoryAnimation.swift.
export const STORY_ANIMATIONS = {
  cuff: {
    title: 'The blood pressure cuff',
    steps: [
      { title: 'Meet the cuff', caption: 'The helper shows {bear} the cuff. The arm rests on a support.' },
      { title: 'Wrap the upper arm', caption: 'The helper wraps it around the upper arm, above the elbow.' },
      { title: 'A short squeeze', caption: 'It fills with air and feels tight. {bear} keeps the arm still.' },
      { title: 'It loosens', caption: 'The air comes out. {bear} can tell the helper how it feels.' },
    ],
  },
  iv: {
    title: 'The IV, tube and pole',
    steps: [
      { title: 'Meet the IV', caption: 'This pole holds a bag of fluid or medicine.' },
      { title: 'The nurse helps', caption: 'A nurse places a tiny soft tube in a vein. It may pinch or sting.' },
      { title: 'Keep it in place', caption: 'A clear dressing holds it still. The nurse connects the tubing.' },
      { title: 'Say how it feels', caption: 'Tell the nurse if the IV hurts or feels uncomfortable.' },
    ],
  },
  mask: {
    title: 'Medicine through a mask',
    steps: [
      { title: 'Meet the mask', caption: 'Some children get medicine through a mask. The team explains the plan.' },
      { title: 'Nose and mouth', caption: 'The helper holds the mask over {bear}’s nose and mouth.' },
      { title: 'Breathe gently', caption: '{bear} breathes medicine that helps with sleep during the operation.' },
      { title: 'The team stays', caption: 'The care team watches over {bear} while the medicine works.' },
    ],
  },
  medicine: {
    title: 'Liquid medicine with a grown-up',
    steps: [
      { title: 'Check the plan', caption: 'A grown-up checks the medicine plan and bottle label.' },
      { title: 'Measure with care', caption: 'They measure with an oral syringe. This syringe has no needle.' },
      { title: 'A little at a time', caption: '{bear} sits up. The grown-up gives small amounts inside the cheek.' },
      { title: 'Pause to swallow', caption: 'There is time to swallow. {bear} can ask for help.' },
    ],
  },
  thermometer: {
    title: 'A temperature check',
    steps: [
      { title: 'Meet the thermometer', caption: 'The helper shows {bear} a forehead thermometer.' },
      { title: 'Come close', caption: 'The helper brings it near the forehead.' },
      { title: 'Hold still', caption: '{bear} holds still while the thermometer checks the temperature.' },
      { title: 'All done', caption: 'The helper takes it away. The check is finished.' },
    ],
  },
  stethoscope: {
    title: 'Listen to a heartbeat',
    steps: [
      { title: 'Meet the stethoscope', caption: 'The helper puts the listening ends in their ears.' },
      { title: 'On the chest', caption: 'The round end rests on {bear}’s chest. It may feel cool.' },
      { title: 'Listen together', caption: 'The helper listens to the heart and breathing.' },
      { title: 'Ask a question', caption: 'The helper lifts it away. {bear} can ask what they heard.' },
    ],
  },
  measure: {
    title: 'Height and weight',
    steps: [
      { title: 'Meet the scale', caption: 'The helper shows {bear} where to stand.' },
      { title: 'Check weight', caption: '{bear} stands on the scale to check weight.' },
      { title: 'Check height', caption: 'A height ruler shows how tall {bear} is.' },
      { title: 'Write it down', caption: 'The helper writes the numbers down to help plan care.' },
    ],
  },
  gown: {
    title: 'Getting changed',
    steps: [
      { title: 'Meet the gown', caption: 'A helper brings a hospital gown.' },
      { title: 'A private space', caption: '{bear} changes behind a screen, with help if needed.' },
      { title: 'Ready in a gown', caption: 'The gown makes it easier for the care team to help.' },
      { title: 'Clothes stay together', caption: 'The clothes wait in a bag with {bear}’s name.' },
    ],
  },
  breathing: {
    title: 'One calm breath',
    steps: [
      { title: 'Get comfortable', caption: '{bear} sits comfortably. You can try a gentle breath too.' },
      { title: 'Breathe in', caption: 'A slow breath in. The circle grows.' },
      { title: 'Breathe out', caption: 'A slow breath out. The circle gets smaller.' },
      { title: 'Choose what helps', caption: 'You can stop, try again, or ask for a hand to hold.' },
    ],
  },
  helper: {
    title: 'Meet your helper',
    steps: [
      { title: 'Say hello', caption: 'A hospital helper comes to meet {bear}.' },
      { title: 'Look for a badge', caption: 'Their badge shows their name.' },
      { title: 'Ask about their job', caption: '{bear} asks, “What do you do?”' },
      { title: 'Listen together', caption: 'The helper explains. It is OK to ask more questions.' },
    ],
  },
  vitals: {
    title: 'Putting the checks together',
    steps: [
      { title: 'Temperature', caption: 'A thermometer checks how warm the body is.' },
      { title: 'Heart and breathing', caption: 'The helper listens to {bear}’s heart and breathing.' },
      { title: 'Blood pressure', caption: 'The arm cuff checks blood pressure.' },
      { title: 'Write down the checks', caption: 'These checks help the team see how {bear} is doing.' },
    ],
  },
  ask: {
    title: 'Your questions matter',
    steps: [
      { title: 'Something new', caption: '{bear} spots a new piece of equipment.' },
      { title: 'Ask about it', caption: '“What does this do?” {bear} asks.' },
      { title: 'See it first', caption: 'The helper shows it and explains.' },
      { title: 'Ask for support', caption: '{bear} can ask for a hand to hold.' },
    ],
  },
  tell: {
    title: 'Tell a grown-up how it feels',
    steps: [
      { title: 'Notice how it feels', caption: '{bear} notices that swallowing hurts.' },
      { title: 'Say what is wrong', caption: '“It hurts when I swallow,” {bear} tells the grown-up.' },
      { title: 'Point if it helps', caption: '{bear} can point to the throat to show where it hurts.' },
      { title: 'Get help together', caption: 'The grown-up listens and helps with the next step.' },
    ],
  },
  rest: {
    title: 'A quiet afternoon',
    steps: [
      { title: 'Time to rest', caption: '{bear}’s grown-up helps choose a quiet activity.' },
      { title: 'Get comfortable', caption: 'A pillow makes a cosy place to sit.' },
      { title: 'Pick something quiet', caption: '{bear} draws while resting on the sofa.' },
      { title: 'Take a break', caption: '{bear} can pause and rest whenever needed.' },
    ],
  },
  sip: {
    title: 'Little sips',
    steps: [
      { title: 'Check the plan', caption: 'A grown-up checks that {bear} can have a drink now.' },
      { title: 'Lift the cup', caption: '{bear} brings the cup up slowly.' },
      { title: 'Take a little sip', caption: 'A little sip, just as the care plan says.' },
      { title: 'Pause and tell', caption: 'The cup goes down. Tell a grown-up if drinking hurts.' },
    ],
  },
  snack: {
    title: 'Choose a snack together',
    steps: [
      { title: 'Check the food plan', caption: 'A grown-up checks which foods {bear} can have.' },
      { title: 'Find a snack that fits', caption: 'This story’s plan says soft, cool food.' },
      { title: 'A little taste', caption: '{bear} tries a little smooth, chilled yogurt.' },
      { title: 'Take your time', caption: '{bear} pauses and tells the grown-up how it feels.' },
    ],
  },
} as const;

export type StoryAnimationScene = keyof typeof STORY_ANIMATIONS;

// Map authored pages only. Never guess a medical demonstration from a parent’s text.
const PAGE_ANIMATIONS: Record<string, StoryAnimationScene> = {
  'prep-welcome': 'breathing', 'prep-scrubs': 'helper', 'prep-gown': 'gown',
  'prep-measure': 'measure', 'prep-thermometer': 'thermometer',
  'prep-stethoscope': 'stethoscope', 'prep-cuff': 'cuff', 'prep-vitals': 'vitals',
  'prep-iv': 'iv', 'prep-mask': 'mask', 'prep-ready': 'ask',
  rest: 'rest', medicine: 'medicine', sips: 'sip', treat: 'snack', speak: 'tell',
  'tour-practice': 'rest',
};

export function animationSceneForPage(pageID: string): StoryAnimationScene | undefined {
  return Object.hasOwn(PAGE_ANIMATIONS, pageID) ? PAGE_ANIMATIONS[pageID] : undefined;
}

export function animationCaption(text: string, bearName: string): string {
  return text.replaceAll('{bear}', () => bearName.trim() || 'Kare');
}
