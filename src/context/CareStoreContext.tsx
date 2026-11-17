import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Dose,
  ParentInstruction,
  StoryPage,
  BearMoodInfo,
  PUPPY_GOAL,
  MAX_CUPS,
  MAX_COLD_TREATS,
  MAX_REST,
  getBearMood,
  buildInstructionDoses,
  normalizeDueDose,
  buildStoryPagesForInstructions,
  buildPrepPages,
  SAMPLE_TONSILLECTOMY_STEPS,
  SAMPLE_CAST_CARE_STEPS,
} from '../utils/careStoreLogic.ts';

interface CareStoreState {
  stars: number;
  cups: number;
  maxCups: number;
  puppyGoal: number;
  coldTreats: number;
  maxColdTreats: number;
  restHelps: number;
  maxRest: number;
  snoozed: boolean;
  puppyUnlocked: boolean;
  showPuppyCelebration: boolean;
  parentName: string;
  parentEmail: string;
  childName: string;
  bearName: string;
  childAge: string;
  recoveryFocus: string;
  careStage: 'pre' | 'post';
  prepGameEnabled: boolean;
  didFinishOnboarding: boolean;
  isLoggedIn: boolean;
  childModeUnlocked: boolean;
  wellness: number;
  passwordRecord: string;
  parentInstructions: ParentInstruction[];
  doses: Dose[];
  clearedStoryIDs: string[];
  talkWithParentIDs: string[];
  storyMissCounts: Record<string, number>;
  companionName: string;
  bearMood: BearMoodInfo;
  heroDose: Dose | null;
  storyPages: StoryPage[];
  prepPages: StoryPage[];
  storyFinished: boolean;
  unlockedBadgeCount: number;
  childSummary: string;
  hasPassword: boolean;
}

interface CareStoreActions {
  setShowPuppyCelebration: (show: boolean) => void;
  setChildModeUnlocked: (unlocked: boolean) => void;
  setPrepGameEnabled: (enabled: boolean) => void;
  setCareStage: (stage: 'pre' | 'post') => void;
  renameBear: (name: string) => void;
  tookMedicine: () => void;
  completeCareStep: (id: string) => void;
  snoozeDose: () => void;
  drinkCup: () => void;
  setCupCount: (count: number) => void;
  giveColdTreat: () => void;
  helpRest: () => void;
  missCareStep: () => void;
  addParentInstruction: (title: string, detail: string, fromRecording?: boolean, isDemo?: boolean) => void;
  updateParentInstruction: (id: string, title: string, detail: string) => void;
  removeParentInstruction: (id: string) => void;
  loadSampleSteps: (mode?: 'tonsillectomy' | 'cast') => void;
  clearDemoInstructions: () => void;
  markStoryCleared: (id: string) => void;
  isStoryCleared: (id: string) => boolean;
  recordStoryMiss: (id: string) => number;
  storyMissCount: (id: string) => number;
  needsParentTalk: (id: string) => boolean;
  savePassword: (password: string) => void;
  passwordMatches: (password: string) => boolean;
  completeOnboarding: (data: {
    parentName: string;
    email: string;
    childName: string;
    age: string;
    recovery: string;
    careStage: 'pre' | 'post';
    prepGameEnabled: boolean;
  }) => void;
  updateProfile: (data: {
    parentName: string;
    email: string;
    childName: string;
    age: string;
    recovery: string;
  }) => void;
  logOut: () => void;
  logIn: (email: string, password: string) => boolean;
  beginNewAccount: () => void;
  openOnboardingFlow: () => void;
  trailingLabelForDose: (dose: Dose) => string;
}

type CareStoreContextValue = CareStoreState & CareStoreActions;

const CareStoreContext = createContext<CareStoreContextValue | null>(null);

