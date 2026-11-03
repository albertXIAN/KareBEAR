/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Post-Operative Recovery Mode Screens:
 * 1. Caregiver Appointment Capture, Transcript Correction, Uncertainty Resolution,
 *    Plain-Language Summary Review, and Versioned Bear-Story Draft Release.
 * 2. Child & Caregiver Post-Op Dashboard: Released Story Reader, Grounded Care Tasks
 *    (preserving missing schedule fields like "twice daily" without inventing clock times),
 *    Caregiver-Only Task Confirmation, and Idempotent Positive Reward Ledger.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  FileAudio,
  HeartHandshake,
  Lock,
  Mic,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  COSMETIC_REWARDS,
  SURGERY_UI_COPY,
} from '../data/surgeryContent';
import {
  calculateTotalPoints,
  detectDisallowedReassurancePhrases,
  isItemBlockedByUncertainty,
  type AppointmentCaptureState,
  type BearStoryDraft,
  type CorrectedTranscriptObject,
  type MachineTranscriptObject,
  type PlainLanguageSummaryDraft,
  type PostOpCareTask,
  type PresentationPreferences,
  type RewardLedgerState,
  type TranscriptUncertaintyFlag,
} from '../utils/surgeryDataModel';
import type { KareCostumePreset } from '../mascot/kareArtwork';
import { KareMascot } from '../mascot/KareMascot';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';
import { ListenButton } from './ListenButton';

export type PostOpSubTab = 'caregiver-appointment' | 'postop-dashboard';

interface PostOpWorkspaceProps {
  preferences: PresentationPreferences;
  activeSubTab: PostOpSubTab;
  onChangeSubTab: (tab: PostOpSubTab) => void;
  captureState: AppointmentCaptureState;
  recordingConsentChecked: boolean;
  onToggleRecordingConsent: (checked: boolean) => void;
  machineTranscript: MachineTranscriptObject | null;
  correctedTranscript: CorrectedTranscriptObject | null;
  uncertaintyFlags: TranscriptUncertaintyFlag[];
  summaryDraft: PlainLanguageSummaryDraft;
  storyDraft: BearStoryDraft;
  careTasks: PostOpCareTask[];
  rewardLedger: RewardLedgerState;
  onLoadSampleFixture: () => void;
  onLiveTranscriptCaptured: (transcript: MachineTranscriptObject) => void;
  onDiscardSessionData: () => void;
  onEditTranscriptSegment: (segmentId: string, newText: string) => void;
  onResolveUncertaintyFlag: (
    flagId: string,
    resolved: boolean,
    clarificationNote: string
  ) => void;
  onUpdateSummaryFromServer: (nextSummary: PlainLanguageSummaryDraft) => void;
  onEditSummaryItem: (
    section:
      | 'whatWasDiscussed'
      | 'whatToDo'
      | 'whenToSeekHelp'
      | 'questionsToClarify',
    itemId: string,
    newText: string
  ) => void;
  onMarkSummaryReviewed: () => void;
  onUpdateStoryDraft: (nextStory: BearStoryDraft) => void;
  onEditStoryPage: (
    pageId: string,
    field: 'title' | 'bodyText' | 'extraDetailText',
    value: string
  ) => void;
  onReleaseStoryToChild: () => void;
  onApproveTaskForChild: (taskId: string) => void;
  onChildTapReadyOrHelp: (taskId: string) => void;
  onCaregiverConfirmTask: (taskId: string) => void;
  onCaregiverRevokeTask: (taskId: string) => void;
  onUnlockOrEquipCosmetic: (cosmeticId: string, costPoints: number) => void;
  onReturnToPreOp: () => void;
  onOpenSetupModal: () => void;
}

