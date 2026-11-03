/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Screen components for Journey 2:
 * S4 (Grown-up Review), S5 (Handover), S6 (Learn Page),
 * S7 (Comprehension Check), and S8 (Finish & Caregiver Summary).
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Home as HomeIcon,
  Lock,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  BEAR_ASSETS,
  ENJOYMENT_OPTIONS,
  RECOVERY_POINTS,
  SICKKIDS_SOURCE_INFO,
  UI_COPY,
  type ComprehensionChoice,
} from '../data/demoContent';
import {
  calculateCaregiverSummary,
  type DemoState,
} from '../utils/demoState';
import type { ExplainMessage } from '../utils/explainKareLogic';
import { KareIllustration } from './KareIllustration';
import { ListenButton } from './ListenButton';
import { FaceSelector } from './FaceSelector';
import { ExplainItToKarePanel } from './ExplainItToKarePanel';

/* -------------------------------------------------------------------------- */
/* S4: GROWN-UP REVIEW SCREEN                                                 */
/* -------------------------------------------------------------------------- */

interface S4GrownUpReviewProps {
  state: DemoState;
  onToggleOriginalWording: (pointId: string) => void;
  onToggleSupplementalDetail: (pointId: string) => void;
  onToggleExplainPrompts: () => void;
  onToggleReadAloud: () => void;
  onBack: () => void;
  onApprove: () => void;
}

