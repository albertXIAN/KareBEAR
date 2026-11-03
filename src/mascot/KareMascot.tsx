/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareMascot — Reusable layered vector mascot component reconstructed from
 * the canonical seated honey-brown bear (kare-master.svg).
 *
 * Supports:
 * - Six states: 'idle' | 'waving' | 'listening' | 'speaking' | 'encouraging' | 'celebrating'
 * - Five overlays on the same seated base: 'coat' | 'glasses' | 'clipboard' | 'headset' | 'cast'
 * - Externally controlled mouthOpen (0..1) or illustrative speaking rhythm while state === 'speaking'
 * - Full prefers-reduced-motion compliance and screen-reader accessibility
 * - Optional static PNG fallback mode ('png-fallback')
 */

import React, { useEffect, useState } from 'react';
import {
  clampMouthOpen,
  KARE_REFERENCE_ASSETS,
  resolveKareAccessories,
  type KareAccessory,
  type KareAccessoryMap,
  type KareCostumePreset,
  type KareMascotState,
  type KareRenderMode,
} from './kareArtwork';
import './kare-mascot.css';

export interface KareMascotProps {
  /** Active behavioural state (defaults to 'idle'). */
  state?: KareMascotState;
  /** Named costume preset ('neutral', 'cast', 'checklist', 'doctor', 'doctor-cast'). */
  preset?: KareCostumePreset;
  /** Individual accessory overrides or list of enabled accessories. */
  accessories?: Partial<KareAccessoryMap> | readonly KareAccessory[];
  /**
   * Mouth opening between 0 (closed) and 1 (fully open).
   * When omitted and state === 'speaking', an illustrative speaking rhythm is used
   * only while audio/speech is active.
   */
  mouthOpen?: number;
  /** Optional explicit speaking flag when driven by audio playback. */
  speaking?: boolean;
  /** Accessible label for screen readers. Omit or set decorative=true when decorative. */
  label?: string;
  /** Marks the mascot as decorative (aria-hidden="true"). */
  decorative?: boolean;
  /** Size preset for layout containers. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Optional override for prefers-reduced-motion. */
  reducedMotion?: boolean;
  /** 'svg' (default layered vector reconstruction) or 'png-fallback' (original neutral PNG). */
  renderMode?: KareRenderMode;
  /** Additional wrapper className. */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<KareMascotProps['size']>, string> = {
  xs: 'w-10 h-11',
  sm: 'w-24 h-26',
  md: 'w-44 h-48',
  lg: 'w-56 h-60 sm:w-64 sm:h-68',
};

export const KareMascot: React.FC<KareMascotProps> = ({
  state = 'idle',
  preset = 'neutral',
  accessories,
  mouthOpen,
  label,
  decorative = false,
  size = 'lg',
  reducedMotion: reducedMotionOverride,
  renderMode = 'svg',
  className = '',
}) => {
  const [osReducedMotion, setOsReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [rhythmMouthOpen, setRhythmMouthOpen] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setOsReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isReducedMotion =
    typeof reducedMotionOverride === 'boolean'
      ? reducedMotionOverride
      : osReducedMotion;

  // Illustrative speaking rhythm ONLY when state === 'speaking' and mouthOpen is not manually provided
  useEffect(() => {
    if (typeof mouthOpen === 'number' || state !== 'speaking') {
      setRhythmMouthOpen(0);
      return;
    }

    if (isReducedMotion) {
      // Static gentle open mouth during speaking when reduced motion is preferred
      setRhythmMouthOpen(0.55);
      return;
    }

    const pattern = [0.25, 0.72, 0.35, 0.88, 0.18, 0.64, 0.08, 0.78];
    let stepIndex = 0;
    setRhythmMouthOpen(pattern[0]);

    const intervalId = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % pattern.length;
      setRhythmMouthOpen(pattern[stepIndex]);
    }, 135);

    return () => {
      window.clearInterval(intervalId);
      setRhythmMouthOpen(0);
    };
  }, [state, mouthOpen, isReducedMotion]);

