/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pre-Operative Preparation Hub, 8 Illustrated Equipment & Procedure Lessons,
 * Caregiver Setup Modal (Age Band, Language, Detail Preference, Narration),
 * and Adult Post-Op Mode Activation Modal.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  HelpCircle,
  Lock,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  convertPreOpLessonToRecoveryPoint,
  PRE_OP_LESSONS,
  SURGERY_UI_COPY,
  VERIFIED_SOURCES,
} from '../data/surgeryContent';
import type {
  AgeBand,
  AppLanguage,
  DetailPreference,
  PostOpActivationState,
  PreOpLessonItem,
  PresentationPreferences,
} from '../utils/surgeryDataModel';
import type {
  ExplainMessage,
  PointExplainObservation,
} from '../utils/explainKareLogic';
import { KareMascot } from '../mascot/KareMascot';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';
import { ListenButton } from './ListenButton';
import { ExplainItToKarePanel } from './ExplainItToKarePanel';

/* -------------------------------------------------------------------------- */
/* 1. CAREGIVER SETUP MODAL (AGE BAND, LANGUAGE, DETAIL LEVEL, NARRATION)     */
/* -------------------------------------------------------------------------- */

interface CaregiverSetupModalProps {
  isOpen: boolean;
  preferences: PresentationPreferences;
  onSavePreferences: (next: PresentationPreferences) => void;
  onClose: () => void;
}

