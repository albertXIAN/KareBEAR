/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accessible optional face selector for Feelings (S3) and Enjoyment (S3/S8).
 * Selection is always optional, never blocks progress, and uses icon + text + border.
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface FaceOptionItem {
  id: string;
  label: string;
  faceType: 'worried' | 'little-worried' | 'ready' | 'not-really' | 'ok' | 'yes';
}

interface FaceSelectorProps {
  question: string;
  optionalNote?: string;
  options: FaceOptionItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  groupName: string;
}

export const FaceSelector: React.FC<FaceSelectorProps> = ({
  question,
  optionalNote = 'Optional — you do not have to pick one to continue.',
  options,
  selectedId,
  onSelect,
  groupName,
}) => {
  const renderFaceSvg = (faceType: FaceOptionItem['faceType']) => {
    return (
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="h-14 w-14 shrink-0"
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="#FFF8EC"
          stroke="#3A2E26"
          strokeWidth="3.5"
        />
        {/* Eyes */}
        <circle cx="22" cy="26" r="3.5" fill="#3A2E26" />
        <circle cx="42" cy="26" r="3.5" fill="#3A2E26" />

        {/* Eyebrows & Mouth by faceType */}
        {(faceType === 'worried' || faceType === 'not-really') && (
          <>
            <path d="M16 19 L25 22" stroke="#3A2E26" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M48 19 L39 22" stroke="#3A2E26" strokeWidth="2.8" strokeLinecap="round" />
            <path
              d="M21 44 Q32 36 43 44"
              fill="none"
              stroke="#3A2E26"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </>
        )}

        {(faceType === 'little-worried' || faceType === 'ok') && (
          <>
            <path d="M17 19 L25 19" stroke="#3A2E26" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M39 19 L47 19" stroke="#3A2E26" strokeWidth="2.8" strokeLinecap="round" />
            <path
              d="M22 41 L42 41"
              fill="none"
              stroke="#3A2E26"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </>
        )}

        {(faceType === 'ready' || faceType === 'yes') && (
          <>
            <path d="M17 20 Q21 16 26 20" fill="none" stroke="#3A2E26" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M38 20 Q43 16 47 20" fill="none" stroke="#3A2E26" strokeWidth="2.8" strokeLinecap="round" />
            <path
              d="M20 37 Q32 49 44 37"
              fill="none"
              stroke="#3A2E26"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    );
  };

  return (
    <fieldset className="rounded-2xl border-2 border-[#3A2E26]/15 bg-[#FFFDF8] p-5">
      <legend className="px-2 font-child text-[22px] font-bold text-[#1F6F6B]">
        {question}
      </legend>
      <p className="mb-4 text-base text-[#3A2E26]/80">{optionalNote}</p>

      <div
        role="group"
        aria-label={groupName}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : option.id)}
              aria-pressed={isSelected}
              className={`relative flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-center transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#1F6F6B] bg-[#DDF1EE] text-[#3A2E26] shadow-xs'
                  : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#FFFDF8]'
              }`}
            >
              {isSelected && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1F6F6B]">
                  <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                  <span>Selected</span>
                </span>
              )}
              {renderFaceSvg(option.faceType)}
              <span className="font-child text-[20px] font-bold leading-snug text-[#3A2E26]">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
