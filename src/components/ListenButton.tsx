/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accessible "Listen / Stop" button using Gemini TTS (/api/tts with 'Kore' voice
 * and exact text+language+voice+version caching) with automatic fallback to browser
 * speechSynthesis ('en-CA' / 'fr-CA') when offline or unavailable.
 *
 * Connected to the app-owned MascotRuntimeContext so Kare enters the 'speaking'
 * state only while narration is actively playing and returns cleanly when
 * paused, ended, cancelled, or on error/unmount.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Square, Volume2 } from 'lucide-react';
import { UI_COPY } from '../data/demoContent';
import { SURGERY_UI_COPY } from '../data/surgeryContent';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';
import type { AppLanguage } from '../utils/surgeryDataModel';

interface ListenButtonProps {
  textToRead: string;
  enabledByCaregiver?: boolean;
  language?: AppLanguage;
  contentVersion?: number | string;
}

// Client-side session cache keyed by exact (textToRead | language | voice | contentVersion)
const clientTtsDataUrlCache = new Map<string, string>();

export const ListenButton: React.FC<ListenButtonProps> = ({
  textToRead,
  enabledByCaregiver = true,
  language = 'en',
  contentVersion = 1,
}) => {
  const { setNarrationSpeaking } = useMascotRuntime();
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const stopSpeechCleanly = () => {
    clearFallbackTimer();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsLoading(false);
    setIsSpeaking(false);
    setNarrationSpeaking(false);
  };

  useEffect(() => {
    return () => {
      stopSpeechCleanly();
    };
  }, []);

  // Stop speech when text or language changes (e.g., page navigation)
  useEffect(() => {
    stopSpeechCleanly();
  }, [textToRead, language, contentVersion]);

  if (!enabledByCaregiver) {
    return null;
  }

  const playBrowserSpeechFallback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      stopSpeechCleanly();
      return;
    }

    try {
      clearFallbackTimer();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = language === 'fr' ? 'fr-CA' : 'en-CA';
      utterance.rate = 0.92;

      utterance.onstart = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        setNarrationSpeaking(true, 0.55);
      };
      utterance.onpause = () => {
        setIsSpeaking(false);
        setNarrationSpeaking(false);
      };
      utterance.onresume = () => {
        setIsSpeaking(true);
        setNarrationSpeaking(true, 0.55);
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

      setIsLoading(false);
      setIsSpeaking(true);
      setNarrationSpeaking(true, 0.55);
      window.speechSynthesis.speak(utterance);

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

  const playHtmlAudioDataUrl = (dataUrl: string) => {
    try {
      const audio = new Audio(dataUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        setNarrationSpeaking(true, 0.65);
      };
      audio.onended = () => {
        clearFallbackTimer();
        setIsSpeaking(false);
        setNarrationSpeaking(false);
        audioRef.current = null;
      };
      audio.onpause = () => {
        if (!audio.ended) {
          setIsSpeaking(false);
          setNarrationSpeaking(false);
        }
      };
      audio.onerror = () => {
        audioRef.current = null;
        playBrowserSpeechFallback();
      };

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          audioRef.current = null;
          playBrowserSpeechFallback();
        });
      }
    } catch {
      playBrowserSpeechFallback();
    }
  };

  const handleToggleSpeech = async () => {
    if (isSpeaking || isLoading) {
      stopSpeechCleanly();
      return;
    }

    const cacheKey = `${textToRead.trim()}|${language}|Kore|${contentVersion}`;
    const cachedDataUrl = clientTtsDataUrlCache.get(cacheKey);
    if (cachedDataUrl) {
      playHtmlAudioDataUrl(cachedDataUrl);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToRead,
          language,
          voice: 'Kore',
          version: contentVersion,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        playBrowserSpeechFallback();
        return;
      }

      const data = (await response.json()) as {
        audioBase64?: string;
        mimeType?: string;
        fallbackToBrowserTts?: boolean;
      };

      if (data.audioBase64 && !data.fallbackToBrowserTts) {
        const mime = data.mimeType || 'audio/wav';
        const dataUrl = `data:${mime};base64,${data.audioBase64}`;
        clientTtsDataUrlCache.set(cacheKey, dataUrl);
        playHtmlAudioDataUrl(dataUrl);
      } else {
        playBrowserSpeechFallback();
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      playBrowserSpeechFallback();
    }
  };

  const listenLabel =
    language === 'fr'
      ? SURGERY_UI_COPY.fr.preOpHub.listen
      : UI_COPY.story.listenButton;
  const stopLabel =
    language === 'fr'
      ? SURGERY_UI_COPY.fr.preOpHub.stop
      : UI_COPY.story.stopListeningButton;
  const loadingLabel =
    language === 'fr'
      ? SURGERY_UI_COPY.fr.preOpHub.loadingAudio
      : SURGERY_UI_COPY.en.preOpHub.loadingAudio;

  return (
    <button
      type="button"
      onClick={handleToggleSpeech}
      aria-pressed={isSpeaking}
      className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#1F6F6B] bg-[#FFFDF8] px-5 py-3 text-lg font-bold text-[#1F6F6B] transition-colors hover:bg-[#DDF1EE] active:bg-[#DDF1EE] whitespace-nowrap shrink-0 cursor-pointer"
    >
      {isLoading ? (
        <>
          <Loader2
            className="h-5 w-5 animate-spin shrink-0"
            aria-hidden="true"
          />
          <span>{loadingLabel}</span>
        </>
      ) : isSpeaking ? (
        <>
          <Square
            className="h-5 w-5 fill-current shrink-0"
            aria-hidden="true"
          />
          <span>{stopLabel}</span>
        </>
      ) : (
        <>
          <Volume2 className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{listenLabel}</span>
        </>
      )}
    </button>
  );
};
