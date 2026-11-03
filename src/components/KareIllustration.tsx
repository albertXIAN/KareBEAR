/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Renders the teammate-created Kare bear illustrations
 * (Companion Heart Bear, Doctor/Teaching Bear, and Checklist Bear)
 * along with expression states and contextual scene badges.
 */

import React from 'react';
import {
  BEAR_ASSETS,
  type BearVariant,
  type KareExpression,
  type RecoverySceneProp,
  type StorySceneProp,
} from '../data/demoContent';

interface KareIllustrationProps {
  expression: KareExpression;
  sceneProp?: StorySceneProp | RecoverySceneProp;
  variant?: BearVariant;
  caption?: string;
  size?: 'md' | 'lg';
}

export const KareIllustration: React.FC<KareIllustrationProps> = ({
  expression,
  sceneProp,
  variant,
  caption,
  size = 'lg',
}) => {
  // Automatically select the best teammate bear illustration for the current scene if variant is not explicitly passed
  const resolvedVariant: BearVariant =
    variant ??
    (sceneProp === 'doctor-chart' ||
    sceneProp === 'xray-camera' ||
    sceneProp === 'keep-cast-dry' ||
    sceneProp === 'no-objects-inside' ||
    sceneProp === 'finger-warning-signs'
      ? 'doctor'
      : 'companion');

  const bearAsset = BEAR_ASSETS[resolvedVariant];

  const expressionBadge: Record<KareExpression, { text: string; icon: string }> = {
    waving: { text: 'Welcoming & Friendly', icon: '👋' },
    calm: { text: 'Calm & Reassuring', icon: '💛' },
    celebrating: { text: 'Celebrating with You!', icon: '🌟' },
    encouraging: { text: 'Encouraging & Supportive', icon: '🤝' },
  };

  const sceneLabelMap: Record<StorySceneProp | RecoverySceneProp, { label: string; icon: string }> = {
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
  const activeExpression = expressionBadge[expression];

  return (
    <figure
      className={`relative flex flex-col items-center justify-between rounded-2xl border-2 border-[#3A2E26]/15 bg-[#FFFDF8] p-4 shadow-xs ${
        size === 'lg' ? 'w-full min-h-[260px] lg:min-h-[320px]' : 'w-full min-h-[210px]'
      }`}
    >
      {/* Top Status & Context Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 w-full px-1 text-xs font-bold text-[#3A2E26]/85">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF8EC] border border-[#3A2E26]/15 px-2.5 py-1 text-[#1F6F6B]">
          <span aria-hidden="true">{activeExpression.icon}</span>
          <span>{activeExpression.text}</span>
        </span>

        {activeSceneBadge && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#DDF1EE]/70 border border-[#1F6F6B]/25 px-2.5 py-1 text-[#3A2E26]">
            <span aria-hidden="true">{activeSceneBadge.icon}</span>
            <span>{activeSceneBadge.label}</span>
          </span>
        )}
      </div>

      {/* Teammate Bear Artwork Container */}
      <div className="relative my-auto flex items-center justify-center w-full py-2">
        <div className="relative flex items-center justify-center rounded-2xl bg-white p-3 shadow-xs border border-[#3A2E26]/10">
          <img
            src={bearAsset.src}
            alt={`${bearAsset.alt} (${activeExpression.text})`}
            className="max-h-[220px] w-auto object-contain select-none"
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