export const CaregiverSetupModal: React.FC<CaregiverSetupModalProps> = ({
  isOpen,
  preferences,
  onSavePreferences,
  onClose,
}) => {
  const [draft, setDraft] = useState<PresentationPreferences>(preferences);

  React.useEffect(() => {
    if (isOpen) {
      setDraft(preferences);
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const copy = SURGERY_UI_COPY[draft.language].setupModal;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(draft);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="caregiver-setup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E26]/65 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-[#3A2E26]/25 bg-[#FFF8EC] p-6 text-[#3A2E26] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#3A2E26]/15 pb-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#1F6F6B]">
              KareBEAR · Caregiver Presentation Controls
            </p>
            <h2
              id="caregiver-setup-modal-title"
              className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26]"
            >
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup modal"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border-2 border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-2 font-bold text-[#3A2E26] hover:bg-[#DDF1EE] cursor-pointer"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-5">
          <p className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/50 p-3.5 text-base font-medium leading-relaxed text-[#3A2E26]">
            {copy.subtitle}
          </p>

          {/* Language Selection */}
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-lg font-extrabold text-[#3A2E26]">
              <Globe className="h-5 w-5 text-[#1F6F6B]" aria-hidden="true" />
              <span>{copy.languageLabel}</span>
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['en', 'fr'] as AppLanguage[]).map((lang) => {
                const isSelected = draft.language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, language: lang }))}
                    aria-pressed={isSelected}
                    className={`flex min-h-[56px] items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                        : 'border-[#3A2E26]/25 bg-[#FFFDF8] text-[#3A2E26] hover:bg-[#DDF1EE]/60'
                    }`}
                  >
                    <span>
                      {lang === 'en' ? 'English (EN)' : 'Français (FR) ⚑'}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {draft.language === 'fr' && (
              <p className="rounded-xl border border-[#E76F51]/40 bg-[#FDE8D4]/70 p-3 text-sm font-semibold text-[#3A2E26]">
                {copy.frenchReviewNote}
              </p>
            )}
          </fieldset>

          {/* Age Band Selection */}
          <fieldset className="space-y-2">
            <legend className="text-lg font-extrabold text-[#3A2E26]">
              {copy.ageBandLabel}
            </legend>
            <div className="grid grid-cols-1 gap-2.5">
              {(['3-6', '7-9', '10-12'] as AgeBand[]).map((band) => {
                const isSelected = draft.ageBand === band;
                return (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, ageBand: band }))}
                    aria-pressed={isSelected}
                    className={`flex min-h-[56px] items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#1F6F6B] bg-[#DDF1EE] text-[#1F6F6B]'
                        : 'border-[#3A2E26]/20 bg-[#FFFDF8] text-[#3A2E26] hover:bg-[#DDF1EE]/40'
                    }`}
                  >
                    <span>{copy.ageBandDescriptions[band]}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1F6F6B]" />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Detail Preference (Kept separate from chronological age) */}
          <fieldset className="space-y-2">
            <legend className="text-lg font-extrabold text-[#3A2E26]">
              {copy.detailLabel}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['simple', 'extra-detail'] as DetailPreference[]).map(
                (level) => {
                  const isSelected = draft.detailLevel === level;
                  const label =
                    level === 'simple' ? copy.detailSimple : copy.detailExtra;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, detailLevel: level }))
                      }
                      aria-pressed={isSelected}
                      className={`flex min-h-[56px] items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-base font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#1F6F6B] bg-[#DDF1EE] text-[#1F6F6B]'
                          : 'border-[#3A2E26]/20 bg-[#FFFDF8] text-[#3A2E26] hover:bg-[#DDF1EE]/40'
                      }`}
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1F6F6B]" />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>

          {/* Narration Toggle */}
          <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-base font-bold text-[#3A2E26]">
                {copy.narrationLabel}
              </span>
              <input
                type="checkbox"
                checked={draft.narrationEnabled}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    narrationEnabled: e.target.checked,
                  }))
                }
                className="h-6 w-6 accent-[#1F6F6B] cursor-pointer"
              />
            </label>
          </div>

          <p className="text-xs font-medium text-[#3A2E26]/80">
            {copy.privacyNote}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#3A2E26]/15 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFFDF8] px-5 py-2.5 text-base font-bold text-[#3A2E26] hover:bg-[#FDE8D4]/50 cursor-pointer"
            >
              {SURGERY_UI_COPY[draft.language].postOpModal.cancelButton}
            </button>
            <button
              type="submit"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#1F6F6B] px-6 py-2.5 text-base font-bold text-white hover:bg-[#165350] cursor-pointer"
            >
              {copy.saveButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. ADULT POST-OP ACTIVATION MODAL                                          */
/* -------------------------------------------------------------------------- */

interface ActivatePostOpModalProps {
  isOpen: boolean;
  language: AppLanguage;
  onConfirmActivate: () => void;
  onClose: () => void;
}

export const ActivatePostOpModal: React.FC<ActivatePostOpModalProps> = ({
  isOpen,
  language,
  onConfirmActivate,
  onClose,
}) => {
  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setCheckedDisclaimer(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copy = SURGERY_UI_COPY[language].postOpModal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-postop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E26]/65 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl border-2 border-[#3A2E26]/25 bg-[#FFF8EC] p-6 text-[#3A2E26] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#3A2E26]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert
              className="h-7 w-7 shrink-0 text-[#E76F51]"
              aria-hidden="true"
            />
            <h2
              id="activate-postop-modal-title"
              className="font-child text-2xl font-extrabold text-[#3A2E26]"
            >
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close post-op activation modal"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border-2 border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-2 font-bold text-[#3A2E26] hover:bg-[#DDF1EE] cursor-pointer"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="rounded-xl border-2 border-[#E76F51]/50 bg-[#FDE8D4]/70 p-4 text-base font-medium leading-relaxed text-[#3A2E26]">
            {copy.explanation}
          </p>

          <label className="flex items-start gap-3 rounded-xl border-2 border-[#1F6F6B]/30 bg-[#FFFDF8] p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedDisclaimer}
              onChange={(e) => setCheckedDisclaimer(e.target.checked)}
              className="mt-1 h-6 w-6 shrink-0 accent-[#1F6F6B] cursor-pointer"
            />
            <span className="text-base font-bold text-[#3A2E26]">
              {copy.checkboxLabel}
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#3A2E26]/15 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFFDF8] px-5 py-2.5 text-base font-bold text-[#3A2E26] hover:bg-[#FDE8D4]/50 cursor-pointer"
          >
            {copy.cancelButton}
          </button>
          <button
            type="button"
            disabled={!checkedDisclaimer}
            onClick={onConfirmActivate}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#E76F51] px-6 py-2.5 text-base font-extrabold text-white transition-opacity hover:bg-[#d45d3f] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
          >
            {copy.confirmButton}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. PRE-OP PREPARATION HUB (MAIN SURGERY EXPERIENCE LANDING)                */
/* -------------------------------------------------------------------------- */

interface PreOpHubScreenProps {
  preferences: PresentationPreferences;
  completedLessonIds: string[];
  postOpActivation: PostOpActivationState;
  onSelectLesson: (lessonId: string) => void;
  onOpenSetupModal: () => void;
  onRequestActivatePostOp: () => void;
  onOpenPostOpDashboard: () => void;
  onOpenParentResources: () => void;
  onOpenCastDemo: () => void;
  onOpenFacilitatorModal: () => void;
}

export const PreOpHubScreen: React.FC<PreOpHubScreenProps> = ({
  preferences,
  completedLessonIds,
  postOpActivation,
  onSelectLesson,
  onOpenSetupModal,
  onRequestActivatePostOp,
  onOpenPostOpDashboard,
  onOpenParentResources,
  onOpenCastDemo,
  onOpenFacilitatorModal,
}) => {
  const { mascotState, renderMode, mouthOpen, isSpeaking } = useMascotRuntime();
  const lang = preferences.language;
  const copy = SURGERY_UI_COPY[lang];

  return (
    <div className="space-y-6">
      {/* HERO BANNER WITH KARE MASCOT & PRESENTATION CONTROLS */}
      <section className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Mascot Column */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[#1F6F6B]/20 bg-[#DDF1EE]/40 p-4 lg:col-span-4">
            <KareMascot
              size="lg"
              preset="doctor"
              state={mascotState}
              renderMode={renderMode}
              mouthOpen={mouthOpen}
              speaking={isSpeaking}
              label="Kare the hospital preparation companion bear"
            />
            <span className="mt-2 rounded-lg bg-[#FFFDF8] px-3 py-1 text-xs font-extrabold text-[#1F6F6B] border border-[#1F6F6B]/25">
              {lang === 'fr'
                ? 'Compagnon de préparation KareBEAR'
                : 'KareBEAR Hospital Preparation Companion'}
            </span>
          </div>

          {/* Copy & Quick Actions Column */}
          <div className="space-y-4 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#1F6F6B] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                {lang === 'fr'
                  ? `Tranche d’âge : ${preferences.ageBand} ans`
                  : `Age Band: ${preferences.ageBand} yrs`}
              </span>
              <span className="rounded-lg border border-[#1F6F6B]/40 bg-[#DDF1EE] px-3 py-1 text-xs font-extrabold text-[#1F6F6B]">
                {lang === 'fr' ? 'Langue : Français (FR) ⚑' : 'Language: English (EN)'}
              </span>
              <span className="rounded-lg border border-[#3A2E26]/25 bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#3A2E26]">
                {preferences.detailLevel === 'extra-detail'
                  ? lang === 'fr'
                    ? 'Mode : Détails supplémentaires'
                    : 'Mode: Extra detail'
                  : lang === 'fr'
                  ? 'Mode : Simple'
                  : 'Mode: Simple'}
              </span>
            </div>

            <h1 className="font-child text-2xl font-extrabold text-[#3A2E26] sm:text-3xl">
              {copy.preOpHub.heading}
            </h1>

            <p className="text-base leading-relaxed text-[#3A2E26]/90 sm:text-lg">
              {copy.preOpHub.subheading}
            </p>

            {/* Scope Guardrail Notice */}
            <div className="rounded-xl border border-[#E76F51]/40 bg-[#FDE8D4]/60 p-3.5 text-sm font-medium leading-relaxed text-[#3A2E26]">
              {copy.preOpHub.scopeBanner}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <ListenButton
                textToRead={`${copy.preOpHub.heading}. ${copy.preOpHub.subheading}`}
                enabledByCaregiver={preferences.narrationEnabled}
                language={lang}
                contentVersion={`hub-${lang}-${preferences.ageBand}`}
              />

              <button
                type="button"
                onClick={onOpenSetupModal}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2.5 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
              >
                <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{copy.topNav.setupBtn}</span>
              </button>

              {postOpActivation.isActivated ? (
                <button
                  type="button"
                  onClick={onOpenPostOpDashboard}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#E76F51] px-5 py-2.5 text-base font-extrabold text-white hover:bg-[#d45d3f] cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    {lang === 'fr'
                      ? 'Ouvrir le mode post-opératoire (Activé)'
                      : 'Open Post-Op Recovery Mode (Activated)'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRequestActivatePostOp}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#E76F51] bg-[#FDE8D4]/80 px-4 py-2.5 text-base font-extrabold text-[#3A2E26] hover:bg-[#FDE8D4] cursor-pointer"
                >
                  <Lock className="h-5 w-5 shrink-0 text-[#E76F51]" aria-hidden="true" />
                  <span>{copy.topNav.activatePostOpBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8 PRE-OPERATIVE EQUIPMENT & PROCEDURE LESSONS GRID */}
      <section aria-labelledby="preop-lessons-grid-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="preop-lessons-grid-heading"
            className="font-child text-xl font-extrabold text-[#3A2E26] sm:text-2xl"
          >
            {lang === 'fr'
              ? 'Les 8 étapes et objets de préparation à l’hôpital'
              : '8 Hospital Preparation & Equipment Lessons'}
          </h2>
          <span className="text-sm font-bold text-[#1F6F6B]">
            {completedLessonIds.length} / {PRE_OP_LESSONS.length}{' '}
            {lang === 'fr' ? 'explorés' : 'explored'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRE_OP_LESSONS.map((lesson) => {
            const variant = lesson.variants[lang];
            const isCompleted = completedLessonIds.includes(lesson.id);
            const reviewState = lesson.reviewStatus[lang];

            return (
              <article
                key={lesson.id}
                className="flex flex-col justify-between rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-4 shadow-xs transition-all hover:border-[#1F6F6B]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#DDF1EE] px-2.5 py-1 text-xs font-extrabold text-[#1F6F6B]">
                      <span>#{lesson.stepNumber}</span>
                      <span aria-hidden="true">{lesson.iconEmoji}</span>
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#2A7B4C]/15 px-2.5 py-1 text-xs font-extrabold text-[#2A7B4C]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{copy.preOpHub.completedBadge}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-child text-lg font-extrabold leading-snug text-[#3A2E26]">
                    {variant.title}
                  </h3>

                  <p className="text-sm font-medium text-[#3A2E26]/85 line-clamp-3">
                    {variant.whatItIs[preferences.ageBand]}
                  </p>

                  <div className="pt-1">
                    {reviewState === 'needs-clinical-review' ? (
                      <span className="inline-block rounded-md border border-[#E76F51]/50 bg-[#FDE8D4]/70 px-2 py-0.5 text-[11px] font-bold text-[#3A2E26]">
                        {copy.badges.needsClinicalReview}
                      </span>
                    ) : (
                      <span className="inline-block rounded-md border border-[#1F6F6B]/30 bg-[#DDF1EE]/50 px-2 py-0.5 text-[11px] font-bold text-[#1F6F6B]">
                        {copy.badges.reviewedDemo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#3A2E26]/10">
                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1F6F6B] px-4 py-2.5 text-base font-bold text-white hover:bg-[#165350] cursor-pointer"
                  >
                    <span>{copy.preOpHub.exploreLesson}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECONDARY CARDS: PARENT RESOURCES, CAST DEMO REGRESSION, & HOST EVALUATION */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5">
          <div className="space-y-2">
            <h3 className="font-child text-lg font-extrabold text-[#1F6F6B]">
              {copy.topNav.parentResources}
            </h3>
            <p className="text-sm text-[#3A2E26]/85">
              {lang === 'fr'
                ? 'Sources publiques vérifiées (Boston Children’s Hospital, AAP HealthyChildren, SickKids) et espace pour les coordonnées de votre équipe de soins.'
                : 'Verified hospital & child-life sources (Boston Children’s Hospital, AAP HealthyChildren, SickKids) plus care-team contact notes.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenParentResources}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-sm font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{copy.topNav.parentResources}</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5">
          <div className="space-y-2">
            <h3 className="font-child text-lg font-extrabold text-[#3A2E26]">
              {copy.topNav.castDemo}
            </h3>
            <p className="text-sm text-[#3A2E26]/85">
              {lang === 'fr'
                ? 'Parcours de démonstration initial (plâtre non imperméable S1–S8) conservé intact pour les tests de non-régression.'
                : 'Original non-waterproof arm cast demonstration journey (S1–S8) preserved intact for regression testing.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCastDemo}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2 text-sm font-bold text-[#3A2E26] hover:bg-[#FDE8D4]/60 cursor-pointer"
          >
            <Stethoscope className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{copy.topNav.castDemo}</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5">
          <div className="space-y-2">
            <h3 className="font-child text-lg font-extrabold text-[#3A2E26]">
              {lang === 'fr'
                ? 'Guide de l’animateur et tâches d’évaluation (5 min)'
                : 'Host Facilitator Guide & 5-Min Peer Tasks'}
            </h3>
            <p className="text-sm text-[#3A2E26]/85">
              {lang === 'fr'
                ? 'Réservé aux adultes et évaluateurs : tâches de test par les pairs de 5 minutes et traçabilité des preuves.'
                : 'Strictly outside child screens: 5-minute peer evaluation tasks and evidence traceability.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFacilitatorModal}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2 text-sm font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/60 cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {lang === 'fr'
                ? 'Ouvrir le guide de l’animateur'
                : 'Open Facilitator & Peer Tasks'}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. PRE-OP LESSON DETAIL SCREEN (TEMPLATE FOR ALL 8 LESSONS)                */
/* -------------------------------------------------------------------------- */

interface PreOpLessonDetailScreenProps {
  lesson: PreOpLessonItem;
  preferences: PresentationPreferences;
  selectedChoiceId: string | null;
  observation: PointExplainObservation;
  onSelectChoice: (lessonId: string, choiceId: string) => void;
  onRecordExplainTurn: (
    pointId: string,
    newMessages: ExplainMessage[],
    coveredPointIds: string[]
  ) => void;
  onBackToHub: () => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenSetupModal: () => void;
}

export const PreOpLessonDetailScreen: React.FC<PreOpLessonDetailScreenProps> = ({
  lesson,
  preferences,
  selectedChoiceId,
  observation,
  onSelectChoice,
  onRecordExplainTurn,
  onBackToHub,
  onSelectLesson,
  onOpenSetupModal,
}) => {
  const {
    mascotState,
    renderMode,
    mouthOpen,
    isSpeaking,
    triggerTransientGesture,
  } = useMascotRuntime();

  const lang = preferences.language;
  const ageBand = preferences.ageBand;
  const copy = SURGERY_UI_COPY[lang];
  const variant = lesson.variants[lang];

  const [showExtraDetail, setShowExtraDetail] = useState(
    preferences.detailLevel === 'extra-detail'
  );

  React.useEffect(() => {
    setShowExtraDetail(preferences.detailLevel === 'extra-detail');
  }, [preferences.detailLevel, lesson.id]);

  const currentIndex = PRE_OP_LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? PRE_OP_LESSONS[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < PRE_OP_LESSONS.length - 1
      ? PRE_OP_LESSONS[currentIndex + 1]
      : null;

  const selectedChoice = variant.comprehensionChoices.find(
    (c) => c.id === selectedChoiceId
  );

  const combinedNarrationText = [
    variant.title,
    variant.whatItIs[ageBand],
    variant.whatYouMaySeeOrFeel[ageBand],
    variant.sourceGroundedExplanation[ageBand],
    showExtraDetail ? variant.extraDetail : '',
  ]
    .filter(Boolean)
    .join(' ');

  const adaptedRecoveryPoint = convertPreOpLessonToRecoveryPoint(
    lesson,
    lang,
    ageBand
  );

  return (
    <div className="space-y-6">
      {/* Top Lesson Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#3A2E26]/15 bg-[#FFFDF8] px-4 py-3">
        <button
          type="button"
          onClick={onBackToHub}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{copy.preOpHub.backToHub}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#1F6F6B] px-3 py-1 text-xs font-extrabold text-white">
            #{lesson.stepNumber} / {PRE_OP_LESSONS.length}
          </span>
          <span className="rounded-lg border border-[#1F6F6B]/30 bg-[#DDF1EE] px-3 py-1 text-xs font-extrabold text-[#1F6F6B]">
            {lang.toUpperCase()} · {ageBand}
          </span>
          {lesson.reviewStatus[lang] === 'needs-clinical-review' ? (
            <span className="rounded-lg border border-[#E76F51] bg-[#FDE8D4] px-3 py-1 text-xs font-extrabold text-[#3A2E26]">
              {copy.badges.needsClinicalReview}
            </span>
          ) : (
            <span className="rounded-lg border border-[#1F6F6B]/30 bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#1F6F6B]">
              {copy.badges.reviewedDemo}
            </span>
          )}
          <button
            type="button"
            onClick={onOpenSetupModal}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#3A2E26]/30 bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/50 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{copy.topNav.setupBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Lesson Card */}
      <section className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Kare Mascot Illustration Column */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[#1F6F6B]/25 bg-[#DDF1EE]/40 p-5 lg:col-span-4">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#1F6F6B]/30 bg-[#FFFDF8] px-3.5 py-1 text-sm font-extrabold text-[#1F6F6B]">
              <span aria-hidden="true">{lesson.iconEmoji}</span>
              <span>{lesson.sceneBadgeText[lang]}</span>
            </div>

            <KareMascot
              size="lg"
              preset={lesson.karePreset}
              state={mascotState}
              renderMode={renderMode}
              mouthOpen={mouthOpen}
              speaking={isSpeaking}
              label={`Kare demonstrating ${variant.title}`}
            />

            <div className="mt-4">
              <ListenButton
                textToRead={combinedNarrationText}
                enabledByCaregiver={preferences.narrationEnabled}
                language={lang}
                contentVersion={`${lesson.id}-${lesson.contentVersion}-${lang}-${ageBand}-${showExtraDetail ? 'extra' : 'simple'}`}
              />
            </div>
          </div>

          {/* Structured Content Sections */}
          <div className="space-y-4 lg:col-span-8">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                {variant.shortSubtitle}
              </p>
              <h1 className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26] sm:text-3xl">
                {variant.title}
              </h1>
            </div>

            {/* 1. What it is */}
            <div className="rounded-xl border-2 border-[#1F6F6B]/25 bg-[#FFF8EC] p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                {copy.preOpHub.whatItIsHeading}
              </h2>
              <p className="mt-1.5 font-child text-lg font-bold leading-relaxed text-[#3A2E26]">
                {variant.whatItIs[ageBand]}
              </p>
            </div>

            {/* 2. What you may see or feel */}
            <div className="rounded-xl border-2 border-[#E76F51]/35 bg-[#FDE8D4]/45 p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#3A2E26]">
                {copy.preOpHub.whatYouMaySeeHeading}
              </h2>
              <p className="mt-1.5 font-child text-lg font-medium leading-relaxed text-[#3A2E26]">
                {variant.whatYouMaySeeOrFeel[ageBand]}
              </p>
            </div>

            {/* 3. Source-grounded explanation */}
            <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                {copy.preOpHub.whyItHelpsHeading}
              </h2>
              <p className="mt-1.5 text-base font-medium leading-relaxed text-[#3A2E26]">
                {variant.sourceGroundedExplanation[ageBand]}
              </p>

              {/* Verified Source Citations */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#3A2E26]/10 pt-2.5 text-xs">
                <span className="font-bold text-[#3A2E26]/80">
                  {copy.preOpHub.sourceHeading}:
                </span>
                {lesson.sourceReferenceIds.map((refId) => {
                  const source = VERIFIED_SOURCES[refId];
                  if (!source) return null;
                  return (
                    <a
                      key={refId}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#1F6F6B] underline hover:text-[#3A2E26]"
                    >
                      <span>
                        {source.publisher} ({source.title})
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* 4. Optional Extra Detail */}
            <div className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/35 p-4">
              <button
                type="button"
                onClick={() => setShowExtraDetail((s) => !s)}
                aria-expanded={showExtraDetail}
                className="flex w-full items-center justify-between text-left text-base font-extrabold text-[#1F6F6B] cursor-pointer"
              >
                <span>{copy.preOpHub.extraDetailHeading}</span>
                {showExtraDetail ? (
                  <ChevronUp className="h-5 w-5 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0" />
                )}
              </button>
              {showExtraDetail && (
                <p className="mt-2.5 text-base leading-relaxed text-[#3A2E26]">
                  {variant.extraDetail}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comprehension Check */}
      <section
        aria-labelledby="preop-comprehension-heading"
        className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="preop-comprehension-heading"
            className="font-child text-xl font-extrabold text-[#1F6F6B]"
          >
            {copy.preOpHub.comprehensionHeading}
          </h2>
          <span className="rounded-lg bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#3A2E26] border border-[#3A2E26]/15">
            {copy.badges.alwaysIncluded}
          </span>
        </div>

        <p className="font-child text-lg font-bold text-[#3A2E26]">
          {variant.comprehensionQuestion}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {variant.comprehensionChoices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => {
                  triggerTransientGesture(
                    choice.isCorrect ? 'celebrating' : 'encouraging',
                    2400
                  );
                  onSelectChoice(lesson.id, choice.id);
                }}
                aria-pressed={isSelected}
                className={`flex min-h-[64px] items-center justify-between gap-3 rounded-xl border-2 p-4 text-left font-child text-base font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? choice.isCorrect
                      ? 'border-[#2A7B4C] bg-[#2A7B4C]/15 text-[#3A2E26]'
                      : 'border-[#E76F51] bg-[#FDE8D4] text-[#3A2E26]'
                    : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26] hover:border-[#1F6F6B] hover:bg-[#DDF1EE]/50'
                }`}
              >
                <span>{choice.text}</span>
                {isSelected && (
                  <CheckCircle2
                    className={`h-6 w-6 shrink-0 ${
                      choice.isCorrect ? 'text-[#2A7B4C]' : 'text-[#E76F51]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedChoice && (
          <div
            role="status"
            className={`rounded-xl border-2 p-4 text-base font-bold ${
              selectedChoice.isCorrect
                ? 'border-[#2A7B4C] bg-[#2A7B4C]/10 text-[#2A7B4C]'
                : 'border-[#E76F51] bg-[#FDE8D4]/70 text-[#3A2E26]'
            }`}
          >
            {selectedChoice.supportiveFeedback}
          </div>
        )}
      </section>

      {/* Ask a Caregiver or Explain in Your Own Words (Reusing ExplainItToKarePanel) */}
      <section className="space-y-3">
        <div className="rounded-xl border-2 border-[#1F6F6B]/30 bg-[#DDF1EE]/40 p-4">
          <h2 className="font-child text-lg font-extrabold text-[#1F6F6B]">
            {copy.preOpHub.askOrExplainHeading}
          </h2>
          <p className="mt-1 font-child text-base font-bold text-[#3A2E26]">
            “{variant.askOrExplainPrompt}”
          </p>
        </div>

        <ExplainItToKarePanel
          point={adaptedRecoveryPoint}
          observation={observation}
          onRecordTurn={onRecordExplainTurn}
          onJumpToExplanation={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          isOnLearnScreen={true}
        />
      </section>

      {/* Bottom Lesson Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#3A2E26]/15 bg-[#FFFDF8] p-4">
        {prevLesson ? (
          <button
            type="button"
            onClick={() => onSelectLesson(prevLesson.id)}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2.5 text-base font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/50 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {copy.preOpHub.previousLesson}: #{prevLesson.stepNumber}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onBackToHub}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2.5 text-base font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/50 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{copy.preOpHub.backToHub}</span>
          </button>
        )}

        {nextLesson ? (
          <button
            type="button"
            onClick={() => onSelectLesson(nextLesson.id)}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#1F6F6B] px-5 py-2.5 text-base font-bold text-white hover:bg-[#165350] cursor-pointer"
          >
            <span>
              {copy.preOpHub.nextLesson}: #{nextLesson.stepNumber}{' '}
              {nextLesson.variants[lang].title}
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onBackToHub}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#1F6F6B] px-5 py-2.5 text-base font-bold text-white hover:bg-[#165350] cursor-pointer"
          >
            <span>{copy.preOpHub.backToHub}</span>
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