export const S4GrownUpReviewScreen: React.FC<S4GrownUpReviewProps> = ({
  state,
  onToggleOriginalWording,
  onToggleSupplementalDetail,
  onToggleExplainPrompts,
  onToggleReadAloud,
  onBack,
  onApprove,
}) => {
  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="space-y-6">
        {/* Header & Non-waterproof Cast / Approval Disclaimers */}
        <div className="rounded-2xl border-2 border-[#1F6F6B]/30 bg-[#FFFDF8] p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#1F6F6B]">
              Grown-up Review &amp; Preferences · {UI_COPY.nonWaterproofTag}
            </span>
            <a
              href={SICKKIDS_SOURCE_INFO.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F6F6B] underline hover:text-[#3A2E26]"
            >
              <span>Full SickKids Cast Care Guidance</span>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={BEAR_ASSETS.checklist.src}
              alt={BEAR_ASSETS.checklist.alt}
              className="h-24 w-24 shrink-0 rounded-2xl border border-[#3A2E26]/15 bg-white object-contain p-1.5 shadow-xs"
            />
            <div className="space-y-1.5">
              <h1 className="font-child text-[28px] sm:text-[32px] font-extrabold text-[#1F6F6B]">
                {UI_COPY.grownUpReview.screenTitle}
              </h1>

              <p className="text-[19px] leading-relaxed text-[#3A2E26]">
                {UI_COPY.grownUpReview.introText}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
            <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-3.5 text-base text-[#3A2E26]">
              <strong className="block font-bold text-[#1F6F6B]">
                Non-waterproof cast &amp; learning example scope:
              </strong>
              {SICKKIDS_SOURCE_INFO.castTypeNotice} {SICKKIDS_SOURCE_INFO.scopeNotice}
            </div>
            <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FDE8D4]/55 p-3.5 text-base text-[#3A2E26]">
              <strong className="block font-bold text-[#3A2E26]">
                What caregiver approval means:
              </strong>
              {SICKKIDS_SOURCE_INFO.approvalNotice}
            </div>
          </div>
        </div>

        {/* Three Core Recovery Points (Always included + Supplemental Detail Controls) */}
        <div className="space-y-4">
          {RECOVERY_POINTS.map((point) => {
            const isOriginalOpen = Boolean(
              state.expandedOriginalWordingByPointId[point.id]
            );
            const isSupplementalIncluded = Boolean(
              state.caregiverPreferences.supplementalDetailByPointId[point.id]
            );

            return (
              <section
                key={point.id}
                aria-labelledby={`point-heading-${point.id}`}
                className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-bold text-[#1F6F6B]">
                      Selected Learning Example {point.stepNumber} of {RECOVERY_POINTS.length}
                    </span>
                    <h2
                      id={`point-heading-${point.id}`}
                      className="font-child text-[22px] font-extrabold text-[#3A2E26]"
                    >
                      {point.shortTitle}
                    </h2>
                  </div>

                  {/* Locked Core Instruction Status ("Always included in this demonstration.") */}
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#1F6F6B]/40 bg-[#DDF1EE] px-3.5 py-2 text-sm font-bold text-[#3A2E26]">
                    <Lock className="h-4 w-4 text-[#1F6F6B] shrink-0" aria-hidden="true" />
                    <span>{point.alwaysIncludedBadge}</span>
                  </div>
                </div>

                {/* Child-Friendly Wording Box */}
                <div className="rounded-xl border border-[#3A2E26]/15 bg-[#FFF8EC] p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#1F6F6B]">
                      Child-friendly wording (shown to your child):
                    </span>
                    {point.needsClinicalReviewFlag && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#3A2E26]/20 bg-[#FDE8D4] px-2.5 py-0.5 text-xs font-bold text-[#3A2E26]">
                        <span>⚑ Needs clinical review</span>
                      </span>
                    )}
                  </div>
                  <p className="font-child text-[22px] font-bold text-[#3A2E26]">
                    “{point.childInstruction}”
                  </p>
                </div>

                {/* Caregiver Controls Row: See Original Wording Toggle + Supplemental Detail Checkbox */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onToggleOriginalWording(point.id)}
                    aria-expanded={isOriginalOpen}
                    aria-controls={`orig-wording-${point.id}`}
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                  >
                    <span>
                      {isOriginalOpen
                        ? UI_COPY.grownUpReview.hideOriginalWording
                        : UI_COPY.grownUpReview.seeOriginalWording}
                    </span>
                    {isOriginalOpen ? (
                      <ChevronUp className="h-5 w-5 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0" aria-hidden="true" />
                    )}
                  </button>

                  {/* Caregiver control for supplemental detail (does not remove core instruction) */}
                  <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-[#3A2E26]/25 bg-[#FFF8EC] px-4 py-2 text-base font-semibold text-[#3A2E26] hover:border-[#1F6F6B]">
                    <input
                      type="checkbox"
                      checked={isSupplementalIncluded}
                      onChange={() => onToggleSupplementalDetail(point.id)}
                      className="h-5 w-5 accent-[#1F6F6B] cursor-pointer"
                    />
                    <span>
                      {UI_COPY.grownUpReview.supplementalToggleLabel} (Step {point.stepNumber})
                    </span>
                  </label>
                </div>

                {/* Expandable Original Wording & SickKids Grounding */}
                {isOriginalOpen && (
                  <div
                    id={`orig-wording-${point.id}`}
                    className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/45 p-4 space-y-2 text-base text-[#3A2E26]"
                  >
                    <p className="font-bold text-[#1F6F6B]">
                      {point.sourceCitationLabel}
                    </p>
                    <p className="leading-relaxed">{point.originalSourceWording}</p>
                    <p className="text-sm text-[#3A2E26]/85">
                      <strong>Supplemental child detail (“More about this”):</strong> “{point.moreAboutThis}” ⚑
                    </p>
                    <p className="pt-1">
                      <a
                        href={point.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F6F6B] underline hover:text-[#3A2E26]"
                      >
                        <span>Read full SickKids AboutKidsHealth article</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Presentation Preferences for Caregiver */}
        <section
          aria-labelledby="presentation-prefs-heading"
          className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 space-y-3"
        >
          <h2
            id="presentation-prefs-heading"
            className="font-child text-[20px] font-extrabold text-[#1F6F6B]"
          >
            {UI_COPY.grownUpReview.presentationSectionTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border border-[#3A2E26]/25 bg-[#FFF8EC] px-4 py-3 text-base font-semibold text-[#3A2E26] hover:border-[#1F6F6B]">
              <input
                type="checkbox"
                checked={state.caregiverPreferences.showExplainPrompts}
                onChange={onToggleExplainPrompts}
                className="h-5 w-5 accent-[#1F6F6B] cursor-pointer shrink-0"
              />
              <span>{UI_COPY.grownUpReview.explainPromptToggleLabel}</span>
            </label>

            <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border border-[#3A2E26]/25 bg-[#FFF8EC] px-4 py-3 text-base font-semibold text-[#3A2E26] hover:border-[#1F6F6B]">
              <input
                type="checkbox"
                checked={state.caregiverPreferences.enableReadAloud}
                onChange={onToggleReadAloud}
                className="h-5 w-5 accent-[#1F6F6B] cursor-pointer shrink-0"
              />
              <span>{UI_COPY.grownUpReview.listenToggleLabel}</span>
            </label>
          </div>
        </section>
      </div>

      {/* Bottom Bar: Back (bottom left) & Approve for my child (bottom right) */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-[#3A2E26]/15 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#3A2E26]/40 bg-[#FFFDF8] px-6 py-3 text-xl font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/40 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onApprove}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#1F6F6B] px-8 py-3 text-xl font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.grownUpReview.approveButton}</span>
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* S5: HANDOVER SCREEN                                                        */
/* -------------------------------------------------------------------------- */

interface S5HandoverProps {
  onBack: () => void;
  onStartWithKare: () => void;
}

export const S5HandoverScreen: React.FC<S5HandoverProps> = ({
  onBack,
  onStartWithKare,
}) => {
  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-5">
          <KareIllustration
            expression="waving"
            caption="Kare is ready to learn the three cast care steps with your child."
          />
        </div>

        <div className="flex flex-col justify-center gap-6 lg:col-span-7">
          <div className="rounded-2xl border-2 border-[#1F6F6B] bg-[#DDF1EE]/60 p-6 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#1F6F6B] px-4 py-2 text-base font-bold text-white">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Caregiver permission confirmed for this demonstration</span>
            </div>

            <h1 className="font-child text-[30px] sm:text-[34px] font-extrabold text-[#1F6F6B]">
              {UI_COPY.handover.title}
            </h1>

            <p className="text-[20px] leading-relaxed text-[#3A2E26]">
              {UI_COPY.handover.subtitle}
            </p>

            <div className="rounded-xl border border-[#3A2E26]/15 bg-[#FFFDF8] p-4 text-base text-[#3A2E26]">
              <strong>How each step works:</strong> First your child reads or listens to a
              recovery tip with Kare, then completes a short comprehension check, and
              shares the idea with you in their own words.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Back (bottom left) & Start with Kare (bottom right) */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-[#3A2E26]/15 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#3A2E26]/40 bg-[#FFFDF8] px-6 py-3 text-xl font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/40 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onStartWithKare}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#1F6F6B] px-8 py-3 text-xl font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>{UI_COPY.handover.startButton}</span>
          <ArrowRight className="h-6 w-6 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* S6: LEARN PAGE (Per recovery point, supports normal and retry mode)        */
/* -------------------------------------------------------------------------- */

interface S6LearnPageProps {
  state: DemoState;
  onToggleLearnMore: (pointId: string) => void;
  onRecordExplainTurn: (
    pointId: string,
    newMessages: ExplainMessage[],
    coveredPointIds: string[]
  ) => void;
  onJumpToExplanation: (pointId: string) => void;
  onBack: () => void;
  onProceedToCheck: () => void;
}

export const S6LearnPageScreen: React.FC<S6LearnPageProps> = ({
  state,
  onToggleLearnMore,
  onRecordExplainTurn,
  onJumpToExplanation,
  onBack,
  onProceedToCheck,
}) => {
  const point =
    RECOVERY_POINTS[state.activeRecoveryIndex] ?? RECOVERY_POINTS[0];
  const isRetry = state.isRetryLearnMode;
  const isMoreAllowed = Boolean(
    state.caregiverPreferences.supplementalDetailByPointId[point.id]
  );
  const isMoreExpanded = Boolean(state.expandedLearnMoreByPointId[point.id]);

  const speechText = [
    isRetry ? UI_COPY.learn.retryBanner : `Step ${point.stepNumber} of ${RECOVERY_POINTS.length}`,
    point.childInstruction,
    isMoreAllowed && isMoreExpanded ? point.moreAboutThis : '',
    state.caregiverPreferences.showExplainPrompts
      ? point.explainToCaregiverPrompt
      : '',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <div className="flex flex-col justify-between gap-6">
      {/* Retry Banner when revisiting from a 1st incorrect answer */}
      {isRetry && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border-2 border-[#3A2E26]/30 bg-[#FDE8D4] px-5 py-4 text-[#3A2E26]"
        >
          <RotateCcw className="h-7 w-7 shrink-0 text-[#3A2E26]" aria-hidden="true" />
          <div>
            <p className="font-child text-[22px] font-extrabold text-[#3A2E26]">
              {UI_COPY.learn.retryBanner}
            </p>
            <p className="text-base font-medium text-[#3A2E26]/90">
              {UI_COPY.learn.retrySubtitle}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left: Kare Illustration */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <KareIllustration
            expression={isRetry ? 'encouraging' : point.kareLearnExpression}
            sceneProp={point.sceneProp}
            variant="doctor"
            caption={`Step ${point.stepNumber} of ${RECOVERY_POINTS.length}: ${point.shortTitle}`}
          />
        </div>

        {/* Right: Child Care Point + More About This + Explain Prompt */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-7">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-base font-bold text-[#1F6F6B]">
                  Step {point.stepNumber} of {RECOVERY_POINTS.length} · Learn with Kare
                </span>
                <h1 className="font-child text-[28px] sm:text-[32px] font-extrabold text-[#1F6F6B]">
                  {point.shortTitle}
                </h1>
              </div>

              <ListenButton
                textToRead={speechText}
                enabledByCaregiver={state.caregiverPreferences.enableReadAloud}
              />
            </div>

            {/* Main Child Instruction Bubble */}
            <div className="rounded-2xl border-2 border-[#1F6F6B] bg-[#FFFDF8] p-6 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#1F6F6B]">
                  Kare says:
                </span>
                {point.needsClinicalReviewFlag && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#3A2E26]/20 bg-[#FDE8D4] px-2.5 py-1 text-xs font-bold text-[#3A2E26]">
                    <span>⚑ Needs clinical review</span>
                  </span>
                )}
              </div>

              <p className="font-child text-[24px] sm:text-[26px] font-bold leading-[1.5] text-[#3A2E26]">
                “{point.childInstruction}”
              </p>
            </div>

            {/* Supplemental "More about this" (if enabled by caregiver on S4) */}
            {isMoreAllowed && (
              <div className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-4">
                <button
                  type="button"
                  onClick={() => onToggleLearnMore(point.id)}
                  aria-expanded={isMoreExpanded}
                  aria-controls={`learn-more-${point.id}`}
                  className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left font-child text-[20px] font-bold text-[#1F6F6B] hover:bg-[#DDF1EE]/50 cursor-pointer"
                >
                  <span>
                    {isMoreExpanded
                      ? UI_COPY.story.hideMoreAboutButton
                      : UI_COPY.story.moreAboutButton}
                  </span>
                  {isMoreExpanded ? (
                    <ChevronUp className="h-6 w-6 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-6 w-6 shrink-0" aria-hidden="true" />
                  )}
                </button>

                {isMoreExpanded && (
                  <div
                    id={`learn-more-${point.id}`}
                    className="mt-3 border-t border-[#3A2E26]/15 pt-4 px-3 space-y-2"
                  >
                    <p className="font-child text-[22px] leading-[1.5] text-[#3A2E26]">
                      {point.moreAboutThis}
                    </p>
                    {point.moreAboutNeedsReviewFlag && (
                      <p className="inline-flex items-center gap-1.5 rounded-md border border-[#3A2E26]/20 bg-[#FDE8D4] px-2.5 py-1 text-xs font-bold text-[#3A2E26]">
                        <span>⚑ Wording marked for clinical source review</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shared "Explain it to Kare" Activity (Talk to Kare & Type to Kare) */}
            {state.caregiverPreferences.showExplainPrompts && (
              <ExplainItToKarePanel
                point={point}
                observation={
                  state.explainObservationsByPointId[point.id] ?? {
                    pointId: point.id,
                    coveredLearningPointIds: [],
                    messages: [],
                    lastUpdated: null,
                  }
                }
                onRecordTurn={onRecordExplainTurn}
                onJumpToExplanation={onJumpToExplanation}
                isOnLearnScreen={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Back (bottom left) & Next / Try again (bottom right) */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-[#3A2E26]/15 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#3A2E26]/40 bg-[#FFFDF8] px-6 py-3 text-xl font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/40 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onProceedToCheck}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#1F6F6B] px-8 py-3 text-xl font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>
            {isRetry
              ? UI_COPY.learn.retryToCheckButton
              : UI_COPY.learn.nextToCheckButton}
          </span>
          <ArrowRight className="h-6 w-6 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* S7: COMPREHENSION CHECK SCREEN                                             */
/* -------------------------------------------------------------------------- */

interface S7ComprehensionCheckProps {
  state: DemoState;
  onSelectChoice: (pointId: string, choiceId: string) => void;
  onLookAgain: () => void;
  onNextStep: () => void;
  onBack: () => void;
  onRecordExplainTurn: (
    pointId: string,
    newMessages: ExplainMessage[],
    coveredPointIds: string[]
  ) => void;
  onJumpToExplanation: (pointId: string) => void;
}

export const S7ComprehensionCheckScreen: React.FC<S7ComprehensionCheckProps> = ({
  state,
  onSelectChoice,
  onLookAgain,
  onNextStep,
  onBack,
  onRecordExplainTurn,
  onJumpToExplanation,
}) => {
  const point =
    RECOVERY_POINTS[state.activeRecoveryIndex] ?? RECOVERY_POINTS[0];
  const attempt = state.pointAttempts[point.id];
  const feedbackState = attempt?.currentFeedbackState ?? 'idle';
  const selectedChoiceId = attempt?.currentSelectedChoiceId ?? null;
  const isLastPoint = state.activeRecoveryIndex + 1 >= RECOVERY_POINTS.length;

  const kareExpression =
    feedbackState === 'correct'
      ? 'celebrating'
      : feedbackState === 'first-incorrect' ||
          feedbackState === 'second-incorrect-explained'
        ? 'encouraging'
        : 'calm';

  const speechText = [
    `Step ${point.stepNumber} of ${RECOVERY_POINTS.length}. ${UI_COPY.comprehension.badge}.`,
    point.comprehensionCheck.scenarioQuestion,
    ...point.comprehensionCheck.choices.map((c, idx) => `Option ${idx + 1}: ${c.label}`),
  ].join(' ');

  const renderChoiceIcon = (iconType: ComprehensionChoice['iconType']) => {
    switch (iconType) {
      case 'water':
        return '💧';
      case 'play-dry':
        return '☀️';
      case 'remove-cast':
        return '🩹';
      case 'pencil':
        return '✏️';
      case 'tell-adult':
        return '🗣️';
      case 'wait':
        return '⏳';
      case 'shake':
        return '👋';
      default:
        return '•';
    }
  };

  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left: Kare Illustration responding to answer state */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <KareIllustration
            expression={kareExpression}
            sceneProp={point.sceneProp}
            variant={feedbackState === 'correct' ? 'companion' : 'checklist'}
            caption={`Step ${point.stepNumber} of ${RECOVERY_POINTS.length} · ${UI_COPY.comprehension.badge}`}
          />
        </div>

        {/* Right: Scenario Question, Picture Choice Buttons, Supportive Feedback */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-7">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-base font-bold text-[#1F6F6B]">
                  <HelpCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    Step {point.stepNumber} of {RECOVERY_POINTS.length} · {UI_COPY.comprehension.badge}
                  </span>
                </span>
                <h1 className="mt-0.5 font-child text-[25px] sm:text-[28px] font-extrabold leading-snug text-[#3A2E26]">
                  {point.comprehensionCheck.scenarioQuestion}
                </h1>
              </div>

              <ListenButton
                textToRead={speechText}
                enabledByCaregiver={state.caregiverPreferences.enableReadAloud}
              />
            </div>

            {/* Large Picture Answer Buttons */}
            <div
              role="group"
              aria-label={point.comprehensionCheck.scenarioQuestion}
              className="grid grid-cols-1 gap-2.5"
            >
              {point.comprehensionCheck.choices.map((choice) => {
                const isSelected = selectedChoiceId === choice.id;
                const isRevealedCorrect =
                  feedbackState === 'second-incorrect-explained' && choice.isCorrect;

                let buttonStyle =
                  'border-[#3A2E26]/30 bg-[#FFFDF8] text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/30';
                let statusBadge: React.ReactNode = null;

                if (
                  (isSelected && feedbackState === 'correct') ||
                  isRevealedCorrect
                ) {
                  buttonStyle =
                    'border-[#1F6F6B] bg-[#DDF1EE] text-[#3A2E26] shadow-xs';
                  statusBadge = (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F6F6B] px-3 py-1 text-sm font-bold text-white shrink-0">
                      <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                      <span>Correct answer</span>
                    </span>
                  );
                } else if (
                  isSelected &&
                  (feedbackState === 'first-incorrect' ||
                    feedbackState === 'second-incorrect-explained')
                ) {
                  buttonStyle =
                    'border-[#F2994A] bg-[#FDE8D4] text-[#3A2E26] shadow-xs';
                  statusBadge = (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#3A2E26]/25 bg-[#F2994A] px-3 py-1 text-sm font-bold text-[#3A2E26] shrink-0">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      <span>Let&apos;s check</span>
                    </span>
                  );
                }

                const isDisabled =
                  feedbackState === 'correct' ||
                  feedbackState === 'second-incorrect-explained';

                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelectChoice(point.id, choice.id)}
                    aria-pressed={isSelected}
                    className={`flex min-h-[68px] w-full items-center justify-between gap-4 rounded-2xl border-2 px-5 py-3.5 text-left transition-colors ${buttonStyle} ${
                      isDisabled ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#3A2E26]/15 bg-[#FFF8EC] text-2xl"
                      >
                        {renderChoiceIcon(choice.iconType)}
                      </span>
                      <span className="font-child text-[22px] font-bold leading-snug text-[#3A2E26]">
                        {choice.label}
                      </span>
                    </div>
                    {statusBadge}
                  </button>
                );
              })}
            </div>

            {/* In-Place Supportive Feedback */}
            {feedbackState === 'correct' && (
              <div
                role="status"
                className="rounded-2xl border-2 border-[#1F6F6B] bg-[#DDF1EE] p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1F6F6B] text-white">
                    <Check className="h-6 w-6 stroke-[3]" aria-hidden="true" />
                  </div>
                  <p className="font-child text-[22px] font-extrabold text-[#3A2E26]">
                    {point.comprehensionCheck.correctFeedback}
                  </p>
                </div>

                {state.caregiverPreferences.showExplainPrompts && (
                  <div className="rounded-xl border border-[#1F6F6B]/30 bg-[#FFFDF8] p-3.5 text-base text-[#3A2E26]">
                    <strong className="font-bold text-[#1F6F6B]">
                      {UI_COPY.comprehension.explainAfterCheckTitle}
                    </strong>{' '}
                    {point.explainToCaregiverPrompt}
                  </div>
                )}
              </div>
            )}

            {feedbackState === 'first-incorrect' && (
              <div
                role="status"
                className="rounded-2xl border-2 border-[#F2994A] bg-[#FDE8D4] p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2994A] text-[#3A2E26]">
                    <RotateCcw className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="font-child text-[22px] font-extrabold text-[#3A2E26]">
                    {point.comprehensionCheck.firstIncorrectFeedback}
                  </p>
                </div>
                <p className="text-base font-medium text-[#3A2E26]">
                  Select <strong>“{UI_COPY.comprehension.lookAgainButton}”</strong> below to revisit Kare&apos;s tip, then try this comprehension check once more.
                </p>
              </div>
            )}

            {feedbackState === 'second-incorrect-explained' && (
              <div
                role="status"
                className="rounded-2xl border-2 border-[#F2994A] bg-[#FDE8D4] p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1F6F6B] text-white">
                    <MessageCircle className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="font-child text-[22px] font-extrabold text-[#3A2E26]">
                    {point.comprehensionCheck.secondIncorrectExplanation}
                  </p>
                </div>
                <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-3.5 text-base text-[#3A2E26]">
                  <strong className="font-bold text-[#1F6F6B]">
                    Flagged for grown-up discussion:
                  </strong>{' '}
                  {point.explainToCaregiverPrompt} You can continue to the next step now.
                </div>
              </div>
            )}

            {/* Shared "Explain it to Kare" panel available on S7 after answering */}
            {state.caregiverPreferences.showExplainPrompts &&
              (feedbackState === 'correct' ||
                feedbackState === 'second-incorrect-explained') && (
                <ExplainItToKarePanel
                  point={point}
                  observation={
                    state.explainObservationsByPointId[point.id] ?? {
                      pointId: point.id,
                      coveredLearningPointIds: [],
                      messages: [],
                      lastUpdated: null,
                    }
                  }
                  onRecordTurn={onRecordExplainTurn}
                  onJumpToExplanation={onJumpToExplanation}
                  isOnLearnScreen={false}
                />
              )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Back (bottom left) & Primary Action (bottom right) */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-[#3A2E26]/15 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#3A2E26]/40 bg-[#FFFDF8] px-6 py-3 text-xl font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/40 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.backButton}</span>
        </button>

        {feedbackState === 'first-incorrect' ? (
          <button
            type="button"
            onClick={onLookAgain}
            className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#F2994A] px-8 py-3 text-xl font-bold text-[#3A2E26] border-2 border-[#3A2E26] hover:bg-[#e58938] cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>{UI_COPY.comprehension.lookAgainButton}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={
              feedbackState !== 'correct' &&
              feedbackState !== 'second-incorrect-explained'
            }
            onClick={onNextStep}
            className={`inline-flex min-h-[56px] items-center gap-2.5 rounded-xl px-8 py-3 text-xl font-bold whitespace-nowrap shrink-0 ${
              feedbackState === 'correct' ||
              feedbackState === 'second-incorrect-explained'
                ? 'bg-[#1F6F6B] text-white hover:bg-[#165350] cursor-pointer'
                : 'bg-[#3A2E26]/20 text-[#3A2E26]/60 cursor-not-allowed'
            }`}
          >
            <span>
              {isLastPoint
                ? UI_COPY.comprehension.finishJourneyButton
                : UI_COPY.comprehension.nextPointButton}
            </span>
            <ArrowRight className="h-6 w-6 shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* S8: FINISH AND CAREGIVER SUMMARY SCREEN                                    */
/* -------------------------------------------------------------------------- */

interface S8FinishSummaryProps {
  state: DemoState;
  onSelectEnjoyment: (id: string | null) => void;
  onRecordExplainTurn: (
    pointId: string,
    newMessages: ExplainMessage[],
    coveredPointIds: string[]
  ) => void;
  onJumpToExplanation: (pointId: string) => void;
  onBack: () => void;
  onHome: () => void;
}

export const S8FinishSummaryScreen: React.FC<S8FinishSummaryProps> = ({
  state,
  onSelectEnjoyment,
  onRecordExplainTurn,
  onJumpToExplanation,
  onBack,
  onHome,
}) => {
  const summary = calculateCaregiverSummary(state);
  const [selectedSummaryPointId, setSelectedSummaryPointId] = useState<string>(
    RECOVERY_POINTS[0].id
  );
  const activeSummaryPoint =
    RECOVERY_POINTS.find((p) => p.id === selectedSummaryPointId) ??
    RECOVERY_POINTS[0];

  const childSpeechText = `${UI_COPY.finishSummary.childCelebrationTitle} ${UI_COPY.finishSummary.childPrompt} ${UI_COPY.finishSummary.enjoymentQuestion}`;

  return (
    <div className="flex flex-col justify-between gap-8">
      {/* CHILD PART (Top Section) */}
      <section
        aria-labelledby="child-finish-heading"
        className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12"
      >
        <div className="flex flex-col justify-center lg:col-span-5">
          <KareIllustration
            expression="celebrating"
            sceneProp="going-home"
            caption="Kare is proud of you for practicing how to care for your cast!"
          />
        </div>

        <div className="flex flex-col justify-between gap-5 lg:col-span-7">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-base font-bold text-[#1F6F6B]">
                <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Finished all {summary.totalPoints} home care steps!</span>
              </div>

              <ListenButton
                textToRead={childSpeechText}
                enabledByCaregiver={state.caregiverPreferences.enableReadAloud}
              />
            </div>

            <h1
              id="child-finish-heading"
              className="font-child text-[30px] sm:text-[34px] font-extrabold text-[#1F6F6B]"
            >
              {UI_COPY.finishSummary.childCelebrationTitle}
            </h1>

            {/* Shared "Explain it to Kare" Activity on S8 with step selector */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#1F6F6B]">
                  Choose a step to explain to Kare:
                </span>
                {RECOVERY_POINTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedSummaryPointId(p.id)}
                    className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-sm font-bold cursor-pointer ${
                      activeSummaryPoint.id === p.id
                        ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                        : 'border-[#3A2E26]/25 bg-[#FFFDF8] text-[#3A2E26] hover:border-[#1F6F6B]'
                    }`}
                  >
                    Step {p.stepNumber}: {p.shortTitle}
                  </button>
                ))}
              </div>

              <ExplainItToKarePanel
                point={activeSummaryPoint}
                observation={
                  state.explainObservationsByPointId[activeSummaryPoint.id] ?? {
                    pointId: activeSummaryPoint.id,
                    coveredLearningPointIds: [],
                    messages: [],
                    lastUpdated: null,
                  }
                }
                onRecordTurn={onRecordExplainTurn}
                onJumpToExplanation={onJumpToExplanation}
                isOnLearnScreen={false}
              />
            </div>

            {/* Optional Enjoyment Question */}
            <FaceSelector
              question={UI_COPY.finishSummary.enjoymentQuestion}
              optionalNote="Optional — picking a face is never required to finish."
              options={ENJOYMENT_OPTIONS}
              selectedId={state.selectedRecoveryEnjoymentId}
              onSelect={onSelectEnjoyment}
              groupName="Did you like learning with Kare?"
            />
          </div>
        </div>
      </section>

      {/* DIVIDER BETWEEN CHILD PART AND GROWN-UP PART */}
      <hr className="border-t-2 border-[#3A2E26]/20" />

      {/* GROWN-UP PART (Caregiver Summary tracking the 3 required state distinctions) */}
      <section
        aria-labelledby="caregiver-summary-heading"
        className="rounded-2xl border-2 border-[#3A2E26]/25 bg-[#FFFDF8] p-6 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={BEAR_ASSETS.checklist.src}
              alt={BEAR_ASSETS.checklist.alt}
              className="hidden sm:block h-20 w-20 shrink-0 rounded-2xl border border-[#3A2E26]/15 bg-white object-contain p-1.5 shadow-xs"
            />
            <div className="space-y-1">
              <span className="text-sm font-bold text-[#1F6F6B]">
                For Grown-ups · Session Summary ({UI_COPY.nonWaterproofTag})
              </span>
              <h2
                id="caregiver-summary-heading"
                className="font-child text-[26px] font-extrabold text-[#1F6F6B]"
              >
                {UI_COPY.finishSummary.caregiverSectionTitle}
              </h2>
              <p className="text-[18px] text-[#3A2E26]">
                Your child finished {summary.completedPoints} of {summary.totalPoints} selected non-waterproof cast care examples.{' '}
                {UI_COPY.finishSummary.caregiverSectionIntro}
              </p>
            </div>
          </div>

          <a
            href={SICKKIDS_SOURCE_INFO.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE]"
          >
            <span>Full SickKids Cast Care Guidance</span>
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        </div>

        {/* Summary Metric Counts (Calculated from actual content & attempts) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4">
            <p className="text-sm font-bold text-[#3A2E26]/80">
              Any incorrect attempt
            </p>
            <p className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26] tabular-nums">
              {summary.hadIncorrectAttemptCount} of {summary.totalPoints} steps
            </p>
          </div>

          <div className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/50 p-4">
            <p className="text-sm font-bold text-[#1F6F6B]">
              Eventually correct
            </p>
            <p className="mt-1 font-child text-2xl font-extrabold text-[#1F6F6B] tabular-nums">
              {summary.eventuallyCorrectCount} of {summary.totalPoints} steps
            </p>
            <p className="text-xs font-medium text-[#3A2E26]/85">
              ({summary.firstTryCorrectCount} first try · {summary.ResolvedOnRetryCount} on retry)
            </p>
          </div>

          <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FDE8D4]/65 p-4">
            <p className="text-sm font-bold text-[#3A2E26]">
              Caregiver discussion still needed
            </p>
            <p className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26] tabular-nums">
              {summary.needsCaregiverDiscussionCount} of {summary.totalPoints} steps
            </p>
          </div>
        </div>

        {/* Highlight Callout: Talk About These Together */}
        {(summary.pointsNeedingDiscussion.length > 0 ||
          summary.pointsSolvedOnRetry.length > 0) ? (
          <div className="rounded-xl border-2 border-[#F2994A] bg-[#FDE8D4]/65 p-4 space-y-2">
            <h3 className="font-child text-[20px] font-extrabold text-[#3A2E26]">
              {UI_COPY.finishSummary.talkTogetherHeading}
            </h3>
            {summary.pointsNeedingDiscussion.length > 0 && (
              <p className="text-[18px] text-[#3A2E26]">
                <strong>Caregiver discussion still needed (answer explained after 2 incorrect tries):</strong>{' '}
                {summary.pointsNeedingDiscussion.map((p) => p.shortTitle).join('; ')}.
              </p>
            )}
            {summary.pointsSolvedOnRetry.length > 0 && (
              <p className="text-[18px] text-[#3A2E26]">
                <strong>Needed another look (had 1 incorrect attempt, then answered correctly on retry):</strong>{' '}
                {summary.pointsSolvedOnRetry.map((p) => p.shortTitle).join('; ')}.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#1F6F6B] bg-[#DDF1EE]/60 p-4 text-[18px] font-medium text-[#3A2E26]">
            {UI_COPY.finishSummary.allClearMessage}
          </div>
        )}

        {/* Per-Point Detailed Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-[#3A2E26]/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3A2E26]/20 bg-[#FFF8EC] text-sm font-bold text-[#3A2E26]">
                <th className="py-3 px-4">Approved Care Example</th>
                <th className="py-3 px-4">Any Incorrect Attempt?</th>
                <th className="py-3 px-4">Eventually Correct?</th>
                <th className="py-3 px-4">Caregiver Discussion Still Needed?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A2E26]/15 text-base">
              {RECOVERY_POINTS.map((point) => {
                const attempt = state.pointAttempts[point.id];
                const hadIncorrect = Boolean(attempt?.hadIncorrectAttempt);
                const eventuallyCorrect = Boolean(attempt?.eventuallyCorrect);
                const needsDiscussion = Boolean(attempt?.needsCaregiverDiscussion);

                return (
                  <tr key={point.id} className="bg-[#FFFDF8]">
                    <td className="py-3.5 px-4 font-bold text-[#3A2E26]">
                      Step {point.stepNumber}: {point.shortTitle}
                      <span className="block text-sm font-normal text-[#3A2E26]/80">
                        “{point.childInstruction}”
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {hadIncorrect ? (
                        <span className="inline-flex items-center gap-1.5 text-[#3A2E26]">
                          <RotateCcw className="h-4 w-4 text-[#F2994A] shrink-0" aria-hidden="true" />
                          <span>Yes ({attempt?.incorrectAttemptsCount} incorrect)</span>
                        </span>
                      ) : (
                        <span className="text-[#1F6F6B]">No (0 incorrect)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {eventuallyCorrect ? (
                        <span className="inline-flex items-center gap-1.5 text-[#1F6F6B]">
                          <Check className="h-4 w-4 stroke-[3] shrink-0" aria-hidden="true" />
                          <span>
                            {hadIncorrect
                              ? 'Yes (correct on retry)'
                              : 'Yes (correct on 1st try)'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[#3A2E26]">
                          No (answer explained after 2nd try)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {needsDiscussion ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#3A2E26]/25 bg-[#FDE8D4] px-3 py-1 text-sm font-bold text-[#3A2E26]">
                          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>Yes — Discuss together</span>
                        </span>
                      ) : hadIncorrect ? (
                        <span className="text-sm font-semibold text-[#3A2E26]">
                          No (resolved on retry; optional review)
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-[#1F6F6B]">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* EXPLAIN IT TO KARE: SUGGESTED OBSERVATIONS FOR CAREGIVER REVIEW */}
        <div className="rounded-xl border-2 border-[#1F6F6B]/30 bg-[#FFF8EC] p-5 space-y-4">
          <div>
            <span className="text-xs font-bold text-[#1F6F6B]">
              Suggested Observations for Caregiver Review · Not a Validated Comprehension Score
            </span>
            <h3 className="font-child text-[22px] font-extrabold text-[#1F6F6B]">
              “Explain it to Kare” Learning Point Observations
            </h3>
            <p className="text-base text-[#3A2E26]">
              These observations summarize which expected learning points came up when your child talked or typed with Kare, and which points remain unclear to revisit together.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {RECOVERY_POINTS.map((point) => {
              const obs = state.explainObservationsByPointId[point.id];
              const coveredSet = new Set(obs?.coveredLearningPointIds ?? []);
              return (
                <div
                  key={`obs-summary-${point.id}`}
                  className="flex flex-col justify-between rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <h4 className="font-child text-lg font-extrabold text-[#3A2E26]">
                      Step {point.stepNumber}: {point.shortTitle}
                    </h4>

                    <ul className="space-y-2 text-sm">
                      {point.expectedLearningPoints.map((lp) => {
                        const isCovered = coveredSet.has(lp.id);
                        return (
                          <li
                            key={lp.id}
                            className={`rounded-lg border p-2.5 ${
                              isCovered
                                ? 'border-[#1F6F6B] bg-[#DDF1EE]/60 text-[#3A2E26]'
                                : 'border-[#3A2E26]/20 bg-[#FDE8D4]/55 text-[#3A2E26]'
                            }`}
                          >
                            <span className="block font-bold">
                              {isCovered ? '✓ Covered:' : '• Unclear / Not yet mentioned:'}
                            </span>
                            <span>{lp.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onJumpToExplanation(point.id)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#1F6F6B] bg-[#FFF8EC] px-3 py-2 text-sm font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                  >
                    <span>Review Step {point.stepNumber} explanation</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-[#3A2E26]/80">
          <strong>Scope reminder:</strong> {SICKKIDS_SOURCE_INFO.scopeNotice}{' '}
          {SICKKIDS_SOURCE_INFO.approvalNotice}
        </p>
      </section>

      {/* Bottom Bar: Back (bottom left) & Back to home (bottom right) */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-[#3A2E26]/15 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#3A2E26]/40 bg-[#FFFDF8] px-6 py-3 text-xl font-bold text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/40 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.backButton}</span>
        </button>

        <button
          type="button"
          onClick={onHome}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#1F6F6B] px-8 py-3 text-xl font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
        >
          <HomeIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{UI_COPY.story.backToHomeButton}</span>
        </button>
      </div>
    </div>
  );
};
