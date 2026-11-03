/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accessible "Listen" button using browser speechSynthesis API when available.
 * Connected to the app-owned MascotRuntimeContext so Kare enters the 'speaking'
 * state only while narration is actively playing and returns cleanly when
 * paused, ended, cancelled, or on error/unmount.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { UI_COPY } from '../data/demoContent';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';

interface ListenButtonProps {
  textToRead: string;
  enabledByCaregiver?: boolean;
}

export const ListenButton: React.FC<ListenButtonProps> = ({
  textToRead,
  enabledByCaregiver = true,
}) => {
  const { setNarrationSpeaking } = useMascotRuntime();
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const stopSpeechCleanly = () => {
    clearFallbackTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
    setNarrationSpeaking(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
    return () => {
      stopSpeechCleanly();
    };
  }, []);

  // Stop speech when text changes (e.g., page navigation)
  useEffect(() => {
    stopSpeechCleanly();
  }, [textToRead]);

  if (!isSupported || !enabledByCaregiver) {
    return null;
  }

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stopSpeechCleanly();
      return;
    }

    try {
      clearFallbackTimer();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-CA';
      utterance.rate = 0.92;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setNarrationSpeaking(true);
      };
      utterance.onpause = () => {
        setIsSpeaking(false);
        setNarrationSpeaking(false);
      };
      utterance.onresume = () => {
        setIsSpeaking(true);
        setNarrationSpeaking(true);
      };
      utterance.onend = () => {
        clearFallbackTimer();
        setIsSpeaking(false);
        setNarrationSpeaking(false);
      };
      utterance.onerror = () => {
        clearFallbackTimer();
        setIsSpeaking(false);
        setNarrationSpeaking(false);
      };

      setIsSpeaking(true);
      setNarrationSpeaking(true);
      window.speechSynthesis.speak(utterance);

      // Safety bounded duration in case the browser speech engine lacks audio output devices
      const estimatedMs = Math.min(
        18000,
        Math.max(2800, textToRead.split(/\s+/).length * 360)
      );
      fallbackTimerRef.current = window.setTimeout(() => {
        setIsSpeaking(false);
        setNarrationSpeaking(false);
        fallbackTimerRef.current = null;
      }, estimatedMs);
    } catch {
      stopSpeechCleanly();
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleSpeech}
      aria-pressed={isSpeaking}
      className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#1F6F6B] bg-[#FFFDF8] px-5 py-3 text-lg font-bold text-[#1F6F6B] transition-colors hover:bg-[#DDF1EE] active:bg-[#DDF1EE] whitespace-nowrap shrink-0 cursor-pointer"
    >
      {isSpeaking ? (
        <>
          <Square className="h-5 w-5 fill-current shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.stopListeningButton}</span>
        </>
      ) : (
        <>
          <Volume2 className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.listenButton}</span>
        </>
      )}
    </button>
  );
};
