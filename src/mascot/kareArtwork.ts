/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareBEAR Master Mascot Kit — Artwork metadata, costume presets,
 * accessory resolution, and exported TypeScript types.
 */

export type KareMascotState =
  | 'idle'
  | 'waving'
  | 'listening'
  | 'speaking'
  | 'encouraging'
  | 'celebrating';

export type KareAccessory =
  | 'coat'
  | 'glasses'
  | 'clipboard'
  | 'headset'
  | 'cast';

export type KareCostumePreset =
  | 'neutral'
  | 'cast'
  | 'checklist'
  | 'doctor'
  | 'doctor-cast';

export type KareRenderMode = 'svg' | 'png-fallback';

export type KareAccessoryMap = Record<KareAccessory, boolean>;

export const ALL_KARE_STATES: readonly KareMascotState[] = [
  'idle',
  'waving',
  'listening',
  'speaking',
  'encouraging',
  'celebrating',
] as const;

export const ALL_KARE_ACCESSORIES: readonly KareAccessory[] = [
  'coat',
  'glasses',
  'clipboard',
  'headset',
  'cast',
] as const;

export const KARE_PRESET_ACCESSORIES: Record<
  KareCostumePreset,
  KareAccessoryMap
> = {
  neutral: {
    coat: false,
    glasses: false,
    clipboard: false,
    headset: false,
    cast: false,
  },
  cast: {
    coat: false,
    glasses: false,
    clipboard: false,
    headset: false,
    cast: true,
  },
  checklist: {
    coat: false,
    glasses: true,
    clipboard: true,
    headset: false,
    cast: false,
  },
  doctor: {
    coat: true,
    glasses: false,
    clipboard: false,
    headset: true,
    cast: false,
  },
  'doctor-cast': {
    coat: true,
    glasses: false,
    clipboard: false,
    headset: true,
    cast: true,
  },
};

export const KARE_REFERENCE_ASSETS = {
  masterSvg: '/assets/kare-master.svg',
  neutralPng: '/references/kare-neutral.png',
  checklistPng: '/references/kare-checklist.png',
  doctorPng: '/references/kare-doctor.png',
} as const;

export const KARE_STATE_LABELS: Record<
  KareMascotState,
  { badgeText: string; description: string }
> = {
  idle: {
    badgeText: 'Calm & Ready',
    description: 'Calm seated posture during ordinary lesson display.',
  },
  waving: {
    badgeText: 'Welcoming Wave',
    description: 'Brief friendly greeting wave that returns to idle.',
  },
  listening: {
    badgeText: 'Listening to You',
    description: 'Attentive head tilt while microphone capture is active.',
  },
  speaking: {
    badgeText: 'Speaking with You',
    description: 'Animated mouth rhythm while narration or voice audio plays.',
  },
  encouraging: {
    badgeText: 'Encouraging & Supportive',
    description: 'Warm, reassuring nod during retry or supportive feedback.',
  },
  celebrating: {
    badgeText: 'Celebrating Together!',
    description: 'Cheerful uplift after completing a check or journey.',
  },
};

/**
 * Resolves a complete accessory map from an optional preset and optional
 * accessory list or partial map overrides.
 */
export function resolveKareAccessories(
  preset: KareCostumePreset = 'neutral',
  accessories?: Partial<KareAccessoryMap> | readonly KareAccessory[]
): KareAccessoryMap {
  const base: KareAccessoryMap = {
    ...KARE_PRESET_ACCESSORIES[preset],
  };

  if (!accessories) {
    return base;
  }

  if (Array.isArray(accessories)) {
    const list = accessories as readonly KareAccessory[];
    for (const acc of list) {
      if (acc in base) {
        base[acc] = true;
      }
    }
    return base;
  }

  const overrideMap = accessories as Partial<KareAccessoryMap>;
  for (const key of ALL_KARE_ACCESSORIES) {
    if (typeof overrideMap[key] === 'boolean') {
      base[key] = Boolean(overrideMap[key]);
    }
  }

  return base;
}

/**
 * Clamps mouthOpen to the valid [0, 1] range.
 */
export function clampMouthOpen(value: number | undefined | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return Number(value.toFixed(3));
}