  const effectiveMouthOpen =
    typeof mouthOpen === 'number'
      ? clampMouthOpen(mouthOpen)
      : state === 'speaking'
      ? clampMouthOpen(rhythmMouthOpen)
      : 0;

  const isMouthOpenVisible = effectiveMouthOpen > 0.04;
  const mouthScaleY = Number((0.28 + effectiveMouthOpen * 0.72).toFixed(3));

  const resolvedAcc = resolveKareAccessories(preset, accessories);
  const isDecorative = decorative || !label;

  if (renderMode === 'png-fallback') {
    return (
      <div
        role={isDecorative ? undefined : 'img'}
        aria-label={isDecorative ? undefined : label}
        aria-hidden={isDecorative ? 'true' : undefined}
        data-state={state}
        data-render-mode="png-fallback"
        data-reduced-motion={isReducedMotion ? 'true' : 'false'}
        className={`kare-mascot-root ${SIZE_CLASSES[size]} ${className}`.trim()}
      >
        <img
          src={KARE_REFERENCE_ASSETS.neutralPng}
          alt={isDecorative ? '' : label ?? 'Kare the bear'}
          className="h-full w-full object-contain select-none"
        />
      </div>
    );
  }

  return (
    <div
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : label}
      aria-hidden={isDecorative ? 'true' : undefined}
      data-state={state}
      data-preset={preset}
      data-render-mode="svg"
      data-mouth-open={effectiveMouthOpen}
      data-reduced-motion={isReducedMotion ? 'true' : 'false'}
      className={`kare-mascot-root ${SIZE_CLASSES[size]} ${className}`.trim()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 660"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="kare-mascot-svg"
      >
        <g
          data-part="float"
          stroke="#563820"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* TORSO / BODY */}
          <g data-part="body">
            <path
              d="M218 318C181 337 164 393 169 460L178 537C184 578 226 599 300 599C374 599 416 578 422 537L431 460C436 393 419 337 382 318Z"
              fill="#B78046"
            />
            <path
              d="M222 350C197 380 192 427 198 477C204 531 238 559 300 562C362 559 396 531 402 477C408 427 403 380 378 350C358 366 242 366 222 350Z"
              fill="#C58D50"
              stroke="none"
            />
            <ellipse
              cx="300"
              cy="458"
              rx="91"
              ry="116"
              fill="#E6B87F"
              stroke="#A46B38"
              strokeWidth="5"
            />
            <path
              d="M244 402C259 382 278 375 299 375C320 375 341 383 355 402"
              stroke="#F2CE9B"
              strokeWidth="7"
              opacity=".65"
            />
            <g data-part="heart">
              <path
                d="M300 457C285 447 266 433 266 417C266 397 290 393 300 410C310 393 334 397 334 417C334 433 315 447 300 457Z"
                fill="#CC594C"
                stroke="#92503B"
                strokeWidth="5"
              />
              <path
                d="M276 414C277 407 285 407 289 412"
                stroke="#ED8C77"
                strokeWidth="4"
              />
            </g>

            {/* ACCESSORY: DOCTOR COAT & STETHOSCOPE (TORSO) */}
            {resolvedAcc.coat && (
              <g data-accessory="coat">
                <path
                  d="M218 334L261 357L279 449L278 564L205 560C184 525 183 455 188 398Z"
                  fill="#FAFAF4"
                />
                <path
                  d="M382 334L339 357L321 449L322 564L395 560C416 525 417 455 412 398Z"
                  fill="#FAFAF4"
                />
                <path
                  d="M237 346L257 384L239 407L278 449M363 346L343 384L361 407L322 449"
                  stroke="#B5B4A9"
                  strokeWidth="5"
                />
                <path
                  d="M219 465H253V503H219ZM347 465H381V503H347Z"
                  fill="#E6F0ED"
                  strokeWidth="4"
                />
                <path
                  d="M243 374V421C243 446 271 447 280 424M357 374V421C357 445 329 447 320 424"
                  stroke="#415C5A"
                  strokeWidth="8"
                />
                <circle
                  cx="280"
                  cy="425"
                  r="10"
                  fill="#BFD4D0"
                  stroke="#415C5A"
                  strokeWidth="5"
                />
                <circle
                  cx="320"
                  cy="425"
                  r="10"
                  fill="#BFD4D0"
                  stroke="#415C5A"
                  strokeWidth="5"
                />
              </g>
            )}
          </g>

