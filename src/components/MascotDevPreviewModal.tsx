/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MascotDevPreviewModal — Development-only inspection & verification workbench
 * for the KareBEAR Master Mascot Kit.
 *
 * Strictly kept outside child-facing screens. Provides interactive controls for:
 * - All 6 states: idle, waving, listening, speaking, encouraging, celebrating
 * - All 5 overlays: coat, glasses, clipboard, headset, cast + presets
 * - External mouthOpen control (0, intermediate values, 1, or auto speaking rhythm)
 * - Reduced-motion simulation and SVG vs. Original Neutral PNG fallback switch
 * - Side-by-side comparison of the vector reconstruction against the 3 original reference PNGs
 */

import React, { useState } from 'react';
import { X, Sliders, Eye, Sparkles } from 'lucide-react';
import { KareMascot } from '../mascot/KareMascot';
import {
  ALL_KARE_ACCESSORIES,
  ALL_KARE_STATES,
  KARE_PRESET_ACCESSORIES,
  KARE_REFERENCE_ASSETS,
  KARE_STATE_LABELS,
  type KareAccessory,
  type KareAccessoryMap,
  type KareCostumePreset,
  type KareMascotState,
} from '../mascot/kareArtwork';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';

interface MascotDevPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MascotDevPreviewModal: React.FC<MascotDevPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { renderMode, setRenderMode } = useMascotRuntime();

  const [previewState, setPreviewState] = useState<KareMascotState>('idle');
  const [selectedPreset, setSelectedPreset] =
    useState<KareCostumePreset>('neutral');
  const [accessories, setAccessories] = useState<KareAccessoryMap>({
    ...KARE_PRESET_ACCESSORIES.neutral,
  });
  const [useManualMouth, setUseManualMouth] = useState<boolean>(false);
  const [manualMouthValue, setManualMouthValue] = useState<number>(0);
  const [simulateReducedMotion, setSimulateReducedMotion] =
    useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: KareCostumePreset) => {
    setSelectedPreset(preset);
    setAccessories({ ...KARE_PRESET_ACCESSORIES[preset] });
  };

  const handleToggleAccessory = (acc: KareAccessory) => {
    setAccessories((prev) => ({
      ...prev,
      [acc]: !prev[acc],
    }));
  };

  const handleSelectMouthPreset = (val: number | null) => {
    if (val === null) {
      setUseManualMouth(false);
    } else {
      setUseManualMouth(true);
      setManualMouthValue(val);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mascot-dev-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E26]/65 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border-2 border-[#3A2E26] bg-[#FFF8EC] p-6 shadow-xl space-y-6 text-[#3A2E26]">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#3A2E26]/15 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#1F6F6B] px-3 py-1 text-xs font-bold text-white">
              <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Developer &amp; Evaluator Mascot Kit Workbench</span>
            </div>
            <h2
              id="mascot-dev-preview-title"
              className="font-child text-2xl sm:text-3xl font-extrabold text-[#1F6F6B]"
            >
              KareBEAR Master Mascot Kit — Interactive Preview &amp; Reference Check
            </h2>
            <p className="text-sm text-[#3A2E26]/85">
              Developer-only inspection tool (kept outside child-facing screens). Test all six states, five layered accessories, external mouthOpening (0–1), reduced motion, and compare against the three original reference PNGs.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#3A2E26] bg-[#FFFDF8] px-4 py-2 text-base font-bold text-[#3A2E26] hover:bg-[#FDE8D4] cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span>Close Preview</span>
          </button>
        </div>

        {/* Top Section: Live Interactive Workbench (Left: Stage, Right: Controls) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Interactive Mascot Stage */}
          <div className="flex flex-col items-center justify-between rounded-2xl border-2 border-[#1F6F6B] bg-[#FFFDF8] p-5 lg:col-span-5">
            <div className="w-full flex items-center justify-between text-xs font-bold text-[#1F6F6B]">
              <span>Interactive Reconstruction Stage</span>
              <span>State: {previewState.toUpperCase()}</span>
            </div>

            <div className="my-3 flex items-center justify-center rounded-2xl border border-[#3A2E26]/15 bg-white p-4 shadow-xs">
              <KareMascot
                state={previewState}
                preset={selectedPreset}
                accessories={accessories}
                mouthOpen={useManualMouth ? manualMouthValue : undefined}
                reducedMotion={simulateReducedMotion}
                renderMode={renderMode}
                size="lg"
                label={`Interactive preview of Kare in ${previewState} state`}
              />
            </div>

            <div className="w-full space-y-2 text-center">
              <p className="text-sm font-bold text-[#3A2E26]">
                {KARE_STATE_LABELS[previewState].badgeText}
              </p>
              <p className="text-xs text-[#3A2E26]/80">
                {KARE_STATE_LABELS[previewState].description}
              </p>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="space-y-5 rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 lg:col-span-7">
            {/* 1. Six States */}
            <div className="space-y-2">
              <span className="block text-sm font-bold text-[#1F6F6B]">
                1. Mascot State (6 States):
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ALL_KARE_STATES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPreviewState(st)}
                    data-dev-state-btn={st}
                    className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-sm font-bold capitalize transition-colors cursor-pointer ${
                      previewState === st
                        ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                        : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26] hover:border-[#1F6F6B]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Costume Presets & Individual Accessories */}
            <div className="space-y-2">
              <span className="block text-sm font-bold text-[#1F6F6B]">
                2. Costume Presets &amp; Layered Accessories (5 Overlays on Seated Base):
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'neutral',
                    'cast',
                    'checklist',
                    'doctor',
                    'doctor-cast',
                  ] as KareCostumePreset[]
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    data-dev-preset-btn={preset}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold capitalize cursor-pointer ${
                      selectedPreset === preset
                        ? 'border-[#1F6F6B] bg-[#DDF1EE] text-[#1F6F6B]'
                        : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26]'
                    }`}
                  >
                    Preset: {preset}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-5">
                {ALL_KARE_ACCESSORIES.map((acc) => (
                  <label
                    key={acc}
                    className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-[#3A2E26]/25 bg-[#FFF8EC] px-3 py-1.5 text-sm font-bold capitalize text-[#3A2E26]"
                  >
                    <input
                      type="checkbox"
                      checked={accessories[acc]}
                      onChange={() => handleToggleAccessory(acc)}
                      data-dev-accessory-checkbox={acc}
                      className="h-4 w-4 accent-[#1F6F6B]"
                    />
                    <span>{acc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. External Mouth Opening (0 to 1) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="dev-mouth-open-slider"
                  className="text-sm font-bold text-[#1F6F6B]"
                >
                  3. Mouth Opening (`mouthOpen` prop 0.00–1.00):
                </label>
                <span className="text-xs font-bold text-[#3A2E26]">
                  {useManualMouth
                    ? `Manual: ${manualMouthValue.toFixed(2)}`
                    : 'Auto (Speaking rhythm when state = speaking)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectMouthPreset(null)}
                  data-dev-mouth-btn="auto"
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer ${
                    !useManualMouth
                      ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                      : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26]'
                  }`}
                >
                  Auto Rhythm
                </button>
                {[0, 0.35, 0.65, 1].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectMouthPreset(val)}
                    data-dev-mouth-btn={String(val)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer ${
                      useManualMouth && Math.abs(manualMouthValue - val) < 0.01
                        ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                        : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26]'
                    }`}
                  >
                    mouthOpen = {val}
                  </button>
                ))}
              </div>

              <input
                id="dev-mouth-open-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={useManualMouth ? manualMouthValue : 0}
                onChange={(e) => {
                  setUseManualMouth(true);
                  setManualMouthValue( parseFloat(e.target.value) );
                }}
                className="w-full accent-[#1F6F6B] cursor-pointer"
              />
            </div>

            {/* 4. Reduced Motion & App Default Render Mode */}
            <div className="grid grid-cols-1 gap-3 border-t border-[#3A2E26]/15 pt-3 sm:grid-cols-2">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-[#3A2E26]/25 bg-[#FFF8EC] px-3 py-2 text-sm font-bold text-[#3A2E26]">
                <input
                  type="checkbox"
                  checked={simulateReducedMotion}
                  onChange={(e) => setSimulateReducedMotion(e.target.checked)}
                  data-dev-reduced-motion-toggle="true"
                  className="h-4 w-4 accent-[#1F6F6B]"
                />
                <span>Simulate `prefers-reduced-motion`</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setRenderMode(
                      renderMode === 'svg' ? 'png-fallback' : 'svg'
                    )
                  }
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-3 py-2 text-xs font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                >
                  <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    App Default: {renderMode === 'svg' ? 'Layered SVG (Active)' : 'Neutral PNG Fallback'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Visual Comparison (3 Original Reference PNGs vs. Independent Vector Reconstructions) */}
        <div className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-child text-xl font-extrabold text-[#1F6F6B]">
                Visual Identity &amp; Multi-Instance Independence Check
              </h3>
              <p className="text-sm text-[#3A2E26]/85">
                Comparing `public/references/` PNGs beside independent `KareMascot` vector reconstructions. Note: The standing doctor reference at a desk is represented as a seated doctor costume variation (`coat` + `headset` + optional `cast`) on the canonical seated base; the desk environment is not stretched onto the seated rig.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#DDF1EE] px-3 py-1 text-xs font-bold text-[#1F6F6B]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>4 Independent Mascot Instances Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Comparison 1: Neutral Seated Bear */}
            <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3">
              <p className="text-sm font-bold text-[#1F6F6B]">
                1. Canonical Neutral Seated Bear
              </p>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="flex flex-col items-center rounded-lg bg-white p-2 border border-[#3A2E26]/10">
                  <img
                    src={KARE_REFERENCE_ASSETS.neutralPng}
                    alt="Original neutral reference PNG"
                    className="h-28 w-auto object-contain"
                  />
                  <span className="mt-1 text-[11px] font-semibold text-[#3A2E26]/75">
                    Reference PNG
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-white p-2 border border-[#1F6F6B]/30">
                  <KareMascot
                    state="idle"
                    preset="neutral"
                    size="sm"
                    reducedMotion={simulateReducedMotion}
                    label="Neutral vector reconstruction"
                  />
                  <span className="mt-1 text-[11px] font-bold text-[#1F6F6B]">
                    Vector SVG (`neutral`)
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison 2: Checklist / Caregiver Review Bear */}
            <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3">
              <p className="text-sm font-bold text-[#1F6F6B]">
                2. Caregiver Checklist Variation
              </p>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="flex flex-col items-center rounded-lg bg-white p-2 border border-[#3A2E26]/10">
                  <img
                    src={KARE_REFERENCE_ASSETS.checklistPng}
                    alt="Original checklist reference PNG"
                    className="h-28 w-auto object-contain"
                  />
                  <span className="mt-1 text-[11px] font-semibold text-[#3A2E26]/75">
                    Reference PNG
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-white p-2 border border-[#1F6F6B]/30">
                  <KareMascot
                    state="encouraging"
                    preset="checklist"
                    size="sm"
                    reducedMotion={simulateReducedMotion}
                    label="Checklist vector reconstruction"
                  />
                  <span className="mt-1 text-[11px] font-bold text-[#1F6F6B]">
                    Vector SVG (`checklist`)
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison 3: Seated Doctor Costume Variation */}
            <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3">
              <p className="text-sm font-bold text-[#1F6F6B]">
                3. Seated Doctor &amp; Cast Variation
              </p>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="flex flex-col items-center rounded-lg bg-white p-2 border border-[#3A2E26]/10">
                  <img
                    src={KARE_REFERENCE_ASSETS.doctorPng}
                    alt="Original standing doctor reference PNG"
                    className="h-28 w-auto object-contain"
                  />
                  <span className="mt-1 text-[11px] font-semibold text-[#3A2E26]/75">
                    Standing Ref PNG
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-white p-2 border border-[#1F6F6B]/30">
                  <KareMascot
                    state="waving"
                    preset="doctor-cast"
                    size="sm"
                    reducedMotion={simulateReducedMotion}
                    label="Seated doctor-cast vector reconstruction"
                  />
                  <span className="mt-1 text-[11px] font-bold text-[#1F6F6B]">
                    Seated SVG (`doctor-cast`)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
