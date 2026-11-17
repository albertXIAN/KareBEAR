import React, { useState, useEffect } from 'react';
import { useCareStore } from '../context/CareStoreContext.tsx';
import { StoryPage, StoryChoice, Dose } from '../utils/careStoreLogic.ts';
import { BearBadge, NameBearButton } from './BearArt.tsx';
import {
  Volume2,
  VolumeX,
  Home,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  Star,
  Lock,
  BookOpen,
  Gamepad2,
  BriefcaseMedical,
  Heart,
  RotateCcw,
  MessageCircleHeart,
} from 'lucide-react';

type StoryPhase = 'reading' | 'question' | 'tryAgain' | 'correct' | 'revealed' | 'done';

interface PracticeStoryViewProps {
  pages: StoryPage[];
  heading: string;
  recordsProgress?: boolean;
  doneTitle: string;
  doneDetail: string;
  doneButton: string;
  secondaryButtonLabel?: string;
  onSecondaryAction?: () => void;
  onLeave?: () => void;
  onDone: () => void;
}

export const PracticeStoryView: React.FC<PracticeStoryViewProps> = ({
  pages,
  heading,
  recordsProgress = true,
  doneTitle,
  doneDetail,
  doneButton,
  secondaryButtonLabel,
  onSecondaryAction,
  onLeave,
  onDone,
}) => {
  const store = useCareStore();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<StoryPhase>('reading');
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [localMisses, setLocalMisses] = useState<Record<string, number>>({});
  const [speaking, setSpeaking] = useState(false);
  const [triedOnPage, setTriedOnPage] = useState(false);

  const page = pages[Math.min(index, Math.max(0, pages.length - 1))];

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1.05;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = () => {
    if (speaking) {
      stopSpeech();
      return;
    }
    if (!page) return;
    const textToRead =
      phase === 'reading'
        ? `${page.title}. ${page.speech} ${page.more}`
        : `${page.question} ${page.choices.map((c) => c.label).join('. ')}`;
    speakText(textToRead);
  };

  const handlePickChoice = (choice: StoryChoice) => {
    if (!page) return;
    stopSpeech();
    setSelectedID(choice.id);

    if (choice.isCorrect) {
      if (recordsProgress) {
        store.markStoryCleared(page.id);
      }
      setPhase('correct');
      return;
    }

    if (recordsProgress) {
      const missCount = store.recordStoryMiss(page.id);
      setPhase(missCount >= 2 ? 'revealed' : 'tryAgain');
    } else {
      const nextMiss = (localMisses[page.id] ?? 0) + 1;
      setLocalMisses((prev) => ({ ...prev, [page.id]: nextMiss }));
      setPhase(nextMiss >= 2 ? 'revealed' : 'tryAgain');
    }
  };

  const handleNextPage = () => {
    stopSpeech();
    setSelectedID(null);
    setTriedOnPage(false);
    if (index + 1 < pages.length) {
      setIndex(index + 1);
      setPhase('reading');
    } else {
      setPhase('done');
    }
  };

  const handlePrevPage = () => {
    stopSpeech();
    setSelectedID(null);
    setTriedOnPage(false);
    if (phase !== 'reading' && phase !== 'done') {
      setPhase('reading');
      return;
    }
    if (index > 0) {
      setIndex(index - 1);
      setPhase('reading');
    }
  };

  const handleRestart = () => {
    stopSpeech();
    setIndex(0);
    setSelectedID(null);
    setTriedOnPage(false);
    setPhase('reading');
  };

  if (!page) return null;

  const flaggedPages = pages.filter((p) => store.needsParentTalk(p.id));

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6F0]">
      {/* Story Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E2D8] bg-[#FAF6F0]">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-extrabold text-[#0E5A54]">
            Kare<span className="text-[#E06D38]">BEAR</span>
          </span>
          {onLeave && (
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                onLeave();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#556B68] bg-white px-3 py-1 rounded-full border border-[#E8E2D8]">
            {phase === 'done' ? 'Complete' : `Page ${index + 1} of ${pages.length}`}
          </span>
          {phase !== 'done' && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition cursor-pointer ${
                speaking
                  ? 'bg-[#0E5A54] text-white border-[#0E5A54]'
                  : 'bg-white text-[#0E5A54] border-[#E8E2D8] hover:bg-[#E6F4F1]'
              }`}
              aria-label={speaking ? 'Stop reading aloud' : 'Listen to page'}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{speaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {phase === 'done' ? (
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
          <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] shadow-xs text-center space-y-4">
            <div className="flex justify-center">
              <BearBadge size={128} showsStatus variant="sit" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-3.5 py-1 text-xs font-bold text-[#0E5A54]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{heading}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0E5A54]">{doneTitle}</h2>
            <p className="text-base font-medium text-[#556B68] max-w-lg mx-auto">{doneDetail}</p>

            {recordsProgress && flaggedPages.length > 0 && (
              <div className="rounded-2xl bg-[#FDF0E6] border border-[#F4D2BA] p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#E06D38]">
                  <MessageCircleHeart className="w-4 h-4" />
                  <span>Good pages to talk over with a grown-up:</span>
                </div>
                <ul className="space-y-1 text-sm font-semibold text-[#163835]">
                  {flaggedPages.map((fp) => (
                    <li key={fp.id}>• {fp.title}: {fp.reveal}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onDone}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] px-5 py-3.5 text-base font-bold text-white hover:bg-[#0B4742] transition cursor-pointer"
              >
                <span>{doneButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {secondaryButtonLabel && onSecondaryAction && (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-base font-bold text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] transition cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{secondaryButtonLabel}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-[#556B68] border border-[#E8E2D8] hover:bg-[#FAF6F0] transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Read again</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left / Top Bear Stage */}
          <div className="md:col-span-5 rounded-3xl bg-white p-5 border border-[#E8E2D8] shadow-2xs flex flex-col items-center text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#556B68]">
              {heading}
            </span>
            <BearBadge
              size={148}
              showsStatus
              speaking={speaking}
              variant={page.id.startsWith('prep-') ? 'doctor' : 'sit'}
            />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-bold text-[#0E5A54]">
              {store.companionName} is {page.expression.toLowerCase()}
            </span>
            <p className="text-xs font-semibold text-[#556B68]">{page.scene}</p>
          </div>

          {/* Right / Bottom Story & Question Block */}
          <div className="md:col-span-7 space-y-4">
            <div className="rounded-3xl bg-white p-5 sm:p-6 border border-[#E8E2D8] shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-2xl font-extrabold text-[#0E5A54]">{page.title}</h2>
                {store.isStoryCleared(page.id) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F4F1] px-2.5 py-1 text-xs font-bold text-[#0E5A54]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </span>
                )}
              </div>

              {phase === 'reading' ? (
                <>
                  <p className="text-lg font-semibold text-[#163835] leading-relaxed">
                    “{page.speech}”
                  </p>
                  <div className="rounded-2xl bg-[#FAF6F0] p-3.5 border border-[#E8E2D8]">
                    <p className="text-sm font-medium text-[#556B68]">{page.more}</p>
                  </div>

                  {/* Interactive "Try it" activity card for Pre-Op pages */}
                  {page.tryTitle && page.tryDetail && (
                    <div className="rounded-2xl bg-[#E6F4F1] border border-[#BCE3DC] p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-[#0E5A54]">
                          Try it: {page.tryTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTriedOnPage((t) => !t)}
                          className="rounded-full bg-[#0E5A54] px-3 py-1 text-xs font-bold text-white hover:bg-[#0B4742] transition cursor-pointer"
                        >
                          {triedOnPage ? 'Practiced ✓' : 'Practice now'}
                        </button>
                      </div>
                      <p className="text-sm font-medium text-[#163835]">{page.tryDetail}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={index === 0}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#0E5A54] border border-[#E8E2D8] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopSpeech();
                        setPhase('question');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E5A54] px-5 py-3.5 text-base font-bold text-white hover:bg-[#0B4742] transition cursor-pointer"
                    >
                      <span>Answer question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl bg-[#FAF6F0] p-3.5 border border-[#E8E2D8] flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#556B68] line-clamp-2">
                      “{page.speech}”
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhase('reading')}
                      className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
                    >
                      Read again
                    </button>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#163835]">{page.question}</h3>

                  <div className="space-y-2.5">
                    {page.choices.map((choice) => {
                      const isSelected = selectedID === choice.id;
                      const showCorrect =
                        (phase === 'correct' || phase === 'revealed') && choice.isCorrect;
                      const showWrong =
                        (phase === 'tryAgain' || phase === 'revealed') &&
                        isSelected &&
                        !choice.isCorrect;

                      let btnStyle =
                        'bg-white border-[#E8E2D8] text-[#163835] hover:border-[#0E5A54]';
                      if (showCorrect) {
                        btnStyle = 'bg-[#E6F4F1] border-[#0E5A54] text-[#0E5A54]';
                      } else if (showWrong) {
                        btnStyle = 'bg-[#FDF0E6] border-[#E06D38] text-[#163835]';
                      }

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          disabled={phase === 'correct' || phase === 'revealed'}
                          onClick={() => handlePickChoice(choice)}
                          className={`w-full text-left rounded-2xl p-4 border-2 font-bold text-base transition flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <span>{choice.label}</span>
                          {showCorrect && <CheckCircle2 className="w-5 h-5 text-[#0E5A54] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {phase === 'tryAgain' && (
                    <div className="rounded-2xl bg-[#FDF0E6] border border-[#F4D2BA] p-4 space-y-1">
                      <p className="text-sm font-extrabold text-[#E06D38]">
                        Look again with {store.companionName}
                      </p>
                      <p className="text-sm font-medium text-[#163835]">
                        That choice does not match what {store.companionName} said. Try one more time!
                      </p>
                    </div>
                  )}

                  {phase === 'correct' && (
                    <div className="rounded-2xl bg-[#E6F4F1] border border-[#BCE3DC] p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-[#0E5A54]">You got it!</p>
                        <p className="text-xs font-medium text-[#556B68]">{page.reveal}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleNextPage}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl bg-[#0E5A54] px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
                      >
                        <span>{index + 1 < pages.length ? 'Next page' : 'Finish'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {phase === 'revealed' && (
                    <div className="rounded-2xl bg-[#FDF0E6] border border-[#F4D2BA] p-4 space-y-3">
                      <div>
                        <p className="text-sm font-extrabold text-[#E06D38]">
                          Let’s talk about this with a grown-up
                        </p>
                        <p className="text-sm font-medium text-[#163835] mt-0.5">{page.reveal}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleNextPage}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#0E5A54] px-4 py-3 text-sm font-bold text-white cursor-pointer"
                      >
                        <span>{index + 1 < pages.length ? 'Next page' : 'Finish'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StoryGameView: React.FC<{
  onHome: () => void;
  onGame: () => void;
}> = ({ onHome, onGame }) => {
  const store = useCareStore();
  return (
    <PracticeStoryView
      pages={store.storyPages}
      heading={`${store.companionName}'s story`}
      recordsProgress={true}
      doneTitle={`You finished ${store.companionName}'s story!`}
      doneDetail={`You read every care step with ${store.companionName}. Now you can play the Remember game or check your To-dos.`}
      doneButton="Back to Play"
      secondaryButtonLabel="Play Remember game"
      onSecondaryAction={onGame}
      onLeave={onHome}
      onDone={onHome}
    />
  );
};

export const RememberGameView: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  const store = useCareStore();
  const instructions = store.parentInstructions;

  const [round, setRound] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'prompt' | 'correct' | 'tryAgain' | 'finished'>('prompt');

  const target = instructions[round % Math.max(1, instructions.length)];

  const speakClue = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.94;
    window.speechSynthesis.speak(u);
  };

  if (instructions.length === 0) {
    return (
      <div className="min-h-full bg-[#FAF6F0] p-6 max-w-xl mx-auto space-y-4">
        <button
          type="button"
          onClick={onHome}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] text-center space-y-3">
          <BearBadge size={112} showsStatus />
          <h2 className="text-xl font-extrabold text-[#0E5A54]">Waiting for care steps</h2>
          <p className="text-sm font-medium text-[#556B68]">
            Once a grown-up saves care steps in the Care &amp; Help tab, you can match them here!
          </p>
        </div>
      </div>
    );
  }

  const handleSelect = (id: string) => {
    setPickedId(id);
    if (id === target.id) {
      setStatus('correct');
    } else {
      setStatus('tryAgain');
    }
  };

  const handleNext = () => {
    setPickedId(null);
    if (round + 1 < instructions.length) {
      setRound(round + 1);
      setStatus('prompt');
    } else {
      setStatus('finished');
    }
  };

  return (
    <div className="min-h-full bg-[#FAF6F0] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E2D8]">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-extrabold text-[#0E5A54]">
            Kare<span className="text-[#E06D38]">BEAR</span>
          </span>
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>
        <span className="text-xs font-bold text-[#556B68] bg-white px-3 py-1 rounded-full border border-[#E8E2D8]">
          Step {Math.min(round + 1, instructions.length)} of {instructions.length}
        </span>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {status === 'finished' ? (
          <div className="rounded-3xl bg-white p-6 border border-[#E8E2D8] text-center space-y-4">
            <BearBadge size={120} showsStatus />
            <h2 className="text-2xl font-extrabold text-[#0E5A54]">
              You remembered every care step!
            </h2>
            <p className="text-sm font-medium text-[#556B68]">
              {store.companionName} is proud of how carefully you listened.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={onHome}
                className="rounded-2xl bg-[#0E5A54] px-6 py-3 text-sm font-bold text-white cursor-pointer"
              >
                Back to Play
              </button>
              <button
                type="button"
                onClick={() => {
                  setRound(0);
                  setPickedId(null);
                  setStatus('prompt');
                }}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
              >
                Play again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] flex flex-col sm:flex-row items-center gap-4">
              <BearBadge size={96} showsStatus />
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0E5A54]">
                    Remember game
                  </span>
                  <button
                    type="button"
                    onClick={() => speakClue(target.detail)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#E6F4F1] px-2.5 py-1 text-xs font-bold text-[#0E5A54] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen
                  </button>
                </div>
                <p className="text-base font-bold text-[#163835]">
                  “{target.detail}”
                </p>
                <p className="text-xs font-medium text-[#556B68]">
                  Tap the care step card that matches what {store.companionName} just said.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {instructions.map((item) => {
                const isSelected = pickedId === item.id;
                const isRight = status === 'correct' && item.id === target.id;
                const isWrong = status === 'tryAgain' && isSelected && item.id !== target.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={status === 'correct'}
                    onClick={() => handleSelect(item.id)}
                    className={`rounded-2xl p-4 text-left border-2 transition cursor-pointer ${
                      isRight
                        ? 'bg-[#E6F4F1] border-[#0E5A54]'
                        : isWrong
                        ? 'bg-[#FDF0E6] border-[#E06D38]'
                        : 'bg-white border-[#E8E2D8] hover:border-[#0E5A54]'
                    }`}
                  >
                    <p className="text-base font-extrabold text-[#0E5A54]">{item.title}</p>
                    <p className="text-xs font-medium text-[#556B68] mt-1 line-clamp-2">
                      {item.detail}
                    </p>
                  </button>
                );
              })}
            </div>

            {status === 'tryAgain' && (
              <div className="rounded-2xl bg-[#FDF0E6] border border-[#F4D2BA] p-4 text-sm font-bold text-[#E06D38]">
                Not that one — listen to the clue and try another card!
              </div>
            )}

            {status === 'correct' && (
              <div className="rounded-2xl bg-[#E6F4F1] border border-[#BCE3DC] p-4 flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#0E5A54]">
                  That matches “{target.title}”!
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-[#0E5A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const QuestHubView: React.FC<{
  openStory: () => void;
  openGame: () => void;
  openPrep: () => void;
}> = ({ openStory, openGame, openPrep }) => {
  const store = useCareStore();
  const prepDoneCount = store.prepPages.filter((p) => store.isStoryCleared(p.id)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Companion Column */}
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

      {/* Activities & To-Dos Column */}
      <div className="md:col-span-7 space-y-4">
        {/* To-Dos Card */}
        <div className="rounded-3xl bg-white p-5 border border-[#E8E2D8] shadow-2xs space-y-3">
          <div>
            <h3 className="text-lg font-extrabold text-[#0E5A54]">To-dos</h3>
            <p className="text-xs font-medium text-[#556B68]">
              Each finished to-do adds 2 stars toward badges.
            </p>
          </div>

          {store.doses.length === 0 ? (
            <p className="text-sm font-medium text-[#556B68]">
              A grown-up has not added care steps yet.
            </p>
          ) : (
            <div className="divide-y divide-[#EFEAE1]">
              {store.doses.map((dose: Dose) => {
                const done = dose.status === 'done';
                return (
                  <button
                    key={dose.id}
                    type="button"
                    disabled={done}
                    onClick={() => store.completeCareStep(dose.id)}
                    className="w-full py-3 flex items-start gap-3 text-left hover:bg-[#FAF6F0]/60 rounded-xl px-2 transition cursor-pointer disabled:cursor-default"
                  >
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-[#0E5A54] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#7E908D] shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-base font-bold ${
                          done ? 'line-through text-[#556B68]' : 'text-[#0E5A54]'
                        }`}
                      >
                        {dose.name}
                      </p>
                      {dose.detail && (
                        <p className="text-xs font-medium text-[#556B68] mt-0.5">{dose.detail}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        done
                          ? 'bg-[#E6F4F1] text-[#0E5A54]'
                          : 'bg-[#FDF0E6] text-[#E06D38]'
                      }`}
                    >
                      {done ? 'Done' : '+2 ⭐'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Games List */}
        <div className="space-y-3">
          {store.prepGameEnabled && (
            <button
              type="button"
              onClick={openPrep}
              className="w-full rounded-3xl bg-white p-4 border-2 border-[#0E5A54]/30 hover:border-[#0E5A54] shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0E5A54] text-white flex items-center justify-center shrink-0">
                <BriefcaseMedical className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-extrabold text-[#0E5A54]">
                  Preparing for my operation
                </h4>
                <p className="text-xs font-medium text-[#556B68]">
                  Meet scrubs, vitals, the cuff, the IV, and the mask.
                </p>
                <span className="text-[11px] font-bold text-[#7E908D]">
                  {prepDoneCount === store.prepPages.length
                    ? 'Finished'
                    : `${store.prepPages.length} pages`}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0E5A54] flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={openStory}
            className="w-full rounded-3xl bg-white p-4 border-2 border-[#0E5A54]/30 hover:border-[#0E5A54] shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0E5A54] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-extrabold text-[#0E5A54]">
                {store.companionName}'s story
              </h4>
              <p className="text-xs font-medium text-[#556B68]">
                {store.parentInstructions.length === 0
                  ? 'A short hello while care steps are on the way.'
                  : 'Read your home care steps and answer a question on every page.'}
              </p>
              <span className="text-[11px] font-bold text-[#7E908D]">
                {store.storyFinished ? 'Finished' : `${store.storyPages.length} pages`}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0E5A54] flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={openGame}
            className="w-full rounded-3xl bg-white p-4 border-2 border-[#0E5A54]/30 hover:border-[#0E5A54] shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0E5A54] text-white flex items-center justify-center shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-extrabold text-[#0E5A54]">Remember game</h4>
              <p className="text-xs font-medium text-[#556B68]">
                Listen to {store.companionName}, then tap the matching care step.
              </p>
              <span className="text-[11px] font-bold text-[#7E908D]">
                {store.parentInstructions.length === 0
                  ? 'Waiting'
                  : `${store.parentInstructions.length} steps`}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0E5A54] flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export const QuestHomeView: React.FC<{
  renderRewardsTab: () => React.ReactNode;
}> = ({ renderRewardsTab }) => {
  const store = useCareStore();
  const [screen, setScreen] = useState<'hub' | 'story' | 'game' | 'prep' | 'rewards'>('hub');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [lockNote, setLockNote] = useState('');

  const childDisplay = store.childName.trim() || 'friend';

  const handleUnlockParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store.passwordMatches(passwordInput)) {
      setLockNote('That password does not match. (Default demo password: karebear)');
      return;
    }
    setPasswordInput('');
    setLockNote('');
    setShowPasswordModal(false);
    store.setChildModeUnlocked(false);
  };

  if (screen === 'story') {
    return (
      <StoryGameView
        onHome={() => setScreen('hub')}
        onGame={() => setScreen('game')}
      />
    );
  }

  if (screen === 'game') {
    return <RememberGameView onHome={() => setScreen('hub')} />;
  }

  if (screen === 'prep') {
    return (
      <PracticeStoryView
        pages={store.prepPages}
        heading="Preparing for my operation"
        recordsProgress={true}
        doneTitle="You know these helpers"
        doneDetail="You met the clothes, the body checks, the cuff, the IV pole, and the sleepy-air mask. You can ask questions, hold a hand, and play this tour again."
        doneButton="Back to home"
        onLeave={() => setScreen('hub')}
        onDone={() => setScreen('hub')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      {/* Child Mode Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#E8E2D8] bg-[#FAF6F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0E5A54]">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0E5A54]">Hi, {childDisplay}</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setPasswordInput('');
            setLockNote('');
            setShowPasswordModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] hover:bg-[#E6F4F1] transition cursor-pointer"
          aria-label="Grown-up password"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Grown-up</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {screen === 'rewards' ? (
          renderRewardsTab()
        ) : (
          <QuestHubView
            openStory={() => setScreen('story')}
            openGame={() => setScreen('game')}
            openPrep={() => setScreen('prep')}
          />
        )}
      </main>

      {/* Child Bottom Tab Bar */}
      <nav
        aria-label="Child navigation"
        className="fixed bottom-0 inset-x-0 bg-[#FAF6F0] border-t border-[#E8E2D8] flex"
      >
        <button
          type="button"
          onClick={() => setScreen('hub')}
          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
            screen !== 'rewards' ? 'text-[#0E5A54]' : 'text-[#556B68]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Play</span>
        </button>
        <button
          type="button"
          onClick={() => setScreen('rewards')}
          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
            screen === 'rewards' ? 'text-[#0E5A54]' : 'text-[#556B68]'
          }`}
        >
          <Star className="w-5 h-5" />
          <span>Rewards</span>
        </button>
      </nav>

      {/* Grown-up Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="grownup-lock-title"
        >
          <form
            onSubmit={handleUnlockParent}
            className="w-full max-w-md rounded-3xl bg-[#FAF6F0] p-6 border border-[#E8E2D8] shadow-xl space-y-4"
          >
            <h2 id="grownup-lock-title" className="text-2xl font-extrabold text-[#0E5A54]">
              Grown-up password
            </h2>
            <p className="text-sm font-medium text-[#556B68]">
              Type the account password to open the parent view. (Demo password:{' '}
              <code className="font-bold text-[#0E5A54]">karebear</code>)
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl bg-white px-4 py-3.5 text-base font-medium border border-[#E8E2D8] focus:outline-none focus:ring-2 focus:ring-[#0E5A54]"
              autoFocus
            />
            {lockNote && (
              <p className="text-xs font-bold text-[#E06D38]">{lockNote}</p>
            )}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#0E5A54] py-3.5 text-base font-bold text-white hover:bg-[#0B4742] transition cursor-pointer"
              >
                Open parent view
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
              >
                Stay here
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