export const PostOpWorkspace: React.FC<PostOpWorkspaceProps> = ({
  preferences,
  activeSubTab,
  onChangeSubTab,
  recordingConsentChecked,
  onToggleRecordingConsent,
  machineTranscript,
  correctedTranscript,
  uncertaintyFlags,
  summaryDraft,
  storyDraft,
  careTasks,
  rewardLedger,
  onLoadSampleFixture,
  onLiveTranscriptCaptured,
  onDiscardSessionData,
  onEditTranscriptSegment,
  onResolveUncertaintyFlag,
  onUpdateSummaryFromServer,
  onEditSummaryItem,
  onMarkSummaryReviewed,
  onUpdateStoryDraft,
  onEditStoryPage,
  onReleaseStoryToChild,
  onApproveTaskForChild,
  onChildTapReadyOrHelp,
  onCaregiverConfirmTask,
  onCaregiverRevokeTask,
  onUnlockOrEquipCosmetic,
  onReturnToPreOp,
  onOpenSetupModal,
}) => {
  const {
    mascotState,
    renderMode,
    mouthOpen,
    isSpeaking,
    setListening,
    triggerTransientGesture,
  } = useMascotRuntime();

  const lang = preferences.language;
  const ageBand = preferences.ageBand;
  const copy = SURGERY_UI_COPY[lang];

  // Recording state (requests mic ONLY after Start is pressed)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [isRegeneratingStory, setIsRegeneratingStory] = useState(false);
  const [activeStoryPageIndex, setActiveStoryPageIndex] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const stopMediaTracksCleanly = () => {
    if (timerIntervalRef.current !== null && typeof window !== 'undefined') {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {}
      }
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setListening(false);
  };

  // Stop microphone tracks on unmount or tab switch
  useEffect(() => {
    return () => {
      stopMediaTracksCleanly();
    };
  }, [activeSubTab]);

  const formatElapsed = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleStartAppointmentRecording = async () => {
    if (!recordingConsentChecked) return;
    setRecordingNotice(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setRecordingNotice(
        lang === 'fr'
          ? 'Microphone non disponible dans ce navigateur. Utilisez le bouton « Charger l’exemple de rendez-vous ».'
          : 'Microphone capture is unavailable in this browser. Please use "Load Sample Post-Op Appointment Fixture".'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) {
          audioChunksRef.current.push(evt.data);
        }
      };

      recorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);
      setListening(true);

      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      stopMediaTracksCleanly();
      setRecordingNotice(
        lang === 'fr'
          ? 'Permission de microphone refusée ou non disponible. Vous pouvez charger l’exemple de rendez-vous fictif ci-dessous.'
          : 'Microphone permission was denied or unavailable. You can load the sample post-operative appointment fixture below.'
      );
    }
  };

  const transcribeBlobAndLoad = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setRecordingNotice(null);
    try {
      const arrayBuf = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      const response = await fetch('/api/appointment/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType }),
      });

      const data = (await response.json()) as {
        transcript?: MachineTranscriptObject;
        notice?: string;
      };

      if (data.notice) {
        setRecordingNotice(data.notice);
      }
      if (data.transcript) {
        onLiveTranscriptCaptured(data.transcript);
      } else {
        onLoadSampleFixture();
      }
    } catch {
      onLoadSampleFixture();
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStopAppointmentRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      stopMediaTracksCleanly();
      return;
    }

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      stopMediaTracksCleanly();
      if (audioBlob.size > 0) {
        void transcribeBlobAndLoad(audioBlob, mimeType);
      } else {
        onLoadSampleFixture();
      }
    };

    try {
      recorder.stop();
    } catch {
      stopMediaTracksCleanly();
      onLoadSampleFixture();
    }
  };

  const handleCancelAppointmentRecording = () => {
    audioChunksRef.current = [];
    stopMediaTracksCleanly();
    setElapsedSeconds(0);
    setRecordingNotice(
      lang === 'fr'
        ? 'Enregistrement annulé et pistes audio fermées.'
        : 'Recording cancelled and microphone tracks closed.'
    );
  };

  const handleUploadAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void transcribeBlobAndLoad(file, file.type || 'audio/wav');
    e.target.value = '';
  };

  const handleRegenerateSummary = async () => {
    if (!correctedTranscript) return;
    setIsRegeneratingSummary(true);
    try {
      const response = await fetch('/api/appointment/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: correctedTranscript.segments,
          transcriptVersion: correctedTranscript.version,
          currentSummaryVersion: summaryDraft.version,
        }),
      });
      const data = (await response.json()) as {
        summary?: PlainLanguageSummaryDraft;
      };
      if (data.summary) {
        onUpdateSummaryFromServer(data.summary);
      }
    } catch {
      onUpdateSummaryFromServer({
        ...summaryDraft,
        version: summaryDraft.version + 1,
        basedOnTranscriptVersion: correctedTranscript.version,
        reviewStatus: 'unreviewed',
        reviewedAt: null,
      });
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const handleRegenerateStory = async () => {
    setIsRegeneratingStory(true);
    try {
      const response = await fetch('/api/appointment/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summaryDraft,
          language: lang,
          ageBand,
          detailLevel: preferences.detailLevel,
          storyVersion: storyDraft.version + 1,
        }),
      });
      const data = (await response.json()) as {
        story?: BearStoryDraft;
      };
      if (data.story) {
        onUpdateStoryDraft(data.story);
      }
    } catch {
      // Fallback handled by parent or server
    } finally {
      setIsRegeneratingStory(false);
    }
  };

  const totalPoints = calculateTotalPoints(rewardLedger);
  const equippedCosmetic = COSMETIC_REWARDS.find(
    (c) => c.id === rewardLedger.equippedCosmeticId
  );
  const activeMascotPreset: KareCostumePreset =
    equippedCosmetic?.mascotAccessoryPreview ?? 'neutral';

  const unresolvedFlagsCount = uncertaintyFlags.filter(
    (f) => !f.resolvedByCaregiver
  ).length;

  const currentStoryPage =
    storyDraft.pages[activeStoryPageIndex] ?? storyDraft.pages[0];

  return (
    <div className="space-y-6">
      {/* POST-OP MODE HEADER & SUB-NAVIGATION */}
      <section className="rounded-2xl border-2 border-[#1F6F6B]/30 bg-[#FFFDF8] p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#E76F51] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                {lang === 'fr'
                  ? 'Mode post-opératoire activé par l’adulte'
                  : 'Adult-Activated Post-Op Recovery Mode'}
              </span>
              <span className="rounded-lg border border-[#1F6F6B]/30 bg-[#DDF1EE] px-2.5 py-1 text-xs font-bold text-[#1F6F6B]">
                {lang.toUpperCase()} · {ageBand} · {preferences.detailLevel}
              </span>
            </div>
            <p className="text-xs font-medium text-[#3A2E26]/80">
              {lang === 'fr'
                ? 'Rappel : Ce mode organise les notes de rendez-vous et les histoires de Kare. Il ne remplace pas l’évaluation médicale ni la feuille de congé officielle.'
                : 'Reminder: This mode organizes appointment notes and Kare recovery stories. It does not replace medical assessment or your official hospital discharge sheet.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onReturnToPreOp}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#3A2E26]/25 bg-[#FFF8EC] px-3.5 py-2 text-sm font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{copy.appointment.returnToPreOpBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSetupModal}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#1F6F6B]/35 bg-[#FFF8EC] px-3.5 py-2 text-sm font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
            >
              <span>{copy.topNav.setupBtn}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Caregiver Review Pipeline vs. Child & Caregiver Dashboard */}
        <div
          role="tablist"
          aria-label="Post-operative mode sections"
          className="mt-4 grid grid-cols-1 gap-3 border-t border-[#3A2E26]/10 pt-4 sm:grid-cols-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'caregiver-appointment'}
            onClick={() => onChangeSubTab('caregiver-appointment')}
            className={`flex min-h-[56px] items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left font-bold transition-colors cursor-pointer ${
              activeSubTab === 'caregiver-appointment'
                ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                : 'border-[#3A2E26]/20 bg-[#FFF8EC] text-[#3A2E26] hover:bg-[#DDF1EE]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ClipboardCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {lang === 'fr'
                  ? '1. Espace Parent : Enregistrer, Vérifier et Publier l’Histoire'
                  : '1. Caregiver Workspace: Record, Review & Release Story'}
              </span>
            </div>
            { (summaryDraft.reviewStatus === 'stale' ||
              storyDraft.status === 'stale' ||
              unresolvedFlagsCount > 0) && (
              <span className="rounded-md bg-[#FDE8D4] px-2 py-0.5 text-xs font-extrabold text-[#3A2E26]">
                {unresolvedFlagsCount > 0
                  ? `${unresolvedFlagsCount} ⚑`
                  : 'Stale'}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'postop-dashboard'}
            onClick={() => onChangeSubTab('postop-dashboard')}
            className={`flex min-h-[56px] items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left font-bold transition-colors cursor-pointer ${
              activeSubTab === 'postop-dashboard'
                ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                : 'border-[#3A2E26]/20 bg-[#FFF8EC] text-[#3A2E26] hover:bg-[#DDF1EE]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {lang === 'fr'
                  ? '2. Tableau Enfant et Parent : Histoire de Kare, Tâches et Étoiles'
                  : '2. Child & Caregiver Dashboard: Kare Story, Tasks & Rewards'}
              </span>
            </div>
            <span className="rounded-md bg-[#FFF8EC] px-2.5 py-0.5 text-xs font-extrabold text-[#1F6F6B]">
              ⭐ {totalPoints} pts
            </span>
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: CAREGIVER APPOINTMENT CAPTURE, REVIEW & STORY RELEASE     */}
      {/* ==================================================================== */}
      {activeSubTab === 'caregiver-appointment' && (
        <div className="space-y-6">
          {/* STEP 1: RECORD OR LOAD POST-OP APPOINTMENT */}
          <section
            aria-labelledby="record-appointment-heading"
            className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                  {lang === 'fr'
                    ? 'Étape 1 sur 4 · Espace réservé aux adultes'
                    : 'Step 1 of 4 · Caregiver-Only Capture'}
                </span>
                <h1
                  id="record-appointment-heading"
                  className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26]"
                >
                  {copy.appointment.heading}
                </h1>
                <p className="mt-1 text-base text-[#3A2E26]/90">
                  {copy.appointment.subheading}
                </p>
              </div>

              <button
                type="button"
                onClick={onDiscardSessionData}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#E76F51]/60 bg-[#FDE8D4]/50 px-3.5 py-2 text-sm font-bold text-[#3A2E26] hover:bg-[#FDE8D4] cursor-pointer"
              >
                <Trash2 className="h-4 w-4 shrink-0 text-[#E76F51]" aria-hidden="true" />
                <span>{copy.appointment.discardBtn}</span>
              </button>
            </div>

            {/* Pre-Recording Consent Checkbox */}
            <label className="flex items-start gap-3 rounded-xl border-2 border-[#1F6F6B]/30 bg-[#FFF8EC] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={recordingConsentChecked}
                onChange={(e) => onToggleRecordingConsent(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#1F6F6B] cursor-pointer"
              />
              <span className="text-base font-bold text-[#3A2E26]">
                {copy.appointment.consentLabel}
              </span>
            </label>

            {/* Recording & Fixture Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  disabled={!recordingConsentChecked || isTranscribing}
                  onClick={handleStartAppointmentRecording}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#1F6F6B] px-5 py-2.5 text-base font-bold text-white hover:bg-[#165350] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                >
                  <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{copy.appointment.startRecording}</span>
                </button>
              ) : (
                <>
                  <div
                    role="status"
                    aria-live="polite"
                    className="inline-flex min-h-[52px] items-center gap-2.5 rounded-xl border-2 border-[#E76F51] bg-[#FDE8D4] px-4 py-2.5 text-base font-extrabold text-[#3A2E26]"
                  >
                    <span className="h-3 w-3 rounded-full bg-[#E76F51] animate-pulse" />
                    <span>
                      {lang === 'fr' ? 'Enregistrement' : 'Recording'}:{' '}
                      {formatElapsed(elapsedSeconds)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStopAppointmentRecording}
                    className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#2A7B4C] px-5 py-2.5 text-base font-bold text-white hover:bg-[#20603b] cursor-pointer"
                  >
                    <Square className="h-4 w-4 fill-current shrink-0" aria-hidden="true" />
                    <span>{copy.appointment.stopRecording}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelAppointmentRecording}
                    className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#3A2E26]/35 bg-[#FFFDF8] px-4 py-2.5 text-base font-bold text-[#3A2E26] hover:bg-[#FDE8D4]/60 cursor-pointer"
                  >
                    <span>{copy.appointment.cancelRecording}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onLoadSampleFixture}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#DDF1EE]/60 px-4 py-2.5 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
              >
                <FileAudio className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{copy.appointment.loadSampleFixture}</span>
              </button>

              <label className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2.5 text-base font-bold text-[#3A2E26] hover:bg-[#DDF1EE]/40 cursor-pointer">
                <Upload className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{copy.appointment.uploadAudio}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleUploadAudioFile}
                  className="sr-only"
                />
              </label>
            </div>

            {isTranscribing && (
              <p className="text-sm font-bold text-[#1F6F6B]">
                {lang === 'fr'
                  ? 'Transcription de l’enregistrement en cours...'
                  : 'Transcribing post-operative appointment audio...'}
              </p>
            )}

            {recordingNotice && (
              <div
                role="status"
                className="rounded-xl border border-[#1F6F6B]/40 bg-[#DDF1EE]/50 p-3 text-sm font-semibold text-[#3A2E26]"
              >
                {recordingNotice}
              </div>
            )}

            <p className="text-xs font-medium text-[#3A2E26]/75">
              {copy.appointment.privacyBanner}
            </p>
          </section>

          {/* STEP 2: ORIGINAL MACHINE TRANSCRIPT (IMMUTABLE) VS CORRECTED TRANSCRIPT (EDITABLE) */}
          {machineTranscript && correctedTranscript && (
            <section
              aria-labelledby="transcripts-comparison-heading"
              className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                    {lang === 'fr'
                      ? 'Étape 2 sur 4 · Vérification de la transcription'
                      : 'Step 2 of 4 · Transcript Verification & Staleness Guardrail'}
                  </span>
                  <h2
                    id="transcripts-comparison-heading"
                    className="mt-1 font-child text-xl font-extrabold text-[#3A2E26]"
                  >
                    {copy.appointment.machineTranscriptTitle} vs.{' '}
                    {copy.appointment.correctedTranscriptTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-[#3A2E26]/25 bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#3A2E26]">
                    Machine v{machineTranscript.version} (Immutable)
                  </span>
                  <span className="rounded-lg bg-[#1F6F6B] px-3 py-1 text-xs font-extrabold text-white">
                    Corrected v{correctedTranscript.version}
                  </span>
                  <button
                    type="button"
                    disabled={isRegeneratingSummary}
                    onClick={handleRegenerateSummary}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border-2 border-[#1F6F6B] bg-[#DDF1EE]/60 px-3 py-1 text-xs font-extrabold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isRegeneratingSummary ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {lang === 'fr'
                        ? 'Actualiser le résumé à partir de la transcription'
                        : 'Refresh Summary from Corrected Transcript'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Immutable Machine Transcript */}
                <div className="rounded-xl border-2 border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#3A2E26]/80">
                    {copy.appointment.machineTranscriptTitle}
                  </h3>
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {machineTranscript.segments.map((seg) => (
                      <div
                        key={seg.id}
                        className="rounded-lg border border-[#3A2E26]/15 bg-[#FFFDF8] p-3 text-sm"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#1F6F6B]">
                          <span>{seg.speaker}</span>
                          <span>[{seg.timestampLabel}]</span>
                        </div>
                        <p className="mt-1 text-[#3A2E26]/90">{seg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editable Corrected Transcript */}
                <div className="rounded-xl border-2 border-[#1F6F6B]/35 bg-[#DDF1EE]/25 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                      {copy.appointment.correctedTranscriptTitle}
                    </h3>
                    <span className="text-xs font-semibold text-[#3A2E26]/80">
                      {lang === 'fr'
                        ? 'Toute modification marque le résumé et l’histoire comme obsolètes'
                        : 'Editing marks downstream summary & story as Stale'}
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {correctedTranscript.segments.map((seg) => (
                      <div
                        key={seg.id}
                        className="rounded-lg border border-[#1F6F6B]/25 bg-[#FFFDF8] p-3 text-sm"
                      >
                        <label
                          htmlFor={`edit-seg-${seg.id}`}
                          className="flex items-center justify-between text-xs font-bold text-[#1F6F6B]"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Edit3 className="h-3 w-3" aria-hidden="true" />
                            <span>
                              {seg.speaker} ({seg.id})
                            </span>
                          </span>
                          <span>[{seg.timestampLabel}]</span>
                        </label>
                        <textarea
                          id={`edit-seg-${seg.id}`}
                          rows={2}
                          value={seg.text}
                          onChange={(e) =>
                            onEditTranscriptSegment(seg.id, e.target.value)
                          }
                          className="mt-1.5 w-full rounded-lg border border-[#3A2E26]/25 bg-[#FFF8EC] p-2 text-sm font-medium text-[#3A2E26] focus:border-[#1F6F6B] focus:outline-hidden"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* UNCERTAINTY & AMBIGUITY FLAGS PANEL */}
              <div className="rounded-xl border-2 border-[#E76F51]/50 bg-[#FDE8D4]/55 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-child text-lg font-extrabold text-[#3A2E26]">
                    <AlertTriangle
                      className="h-5 w-5 shrink-0 text-[#E76F51]"
                      aria-hidden="true"
                    />
                    <span>{copy.appointment.uncertaintyHeading}</span>
                  </h3>
                  <span className="rounded-lg bg-[#FFFDF8] px-3 py-1 text-xs font-extrabold text-[#3A2E26] border border-[#E76F51]/40">
                    {unresolvedFlagsCount === 0
                      ? lang === 'fr'
                        ? 'Toutes les incertitudes sont résolues ✓'
                        : 'All uncertainties clarified ✓'
                      : lang === 'fr'
                      ? `${unresolvedFlagsCount} point(s) bloquent les tâches associées`
                      : `${unresolvedFlagsCount} flag(s) blocking linked tasks`}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {uncertaintyFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`rounded-xl border-2 p-3.5 text-sm space-y-2 ${
                        flag.resolvedByCaregiver
                          ? 'border-[#2A7B4C]/40 bg-[#FFFDF8]'
                          : 'border-[#E76F51] bg-[#FFFDF8]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-[#FDE8D4] px-2 py-0.5 text-xs font-extrabold text-[#3A2E26]">
                          [{flag.timestampLabel}] · {flag.category}
                        </span>
                        <span className="text-xs font-bold text-[#1F6F6B]">
                          Blocks: {flag.blocksTaskOrStoryIds.join(', ')}
                        </span>
                      </div>

                      <p className="font-bold text-[#3A2E26]">
                        {flag.description[lang]}
                      </p>

                      <blockquote className="rounded-lg bg-[#FFF8EC] p-2 text-xs italic text-[#3A2E26]/85 border border-[#3A2E26]/10">
                        {flag.sourceExcerpt}
                      </blockquote>

                      <div>
                        <label
                          htmlFor={`clarify-${flag.id}`}
                          className="block text-xs font-bold text-[#3A2E26]"
                        >
                          {lang === 'fr'
                            ? 'Note de clarification du parent (ex. selon la feuille de congé) :'
                            : 'Caregiver clarification note (e.g. checked against paper discharge sheet):'}
                        </label>
                        <input
                          id={`clarify-${flag.id}`}
                          type="text"
                          value={flag.caregiverClarificationNote}
                          placeholder={
                            lang === 'fr'
                              ? 'Ex. : Vérifié sur la feuille de congé avec le pharmacien'
                              : 'e.g., Checked written discharge sheet / pharmacist note'
                          }
                          onChange={(e) =>
                            onResolveUncertaintyFlag(
                              flag.id,
                              flag.resolvedByCaregiver,
                              e.target.value
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-[#3A2E26]/30 bg-[#FFF8EC] px-3 py-1.5 text-sm font-medium text-[#3A2E26]"
                        />
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flag.resolvedByCaregiver}
                          onChange={(e) =>
                            onResolveUncertaintyFlag(
                              flag.id,
                              e.target.checked,
                              flag.caregiverClarificationNote
                            )
                          }
                          className="h-4 w-4 accent-[#2A7B4C] cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-[#3A2E26]">
                          {lang === 'fr'
                            ? 'Marquer comme vérifié et clarifié par l’adulte'
                            : 'Mark verified & clarified by caregiver'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* STEP 3 & 4: SIDE-BY-SIDE PLAIN-LANGUAGE SUMMARY & KARE'S 3-PAGE STORY DRAFT */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: PLAIN-LANGUAGE SUMMARY (6 COLS) */}
            <section
              aria-labelledby="summary-review-heading"
              className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4 lg:col-span-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                    {lang === 'fr'
                      ? 'Étape 3 sur 4 · Résumé structuré'
                      : 'Step 3 of 4 · Grounded Plain-Language Summary'}
                  </span>
                  <h2
                    id="summary-review-heading"
                    className="mt-1 font-child text-xl font-extrabold text-[#3A2E26]"
                  >
                    {copy.appointment.summaryHeading} (v{summaryDraft.version})
                  </h2>
                </div>

                {summaryDraft.reviewStatus === 'stale' ? (
                  <span className="rounded-lg border-2 border-[#E76F51] bg-[#FDE8D4] px-3 py-1 text-xs font-extrabold text-[#3A2E26]">
                    {copy.badges.staleWarning}
                  </span>
                ) : summaryDraft.reviewStatus === 'reviewed' ? (
                  <span className="rounded-lg bg-[#2A7B4C]/15 px-3 py-1 text-xs font-extrabold text-[#2A7B4C]">
                    ✓ {lang === 'fr' ? 'Vérifié par le parent' : 'Reviewed by Caregiver'}
                  </span>
                ) : (
                  <span className="rounded-lg bg-[#FDE8D4] px-3 py-1 text-xs font-bold text-[#3A2E26]">
                    {copy.badges.unreviewedAiDraft}
                  </span>
                )}
              </div>

              {(
                [
                  {
                    key: 'whatWasDiscussed',
                    title: copy.appointment.summarySections.discussed,
                  },
                  {
                    key: 'whatToDo',
                    title: copy.appointment.summarySections.whatToDo,
                  },
                  {
                    key: 'whenToSeekHelp',
                    title: copy.appointment.summarySections.whenToSeekHelp,
                  },
                  {
                    key: 'questionsToClarify',
                    title: copy.appointment.summarySections.questionsToClarify,
                  },
                ] as const
              ).map((sec) => (
                <div
                  key={sec.key}
                  className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-3.5 space-y-2.5"
                >
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                    {sec.title}
                  </h3>
                  {summaryDraft[sec.key].map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[#3A2E26]/15 bg-[#FFFDF8] p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#1F6F6B]">
                        <span>
                          Source: {item.sourceSegmentId} [{item.timestampLabel}]
                        </span>
                        {item.hasUnresolvedUncertainty && (
                          <span className="text-[#E76F51]">
                            ⚑ Check clarification above
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        aria-label={`${sec.title} item ${item.id}`}
                        value={item.text}
                        onChange={(e) =>
                          onEditSummaryItem(sec.key, item.id, e.target.value)
                        }
                        className="w-full rounded-lg border border-[#3A2E26]/20 bg-[#FFF8EC] p-2 text-sm font-medium text-[#3A2E26]"
                      />
                      <p className="text-[11px] italic text-[#3A2E26]/75">
                        Quote: “{item.sourceQuote}”
                      </p>
                    </div>
                  ))}
                </div>
              ))}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onMarkSummaryReviewed}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1F6F6B] px-5 py-3 text-base font-extrabold text-white hover:bg-[#165350] cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{copy.appointment.markSummaryReviewedBtn}</span>
                </button>
              </div>
            </section>

            {/* RIGHT COLUMN: KARE'S 3-PAGE POST-OP STORY DRAFT (6 COLS) */}
            <section
              aria-labelledby="story-draft-heading"
              className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4 lg:col-span-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                    {lang === 'fr'
                      ? 'Étape 4 sur 4 · Histoire de Kare pour l’enfant'
                      : 'Step 4 of 4 · Versioned Bear-Story Draft'}
                  </span>
                  <h2
                    id="story-draft-heading"
                    className="mt-1 font-child text-xl font-extrabold text-[#3A2E26]"
                  >
                    {copy.appointment.storyDraftHeading} (v{storyDraft.version})
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {storyDraft.status === 'stale' ? (
                    <span className="rounded-lg border-2 border-[#E76F51] bg-[#FDE8D4] px-3 py-1 text-xs font-extrabold text-[#3A2E26]">
                      {copy.badges.staleWarning}
                    </span>
                  ) : storyDraft.status === 'released' ? (
                    <span className="rounded-lg bg-[#2A7B4C]/15 px-3 py-1 text-xs font-extrabold text-[#2A7B4C]">
                      ✓ {lang === 'fr' ? 'Publié pour l’enfant' : 'Released to Child View'}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-[#DDF1EE] px-3 py-1 text-xs font-bold text-[#1F6F6B]">
                      Draft · Summary v{storyDraft.originatingSummaryVersion}
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={isRegeneratingStory}
                    onClick={handleRegenerateStory}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1F6F6B] bg-[#FFF8EC] px-3 py-1 text-xs font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isRegeneratingStory ? 'animate-spin' : ''
                      }`}
                    />
                    <span>{copy.appointment.regenerateStoryBtn}</span>
                  </button>
                </div>
              </div>

              {/* False Reassurance Phrase Filter Alert */}
              {storyDraft.flaggedReassuranceWarnings.length > 0 && (
                <div
                  role="alert"
                  className="rounded-xl border-2 border-[#E76F51] bg-[#FDE8D4] p-3.5 text-sm font-bold text-[#3A2E26]"
                >
                  <p>
                    ⚑ Clinical Safety Phrase Filter Warning: Disallowed false
                    reassurance detected (
                    {storyDraft.flaggedReassuranceWarnings.join(', ')}). Please
                    edit the text below to remove promises like &ldquo;it
                    won&apos;t hurt&rdquo; or &ldquo;you&apos;ll get better
                    soon&rdquo; before releasing to the child view.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {storyDraft.pages.map((page) => (
                  <div
                    key={page.id}
                    className="rounded-xl border border-[#1F6F6B]/30 bg-[#FFF8EC] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-[#1F6F6B] px-2.5 py-0.5 text-xs font-extrabold text-white">
                        Page {page.pageNumber} · {page.karePreset}
                      </span>
                      <span className="text-xs font-semibold text-[#3A2E26]/75">
                        Linked to {page.sourceSummaryItemId}
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor={`story-title-${page.id}`}
                        className="block text-xs font-bold text-[#1F6F6B]"
                      >
                        Page {page.pageNumber} Title
                      </label>
                      <input
                        id={`story-title-${page.id}`}
                        type="text"
                        value={page.title}
                        onChange={(e) =>
                          onEditStoryPage(page.id, 'title', e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-1.5 text-sm font-bold text-[#3A2E26]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`story-body-${page.id}`}
                        className="block text-xs font-bold text-[#1F6F6B]"
                      >
                        Child Story Text ({ageBand} · {lang.toUpperCase()})
                      </label>
                      <textarea
                        id={`story-body-${page.id}`}
                        rows={3}
                        value={page.bodyText}
                        onChange={(e) =>
                          onEditStoryPage(page.id, 'bodyText', e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-[#3A2E26]/25 bg-[#FFFDF8] p-2 text-sm font-medium text-[#3A2E26]"
                      />
                    </div>

                    <p className="text-[11px] italic text-[#3A2E26]/75">
                      Grounded in: “{page.sourceQuote}”
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                {summaryDraft.reviewStatus !== 'reviewed' && (
                  <p className="text-xs font-bold text-[#E76F51]">
                    {lang === 'fr'
                      ? 'Veuillez d’abord cliquer sur « Marquer le résumé comme vérifié par le parent » à gauche avant de publier l’histoire.'
                      : 'Please click "Mark Summary Reviewed by Caregiver" on the left before releasing the story to the child view.'}
                  </p>
                )}

                <button
                  type="button"
                  disabled={
                    summaryDraft.reviewStatus !== 'reviewed' ||
                    storyDraft.flaggedReassuranceWarnings.length > 0
                  }
                  onClick={() => {
                    triggerTransientGesture('celebrating', 2400);
                    onReleaseStoryToChild();
                  }}
                  className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#2A7B4C] px-5 py-3 text-base font-extrabold text-white transition-opacity hover:bg-[#20603b] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{copy.appointment.releaseStoryBtn}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: CHILD & CAREGIVER POST-OP DASHBOARD                       */}
      {/* ==================================================================== */}
      {activeSubTab === 'postop-dashboard' && (
        <div className="space-y-6">
          {/* TOP ROW: KARE COMPANION STATUS & RELEASED POST-OP BEAR STORY READER */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Kare Companion Status & Positive-Only Guardrail (4 Cols) */}
            <section className="flex flex-col justify-between rounded-2xl border-2 border-[#1F6F6B]/30 bg-[#FFFDF8] p-5 shadow-xs lg:col-span-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#DDF1EE] px-3.5 py-1 text-xs font-extrabold text-[#1F6F6B]">
                  <span>⭐ {totalPoints} pts</span>
                  <span>·</span>
                  <span>
                    {equippedCosmetic
                      ? equippedCosmetic.name[lang]
                      : lang === 'fr'
                      ? 'Look Classique de Kare'
                      : 'Classic Kare Look'}
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-[#1F6F6B]/20 bg-[#DDF1EE]/35 p-4 w-full flex justify-center">
                  <KareMascot
                    size="lg"
                    preset={activeMascotPreset}
                    state={mascotState}
                    renderMode={renderMode}
                    mouthOpen={mouthOpen}
                    speaking={isSpeaking}
                    label="Kare your post-op recovery companion bear"
                  />
                </div>

                <h2 className="font-child text-xl font-extrabold text-[#3A2E26]">
                  {copy.postOpTasks.bearStatusHeading}
                </h2>

                <p className="rounded-xl border border-[#1F6F6B]/25 bg-[#FFF8EC] p-3 text-xs font-medium leading-relaxed text-[#3A2E26]">
                  {copy.postOpTasks.bearPositiveNote}
                </p>
              </div>
            </section>

            {/* Released Post-Op Bear Story Reader (8 Cols) */}
            <section className="flex flex-col justify-between rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 lg:col-span-8">
              {storyDraft.status === 'released' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3A2E26]/10 pb-3">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wide text-[#2A7B4C]">
                        ✓{' '}
                        {lang === 'fr'
                          ? 'Histoire vérifiée et publiée par ton parent'
                          : 'Caregiver-Reviewed & Released Post-Op Story'}
                      </span>
                      <h2 className="font-child text-2xl font-extrabold text-[#3A2E26]">
                        {currentStoryPage.title}
                      </h2>
                    </div>

                    <span className="rounded-lg bg-[#1F6F6B] px-3 py-1 text-xs font-extrabold text-white">
                      Page {currentStoryPage.pageNumber} /{' '}
                      {storyDraft.pages.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border-2 border-[#1F6F6B]/25 bg-[#FFF8EC] p-5 space-y-3">
                    <p className="font-child text-xl font-bold leading-relaxed text-[#3A2E26]">
                      {currentStoryPage.bodyText}
                    </p>

                    {preferences.detailLevel === 'extra-detail' && (
                      <p className="rounded-xl border border-[#1F6F6B]/25 bg-[#DDF1EE]/40 p-3 text-base font-medium text-[#3A2E26]">
                        {currentStoryPage.extraDetailText}
                      </p>
                    )}

                    <p className="text-xs italic text-[#3A2E26]/75">
                      Source: “{currentStoryPage.sourceQuote}”
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <ListenButton
                      textToRead={`${currentStoryPage.title}. ${currentStoryPage.bodyText} ${
                        preferences.detailLevel === 'extra-detail'
                          ? currentStoryPage.extraDetailText
                          : ''
                      }`}
                      enabledByCaregiver={preferences.narrationEnabled}
                      language={lang}
                      contentVersion={`postop-story-v${storyDraft.version}-n${storyDraft.narrationVersion}-p${currentStoryPage.pageNumber}-${lang}-${ageBand}`}
                    />

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={activeStoryPageIndex === 0}
                        onClick={() =>
                          setActiveStoryPageIndex((i) => Math.max(0, i - 1))
                        }
                        className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-2 text-sm font-bold text-[#3A2E26] disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        <span>{lang === 'fr' ? 'Précédent' : 'Previous'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={
                          activeStoryPageIndex >= storyDraft.pages.length - 1
                        }
                        onClick={() =>
                          setActiveStoryPageIndex((i) =>
                            Math.min(storyDraft.pages.length - 1, i + 1)
                          )
                        }
                        className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-[#1F6F6B] px-4 py-2 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
                      >
                        <span>{lang === 'fr' ? 'Suivant' : 'Next'}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start justify-center space-y-4 rounded-2xl border-2 border-[#E76F51]/50 bg-[#FDE8D4]/50 p-6">
                  <div className="flex items-center gap-2 text-[#E76F51]">
                    <Lock className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-extrabold uppercase tracking-wide">
                      {storyDraft.status === 'stale'
                        ? copy.badges.staleWarning
                        : lang === 'fr'
                        ? 'En attente de validation par le parent'
                        : 'Awaiting Caregiver Review & Release'}
                    </span>
                  </div>

                  <h2 className="font-child text-2xl font-extrabold text-[#3A2E26]">
                    {storyDraft.status === 'stale'
                      ? lang === 'fr'
                        ? 'La transcription ou le résumé a été modifié — Nouvelle vérification requise'
                        : 'Transcript or Summary Was Edited — Caregiver Re-Review Required'
                      : lang === 'fr'
                      ? 'L’histoire post-opératoire de Kare est en cours de préparation'
                      : 'Kare’s Post-Op Story Is Waiting for Grown-Up Review'}
                  </h2>

                  <p className="text-base text-[#3A2E26]/90">
                    {storyDraft.status === 'stale'
                      ? lang === 'fr'
                        ? 'Pour la sécurité de l’enfant, lorsqu’une note de rendez-vous ou un résumé est modifié, l’histoire précédente est marquée comme obsolète jusqu’à ce que le parent la vérifie et la publie à nouveau.'
                        : 'For clinical safety, whenever the appointment transcript or plain-language summary is edited, the previously released story is marked Stale until a caregiver reviews and releases the updated version.'
                      : lang === 'fr'
                      ? 'Un adulte doit d’abord vérifier le résumé du rendez-vous et cliquer sur « Publier l’histoire pour la vue Enfant » dans l’onglet Espace Parent.'
                      : 'A caregiver must first review the post-operative appointment summary and click "Release Story to Child View" in the Caregiver Workspace tab.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => onChangeSubTab('caregiver-appointment')}
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#1F6F6B] px-5 py-2.5 text-base font-bold text-white hover:bg-[#165350] cursor-pointer"
                  >
                    <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                    <span>
                      {lang === 'fr'
                        ? 'Ouvrir l’Espace Parent pour vérifier et publier'
                        : 'Open Caregiver Workspace to Review & Release'}
                    </span>
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* CARE TASKS SECTION (SHOWING SUPPLIED VS MISSING SCHEDULE FIELDS & CAREGIVER CONFIRMATION) */}
          <section
            aria-labelledby="postop-tasks-heading"
            className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4"
          >
            <div>
              <h2
                id="postop-tasks-heading"
                className="font-child text-2xl font-extrabold text-[#3A2E26]"
              >
                {copy.postOpTasks.heading}
              </h2>
              <p className="mt-1 text-base text-[#3A2E26]/90">
                {copy.postOpTasks.subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {careTasks.map((task) => {
                const blockedByFlag = isItemBlockedByUncertainty(
                  task.id,
                  uncertaintyFlags
                );
                const isConfirmed = task.caregiverConfirmedCompletion;

                return (
                  <article
                    key={task.id}
                    className={`flex flex-col justify-between rounded-2xl border-2 p-4 space-y-3 ${
                      isConfirmed
                        ? 'border-[#2A7B4C] bg-[#2A7B4C]/10'
                        : task.approvalState === 'stale' || blockedByFlag
                        ? 'border-[#E76F51] bg-[#FDE8D4]/45'
                        : 'border-[#3A2E26]/20 bg-[#FFF8EC]'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-lg bg-[#1F6F6B] px-2.5 py-1 text-xs font-extrabold text-white">
                          +{task.pointsValue} pts · [{task.timestampLabel}]
                        </span>

                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#2A7B4C] px-2.5 py-1 text-xs font-extrabold text-white">
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {lang === 'fr'
                                ? 'Confirmé par le parent'
                                : 'Confirmed by Caregiver'}
                            </span>
                          </span>
                        ) : task.approvalState === 'stale' ? (
                          <span className="rounded-lg border border-[#E76F51] bg-[#FDE8D4] px-2.5 py-1 text-xs font-extrabold text-[#3A2E26]">
                            {copy.badges.staleWarning}
                          </span>
                        ) : blockedByFlag ? (
                          <span className="rounded-lg border border-[#E76F51] bg-[#FDE8D4] px-2.5 py-1 text-xs font-extrabold text-[#3A2E26]">
                            {copy.postOpTasks.blockedBadge}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-[#DDF1EE] px-2.5 py-1 text-xs font-bold text-[#1F6F6B]">
                            {task.approvalState}
                          </span>
                        )}
                      </div>

                      <h3 className="font-child text-lg font-extrabold text-[#3A2E26]">
                        {task.title[lang]}
                      </h3>

                      <p className="font-child text-base font-medium text-[#3A2E26]">
                        {task.childFriendlyDescription[lang][ageBand]}
                      </p>

                      {/* Exact Source Quote & Supplied vs Missing Schedule Fields */}
                      <div className="rounded-xl border border-[#3A2E26]/15 bg-[#FFFDF8] p-3 text-xs space-y-1.5">
                        <p className="font-bold text-[#1F6F6B]">
                          Exact Source Quote [{task.timestampLabel}]: “
                          {task.exactSourceInstruction}”
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[#3A2E26]/90 pt-1">
                          <span>
                            <strong>Dose:</strong>{' '}
                            {task.suppliedFields.doseSupplied ?? (
                              <em className="text-[#E76F51] font-bold">
                                Not in audio (check sheet)
                              </em>
                            )}
                          </span>
                          <span>
                            <strong>Frequency:</strong>{' '}
                            {task.suppliedFields.frequencySupplied ?? '—'}
                          </span>
                          <span>
                            <strong>Clock Times:</strong>{' '}
                            {task.suppliedFields.clockTimesSupplied ? (
                              task.suppliedFields.clockTimesSupplied.join(', ')
                            ) : (
                              <em className="text-[#E76F51] font-bold">
                                Not specified (never invented)
                              </em>
                            )}
                          </span>
                          <span>
                            <strong>Duration:</strong>{' '}
                            {task.suppliedFields.durationSupplied ?? '—'}
                          </span>
                        </div>
                      </div>

                      {task.unresolvedWarning && blockedByFlag && (
                        <p className="rounded-lg border border-[#E76F51]/50 bg-[#FDE8D4] p-2.5 text-xs font-bold text-[#3A2E26]">
                          {task.unresolvedWarning[lang]}
                        </p>
                      )}
                    </div>

                    {/* Action Controls: Child Ready Button + Caregiver Approval/Confirmation */}
                    <div className="space-y-2 border-t border-[#3A2E26]/10 pt-3">
                      {blockedByFlag ? (
                        <button
                          type="button"
                          onClick={() =>
                            onChangeSubTab('caregiver-appointment')
                          }
                          className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#E76F51] bg-[#FFFDF8] px-3 py-2 text-xs font-extrabold text-[#3A2E26] hover:bg-[#FDE8D4] cursor-pointer"
                        >
                          <AlertTriangle className="h-4 w-4 text-[#E76F51]" />
                          <span>
                            {lang === 'fr'
                              ? 'Clarifier l’incertitude dans l’Espace Parent d’abord'
                              : 'Clarify uncertainty in Caregiver Workspace first'}
                          </span>
                        </button>
                      ) : (
                        <>
                          {task.approvalState !== 'confirmed-for-child' && (
                            <button
                              type="button"
                              onClick={() => onApproveTaskForChild(task.id)}
                              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#1F6F6B] bg-[#DDF1EE]/60 px-3 py-2 text-xs font-extrabold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>
                                {lang === 'fr'
                                  ? 'Parent : Approuver cette tâche pour la vue Enfant'
                                  : 'Caregiver: Approve Task for Child View'}
                              </span>
                            </button>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Child Signal Button */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerTransientGesture('encouraging', 2200);
                                onChildTapReadyOrHelp(task.id);
                              }}
                              aria-pressed={task.childAskedHelpOrReady}
                              className={`inline-flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                                task.childAskedHelpOrReady
                                  ? 'border-[#1F6F6B] bg-[#DDF1EE] text-[#1F6F6B]'
                                  : 'border-[#3A2E26]/25 bg-[#FFFDF8] text-[#3A2E26] hover:bg-[#DDF1EE]/40'
                              }`}
                            >
                              <HeartHandshake className="h-4 w-4 shrink-0" />
                              <span>
                                {task.childAskedHelpOrReady
                                  ? lang === 'fr'
                                    ? 'Enfant prêt ! (En attente du parent)'
                                  : 'Child Ready! (Waiting for Grown-Up)'
                                  : copy.postOpTasks.childReadyBtn}
                              </span>
                            </button>

                            {/* Caregiver-Only Confirmation Button */}
                            {!isConfirmed ? (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerTransientGesture('celebrating', 2600);
                                  onCaregiverConfirmTask(task.id);
                                }}
                                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2A7B4C] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#20603b] cursor-pointer"
                              >
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>
                                  {copy.postOpTasks.caregiverConfirmBtn}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onCaregiverRevokeTask(task.id)}
                                className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFFDF8] px-3 py-2 text-xs font-bold text-[#3A2E26] hover:bg-[#FDE8D4]/60 cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                                <span>{copy.postOpTasks.undoConfirmBtn}</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* COSMETIC REWARDS SHOP & IDEMPOTENT EVENT LEDGER */}
          <section
            aria-labelledby="rewards-ledger-heading"
            className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="rewards-ledger-heading"
                  className="font-child text-2xl font-extrabold text-[#3A2E26]"
                >
                  {copy.postOpTasks.rewardsHeading}
                </h2>
                <p className="text-sm text-[#3A2E26]/85">
                  {lang === 'fr'
                    ? 'Les points sont attribués une seule fois par identifiant d’événement unique (idempotent). Les corrections de dossier ajustent le total sans punir Kare.'
                    : 'Points are awarded once per unique occurrence ID (idempotent). Record corrections recalculate points cleanly without punishing Kare.'}
                </p>
              </div>
              <span className="rounded-xl bg-[#1F6F6B] px-4 py-2 text-base font-extrabold text-white">
                {copy.postOpTasks.pointsLabel}: ⭐ {totalPoints} pts
              </span>
            </div>

            {/* Cosmetic Items */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {COSMETIC_REWARDS.map((item) => {
                const isUnlocked = rewardLedger.unlockedCosmeticIds.includes(
                  item.id
                );
                const isEquipped = rewardLedger.equippedCosmeticId === item.id;
                const canAfford = totalPoints >= item.costPoints;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between rounded-xl border-2 p-4 ${
                      isEquipped
                        ? 'border-[#1F6F6B] bg-[#DDF1EE]/50'
                        : 'border-[#3A2E26]/20 bg-[#FFF8EC]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl" aria-hidden="true">
                          {item.iconEmoji}
                        </span>
                        <span className="rounded-md bg-[#FFFDF8] px-2.5 py-0.5 text-xs font-extrabold text-[#1F6F6B] border border-[#1F6F6B]/25">
                          {item.costPoints} pts
                        </span>
                      </div>
                      <h3 className="font-child text-base font-extrabold text-[#3A2E26]">
                        {item.name[lang]}
                      </h3>
                      <p className="text-xs text-[#3A2E26]/85">
                        {item.description[lang]}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!isUnlocked && !canAfford}
                      onClick={() =>
                        onUnlockOrEquipCosmetic(item.id, item.costPoints)
                      }
                      className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#1F6F6B] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-40 cursor-pointer"
                    >
                      <Award className="h-4 w-4" />
                      <span>
                        {isEquipped
                          ? lang === 'fr'
                            ? 'Équipé ✓'
                            : 'Equipped ✓'
                          : isUnlocked
                          ? lang === 'fr'
                            ? 'Équiper ce look'
                            : 'Equip Look'
                          : canAfford
                          ? lang === 'fr'
                            ? 'Débloquer et équiper'
                            : 'Unlock & Equip'
                          : lang === 'fr'
                          ? `Nécessite ${item.costPoints} pts`
                          : `Requires ${item.costPoints} pts`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Idempotent Event Ledger Table */}
            <div className="rounded-xl border border-[#3A2E26]/15 bg-[#FFF8EC] p-4 space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
                {lang === 'fr'
                  ? 'Journal d’événements idempotent (Audit des points)'
                  : 'Idempotent Reward Event Ledger (Audit Trail)'}
              </h3>
              {Object.keys(rewardLedger.entries).length === 0 ? (
                <p className="text-xs text-[#3A2E26]/75">
                  {lang === 'fr'
                    ? 'Aucune tâche confirmée pour le moment. Lorsqu’un parent confirme une tâche ci-dessus, son identifiant unique est inscrit ici.'
                    : 'No confirmed task occurrences yet. When a caregiver confirms a task above, its unique occurrenceId is recorded here.'}
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {Object.values(rewardLedger.entries).map((entry) => (
                    <li
                      key={entry.occurrenceId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFFDF8] px-3 py-2 border border-[#3A2E26]/10"
                    >
                      <div>
                        <span className="font-bold text-[#3A2E26]">
                          {entry.label}
                        </span>{' '}
                        <span className="text-[#3A2E26]/70">
                          (ID: {entry.occurrenceId})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.status === 'active' ? (
                          <span className="font-extrabold text-[#2A7B4C]">
                            +{entry.pointsDelta} pts (Active)
                          </span>
                        ) : (
                          <span className="font-semibold text-[#3A2E26]/70 line-through">
                            +{entry.pointsDelta} pts ({entry.correctionReason})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
