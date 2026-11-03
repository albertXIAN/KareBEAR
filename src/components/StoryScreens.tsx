/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Screen components for S1 (Home), S2 (Story Page x5), and S3 (Story Finish).
 */

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Home as HomeIcon,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  BEAR_ASSETS,
  ENJOYMENT_OPTIONS,
  FEELING_OPTIONS,
  SICKKIDS_SOURCE_INFO,
  STORY_PAGES,
  UI_COPY,
} from '../data/demoContent';
import type { DemoState } from '../utils/demoState';
import { KareIllustration } from './KareIllustration';
import { ListenButton } from './ListenButton';
import { FaceSelector } from './FaceSelector';

interface S1HomeProps {
  state: DemoState;
  onStartStory: () => void;
  onStartNewRecovery: () => void;
  onResumeRecovery?: () => void;
  onOpenFacilitatorModal: () => void;
}

export const S1HomeScreen: React.FC<S1HomeProps> = ({
  state,
  onStartStory,
  onStartNewRecovery,
  onResumeRecovery,
  onOpenFacilitatorModal,
}) => {
  const hasExistingRecoveryProgress =
    state.caregiverApproved ||
    Object.values(state.pointAttempts).some(
      (a) => a.completed || a.hadIncorrectAttempt
    );

  return (
    <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
      {/* Left Column: Kare Companion Bear */}
      <div className="flex flex-col justify-center lg:col-span-5">
        <KareIllustration
          expression="waving"
          variant="companion"
          caption="Kare is here to explore your hospital visit and cast care steps together."
        />
      </div>

      {/* Right Column: Greeting & Two Large Journey Cards */}
      <div className="flex flex-col justify-between gap-4 lg:col-span-7">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#1F6F6B]">
            <span>{UI_COPY.nonWaterproofTag}</span>
            <span aria-hidden="true">·</span>
            <span>Ages 7–12 &amp; Caregivers</span>
          </div>

          <h1 className="font-child text-[28px] sm:text-[32px] font-extrabold leading-tight text-[#1F6F6B] text-balance">
            {UI_COPY.home.greeting}
          </h1>

          <p className="text-[18px] leading-relaxed text-[#3A2E26]">
            {UI_COPY.home.subtitle}
          </p>

          {/* Two Primary Journey Cards */}
          <div className="mt-2 grid grid-cols-1 gap-3.5 pt-1">
            {/* Journey 1 Card */}
            <button
              type="button"
              onClick={onStartStory}
              className="group flex min-h-[100px] w-full items-center justify-between gap-4 rounded-2xl border-2 border-[#1F6F6B] bg-[#FFFDF8] p-4 text-left transition-colors hover:bg-[#DDF1EE]/60 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <img
                  src={BEAR_ASSETS.doctor.src}
                  alt=""
                  aria-hidden="true"
                  className="h-16 w-16 shrink-0 rounded-xl border border-[#1F6F6B]/25 bg-white object-contain p-1"
                />
                <div className="space-y-1">
                  <span className="block font-child text-[24px] font-extrabold text-[#1F6F6B]">
                    {UI_COPY.home.storyCard.title}
                  </span>
                  <span className="block text-[18px] font-medium text-[#3A2E26]">
                    {UI_COPY.home.storyCard.subtitle}
                  </span>
                  <span className="block text-sm font-semibold text-[#3A2E26]/75">
                    {UI_COPY.home.storyCard.badge}
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#DDF1EE] text-[#1F6F6B] group-hover:bg-[#1F6F6B] group-hover:text-white transition-colors">
                <ArrowRight className="h-6 w-6" aria-hidden="true" />
              </div>
            </button>

            {/* Journey 2 Card */}
            <button
              type="button"
              onClick={onStartNewRecovery}
              className="group flex min-h-[100px] w-full items-center justify-between gap-4 rounded-2xl border-2 border-[#3A2E26]/30 bg-[#FFFDF8] p-4 text-left transition-colors hover:border-[#1F6F6B] hover:bg-[#FDE8D4]/50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <img
                  src={BEAR_ASSETS.checklist.src}
                  alt=""
                  aria-hidden="true"
                  className="h-16 w-16 shrink-0 rounded-xl border border-[#3A2E26]/20 bg-white object-contain p-1"
                />
                <div className="space-y-1">
                  <span className="block font-child text-[24px] font-extrabold text-[#1F6F6B]">
                    {UI_COPY.home.recoveryCard.title}
                  </span>
                  <span className="block text-[18px] font-medium text-[#3A2E26]">
                    {UI_COPY.home.recoveryCard.subtitle}
                  </span>
                  <span className="block text-sm font-semibold text-[#3A2E26]/75">
                    {UI_COPY.home.recoveryCard.badge}
                    {hasExistingRecoveryProgress
                      ? ' · Starting a new session clears previous recovery results'
                      : ''}
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FDE8D4] text-[#3A2E26] group-hover:bg-[#1F6F6B] group-hover:text-white transition-colors">
                <ArrowRight className="h-6 w-6" aria-hidden="true" />
              </div>
            </button>

            {hasExistingRecoveryProgress && onResumeRecovery && (
              <div className="flex items-center justify-between rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/50 px-4 py-3 text-base">
                <span className="font-medium text-[#3A2E26]">
                  You have an active recovery session in memory.
                </span>
                <button
                  type="button"
                  onClick={onResumeRecovery}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#1F6F6B] px-4 py-2 text-base font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Resume current session</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grown-up / Facilitator Reference Bar (Outside child screens) */}
        <div className="rounded-xl border border-[#3A2E26]/15 bg-[#FFFDF8] p-4 text-base text-[#3A2E26]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold text-[#1F6F6B]">
                Grown-ups &amp; Workshop Evaluators
              </p>
              <p className="text-sm text-[#3A2E26]/85">
                {SICKKIDS_SOURCE_INFO.castTypeNotice}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenFacilitatorModal}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Scenario Tasks &amp; SickKids Source</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface S2StoryPageProps {
  state: DemoState;
  onToggleMoreAbout: (pageId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const S2StoryPageScreen: React.FC<S2StoryPageProps> = ({
  state,
  onToggleMoreAbout,
  onBack,
  onNext,
}) => {
  const page = STORY_PAGES[state.storyPageIndex] ?? STORY_PAGES[0];
  const isMoreExpanded = Boolean(state.expandedStoryMoreById[page.id]);

  const textForSpeech = [
    page.title,
    page.kareSpeech,
    isMoreExpanded && page.moreAboutThis ? page.moreAboutThis : '',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left: Illustrated Comic Panel */}
        <div className="flex flex-col justify-between lg:col-span-5">
          <KareIllustration
            expression={page.kareExpression}
            sceneProp={page.sceneProp}
            caption={`Page ${page.pageNumber} of ${STORY_PAGES.length}: ${page.title}`}
          />
        </div>

        {/* Right: Speech Bubble, Listen, More About This */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-7">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-base font-bold text-[#1F6F6B]">
                  Hospital Story · Page {page.pageNumber} of {STORY_PAGES.length}
                </span>
                <h1 className="font-child text-[28px] sm:text-[32px] font-extrabold text-[#1F6F6B]">
                  {page.title}
                </h1>
              </div>

              <ListenButton
                textToRead={textForSpeech}
                enabledByCaregiver={state.caregiverPreferences.enableReadAloud}
              />
            </div>

            {/* Kare Speech Bubble */}
            <div className="relative rounded-2xl border-2 border-[#1F6F6B] bg-[#FFFDF8] p-6 shadow-xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#1F6F6B]">
                  Kare says:
                </span>
                {page.speechNeedsReviewFlag && (
                  <span
                    title={SICKKIDS_SOURCE_INFO.reviewFlagLegend}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A2E26] bg-[#FDE8D4] px-2.5 py-1 rounded-md border border-[#3A2E26]/20"
                  >
                    <span>⚑ Needs clinical review</span>
                  </span>
                )}
              </div>

              <p className="font-child text-[24px] sm:text-[26px] font-bold leading-[1.5] text-[#3A2E26]">
                “{page.kareSpeech}”
              </p>
            </div>

            {/* Optional Expandable "More about this" */}
            {page.moreAboutThis && (
              <div className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-4">
                <button
                  type="button"
                  onClick={() => onToggleMoreAbout(page.id)}
                  aria-expanded={isMoreExpanded}
                  aria-controls={`more-about-panel-${page.id}`}
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
                    id={`more-about-panel-${page.id}`}
                    className="mt-3 border-t border-[#3A2E26]/15 pt-4 px-3 space-y-2"
                  >
                    <p className="font-child text-[22px] leading-[1.5] text-[#3A2E26]">
                      {page.moreAboutThis}
                    </p>
                    {page.moreAboutNeedsReviewFlag && (
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A2E26] bg-[#FDE8D4] px-2.5 py-1 rounded-md border border-[#3A2E26]/20">
                        <span>⚑ Wording marked for clinical source review</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Back (bottom left) & Next (bottom right) */}
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
          onClick={onNext}
          className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#1F6F6B] px-8 py-3 text-xl font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>{UI_COPY.story.nextButton}</span>
          <ArrowRight className="h-6 w-6 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

interface S3StoryFinishProps {
  state: DemoState;
  onSelectFeeling: (id: string | null) => void;
  onSelectEnjoyment: (id: string | null) => void;
  onBack: () => void;
  onHome: () => void;
}

export const S3StoryFinishScreen: React.FC<S3StoryFinishProps> = ({
  state,
  onSelectFeeling,
  onSelectEnjoyment,
  onBack,
  onHome,
}) => {
  const speechText = `${UI_COPY.story.finishTitle} ${UI_COPY.story.finishSubtitle} ${UI_COPY.story.feelingsQuestion}`;

  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left: Kare Celebrating */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <KareIllustration
            expression="celebrating"
            sceneProp="going-home"
            caption="Kare is celebrating with you after finishing the hospital story!"
          />
        </div>

        {/* Right: Celebration + Optional Feelings & Enjoyment Questions */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-7">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-child text-[30px] sm:text-[34px] font-extrabold text-[#1F6F6B]">
                {UI_COPY.story.finishTitle}
              </h1>
              <ListenButton
                textToRead={speechText}
                enabledByCaregiver={state.caregiverPreferences.enableReadAloud}
              />
            </div>

            <p className="font-child text-[22px] leading-[1.5] text-[#3A2E26]">
              {UI_COPY.story.finishSubtitle}
            </p>

            {/* Optional Feelings Question */}
            <FaceSelector
              question={UI_COPY.story.feelingsQuestion}
              optionalNote="Optional — pick a face if you want to share how you feel. You can always continue without picking one."
              options={FEELING_OPTIONS}
              selectedId={state.selectedStoryFeelingId}
              onSelect={onSelectFeeling}
              groupName="How do you feel about getting your cast now?"
            />

            {/* Optional Enjoyment Question */}
            <FaceSelector
              question={UI_COPY.finishSummary.enjoymentQuestion}
              optionalNote="Optional — tell us if you liked reading the story with Kare."
              options={ENJOYMENT_OPTIONS}
              selectedId={state.selectedStoryEnjoymentId}
              onSelect={onSelectEnjoyment}
              groupName="Did you like learning with Kare?"
            />
          </div>
        </div>
      </div>

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