          {/* SEATED FEET */}
          <g data-part="left-foot">
            <ellipse
              cx="185"
              cy="565"
              rx="67"
              ry="70"
              transform="rotate(-18 185 565)"
              fill="#B78046"
            />
            <ellipse
              cx="186"
              cy="578"
              rx="35"
              ry="40"
              transform="rotate(-18 186 578)"
              fill="#E9BD8A"
              stroke="#A9713D"
              strokeWidth="4"
            />
            <ellipse
              cx="151"
              cy="541"
              rx="12"
              ry="15"
              fill="#F0CCA0"
              stroke="none"
            />
            <ellipse
              cx="179"
              cy="527"
              rx="12"
              ry="15"
              fill="#F0CCA0"
              stroke="none"
            />
            <ellipse
              cx="209"
              cy="534"
              rx="12"
              ry="15"
              fill="#F0CCA0"
              stroke="none"
            />
          </g>

          <g data-part="right-foot">
            <ellipse
              cx="415"
              cy="565"
              rx="67"
              ry="70"
              transform="rotate(18 415 565)"
              fill="#B78046"
            />
            <ellipse
              cx="414"
              cy="578"
              rx="35"
              ry="40"
              transform="rotate(18 414 578)"
              fill="#E9BD8A"
              stroke="#A9713D"
              strokeWidth="4"
            />
            <ellipse
              cx="449"
              cy="541"
              rx="12"
              ry="15"
              fill="#F0CCA0"
              stroke="none"
            />
            <ellipse
              cx="421"
              cy="527"
              rx="12"
              ry="15"
              fill="#F0CCA0"
              stroke="none"
            />
            <ellipse
              cx="391"
              cy="534"
              rx="12"
              ry="15"
              fill="#F0CCA0"
              stroke="none"
            />
          </g>

          {/* LEFT ARM (VIEWER LEFT) */}
          <g data-part="left-arm">
            <path
              d="M192 365C168 354 147 370 137 404L123 465C115 495 124 518 145 524C167 531 187 518 193 495L217 417C224 393 216 375 192 365Z"
              fill="#B78046"
            />
            <path
              d="M153 386C142 407 138 430 135 448"
              stroke="#CE985C"
              strokeWidth="12"
            />
            {resolvedAcc.coat && (
              <g data-accessory="coat">
                <path
                  d="M192 365C168 354 147 370 137 404L133 424L201 446L217 417C224 393 216 375 192 365Z"
                  fill="#FAFAF4"
                />
                <path
                  d="M135 421L203 443"
                  stroke="#B5B4A9"
                  strokeWidth="4"
                />
              </g>
            )}
            <g data-part="left-paw">
              <ellipse
                cx="155"
                cy="494"
                rx="33"
                ry="37"
                fill="#C58D50"
                strokeWidth="6"
              />
              <path
                d="M135 491L140 501M151 488L155 499M167 487L171 497"
                stroke="#8C5A31"
                strokeWidth="4"
              />
            </g>
          </g>

