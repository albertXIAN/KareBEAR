import React, { useState } from 'react';
import { useCareStore } from '../context/CareStoreContext.tsx';
import {
  Dose,
  DraftInstruction,
  SAMPLE_VISIT_TRANSCRIPT,
} from '../utils/careStoreLogic.ts';
import { BearBadge, EmmaAvatar, NameBearButton } from './BearArt.tsx';
import {
  Heart,
  Stethoscope,
  Users,
  CheckCircle2,
  Clock,
  Droplets,
  Star,
  Plus,
  Mic,
  Square,
  Sparkles,
  Trash2,
  Pencil,
  Check,
  X,
  PhoneCall,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  Compass,
} from 'lucide-react';

export const KareHeader: React.FC<{
  onOpenHelp: () => void;
  onOpenProfile: () => void;
}> = ({ onOpenHelp, onOpenProfile }) => {
  const store = useCareStore();

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E8E2D8] bg-[#FAF6F0]">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0E5A54] shrink-0 mt-0.5">
          <Heart className="w-4 h-4 fill-current" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-extrabold leading-tight text-[#0E5A54]">
            Kare<span className="text-[#E06D38]">BEAR</span>
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] border border-[#BCE3DC] px-2.5 py-0.5 text-[11px] font-semibold text-[#0E5A54] max-w-full truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E5A54] shrink-0" />
            <span className="truncate">{store.childSummary}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => store.setChildModeUnlocked(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] transition cursor-pointer"
          aria-label="Open child's view"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Child's View</span>
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          className="w-10 h-10 rounded-full bg-white border border-[#E8E2D8] flex items-center justify-center text-[#0E5A54] hover:bg-[#E6F4F1] transition cursor-pointer"
          aria-label="Care team help"
          title="Care team help"
        >
          <Stethoscope className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="rounded-full bg-white p-0.5 border border-[#E8E2D8] hover:border-[#0E5A54] transition cursor-pointer"
          aria-label={`${store.childName || 'Child'}'s profile`}
          title="Profile & Setup"
        >
          <EmmaAvatar size={36} />
        </button>
      </div>
    </header>
  );
};

function getDoseEmoji(dose: Dose): string {
  const text = `${dose.name} ${dose.detail}`.toLowerCase();
  if (text.includes('popsicle') || text.includes('treat')) return '🍧';
  if (text.includes('sip') || text.includes('water') || text.includes('drink')) return '💧';
  if (text.includes('rest') || text.includes('sleep') || text.includes('pillow')) return '🌙';
  if (text.includes('cast') || text.includes('dry')) return '🩹';
  if (
    text.includes('medicine') ||
    text.includes('antibiotic') ||
    text.includes('dose') ||
    dose.amount
  )
    return '💊';
  return '🫶';
}

