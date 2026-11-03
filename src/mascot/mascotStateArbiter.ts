/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App-owned mascot state arbiter for KareBEAR.
 *
 * Priority rule:
 *   speaking > listening > one short explicit gesture ('waving' | 'encouraging' | 'celebrating') > idle
 *
 * Connection attempts, loading spinners, or permission prompts never trigger
 * 'speaking' or 'listening'.
 */

import type { KareMascotState } from './kareArtwork';

export type KareTransientGesture = 'waving' | 'encouraging' | 'celebrating';

export interface MascotArbiterInput {
  /** True only when browser speechSynthesis or Gemini Live audio is actively playing. */
  isSpeakingAudioPlaying: boolean;
  /** True only when microphone permission is granted and user capture is actively listening/recording. */
  isMicrophoneListening: boolean;
  /** Optional short transient gesture ('waving', 'encouraging', 'celebrating') with automatic expiry. */
  activeGesture?: KareTransientGesture | null;
}

/**
 * Resolves the active KareMascotState according to strict presentation priority:
 * speaking > listening > one short explicit gesture > idle
 */
export function resolveMascotState(input: MascotArbiterInput): KareMascotState {
  if (input.isSpeakingAudioPlaying) {
    return 'speaking';
  }
  if (input.isMicrophoneListening) {
    return 'listening';
  }
  if (
    input.activeGesture === 'waving' ||
    input.activeGesture === 'encouraging' ||
    input.activeGesture === 'celebrating'
  ) {
    return input.activeGesture;
  }
  return 'idle';
}

/**
 * Computes normalized mouth opening (0 to 1) from a raw PCM16 or Float32 RMS amplitude.
 */
export function rmsToMouthOpen(rms: number): number {
  if (!Number.isFinite(rms) || rms <= 0.008) {
    return 0;
  }
  // Map typical speech RMS (0.01 .. 0.22) smoothly into [0.12 .. 1.0]
  const normalized = Math.min(1, Math.max(0.12, (rms - 0.008) / 0.18));
  return Number(normalized.toFixed(3));
}
