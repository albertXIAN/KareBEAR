/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MascotRuntimeContext — Single app-owned state arbiter connecting real
 * narration, Gemini Live voice playback, microphone capture, and transient
 * UI gestures to KareMascot across the application.
 *
 * Enforces priority:
 *   speaking > listening > one short explicit gesture ('waving' | 'encouraging' | 'celebrating') > idle
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KareMascotState, KareRenderMode } from './kareArtwork';
import {
  resolveMascotState,
  type KareTransientGesture,
} from './mascotStateArbiter';

interface MascotRuntimeContextValue {
  /** Resolved state after applying priority (speaking > listening > gesture > idle). */
  resolvedState: KareMascotState;
  /** Alias for resolvedState used by Pre-Op and Post-Op screens. */
  mascotState: KareMascotState;
  /** True only while browser narration or model audio is actively playing. */
  isSpeakingAudioPlaying: boolean;
  /** Alias for isSpeakingAudioPlaying. */
  isSpeaking: boolean;
  /** True only while microphone permission is granted and capture is active. */
  isMicrophoneListening: boolean;
  /** Active transient gesture, if any. */
  activeGesture: KareTransientGesture | null;
  /** Optional dynamic mouthOpen (0..1) driven by live audio amplitude when available. */
  liveMouthOpen: number | undefined;
  /** Alias for liveMouthOpen. */
  mouthOpen: number | undefined;
  /** App-wide render mode ('svg' default or 'png-fallback'). */
  renderMode: KareRenderMode;
  setRenderMode: (mode: KareRenderMode) => void;
  /** Set browser narration speaking state (from ListenButton). */
  setNarrationSpeaking: (speaking: boolean, mouthOpen?: number) => void;
  /** Set model voice audio speaking state + optional amplitude mouthOpen (0..1). */
  setModelAudioSpeaking: (speaking: boolean, mouthOpen?: number) => void;
  /** Set microphone listening state (only after permission granted & capture active). */
  setMicrophoneListening: (listening: boolean) => void;
  /** Alias for setMicrophoneListening. */
  setListening: (listening: boolean) => void;
  /** Trigger a short gesture ('waving', 'encouraging', 'celebrating') that auto-returns to idle. */
  triggerTransientGesture: (
    gesture: KareTransientGesture,
    durationMs?: number
  ) => void;
  /** Stop any active speech synthesis, clear listening/speaking flags, and optionally trigger a gesture. */
  stopAllMascotMedia: (nextGesture?: KareTransientGesture | null) => void;
}

const MascotRuntimeContext = createContext<MascotRuntimeContextValue | null>(
  null
);

export const MascotRuntimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isNarrationSpeaking, setIsNarrationSpeaking] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [liveMouthOpen, setLiveMouthOpen] = useState<number | undefined>(
    undefined
  );
  const [isMicrophoneListening, setIsMicrophoneListening] = useState(false);
  const [activeGesture, setActiveGesture] =
    useState<KareTransientGesture | null>('waving');
  const [renderMode, setRenderMode] = useState<KareRenderMode>('svg');

  const gestureTimerRef = useRef<number | null>(null);

  const clearGestureTimer = useCallback(() => {
    if (gestureTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = null;
    }
  }, []);

  const triggerTransientGesture = useCallback(
    (gesture: KareTransientGesture, durationMs = 2400) => {
      clearGestureTimer();
      setActiveGesture(gesture);
      if (typeof window !== 'undefined') {
        gestureTimerRef.current = window.setTimeout(() => {
          setActiveGesture(null);
          gestureTimerRef.current = null;
        }, durationMs);
      }
    },
    [clearGestureTimer]
  );

  // Initial greeting wave on mount automatically returns to idle
  useEffect(() => {
    triggerTransientGesture('waving', 2400);
    return () => {
      clearGestureTimer();
    };
  }, [triggerTransientGesture, clearGestureTimer]);

  const setNarrationSpeaking = useCallback(
    (speaking: boolean, mouthOpen?: number) => {
      setIsNarrationSpeaking(speaking);
      setLiveMouthOpen(speaking ? mouthOpen : undefined);
    },
    []
  );

  const setModelAudioSpeaking = useCallback(
    (speaking: boolean, mouthOpen?: number) => {
      setIsModelSpeaking(speaking);
      setLiveMouthOpen(speaking ? mouthOpen : undefined);
    },
    []
  );

  const setMicrophoneListening = useCallback((listening: boolean) => {
    setIsMicrophoneListening(listening);
  }, []);

  const stopAllMascotMedia = useCallback(
    (nextGesture: KareTransientGesture | null = null) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setIsNarrationSpeaking(false);
      setIsModelSpeaking(false);
      setLiveMouthOpen(undefined);
      setIsMicrophoneListening(false);
      clearGestureTimer();
      if (nextGesture) {
        triggerTransientGesture(nextGesture, 2200);
      } else {
        setActiveGesture(null);
      }
    },
    [clearGestureTimer, triggerTransientGesture]
  );

  const isSpeakingAudioPlaying = isNarrationSpeaking || isModelSpeaking;

  const resolvedState = useMemo(
    () =>
      resolveMascotState({
        isSpeakingAudioPlaying,
        isMicrophoneListening,
        activeGesture,
      }),
    [isSpeakingAudioPlaying, isMicrophoneListening, activeGesture]
  );

  const value = useMemo<MascotRuntimeContextValue>(
    () => ({
      resolvedState,
      mascotState: resolvedState,
      isSpeakingAudioPlaying,
      isSpeaking: isSpeakingAudioPlaying,
      isMicrophoneListening,
      activeGesture,
      liveMouthOpen,
      mouthOpen: liveMouthOpen,
      renderMode,
      setRenderMode,
      setNarrationSpeaking,
      setModelAudioSpeaking,
      setMicrophoneListening,
      setListening: setMicrophoneListening,
      triggerTransientGesture,
      stopAllMascotMedia,
    }),
    [
      resolvedState,
      isSpeakingAudioPlaying,
      isMicrophoneListening,
      activeGesture,
      liveMouthOpen,
      renderMode,
      setNarrationSpeaking,
      setModelAudioSpeaking,
      setMicrophoneListening,
      triggerTransientGesture,
      stopAllMascotMedia,
    ]
  );

  return (
    <MascotRuntimeContext.Provider value={value}>
      {children}
    </MascotRuntimeContext.Provider>
  );
};

export function useMascotRuntime(): MascotRuntimeContextValue {
  const ctx = useContext(MascotRuntimeContext);
  if (!ctx) {
    // Safe fallback if rendered outside provider in isolated unit tests
    return {
      resolvedState: 'idle',
      mascotState: 'idle',
      isSpeakingAudioPlaying: false,
      isSpeaking: false,
      isMicrophoneListening: false,
      activeGesture: null,
      liveMouthOpen: undefined,
      mouthOpen: undefined,
      renderMode: 'svg',
      setRenderMode: () => {},
      setNarrationSpeaking: () => {},
      setModelAudioSpeaking: () => {},
      setMicrophoneListening: () => {},
      setListening: () => {},
      triggerTransientGesture: () => {},
      stopAllMascotMedia: () => {},
    };
  }
  return ctx;
}
