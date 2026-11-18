import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, HeartPulse, Droplets, Wind, Pill } from 'lucide-react';
import { StoryAnimation } from './StoryAnimation.tsx';
import { STORY_ANIMATIONS, StoryAnimationScene } from '../utils/storyAnimations.ts';
import { useCareStore } from '../context/CareStoreContext.tsx';

const FEATURED = [
  { scene: 'cuff', label: 'Blood pressure', detail: 'Wrap, squeeze, release', Icon: HeartPulse },
  { scene: 'iv', label: 'The IV', detail: 'Bag, tube and helping hands', Icon: Droplets },
  { scene: 'mask', label: 'The mask', detail: 'Meet it, then breathe', Icon: Wind },
  { scene: 'medicine', label: 'Liquid medicine', detail: 'A grown-up helps', Icon: Pill },
] as const;

export function StoryDemoLibrary({ onHome }: { onHome: () => void }) {
  const store = useCareStore();
  const [scene, setScene] = useState<StoryAnimationScene>('cuff');
  const stopNarration = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);
  const narrate = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const line = new SpeechSynthesisUtterance(text);
    line.rate = Number(store.childAge) <= 6 ? 0.85 : 0.94;
    window.speechSynthesis.speak(line);
  }, [store.childAge]);
  useEffect(() => stopNarration, [stopNarration]);

  return <main className="min-h-screen bg-[#FAF6F0] px-4 py-5 sm:p-8">
    <div className="max-w-5xl mx-auto space-y-5">
      <button onClick={() => { stopNarration(); onHome(); }} type="button" className="min-h-12 inline-flex items-center gap-2 rounded-full border border-[#E8E2D8] bg-white px-4 font-bold text-[#0E5A54] cursor-pointer"><ArrowLeft size={20} />Back to Play</button>
      <div>
        <p className="text-sm font-extrabold uppercase tracking-wider text-[#E06D38]">Little stories, one step at a time</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0E5A54] mt-2">Watch with {store.companionName}</h1>
        <p className="text-base text-[#556B68] mt-2">Choose a story. You can pause, listen, or watch it again.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label="Choose a demonstration">
        {FEATURED.map(({ scene: value, label, detail, Icon }) => <button type="button" key={value} aria-pressed={scene === value} onClick={() => { stopNarration(); setScene(value); }} className={`rounded-2xl border-2 p-4 text-left cursor-pointer ${scene === value ? 'border-[#0E5A54] bg-[#E6F4F1]' : 'border-[#E8E2D8] bg-white hover:border-[#0E5A54]'}`}>
          <Icon aria-hidden="true" size={25} className="text-[#0E5A54] mb-3" />
          <span className="block font-extrabold text-lg text-[#0E5A54]">{label}</span>
          <span className="block text-sm text-[#556B68] mt-1">{detail}</span>
        </button>)}
      </div>
      <div className="max-w-2xl mx-auto rounded-3xl border border-[#E8E2D8] bg-white p-3 sm:p-6 shadow-sm">
        <StoryAnimation key={scene} scene={scene} bearName={store.companionName} onNarrate={narrate} onStopNarration={stopNarration} />
      </div>
      <details className="rounded-2xl border border-[#E8E2D8] bg-white p-4">
        <summary className="min-h-11 flex items-center font-bold text-[#0E5A54] cursor-pointer">More stories to explore</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3" role="group" aria-label="More demonstrations">
          {(Object.keys(STORY_ANIMATIONS) as StoryAnimationScene[]).filter(key => !FEATURED.some(item => item.scene === key)).map(key => <button type="button" key={key} aria-pressed={key === scene} onClick={() => { stopNarration(); setScene(key); }} className={`min-h-12 rounded-xl border px-4 py-3 font-bold text-left text-[#0E5A54] cursor-pointer ${key === scene ? 'bg-[#E6F4F1] border-[#0E5A54]' : 'border-[#E8E2D8]'}`}>{STORY_ANIMATIONS[key].title}</button>)}
        </div>
      </details>
      <p className="text-sm text-center text-[#556B68]">Watch together. Your care team will explain what happens for you.</p>
    </div>
  </main>;
}