export const ScheduleView: React.FC<{
  onOpenCareTab: () => void;
}> = ({ onOpenCareTab }) => {
  const store = useCareStore();
  const weekDays = [
    { d: 'M', n: '12', state: 'done' },
    { d: 'T', n: '13', state: 'done' },
    { d: 'W', n: '14', state: 'today' },
    { d: 'T', n: '15', state: 'up' },
    { d: 'F', n: '16', state: 'up' },
    { d: 'S', n: '17', state: 'up' },
    { d: 'S', n: '18', state: 'up' },
  ];

  const hero = store.heroDose;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Companion Status Column */}
      <div className="md:col-span-5 rounded-3xl bg-white p-6 border border-[#E8E2D8] shadow-2xs flex flex-col items-center text-center space-y-3">
        <BearBadge size={156} showsStatus />
        <h2
          className="text-2xl font-extrabold"
          style={{ color: store.bearMood.color }}
        >
          {store.bearMood.title}
        </h2>
        <p className="text-sm font-medium text-[#556B68]">{store.bearMood.detail}</p>
        <NameBearButton />
        <div className="w-full pt-2 border-t border-[#EFEAE1] flex items-center justify-around text-center">
          <div>
            <p className="text-xl font-extrabold text-[#0E5A54]">{store.stars} ⭐</p>
            <p className="text-xs font-semibold text-[#556B68]">Stars earned</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-[#0E5A54]">
              {store.cups}/{store.maxCups} 💧
            </p>
            <p className="text-xs font-semibold text-[#556B68]">Water cups</p>
          </div>
        </div>
      </div>

      {/* Schedule Column */}
      <div className="md:col-span-7 space-y-4">
        {/* Week Strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((item, idx) => {
            const isToday = item.state === 'today';
            const isDone = item.state === 'done';
            return (
              <div
                key={idx}
                className={`rounded-2xl py-2.5 flex flex-col items-center justify-center border ${
                  isToday
                    ? 'bg-[#0E5A54] text-white border-[#0E5A54]'
                    : isDone
                    ? 'bg-[#E6F4F1] text-[#0E5A54] border-[#BCE3DC]'
                    : 'bg-white text-[#556B68] border-[#E8E2D8]'
                }`}
              >
                <span className="text-[11px] font-bold opacity-85">{item.d}</span>
                <span className="text-sm font-extrabold">{item.n}</span>
              </div>
            );
          })}
        </div>

        {/* Hero Due Card */}
        {store.doses.length === 0 ? (
          <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] space-y-3">
            <h3 className="text-lg font-extrabold text-[#0E5A54]">No care steps yet</h3>
            <p className="text-sm font-medium text-[#556B68]">
              Write a care step or record a care conversation in the Care &amp; Help tab to build today's schedule.
            </p>
            <button
              type="button"
              onClick={onOpenCareTab}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#0E5A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add care steps</span>
            </button>
          </div>
        ) : hero ? (
          <div className="rounded-3xl bg-white p-5 border-2 border-[#E06D38]/45 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF0E6] px-2.5 py-1 text-xs font-bold text-[#E06D38]">
                  <span className="w-2 h-2 rounded-full bg-[#E06D38]" />
                  <span>
                    {store.snoozed
                      ? 'Snoozed 10 minutes'
                      : hero.time
                      ? `Due now • ${hero.time}`
                      : 'Next care step'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0E5A54] pt-1">{hero.name}</h3>
                <p className="text-sm font-medium text-[#556B68]">
                  {hero.amount ? `${hero.amount} • ${hero.detail}` : hero.detail}
                </p>
              </div>
              <span className="text-3xl">{getDoseEmoji(hero)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={store.tookMedicine}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] py-3.5 px-4 text-sm font-bold text-white hover:bg-[#0B4742] transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Taken (+2 ⭐)</span>
              </button>
              <button
                type="button"
                onClick={store.snoozeDose}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 px-4 text-sm font-bold text-[#556B68] border border-[#E8E2D8] hover:bg-[#FAF6F0] transition cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>{store.snoozed ? 'Snoozed' : 'Snooze 10 mins'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#E6F4F1] p-4 border border-[#BCE3DC] flex items-center justify-center gap-2 text-sm font-bold text-[#0E5A54]">
            <span>⭐</span>
            <span>Every care step for today is done!</span>
          </div>
        )}

        {/* Today's Schedule List */}
        {store.doses.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0E5A54]">Today's Schedule</h3>
              <button
                type="button"
                onClick={onOpenCareTab}
                className="text-xs font-bold text-[#0E5A54] hover:underline cursor-pointer"
              >
                Edit steps
              </button>
            </div>

            <div className="space-y-2.5">
              {store.doses.map((dose) => {
                const isDue = dose.status === 'due';
                const isDone = dose.status === 'done';
                return (
                  <div
                    key={dose.id}
                    className={`rounded-2xl bg-white p-3.5 border flex items-center gap-3 ${
                      isDue
                        ? 'border-2 border-[#E06D38]/45'
                        : 'border-[#E8E2D8]'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        isDone
                          ? 'bg-[#E6F4F1] text-[#0E5A54] font-bold'
                          : isDue
                          ? 'bg-[#FDF0E6]'
                          : 'bg-[#FAF6F0]'
                      }`}
                    >
                      {isDone ? '✓' : getDoseEmoji(dose)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold ${
                          isDone ? 'line-through text-[#556B68]' : 'text-[#0E5A54]'
                        }`}
                      >
                        {dose.name}
                      </p>
                      <p className="text-xs font-medium text-[#556B68] truncate">
                        {[dose.amount, dose.detail, dose.time]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>

                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => store.completeCareStep(dose.id)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                          isDue
                            ? 'bg-[#FDF0E6] text-[#E06D38] hover:bg-[#F4D2BA]'
                            : 'bg-[#E6F4F1] text-[#0E5A54] hover:bg-[#BCE3DC]'
                        }`}
                      >
                        {store.trailingLabelForDose(dose)}
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#0E5A54]">
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const RewardsBearView: React.FC<{
  showsParentTools?: boolean;
}> = ({ showsParentTools = true }) => {
  const store = useCareStore();
  const remainingForPuppy = Math.max(0, store.puppyGoal - store.stars);
  const progressRatio = Math.min(1, store.stars / store.puppyGoal);

  const badges = [
    {
      id: 'helper',
      emoji: '🐧',
      name: 'Helper',
      unlocked: true,
      fill: '#E6F4F1',
      border: '#BCE3DC',
    },
    {
      id: 'story',
      emoji: '🦁',
      name: 'Story',
      unlocked: store.storyFinished || store.stars >= 10,
      fill: '#FDF0E6',
      border: '#F4D2BA',
    },
    {
      id: 'steady',
      emoji: '💧',
      name: 'Sip Hero',
      unlocked: store.cups >= 5,
      fill: '#FAF0F3',
      border: '#F4D0DC',
    },
    {
      id: 'puppy',
      emoji: '🐶',
      name: 'Puppy',
      unlocked: store.puppyUnlocked || store.stars >= store.puppyGoal,
      fill: '#E6F4F1',
      border: '#BCE3DC',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Bear Column */}
      <div className="md:col-span-5 rounded-3xl bg-white p-6 border border-[#E8E2D8] shadow-2xs flex flex-col items-center text-center space-y-3">
        <BearBadge size={156} showsStatus />
        <h2
          className="text-2xl font-extrabold"
          style={{ color: store.bearMood.color }}
        >
          {store.bearMood.title}
        </h2>
        <p className="text-sm font-medium text-[#556B68]">{store.bearMood.detail}</p>
        <NameBearButton />
      </div>

      {/* Right Rewards & Care Actions Column */}
      <div className="md:col-span-7 space-y-4">
        {/* Stars Progress Card */}
        <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF0E6] px-3 py-1 text-xs font-extrabold text-[#E06D38]">
              ⭐ {store.stars} stars
            </span>
            <span className="text-xs font-bold text-[#0E5A54]">
              {remainingForPuppy === 0
                ? '🐶 Puppy Hero unlocked!'
                : `${remainingForPuppy} more for Puppy Hero`}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#EFEAE1] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E06D38] transition-all duration-300"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>
        </div>

        {/* Care Actions */}
        <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] shadow-2xs space-y-3">
          <h3 className="text-base font-extrabold text-[#0E5A54]">
            Care for {store.companionName}
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              disabled={!store.heroDose}
              onClick={store.tookMedicine}
              className="w-full rounded-2xl p-3.5 bg-[#E6F4F1] border border-[#BCE3DC] flex items-center justify-between text-left disabled:opacity-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-[#0E5A54]">
                  💊 Give {store.companionName} medicine
                </p>
                <p className="text-xs font-medium text-[#556B68]">
                  {store.heroDose
                    ? [store.heroDose.name, store.heroDose.amount].filter(Boolean).join(' • ')
                    : 'Every scheduled dose is done'}
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#0E5A54]">
                {store.heroDose ? '+2 ⭐' : 'Done'}
              </span>
            </button>

            <button
              type="button"
              disabled={store.coldTreats >= store.maxColdTreats}
              onClick={store.giveColdTreat}
              className="w-full rounded-2xl p-3.5 bg-[#FAF0F3] border border-[#F4D0DC] flex items-center justify-between text-left disabled:opacity-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-[#0E5A54]">🍧 Offer a cold popsicle</p>
                <p className="text-xs font-medium text-[#556B68]">
                  {store.coldTreats}/{store.maxColdTreats} soothing treats today
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#0E5A54]">
                {store.coldTreats < store.maxColdTreats ? '+1 ⭐' : 'Done'}
              </span>
            </button>

            <button
              type="button"
              disabled={store.cups >= store.maxCups}
              onClick={store.drinkCup}
              className="w-full rounded-2xl p-3.5 bg-[#E6F4F1] border border-[#BCE3DC] flex items-center justify-between text-left disabled:opacity-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-[#0E5A54]">💧 Offer a cold sip</p>
                <p className="text-xs font-medium text-[#556B68]">
                  {store.cups}/{store.maxCups} cups today
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#0E5A54]">
                {store.cups < store.maxCups ? '+1 ⭐' : 'Full'}
              </span>
            </button>

            <button
              type="button"
              disabled={store.restHelps >= store.maxRest}
              onClick={store.helpRest}
              className="w-full rounded-2xl p-3.5 bg-[#FDF0E6] border border-[#F4D2BA] flex items-center justify-between text-left disabled:opacity-50 cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-[#0E5A54]">
                  🌙 Help {store.companionName} rest
                </p>
                <p className="text-xs font-medium text-[#556B68]">
                  {store.restHelps}/{store.maxRest} quiet rests today
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#E06D38]">
                {store.restHelps < store.maxRest ? '+1 ⭐' : 'Rested'}
              </span>
            </button>

            {showsParentTools && (
              <button
                type="button"
                onClick={store.missCareStep}
                className="w-full rounded-2xl p-3 bg-white border border-[#E8E2D8] flex items-center justify-between text-left hover:bg-[#FAF6F0] cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#556B68]">
                    ⚠️ Simulate missed care step (Parent preview)
                  </p>
                  <p className="text-[11px] font-medium text-[#7E908D]">
                    Shows how {store.companionName} looks when a care step is missed
                  </p>
                </div>
                <span className="rounded-full bg-[#FDF0E6] px-2.5 py-0.5 text-[11px] font-bold text-[#E06D38]">
                  -2 ⭐
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 8-Cup Hydration Tracker */}
        <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0E5A54]">Hydration</h3>
            <span className="text-xs font-bold text-[#0E5A54]">
              {store.cups}/{store.maxCups} cups
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: store.maxCups }, (_, idx) => {
              const cupNumber = idx + 1;
              const filled = cupNumber <= store.cups;
              return (
                <button
                  key={cupNumber}
                  type="button"
                  onClick={() => store.setCupCount(cupNumber)}
                  aria-label={`Cup ${cupNumber} of ${store.maxCups}`}
                  className={`h-11 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                    filled
                      ? 'bg-[#0E5A54] border-[#0E5A54] text-white'
                      : 'bg-[#E6F4F1] border-[#BCE3DC] text-[#0E5A54]'
                  }`}
                >
                  <Droplets className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-[#0E5A54]">Badges</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {badges.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl p-3 text-center border flex flex-col items-center justify-center gap-1"
                style={{
                  backgroundColor: b.unlocked ? b.fill : '#FFFFFF',
                  borderColor: b.unlocked ? b.border : '#E8E2D8',
                  opacity: b.unlocked ? 1 : 0.5,
                }}
              >
                <span className="text-2xl">{b.emoji}</span>
                <span className="text-xs font-bold text-[#163835]">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ParentCareView: React.FC = () => {
  const store = useCareStore();
  const [subScreen, setSubScreen] = useState<'home' | 'write' | 'record' | 'review'>('home');

  // Write form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDetail, setManualDetail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetail, setEditDetail] = useState('');

  // Record & Extract state
  const [transcript, setTranscript] = useState(SAMPLE_VISIT_TRANSCRIPT);
  const [isRecording, setIsRecording] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSource, setExtractSource] = useState<'gemini' | 'local' | null>(null);
  const [drafts, setDrafts] = useState<DraftInstruction[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() && !manualDetail.trim()) return;
    store.addParentInstruction(manualTitle, manualDetail, false, false);
    setManualTitle('');
    setManualDetail('');
    setStatusMessage('Saved care step to schedule and child story.');
    setSubScreen('home');
  };

  const handleStartEdit = (id: string, title: string, detail: string) => {
    setEditingId(id);
    setEditTitle(title);
    setEditDetail(detail);
  };

  const handleSaveEdit = (id: string) => {
    store.updateParentInstruction(id, editTitle, editDetail);
    setEditingId(null);
  };

  const handleToggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatusMessage(
        'Live browser speech recognition is not supported in this browser; edit the transcript directly or use the sample visit transcript.'
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionCtor as any)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      setIsRecording(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          setTranscript((prev) => (prev ? `${prev} ${spoken}` : spoken));
        }
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleExtractSteps = async () => {
    if (!transcript.trim()) return;
    setIsExtracting(true);
    setStatusMessage('');
    try {
      const response = await fetch('/api/extract-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          recoveryFocus: store.recoveryFocus,
        }),
      });
      const data = await response.json();
      const rawSteps: Array<{ title: string; detail: string }> = Array.isArray(data.steps)
        ? data.steps
        : [];
      setExtractSource(data.source === 'gemini' ? 'gemini' : 'local');
      setDrafts(
        rawSteps.map((s, idx) => ({
          id: `draft-${Date.now()}-${idx}`,
          title: s.title,
          detail: s.detail,
          approved: false,
        }))
      );
      setSubScreen('review');
    } catch {
      setStatusMessage('Could not extract steps right now.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveApprovedDrafts = () => {
    const approved = drafts.filter(
      (d) => d.approved && (d.title.trim().length > 0 || d.detail.trim().length > 0)
    );
    if (approved.length === 0) return;
    for (const item of approved) {
      store.addParentInstruction(item.title, item.detail, true, false);
    }
    setDrafts([]);
    setStatusMessage(
      `Approved and saved ${approved.length} care ${approved.length === 1 ? 'step' : 'steps'}.`
    );
    setSubScreen('home');
  };

  const approvedCount = drafts.filter((d) => d.approved).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      {subScreen === 'home' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0E5A54]">Care &amp; Help</h2>
              <p className="text-sm font-medium text-[#556B68]">
                Write care steps or extract them from a recorded care visit. You review and approve every step before {store.childName || 'your child'} sees it.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="rounded-2xl bg-[#E6F4F1] border border-[#BCE3DC] p-3.5 text-xs font-bold text-[#0E5A54] flex items-center justify-between">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => setStatusMessage('')}
                className="text-[#0E5A54] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Cards: Write vs Record */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setSubScreen('write')}
              className="rounded-3xl bg-white p-5 border-2 border-[#0E5A54]/30 hover:border-[#0E5A54] text-left space-y-2 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E6F4F1] text-[#0E5A54] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0E5A54]">Write a care step</h3>
              <p className="text-xs font-medium text-[#556B68]">
                Type a medicine dose, clock time, or home care step in your own words.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSubScreen('record')}
              className="rounded-3xl bg-white p-5 border-2 border-[#E06D38]/40 hover:border-[#E06D38] text-left space-y-2 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FDF0E6] text-[#E06D38] flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0E5A54]">
                Record a conversation
              </h3>
              <p className="text-xs font-medium text-[#556B68]">
                Turn spoken discharge notes into draft care steps that you edit and approve.
              </p>
            </button>
          </div>

          {/* Care Stage & Demo Switcher */}
          <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0E5A54]">
                  Journey &amp; Demo Examples
                </h3>
                <p className="text-xs font-medium text-[#556B68]">
                  Switch between Tonsillectomy recovery and the Non-Waterproof Cast demonstration, or toggle the Pre-Op preparation game.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => store.loadSampleSteps('tonsillectomy')}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                    store.recoveryFocus.toLowerCase().includes('tonsil')
                      ? 'bg-[#0E5A54] text-white border-[#0E5A54]'
                      : 'bg-[#FAF6F0] text-[#0E5A54] border-[#E8E2D8]'
                  }`}
                >
                  Tonsillectomy steps
                </button>
                <button
                  type="button"
                  onClick={() => store.loadSampleSteps('cast')}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                    store.recoveryFocus.toLowerCase().includes('cast')
                      ? 'bg-[#0E5A54] text-white border-[#0E5A54]'
                      : 'bg-[#FAF6F0] text-[#0E5A54] border-[#E8E2D8]'
                  }`}
                >
                  Cast care demo (non-waterproof)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EFEAE1]">
              <div>
                <p className="text-sm font-bold text-[#163835]">
                  “Preparing for my operation” pre-op tour
                </p>
                <p className="text-xs font-medium text-[#556B68]">
                  Shows the 11-page hospital preparation tour on the Child Play tab
                </p>
              </div>
              <button
                type="button"
                onClick={() => store.setPrepGameEnabled(!store.prepGameEnabled)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  store.prepGameEnabled
                    ? 'bg-[#0E5A54] text-white'
                    : 'bg-[#EFEAE1] text-[#556B68]'
                }`}
              >
                {store.prepGameEnabled ? 'Shown on Play tab' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Saved Care Steps List */}
          <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0E5A54]">
                Saved Care Steps ({store.parentInstructions.length})
              </h3>
              <span className="text-xs font-semibold text-[#556B68]">
                Used in Schedule, Story &amp; Remember Game
              </span>
            </div>

            {store.parentInstructions.length === 0 ? (
              <p className="text-sm font-medium text-[#556B68] py-3">
                No care steps saved yet. Use “Write a care step” or “Record a conversation” above.
              </p>
            ) : (
              <div className="space-y-2.5">
                {store.parentInstructions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#FAF6F0] p-4 border border-[#E8E2D8] space-y-2"
                  >
                    {editingId === item.id ? (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold border border-[#E8E2D8]"
                          placeholder="Step title"
                        />
                        <textarea
                          value={editDetail}
                          onChange={(e) => setEditDetail(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl bg-white px-3 py-2 text-xs font-medium border border-[#E8E2D8]"
                          placeholder="Step instruction"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#0E5A54] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#556B68] border border-[#E8E2D8] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-extrabold text-[#0E5A54]">{item.title}</p>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#556B68] border border-[#E8E2D8]">
                              {item.fromRecording ? 'From recording' : 'Written by grown-up'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-[#163835]">{item.detail}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item.id, item.title, item.detail)}
                            className="p-2 rounded-xl bg-white text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] cursor-pointer"
                            aria-label={`Edit ${item.title}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => store.removeParentInstruction(item.id)}
                            className="p-2 rounded-xl bg-white text-[#E06D38] border border-[#E8E2D8] hover:bg-[#FDF0E6] cursor-pointer"
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {subScreen === 'write' && (
        <form
          onSubmit={handleSaveManual}
          className="rounded-3xl bg-white p-6 border border-[#E8E2D8] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-[#0E5A54]">Write a care step</h3>
            <button
              type="button"
              onClick={() => setSubScreen('home')}
              className="text-xs font-bold text-[#0E5A54] cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs font-medium text-[#556B68]">
            Include an amount (like <code className="font-bold">5 mL</code>) or clock time (like{' '}
            <code className="font-bold">8:00 AM</code>) to automatically place it on today's schedule.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0E5A54]">Short title</label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g., Morning pain medicine"
              className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-bold border border-[#E8E2D8] focus:outline-none focus:ring-2 focus:ring-[#0E5A54]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0E5A54]">
              Instruction for you and {store.childName || 'your child'}
            </label>
            <textarea
              value={manualDetail}
              onChange={(e) => setManualDetail(e.target.value)}
              rows={3}
              placeholder="e.g., Give 5 mL liquid medicine at 9:00 AM with a cool sip of water."
              className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3 text-sm font-medium border border-[#E8E2D8] focus:outline-none focus:ring-2 focus:ring-[#0E5A54]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setManualTitle('Afternoon cold sips');
                setManualDetail('Drink 3 small cold sips of water at 3:00 PM.');
              }}
              className="rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#0E5A54] cursor-pointer"
            >
              + Example: Cold sips
            </button>
            <button
              type="button"
              onClick={() => {
                setManualTitle('Evening medicine');
                setManualDetail('Give 5 mL medicine at 7:30 PM with a grown-up.');
              }}
              className="rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#0E5A54] cursor-pointer"
            >
              + Example: Evening 5 mL dose
            </button>
          </div>

          <button
            type="submit"
            disabled={!manualTitle.trim() && !manualDetail.trim()}
            className="w-full rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            Save care step
          </button>
        </form>
      )}

      {subScreen === 'record' && (
        <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-[#0E5A54]">Record a care conversation</h3>
            <button
              type="button"
              onClick={() => setSubScreen('home')}
              className="text-xs font-bold text-[#0E5A54] cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs font-medium text-[#556B68]">
            Record spoken discharge instructions or edit the transcript below. Next, you will review and approve each extracted step before saving.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                isRecording
                  ? 'bg-[#E06D38] text-white'
                  : 'bg-[#E6F4F1] text-[#0E5A54] hover:bg-[#BCE3DC]'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Stop recording' : 'Start microphone'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTranscript(SAMPLE_VISIT_TRANSCRIPT)}
              className="rounded-2xl bg-[#FAF6F0] px-3.5 py-2.5 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
            >
              Load sample clinic transcript
            </button>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={5}
            className="w-full rounded-2xl bg-[#FAF6F0] p-4 text-sm font-medium text-[#163835] border border-[#E8E2D8] focus:outline-none focus:ring-2 focus:ring-[#0E5A54]"
            placeholder="Spoken care instructions appear here..."
          />

          <button
            type="button"
            disabled={isExtracting || !transcript.trim()}
            onClick={handleExtractSteps}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isExtracting ? 'Turning into care steps…' : 'Turn into care steps for review'}
            </span>
          </button>
        </div>
      )}

      {subScreen === 'review' && (
        <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-[#0E5A54]">
                Review &amp; approve care steps
              </h3>
              <p className="text-xs font-medium text-[#556B68]">
                Check each step against your paper discharge sheet. Approve the steps you want to show {store.childName || 'your child'}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubScreen('record')}
              className="text-xs font-bold text-[#0E5A54] cursor-pointer"
            >
              Back
            </button>
          </div>

          {extractSource && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-3 py-1 text-[11px] font-bold text-[#0E5A54]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {extractSource === 'gemini'
                  ? 'Extracted with Gemini • Requires grown-up approval'
                  : 'Extracted from transcript • Requires grown-up approval'}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {drafts.map((draft, idx) => (
              <div
                key={draft.id}
                className={`rounded-2xl p-4 border-2 space-y-2.5 transition ${
                  draft.approved
                    ? 'bg-[#E6F4F1]/60 border-[#0E5A54]'
                    : 'bg-[#FAF6F0] border-[#E8E2D8]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#556B68]">
                    Step {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((prev) =>
                          prev.map((d) =>
                            d.id === draft.id ? { ...d, approved: !d.approved } : d
                          )
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                        draft.approved
                          ? 'bg-[#0E5A54] text-white'
                          : 'bg-white text-[#0E5A54] border border-[#0E5A54]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{draft.approved ? 'Approved' : 'Approve'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
                      }
                      className="p-1.5 rounded-full bg-white text-[#E06D38] border border-[#E8E2D8] cursor-pointer"
                      aria-label="Remove draft step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setDrafts((prev) =>
                      prev.map((d) =>
                        d.id === draft.id ? { ...d, title: e.target.value } : d
                      )
                    )
                  }
                  className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0E5A54] border border-[#E8E2D8]"
                  placeholder="Step title"
                />
                <textarea
                  value={draft.detail}
                  onChange={(e) =>
                    setDrafts((prev) =>
                      prev.map((d) =>
                        d.id === draft.id ? { ...d, detail: e.target.value } : d
                      )
                    )
                  }
                  rows={2}
                  className="w-full rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#163835] border border-[#E8E2D8]"
                  placeholder="Step detail"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setDrafts((prev) => prev.map((d) => ({ ...d, approved: true })))
              }
              className="rounded-xl bg-[#E6F4F1] px-3.5 py-2 text-xs font-bold text-[#0E5A54] cursor-pointer"
            >
              Approve all
            </button>
            <button
              type="button"
              onClick={() =>
                setDrafts((prev) => [
                  ...prev,
                  {
                    id: `draft-${Date.now()}`,
                    title: 'New care step',
                    detail: '',
                    approved: true,
                  },
                ])
              }
              className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
            >
              + Add another step
            </button>
          </div>

          <button
            type="button"
            disabled={approvedCount === 0}
            onClick={handleSaveApprovedDrafts}
            className="w-full rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            {approvedCount === 0
              ? 'Approve steps to save'
              : `Save ${approvedCount} approved ${approvedCount === 1 ? 'step' : 'steps'}`}
          </button>
        </div>
      )}
    </div>
  );
};

export const HelpSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const store = useCareStore();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-sheet-title"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FAF6F0] p-6 border border-[#E8E2D8] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF0E6] px-3 py-1 text-xs font-bold text-[#E06D38]">
            Grown-up guide
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#556B68] hover:bg-white cursor-pointer"
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 id="help-sheet-title" className="text-2xl font-extrabold text-[#0E5A54]">
          Hand this to a grown-up
        </h2>
        <p className="text-sm font-medium text-[#556B68]">
          {store.childName || 'Your child'} may need help right now. Use your hospital discharge sheet for your care team’s phone number.
        </p>

        <div className="rounded-2xl bg-[#FDF0E6] border border-[#F4D2BA] p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#E06D38]">
            <AlertTriangle className="w-4 h-4" />
            <span>Get help right away for:</span>
          </div>
          <ul className="space-y-1.5 text-xs font-semibold text-[#163835]">
            <li>• Bright red blood from the mouth or nose</li>
            <li>• Trouble breathing or swallowing</li>
            <li>• Too sleepy or dizzy to drink small sips</li>
            <li>• Pain that does not improve after scheduled medicine</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-[#E8E2D8] p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0E5A54]">
            <PhoneCall className="w-4 h-4" />
            <span>Call the care clinic today if:</span>
          </div>
          <ul className="space-y-1.5 text-xs font-medium text-[#556B68]">
            <li>• {store.childName || 'Your child'} has not had fluids for several hours</li>
            <li>• Fever reaches 101.5°F (38.6°C) or higher</li>
            <li>• For cast care: fingers or toes feel cold, numb, tingly, or the cast gets wet</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-[#0E5A54] py-3.5 text-sm font-bold text-white cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const ProfileSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const store = useCareStore();
  const [isEditing, setIsEditing] = useState(false);
  const [parentName, setParentName] = useState(store.parentName);
  const [email, setEmail] = useState(store.parentEmail);
  const [childName, setChildName] = useState(store.childName);
  const [age, setAge] = useState(parseInt(store.childAge, 10) || 7);
  const [recovery, setRecovery] = useState(store.recoveryFocus);
  const [newPassword, setNewPassword] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProfile({
      parentName,
      email,
      childName,
      age: String(age),
      recovery,
    });
    if (newPassword.trim().length >= 4) {
      store.savePassword(newPassword.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-sheet-title"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FAF6F0] p-6 border border-[#E8E2D8] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (isEditing ? setIsEditing(false) : onClose())}
            className="text-sm font-bold text-[#0E5A54] cursor-pointer"
          >
            {isEditing ? 'Cancel' : 'Close'}
          </button>
          <h2 id="profile-sheet-title" className="text-base font-extrabold text-[#0E5A54]">
            {isEditing ? 'Edit profile' : 'Profile'}
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-bold text-[#0E5A54] cursor-pointer"
            >
              Edit
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>

        <div className="flex flex-col items-center text-center space-y-1.5">
          <EmmaAvatar size={72} />
          <h3 className="text-2xl font-extrabold text-[#0E5A54]">
            {store.childName || 'Your child'}
          </h3>
          <p className="text-xs font-semibold text-[#556B68]">{store.childSummary}</p>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-[#E8E2D8] divide-y divide-[#EFEAE1] text-sm">
              <div className="px-4 py-3 flex justify-between">
                <span className="font-semibold text-[#556B68]">Grown-up</span>
                <span className="font-bold text-[#163835]">{store.parentName}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="font-semibold text-[#556B68]">Email</span>
                <span className="font-bold text-[#163835]">{store.parentEmail}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="font-semibold text-[#556B68]">Child</span>
                <span className="font-bold text-[#163835]">
                  {store.childName} ({store.childAge} yrs)
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="font-semibold text-[#556B68]">Focus</span>
                <span className="font-bold text-[#163835]">{store.recoveryFocus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  store.setChildModeUnlocked(true);
                }}
                className="rounded-2xl bg-white py-3 px-4 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Open Child's View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  store.openOnboardingFlow();
                }}
                className="rounded-2xl bg-white py-3 px-4 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Replay Setup Tour</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0E5A54] mb-1">Your name</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium border border-[#E8E2D8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0E5A54] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium border border-[#E8E2D8]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">Child's name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium border border-[#E8E2D8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0E5A54] mb-1">Child's age</label>
                <input
                  type="number"
                  min={1}
                  max={17}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 7)}
                  className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium border border-[#E8E2D8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0E5A54] mb-1">
                Recovery focus
              </label>
              <input
                type="text"
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium border border-[#E8E2D8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0E5A54] mb-1">
                Child-mode lock password (optional update)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium border border-[#E8E2D8]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#0E5A54] py-3 text-sm font-bold text-white cursor-pointer"
            >
              Save profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