const STORAGE_KEY = 'kare.webStore.v1';

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export const CareStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = useMemo(() => loadInitialState(), []);
  const urlParams = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()),
    []
  );
  const startInOnboard = urlParams.get('onboard') === '1';
  const startInChild = urlParams.get('view') === 'child';

  const initialInstructions: ParentInstruction[] =
    saved?.parentInstructions ?? SAMPLE_TONSILLECTOMY_STEPS;

  const [stars, setStars] = useState<number>(saved?.stars ?? 14);
  const [cups, setCups] = useState<number>(saved?.cups ?? 5);
  const [coldTreats, setColdTreats] = useState<number>(saved?.coldTreats ?? 1);
  const [restHelps, setRestHelps] = useState<number>(saved?.restHelps ?? 1);
  const [snoozed, setSnoozed] = useState<boolean>(saved?.snoozed ?? false);
  const [puppyUnlocked, setPuppyUnlocked] = useState<boolean>(saved?.puppyUnlocked ?? false);
  const [showPuppyCelebration, setShowPuppyCelebration] = useState<boolean>(false);

  const [parentName, setParentName] = useState<string>(saved?.parentName ?? 'Alex Rivera');
  const [parentEmail, setParentEmail] = useState<string>(saved?.parentEmail ?? 'alex@rivera.family');
  const [childName, setChildName] = useState<string>(saved?.childName ?? 'Emma');
  const [bearName, setBearName] = useState<string>(saved?.bearName ?? 'Kare');
  const [childAge, setChildAge] = useState<string>(saved?.childAge ?? '7');
  const [recoveryFocus, setRecoveryFocus] = useState<string>(saved?.recoveryFocus ?? 'Tonsillectomy');
  const [careStage, setCareStage] = useState<'pre' | 'post'>(saved?.careStage ?? 'post');
  const [prepGameEnabled, setPrepGameEnabled] = useState<boolean>(saved?.prepGameEnabled ?? true);

  const [didFinishOnboarding, setDidFinishOnboarding] = useState<boolean>(
    startInOnboard ? false : saved?.didFinishOnboarding ?? true
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(saved?.isLoggedIn ?? true);
  const [childModeUnlocked, setChildModeUnlocked] = useState<boolean>(
    startInChild ? true : saved?.childModeUnlocked ?? false
  );
  const [wellness, setWellness] = useState<number>(saved?.wellness ?? 3);
  const [passwordRecord, setPasswordRecord] = useState<string>(saved?.passwordRecord ?? 'karebear');

  const [parentInstructions, setParentInstructions] = useState<ParentInstruction[]>(initialInstructions);
  const [doses, setDoses] = useState<Dose[]>(() =>
    saved?.doses && Array.isArray(saved.doses) && saved.doses.length > 0
      ? normalizeDueDose(saved.doses)
      : buildInstructionDoses(initialInstructions, [])
  );

  const [clearedStoryIDs, setClearedStoryIDs] = useState<string[]>(saved?.clearedStoryIDs ?? []);
  const [talkWithParentIDs, setTalkWithParentIDs] = useState<string[]>(saved?.talkWithParentIDs ?? []);
  const [storyMissCounts, setStoryMissCounts] = useState<Record<string, number>>(
    saved?.storyMissCounts ?? {}
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          stars,
          cups,
          coldTreats,
          restHelps,
          snoozed,
          puppyUnlocked,
          parentName,
          parentEmail,
          childName,
          bearName,
          childAge,
          recoveryFocus,
          careStage,
          prepGameEnabled,
          didFinishOnboarding,
          isLoggedIn,
          childModeUnlocked,
          wellness,
          passwordRecord,
          parentInstructions,
          doses,
          clearedStoryIDs,
          talkWithParentIDs,
          storyMissCounts,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [
    stars,
    cups,
    coldTreats,
    restHelps,
    snoozed,
    puppyUnlocked,
    parentName,
    parentEmail,
    childName,
    bearName,
    childAge,
    recoveryFocus,
    careStage,
    prepGameEnabled,
    didFinishOnboarding,
    isLoggedIn,
    childModeUnlocked,
    wellness,
    passwordRecord,
    parentInstructions,
    doses,
    clearedStoryIDs,
    talkWithParentIDs,
    storyMissCounts,
  ]);

  const companionName = useMemo(() => {
    const trimmed = bearName.trim();
    return trimmed || 'Kare';
  }, [bearName]);

  const bearMood = useMemo(() => getBearMood(wellness, companionName), [wellness, companionName]);

  const heroDose = useMemo(
    () => doses.find((d) => d.status === 'due') ?? doses.find((d) => d.status === 'upcoming') ?? null,
    [doses]
  );

  const storyPages = useMemo(
    () => buildStoryPagesForInstructions(parentInstructions, companionName, childAge),
    [parentInstructions, companionName, childAge]
  );

  const prepPages = useMemo(
    () => buildPrepPages(childName, companionName, childAge),
    [childName, companionName, childAge]
  );

  const storyFinished = useMemo(
    () => storyPages.length > 0 && storyPages.every((p) => clearedStoryIDs.includes(p.id)),
    [storyPages, clearedStoryIDs]
  );

  const unlockedBadgeCount = useMemo(() => {
    const badges = [
      true,
      storyFinished || stars >= 10,
      cups >= 5,
      puppyUnlocked || stars >= PUPPY_GOAL,
    ];
    return badges.filter(Boolean).length;
  }, [storyFinished, stars, cups, puppyUnlocked]);

  const childSummary = useMemo(() => {
    const parts: string[] = [];
    if (childName.trim()) parts.push(childName.trim());
    if (childAge.trim()) parts.push(`Age ${childAge.trim()}`);
    if (recoveryFocus.trim()) parts.push(recoveryFocus.trim());
    return parts.length === 0 ? 'Add child details' : parts.join(' • ');
  }, [childName, childAge, recoveryFocus]);

  const addStars = (amount: number) => {
    setStars((prev) => {
      const next = prev + amount;
      if (next >= PUPPY_GOAL && !puppyUnlocked) {
        setPuppyUnlocked(true);
        setShowPuppyCelebration(true);
      }
      return next;
    });
  };

  const improveBear = () => {
    setWellness((prev) => Math.min(3, prev + 1));
  };

  const completeCareStep = (id: string) => {
    setDoses((prev) => {
      const target = prev.find((d) => d.id === id);
      if (!target || target.status === 'done') return prev;
      const updated = prev.map((d) => (d.id === id ? { ...d, status: 'done' as const } : d));
      return normalizeDueDose(updated);
    });
    setSnoozed(false);
    addStars(2);
    improveBear();
  };

  const tookMedicine = () => {
    if (!heroDose) return;
    completeCareStep(heroDose.id);
  };

  const snoozeDose = () => {
    setSnoozed(true);
  };

  const drinkCup = () => {
    if (cups >= MAX_CUPS) return;
    setCups((prev) => Math.min(MAX_CUPS, prev + 1));
    addStars(1);
    improveBear();
  };

  const setCupCount = (target: number) => {
    const clamped = Math.max(0, Math.min(MAX_CUPS, target));
    if (clamped === cups) return;
    if (clamped > cups) {
      addStars(clamped - cups);
      improveBear();
    }
    setCups(clamped);
  };

  const giveColdTreat = () => {
    if (coldTreats >= MAX_COLD_TREATS) return;
    setColdTreats((prev) => prev + 1);
    addStars(1);
    improveBear();
  };

  const helpRest = () => {
    if (restHelps >= MAX_REST) return;
    setRestHelps((prev) => prev + 1);
    addStars(1);
    improveBear();
  };

  const missCareStep = () => {
    setStars((prev) => Math.max(0, prev - 2));
    setWellness((prev) => Math.max(0, prev - 1));
  };

  const renameBear = (name: string) => {
    const trimmed = name.trim().slice(0, 18);
    setBearName(trimmed || 'Kare');
  };

  const addParentInstruction = (
    title: string,
    detail: string,
    fromRecording = false,
    isDemo = false
  ) => {
    const cleanTitle = title.trim();
    const cleanDetail = detail.trim();
    if (!cleanTitle && !cleanDetail) return;

    const item: ParentInstruction = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanTitle || 'Care step',
      detail: cleanDetail || cleanTitle,
      fromRecording,
      isDemo,
    };

    setParentInstructions((prev) => {
      const next = [...prev, item];
      setDoses((oldDoses) => buildInstructionDoses(next, oldDoses));
      return next;
    });
  };

  const updateParentInstruction = (id: string, title: string, detail: string) => {
    const cleanTitle = title.trim();
    const cleanDetail = detail.trim();
    if (!cleanTitle && !cleanDetail) return;

    setParentInstructions((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title: cleanTitle || 'Care step',
              detail: cleanDetail || cleanTitle,
              isDemo: false,
            }
          : item
      );
      setDoses((oldDoses) => buildInstructionDoses(next, oldDoses));
      return next;
    });
  };

  const removeParentInstruction = (id: string) => {
    setParentInstructions((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setDoses((oldDoses) => buildInstructionDoses(next, oldDoses));
      return next;
    });
    const pageId = `parent-${id}`;
    setClearedStoryIDs((prev) => prev.filter((item) => item !== pageId));
    setTalkWithParentIDs((prev) => prev.filter((item) => item !== pageId));
  };

  const loadSampleSteps = (mode: 'tonsillectomy' | 'cast' = 'tonsillectomy') => {
    const steps = mode === 'cast' ? SAMPLE_CAST_CARE_STEPS : SAMPLE_TONSILLECTOMY_STEPS;
    setRecoveryFocus(mode === 'cast' ? 'Cast care (non-waterproof)' : 'Tonsillectomy');
    setParentInstructions(steps);
    setDoses(buildInstructionDoses(steps, []));
  };

  const clearDemoInstructions = () => {
    setParentInstructions((prev) => {
      const next = prev.filter((item) => !item.isDemo);
      setDoses((oldDoses) => buildInstructionDoses(next, oldDoses));
      return next;
    });
  };

  const markStoryCleared = (id: string) => {
    setClearedStoryIDs((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const isStoryCleared = (id: string) => clearedStoryIDs.includes(id);

  const recordStoryMiss = (id: string): number => {
    const nextCount = (storyMissCounts[id] ?? 0) + 1;
    setStoryMissCounts((prev) => ({ ...prev, [id]: nextCount }));
    if (nextCount >= 2) {
      setTalkWithParentIDs((prev) => (prev.includes(id) ? prev : [...prev, id]));
      markStoryCleared(id);
    }
    return nextCount;
  };

  const storyMissCount = (id: string) => storyMissCounts[id] ?? 0;

  const needsParentTalk = (id: string) => talkWithParentIDs.includes(id);

  const savePassword = (password: string) => {
    const trimmed = password.trim();
    if (!trimmed) return;
    setPasswordRecord(trimmed);
  };

  const passwordMatches = (password: string) => {
    const trimmed = password.trim();
    if (!passwordRecord) return trimmed.length > 0;
    return trimmed === passwordRecord;
  };

  const completeOnboarding: CareStoreActions['completeOnboarding'] = (data) => {
    setParentName(data.parentName.trim());
    setParentEmail(data.email.trim());
    setChildName(data.childName.trim());
    setChildAge(data.age.trim());
    setRecoveryFocus(data.recovery.trim());
    setCareStage(data.careStage);
    setPrepGameEnabled(data.prepGameEnabled);
    setDidFinishOnboarding(true);
    setIsLoggedIn(true);
    setChildModeUnlocked(false);
  };

  const updateProfile: CareStoreActions['updateProfile'] = (data) => {
    setParentName(data.parentName.trim());
    setParentEmail(data.email.trim());
    setChildName(data.childName.trim());
    setChildAge(data.age.trim());
    setRecoveryFocus(data.recovery.trim());
  };

  const logOut = () => {
    setChildModeUnlocked(false);
    setIsLoggedIn(false);
  };

  const logIn = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const savedEmail = parentEmail.trim().toLowerCase();
    if (!cleanEmail || (savedEmail && cleanEmail !== savedEmail)) return false;
    if (!passwordMatches(password)) return false;
    setIsLoggedIn(true);
    setChildModeUnlocked(false);
    return true;
  };

  const beginNewAccount = () => {
    setChildModeUnlocked(false);
    setDidFinishOnboarding(false);
  };

  const openOnboardingFlow = () => {
    setDidFinishOnboarding(false);
  };

  const trailingLabelForDose = (dose: Dose): string => {
    if (dose.status === 'done') return 'Done';
    if (dose.status === 'due') return snoozed ? 'In 10m' : 'Now';
    return 'Later';
  };

  const value: CareStoreContextValue = {
    stars,
    cups,
    maxCups: MAX_CUPS,
    puppyGoal: PUPPY_GOAL,
    coldTreats,
    maxColdTreats: MAX_COLD_TREATS,
    restHelps,
    maxRest: MAX_REST,
    snoozed,
    puppyUnlocked,
    showPuppyCelebration,
    parentName,
    parentEmail,
    childName,
    bearName,
    childAge,
    recoveryFocus,
    careStage,
    prepGameEnabled,
    didFinishOnboarding,
    isLoggedIn,
    childModeUnlocked,
    wellness,
    passwordRecord,
    parentInstructions,
    doses,
    clearedStoryIDs,
    talkWithParentIDs,
    storyMissCounts,
    companionName,
    bearMood,
    heroDose,
    storyPages,
    prepPages,
    storyFinished,
    unlockedBadgeCount,
    childSummary,
    hasPassword: passwordRecord.length > 0,
    setShowPuppyCelebration,
    setChildModeUnlocked,
    setPrepGameEnabled,
    setCareStage,
    renameBear,
    tookMedicine,
    completeCareStep,
    snoozeDose,
    drinkCup,
    setCupCount,
    giveColdTreat,
    helpRest,
    missCareStep,
    addParentInstruction,
    updateParentInstruction,
    removeParentInstruction,
    loadSampleSteps,
    clearDemoInstructions,
    markStoryCleared,
    isStoryCleared,
    recordStoryMiss,
    storyMissCount,
    needsParentTalk,
    savePassword,
    passwordMatches,
    completeOnboarding,
    updateProfile,
    logOut,
    logIn,
    beginNewAccount,
    openOnboardingFlow,
    trailingLabelForDose,
  };

  return <CareStoreContext.Provider value={value}>{children}</CareStoreContext.Provider>;
};

export function useCareStore() {
  const ctx = useContext(CareStoreContext);
  if (!ctx) {
    throw new Error('useCareStore must be used inside CareStoreProvider');
  }
  return ctx;
}
