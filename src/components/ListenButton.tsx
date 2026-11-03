/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accessible "Listen" button using browser speechSynthesis API when available.
 * Automatically hidden if speechSynthesis is unsupported or disabled by caregiver preference.
 */

import React, { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { UI_COPY } from '../data/demoContent';

interface ListenButtonProps {
  textToRead: string;
  enabledByCaregiver?: boolean;
}

export const ListenButton: React.FC<ListenButtonProps> = ({
  textToRead,
  enabledByCaregiver = true,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech when text changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [textToRead]);

  if (!isSupported || !enabledByCaregiver) {
    return null;
  }

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-CA';
      utterance.rate = 0.92;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
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