          {/* RIGHT ARM (VIEWER RIGHT — SUPPORTS COAT SLEEVE & ARM CAST) */}
          <g data-part="right-arm">
            <path
              d="M408 365C432 354 453 370 463 404L477 465C485 495 476 518 455 524C433 531 413 518 407 495L383 417C376 393 384 375 408 365Z"
              fill="#B78046"
            />
            <path
              d="M447 386C458 407 462 430 465 448"
              stroke="#CE985C"
              strokeWidth="12"
            />
            {resolvedAcc.coat && (
              <g data-accessory="coat">
                <path
                  d="M408 365C432 354 453 370 463 404L467 424L399 446L383 417C376 393 384 375 408 365Z"
                  fill="#FAFAF4"
                />
                <path
                  d="M465 421L397 443"
                  stroke="#B5B4A9"
                  strokeWidth="4"
                />
              </g>
            )}
            <g data-part="right-paw">
              <ellipse
                cx="445"
                cy="494"
                rx="33"
                ry="37"
                fill="#C58D50"
                strokeWidth="6"
              />
              <path
                d="M465 491L460 501M449 488L445 499M433 487L429 497"
                stroke="#8C5A31"
                strokeWidth="4"
              />
            </g>
            {resolvedAcc.cast && (
              <g data-accessory="cast">
                <path
                  d="M400 435L458 420L480 474C489 500 479 520 459 525L428 529C410 523 402 511 400 494Z"
                  fill="#EF9D4E"
                  strokeWidth="7"
                />
                <path
                  d="M404 453L464 438M408 478L475 461M418 505L479 484"
                  stroke="#C27B38"
                  strokeWidth="5"
                />
                <path
                  d="M400 435L458 420L463 436L403 451Z"
                  fill="#F4D5B0"
                  strokeWidth="4"
                />
                <ellipse
                  cx="423"
                  cy="491"
                  rx="15"
                  ry="20"
                  fill="#C58D50"
                  strokeWidth="5"
                />
              </g>
            )}
          </g>

          {/* HEAD, EARS, FACE, GLASSES, HEADSET */}
          <g data-part="head">
            <g data-part="ears">
              <ellipse
                cx="151"
                cy="115"
                rx="49"
                ry="52"
                transform="rotate(-22 151 115)"
                fill="#B78046"
              />
              <ellipse
                cx="449"
                cy="115"
                rx="49"
                ry="52"
                transform="rotate(22 449 115)"
                fill="#B78046"
              />
              <ellipse
                cx="151"
                cy="115"
                rx="31"
                ry="34"
                transform="rotate(-22 151 115)"
                fill="#E7B982"
                stroke="#996132"
                strokeWidth="4"
              />
              <ellipse
                cx="449"
                cy="115"
                rx="31"
                ry="34"
                transform="rotate(22 449 115)"
                fill="#E7B982"
                stroke="#996132"
                strokeWidth="4"
              />
            </g>
            <path
              d="M167 125C190 103 217 91 248 90L242 75L272 88L277 63L303 84L328 71L327 91C367 87 404 101 433 125C468 153 486 191 482 220L492 231L478 231C484 263 468 301 437 325C404 350 356 362 300 362C244 362 196 350 163 325C132 301 116 263 122 231L108 231L118 220C114 191 132 153 167 125Z"
              fill="#B78046"
            />
            <path
              d="M154 208C162 164 193 130 237 115"
              stroke="#CB9557"
              strokeWidth="15"
            />
            <path
              d="M444 208C437 169 409 138 373 122"
              stroke="#AD733D"
              strokeWidth="16"
            />
            <ellipse
              cx="192"
              cy="273"
              rx="26"
              ry="23"
              fill="#CF9657"
              stroke="none"
            />
            <ellipse
              cx="408"
              cy="273"
              rx="26"
              ry="23"
              fill="#CF9657"
              stroke="none"
            />
            <g data-part="brows" stroke="#563820" strokeWidth="9">
              <path d="M194 190C207 183 221 184 231 189" />
              <path d="M369 189C380 184 393 183 406 190" />
            </g>
            <g data-part="eyes">
              <ellipse
                cx="214"
                cy="229"
                rx="25"
                ry="32"
                fill="#FBF0DE"
                strokeWidth="5"
              />
              <ellipse
                cx="386"
                cy="229"
                rx="25"
                ry="32"
                fill="#FBF0DE"
                strokeWidth="5"
              />
              <ellipse
                cx="219"
                cy="233"
                rx="16"
                ry="23"
                fill="#3B2A1D"
                stroke="none"
              />
              <ellipse
                cx="381"
                cy="233"
                rx="16"
                ry="23"
                fill="#3B2A1D"
                stroke="none"
              />
              <circle cx="224" cy="222" r="7" fill="#FFFFFF" stroke="none" />
              <circle cx="376" cy="222" r="7" fill="#FFFFFF" stroke="none" />
            </g>
            <g data-part="muzzle">
              <ellipse
                cx="300"
                cy="290"
                rx="76"
                ry="55"
                fill="#EFCB96"
                strokeWidth="6"
              />
              <path
                d="M274 265C277 251 323 251 326 265C326 280 310 285 300 285C290 285 274 280 274 265Z"
                fill="#46301F"
                strokeWidth="3"
              />
              <path
                d="M283 260C290 256 301 257 307 258"
                stroke="#8D6A45"
                strokeWidth="4"
              />
              <path d="M300 285V296" strokeWidth="5" />
              {!isMouthOpenVisible && (
                <g data-part="mouth-closed">
                  <path
                    d="M275 298C284 313 300 307 300 297C300 307 316 313 325 298"
                    strokeWidth="5"
                  />
                </g>
              )}
              {isMouthOpenVisible && (
                <g
                  data-part="mouth-open"
                  style={{
                    transform: `scaleY(${mouthScaleY})`,
                    transformOrigin: '300px 298px',
                  }}
                >
                  <path
                    d="M274 297C286 305 314 305 326 297C324 323 314 331 300 331C286 331 276 323 274 297Z"
                    fill="#5C2D25"
                    strokeWidth="5"
                  />
                  <path
                    d="M282 319C294 313 307 313 318 319C312 329 289 329 282 319Z"
                    fill="#E88A81"
                    stroke="none"
                  />
                </g>
              )}
            </g>

