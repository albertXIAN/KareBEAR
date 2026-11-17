import React, { useState } from 'react';
import { useCareStore } from '../context/CareStoreContext.tsx';
import { TUTORIAL_STORY_PAGE, substituteCompanionName } from '../utils/careStoreLogic.ts';
import { BearBadge } from './BearArt.tsx';
import { PracticeStoryView } from './ChildViews.tsx';
import { ArrowRight, ArrowLeft, CheckCircle2, Heart } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const store = useCareStore();
  const [step, setStep] = useState<'account' | 'child' | 'stage' | 'practice'>('account');
  const [parentName, setParentName] = useState(store.parentName || 'Alex Rivera');
  const [email, setEmail] = useState(store.parentEmail || 'alex@rivera.family');
  const [password, setPassword] = useState('karebear');
  const [childName, setChildName] = useState(store.childName || 'Emma');
  const [age, setAge] = useState(parseInt(store.childAge, 10) || 7);
  const [recovery, setRecovery] = useState(store.recoveryFocus || 'Tonsillectomy');
  const [careStage, setCareStage] = useState<'pre' | 'post'>(store.careStage || 'post');
  const [prepGameEnabled, setPrepGameEnabled] = useState(true);

  const finishSetup = () => {
    if (password.trim()) {
      store.savePassword(password.trim());
    }
    store.completeOnboarding({
      parentName,
      email,
      childName,
      age: String(age),
      recovery,
      careStage,
      prepGameEnabled,
    });
  };

  if (step === 'practice') {
    const tutorialPage = substituteCompanionName(TUTORIAL_STORY_PAGE, store.companionName);
    return (
      <PracticeStoryView
        pages={[tutorialPage]}
        heading="Guided Tour • Practice Page"
        recordsProgress={false}
        doneTitle="Setup complete!"
        doneDetail={`You are ready to use KareBEAR with ${childName || 'your child'}.`}
        doneButton="Open KareBEAR"
        onLeave={finishSetup}
        onDone={finishSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#E8E2D8]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0E5A54]">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg font-extrabold text-[#0E5A54]">
            Kare<span className="text-[#E06D38]">BEAR</span>
          </span>
        </div>
        <button
          type="button"
          onClick={finishSetup}
          className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
        >
          Skip setup
        </button>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-center">
          <BearBadge size={112} showsStatus />
        </div>

        {step === 'account' && (
          <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] shadow-2xs space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0E5A54]">
              Step 1 of 4 • Grown-up Account
            </span>
            <h1 className="text-2xl font-extrabold text-[#0E5A54]">
              Set up KareBEAR for your family
            </h1>
            <p className="text-sm font-medium text-[#556B68]">
              A grown-up sets up this device and approves all care steps before the child sees them.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">Your name</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-bold border border-[#E8E2D8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-bold border border-[#E8E2D8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">
                  Password for leaving Child's View
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-bold border border-[#E8E2D8]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('child')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white cursor-pointer"
            >
              <span>Next: Child details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'child' && (
          <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] shadow-2xs space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0E5A54]">
              Step 2 of 4 • About Your Child
            </span>
            <h1 className="text-2xl font-extrabold text-[#0E5A54]">
              Who is Kare helping?
            </h1>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">Child's name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-bold border border-[#E8E2D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">Child's age</label>
                <div className="flex items-center justify-between rounded-2xl bg-[#FAF6F0] px-4 py-2 border border-[#E8E2D8]">
                  <span className="text-lg font-extrabold text-[#0E5A54]">{age} years old</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAge((a) => Math.max(1, a - 1))}
                      className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0E5A54] font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge((a) => Math.min(17, a + 1))}
                      className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0E5A54] font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">
                  What are they preparing for or recovering from?
                </label>
                <input
                  type="text"
                  value={recovery}
                  onChange={(e) => setRecovery(e.target.value)}
                  className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-bold border border-[#E8E2D8]"
                />
                <div className="flex gap-2 mt-2">
                  {['Tonsillectomy', 'Cast care (non-waterproof)'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setRecovery(preset);
                        store.loadSampleSteps(
                          preset.toLowerCase().includes('cast') ? 'cast' : 'tonsillectomy'
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                        recovery === preset
                          ? 'bg-[#0E5A54] text-white'
                          : 'bg-[#E6F4F1] text-[#0E5A54]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('account')}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('stage')}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white cursor-pointer"
              >
                <span>Next: Care stage</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'stage' && (
          <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] shadow-2xs space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0E5A54]">
              Step 3 of 4 • Care Stage
            </span>
            <h1 className="text-2xl font-extrabold text-[#0E5A54]">
              Where is {childName || 'your child'} right now?
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCareStage('pre');
                  setPrepGameEnabled(true);
                }}
                className={`rounded-2xl p-4 text-left border-2 transition cursor-pointer ${
                  careStage === 'pre'
                    ? 'bg-[#E6F4F1] border-[#0E5A54]'
                    : 'bg-[#FAF6F0] border-[#E8E2D8]'
                }`}
              >
                <p className="text-base font-extrabold text-[#0E5A54]">Pre-op</p>
                <p className="text-xs font-medium text-[#556B68] mt-1">
                  Before the operation: meet scrubs, vitals, the cuff, the IV pole, and the sleepy-air mask.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCareStage('post')}
                className={`rounded-2xl p-4 text-left border-2 transition cursor-pointer ${
                  careStage === 'post'
                    ? 'bg-[#E6F4F1] border-[#0E5A54]'
                    : 'bg-[#FAF6F0] border-[#E8E2D8]'
                }`}
              >
                <p className="text-base font-extrabold text-[#0E5A54]">Post-op</p>
                <p className="text-xs font-medium text-[#556B68] mt-1">
                  Back home: track scheduled doses, hydration cups, stories, and care steps.
                </p>
              </button>
            </div>

            <label className="flex items-center justify-between rounded-2xl bg-[#FAF6F0] p-3.5 border border-[#E8E2D8] cursor-pointer">
              <span className="text-xs font-bold text-[#163835]">
                Include “Preparing for my operation” on Child Play tab
              </span>
              <input
                type="checkbox"
                checked={prepGameEnabled}
                onChange={(e) => setPrepGameEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#0E5A54]"
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('child')}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('practice')}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Preview child story page</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
