/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareIllustration — Renders the single reusable KareMascot component
 * with contextual costume presets (coat, glasses, clipboard, headset, cast)
 * and real-time state from the app-owned MascotRuntimeContext arbiter.
 */

import React from 'react';
import {
  type BearVariant,
  type KareExpression,
  type RecoverySceneProp,
  type StorySceneProp,
} from '../data/demoContent';
import { KareMascot } from '../mascot/KareMascot';
import {
  KARE_STATE_LABELS,
  type KareAccessory,
  type KareCostumePreset,
  type KareMascotState,
} from '../mascot/kareArtwork';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';

interface KareIllustrationProps {
  expression: KareExpression;
  sceneProp?: StorySceneProp | RecoverySceneProp;
  variant?: BearVariant;
  caption?: string;
  size?: 'md' | 'lg';
  /** Optional explicit state override for isolated preview cards. */
  stateOverride?: KareMascotState;
}

export const KareIllustration: React.FC<KareIllustrationProps> = ({
  expression,
  sceneProp,
  variant,
  caption,
  size = 'lg',
  stateOverride,
}) => {
  const { resolvedState, liveMouthOpen, renderMode } = useMascotRuntime();

  const activeState: KareMascotState = stateOverride ?? resolvedState;

  // Map variant + sceneProp to seated costume preset and accessory overlays on the same base bear
  const resolvedVariant: BearVariant =
    variant ??
    (sceneProp === 'doctor-chart' ||
    sceneProp === 'xray-camera' ||
    sceneProp === 'keep-cast-dry' ||
    sceneProp === 'no-objects-inside' ||
    sceneProp === 'finger-warning-signs'
      ? 'doctor'
      : 'companion');

  const hasCastInScene =
    sceneProp === 'cast-wrap' ||
    sceneProp === 'going-home' ||
    sceneProp === 'keep-cast-dry' ||
    sceneProp === 'no-objects-inside' ||
    sceneProp === 'finger-warning-signs';

  let preset: KareCostumePreset = 'neutral';
  const extraAccessories: KareAccessory[] = [];

  if (resolvedVariant === 'checklist') {
    preset = 'checklist';
    if (hasCastInScene) {
      extraAccessories.push('cast');
    }
  } else if (resolvedVariant === 'doctor') {
    preset = hasCastInScene ? 'doctor-cast' : 'doctor';
  } else {
    preset = hasCastInScene ? 'cast' : 'neutral';
  }

  const stateBadgeMap: Record<KareMascotState, { text: string; icon: string }> = {
    idle: {
      text:
        expression === 'encouraging'
          ? 'Encouraging & Supportive'
          : KARE_STATE_LABELS.idle.badgeText,
      icon: '💛',
    },
    waving: { text: 'Welcoming & Friendly', icon: '👋' },
    listening: { text: 'Listening to You', icon: '🎙️' },
    speaking: { text: 'Speaking with You', icon: '🔊' },
    encouraging: { text: 'Encouraging & Supportive', icon: '🤝' },
    celebrating: { text: 'Celebrating with You!', icon: '🌟' },
  };

  const sceneLabelMap: Record<
    StorySceneProp | RecoverySceneProp,
    { label: string; icon: string }
  > = {
    'reception-wristband': { label: 'Hospital Check-In & Wristband', icon: '🏷️' },
    'xray-camera': { label: 'Bone Picture (X-Ray)', icon: '📷' },
    'doctor-chart': { label: 'Talking with the Doctor', icon: '🩺' },
    'cast-wrap': { label: 'Soft Layer & Cast Wrap', icon: '🩹' },
    'going-home': { label: 'Ready for Home Care', icon: '🏠' },
    'keep-cast-dry': { label: 'Keep Cast Dry', icon: '☔' },
    'no-objects-inside': { label: 'Nothing Inside the Cast', icon: '🚫✏️' },
    'finger-warning-signs': { label: 'Check Fingers & Tell a Grown-Up', icon: '🖐️' },
  };

  const activeSceneBadge = sceneProp ? sceneLabelMap[sceneProp] : null;
  const activeBadge = stateBadgeMap[activeState];

  const accessibleLabel = `Kare the honey-brown bear (${activeBadge.text}${
    activeSceneBadge ? `, ${activeSceneBadge.label}` : ''
  })`;

  return (
    <figure
      className={`relative flex flex-col items-center justify-between rounded-2xl border-2 border-[#3A2E26]/15 bg-[#FFFDF8] p-4 shadow-xs ${
        size === 'lg'
          ? 'w-full min-h-[260px] lg:min-h-[320px]'
          : 'w-full min-h-[210px]'
      }`}
    >
      {/* Top Status & Context Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 w-full px-1 text-xs font-bold text-[#3A2E26]/85">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF8EC] border border-[#3A2E26]/15 px-2.5 py-1 text-[#1F6F6B]">
          <span aria-hidden="true">{activeBadge.icon}</span>
          <span>{activeBadge.text}</span>
        </span>

        {activeSceneBadge && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#DDF1EE]/70 border border-[#1F6F6B]/25 px-2.5 py-1 text-[#3A2E26]">
            <span aria-hidden="true">{activeSceneBadge.icon}</span>
            <span>{activeSceneBadge.label}</span>
          </span>
        )}
      </div>

      {/* Reusable Layered Vector Mascot Container */}
      <div className="relative my-auto flex items-center justify-center w-full py-2">
        <div className="relative flex items-center justify-center rounded-2xl bg-white p-3 shadow-xs border border-[#3A2E26]/10">
          <KareMascot
            state={activeState}
            preset={preset}
            accessories={
              extraAccessories.length > 0 ? extraAccessories : undefined
            }
            mouthOpen={liveMouthOpen}
            renderMode={renderMode}
            size={size}
            label={accessibleLabel}
          />
        </div>
      </div>

      {caption && (
        <figcaption className="mt-2 text-center text-sm font-semibold text-[#3A2E26]/90">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