            {/* ACCESSORY: GLASSES */}
            {resolvedAcc.glasses && (
              <g data-accessory="glasses" stroke="#796144" strokeWidth="7">
                <rect
                  x="177"
                  y="210"
                  width="77"
                  height="53"
                  rx="18"
                  fill="#FFFFFF"
                  fillOpacity=".12"
                />
                <rect
                  x="346"
                  y="210"
                  width="77"
                  height="53"
                  rx="18"
                  fill="#FFFFFF"
                  fillOpacity=".12"
                />
                <path d="M254 229C277 218 323 218 346 229M177 226L149 216M423 226L451 216" />
              </g>
            )}

            {/* ACCESSORY: HEADSET */}
            {resolvedAcc.headset && (
              <g data-accessory="headset">
                <path
                  d="M147 218C129 88 432 57 457 209"
                  stroke="#354F51"
                  strokeWidth="13"
                />
                <rect
                  x="438"
                  y="196"
                  width="31"
                  height="65"
                  rx="13"
                  fill="#5B7F80"
                  stroke="#354F51"
                  strokeWidth="5"
                />
                <path
                  d="M455 258C449 293 421 307 373 304"
                  stroke="#354F51"
                  strokeWidth="8"
                />
                <rect
                  x="351"
                  y="294"
                  width="31"
                  height="17"
                  rx="8"
                  fill="#354F51"
                  strokeWidth="3"
                />
              </g>
            )}
          </g>

          {/* ACCESSORY: CLIPBOARD */}
          {resolvedAcc.clipboard && (
            <g data-accessory="clipboard">
              <path
                d="M248 407H352V537H248Z"
                fill="#A97B49"
                strokeWidth="5"
              />
              <path
                d="M258 419H342V526H258Z"
                fill="#FFFDF3"
                stroke="#B7A98C"
                strokeWidth="3"
              />
              <rect
                x="280"
                y="400"
                width="40"
                height="22"
                rx="6"
                fill="#D3D1BC"
                strokeWidth="4"
              />
              <path
                d="M270 444L276 450L286 437M270 474L276 480L286 467M270 504L276 510L286 497"
                stroke="#4F8468"
                strokeWidth="5"
              />
              <path
                d="M297 444H328M297 474H328M297 504H323"
                stroke="#B4B0A0"
                strokeWidth="4"
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
