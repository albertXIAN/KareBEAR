import React, { useState } from 'react';
import { CareStoreProvider, useCareStore } from './context/CareStoreContext.tsx';
import {
  KareHeader,
  ScheduleView,
  RewardsBearView,
  ParentCareView,
  HelpSheet,
  ProfileSheet,
} from './components/ParentViews.tsx';
import { QuestHomeView } from './components/ChildViews.tsx';
import { OnboardingView } from './components/OnboardingView.tsx';
import { Calendar, Star, HeartHandshake, Sparkles } from 'lucide-react';

type ParentTab = 'schedule' | 'rewards' | 'care';

const MainAppShell: React.FC = () => {
  const store = useCareStore();
  const [tab, setTab] = useState<ParentTab>('schedule');
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (!store.didFinishOnboarding) {
    return <OnboardingView />;
  }

  if (store.childModeUnlocked) {
    return (
      <QuestHomeView
        renderRewardsTab={() => <RewardsBearView showsParentTools={false} />}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <KareHeader
        onOpenHelp={() => setShowHelp(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'schedule' && (
          <ScheduleView onOpenCareTab={() => setTab('care')} />
        )}
        {tab === 'rewards' && <RewardsBearView showsParentTools={true} />}
        {tab === 'care' && <ParentCareView />}
      </main>

      {/* Parent Bottom Navigation Bar */}
      <nav
        aria-label="Parent navigation"
        className="fixed bottom-0 inset-x-0 bg-[#FAF6F0] border-t border-[#E8E2D8] flex z-30"
      >
        <button
          type="button"
          onClick={() => setTab('schedule')}
          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
            tab === 'schedule' ? 'text-[#0E5A54]' : 'text-[#556B68]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('rewards')}
          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
            tab === 'rewards' ? 'text-[#0E5A54]' : 'text-[#556B68]'
          }`}
        >
          <Star className="w-5 h-5" />
          <span>Rewards</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('care')}
          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
            tab === 'care' ? 'text-[#0E5A54]' : 'text-[#556B68]'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          <span>Care &amp; Help</span>
        </button>
      </nav>

      {/* Puppy Hero Celebration Modal */}
      {store.showPuppyCelebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="puppy-hero-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF6F0] p-6 border border-[#E8E2D8] shadow-xl text-center space-y-4">
            <div className="text-5xl">🐶</div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#0E5A54]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>17 Stars Reached!</span>
            </div>
            <h2 id="puppy-hero-title" className="text-2xl font-extrabold text-[#0E5A54]">
              Puppy Hero Unlocked!
            </h2>
            <p className="text-sm font-medium text-[#556B68]">
              {store.childName || 'Your child'} and {store.companionName} unlocked the Puppy Hero badge together!
            </p>
            <button
              type="button"
              onClick={() => store.setShowPuppyCelebration(false)}
              className="w-full rounded-2xl bg-[#0E5A54] py-3 text-sm font-bold text-white cursor-pointer"
            >
              Yay!
            </button>
          </div>
        </div>
      )}

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export function App() {
  return (
    <CareStoreProvider>
      <MainAppShell />
    </CareStoreProvider>
  );
}

export default App;
