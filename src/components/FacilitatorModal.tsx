/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Host / Facilitator Reference Modal (Strictly outside child-facing screens):
 * - 5-Minute Peer Evaluation Tasks 1 & 2 (Pre-Op Age/Language Prep & Post-Op Appointment Review/Release)
 * - Original Cast Demo Workshop Tasks A & B (preserved for regression testing)
 * - Verified Public Clinical Sources & Design Hypotheses Requiring Evaluation
 */

import React from 'react';
import { X, ExternalLink, BookOpen, CheckCircle2, ClipboardList } from 'lucide-react';
import { FACILITATOR_TASKS, SICKKIDS_SOURCE_INFO } from '../data/demoContent';
import {
  HOST_PEER_EVALUATION_TASKS,
  VERIFIED_SOURCES,
} from '../data/surgeryContent';

interface FacilitatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FacilitatorModal: React.FC<FacilitatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="facilitator-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E26]/65 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFF8EC] p-6 text-[#3A2E26] shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#3A2E26]/15 pb-4">
          <div>
            <p className="text-sm font-bold text-[#1F6F6B]">
              Host &amp; Workshop Facilitator Reference (Strictly Outside Child Screens)
            </p>
            <h2
              id="facilitator-modal-title"
              className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26]"
            >
              5-Minute Peer Evaluation Tasks, Verified Sources &amp; Evidence Mapping
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close facilitator reference"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border-2 border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-2 font-bold text-[#3A2E26] hover:bg-[#DDF1EE] cursor-pointer"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-base leading-relaxed">
          {/* 1. Updated 5-Minute Peer Evaluation Tasks (Pre-Op & Post-Op Journey) */}
          <section aria-labelledby="peer-tasks-heading" className="space-y-4">
            <h3
              id="peer-tasks-heading"
              className="flex items-center gap-2 text-xl font-extrabold text-[#1F6F6B]"
            >
              <ClipboardList className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                5-Minute Peer Evaluation Tasks (Surgery Pre-Op &amp; Post-Op Journey)
              </span>
            </h3>

            <p className="rounded-xl border border-[#E76F51]/40 bg-[#FDE8D4]/60 p-3 text-sm font-semibold text-[#3A2E26]">
              {HOST_PEER_EVALUATION_TASKS.disclaimer}
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                HOST_PEER_EVALUATION_TASKS.task1,
                HOST_PEER_EVALUATION_TASKS.task2,
              ].map((task) => (
                <div
                  key={task.title}
                  className="rounded-xl border-2 border-[#1F6F6B]/25 bg-[#FFFDF8] p-4 space-y-3"
                >
                  <h4 className="font-child text-base font-extrabold text-[#1F6F6B]">
                    {task.title}
                  </h4>
                  <blockquote className="rounded-lg bg-[#FFF8EC] p-3 text-sm font-medium text-[#3A2E26] border border-[#3A2E26]/10">
                    “{task.participantPrompt}”
                  </blockquote>
                  <div className="space-y-1 text-xs text-[#3A2E26]/90">
                    <p className="font-bold text-[#1F6F6B]">
                      Host-Only Expected Action Sequence:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      {task.expectedActionSequence.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="rounded-lg bg-[#DDF1EE]/45 p-2.5 text-xs text-[#3A2E26]">
                    <strong>Developer Error-Path Verification:</strong>{' '}
                    {task.developerErrorPathCheck}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Verified Public Clinical Sources */}
          <section
            aria-labelledby="source-grounding-heading"
            className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/50 p-4 space-y-3"
          >
            <h3
              id="source-grounding-heading"
              className="flex items-center gap-2 text-lg font-extrabold text-[#1F6F6B]"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Verified Public Clinical &amp; Design Sources</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              {Object.values(VERIFIED_SOURCES).map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#1F6F6B]/25 bg-[#FFFDF8] p-2.5 font-bold text-[#1F6F6B] underline hover:text-[#3A2E26]"
                >
                  <span>
                    {src.publisher}: {src.title}
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          {/* 3. Cast Demo Regression Workshop Tasks */}
          <section aria-labelledby="cast-tasks-heading" className="space-y-3">
            <h3
              id="cast-tasks-heading"
              className="flex items-center gap-2 text-lg font-extrabold text-[#3A2E26]"
            >
              <BookOpen className="h-5 w-5 shrink-0 text-[#1F6F6B]" aria-hidden="true" />
              <span>Original Cast Demo Regression Tasks ({SICKKIDS_SOURCE_INFO.organization})</span>
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FACILITATOR_TASKS.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-3.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-[#1F6F6B]">{task.title}</h4>
                    <span className="text-xs font-semibold text-[#3A2E26]/80">
                      {task.durationLabel}
                    </span>
                  </div>
                  <blockquote className="mt-2 rounded-lg bg-[#FFF8EC] p-2.5 text-sm font-medium text-[#3A2E26]">
                    “{task.participantPrompt}”
                  </blockquote>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end border-t border-[#3A2E26]/15 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#1F6F6B] px-6 py-2.5 text-base font-bold text-white hover:bg-[#165350] cursor-pointer"
          >
            Close facilitator guide
          </button>
        </div>
      </div>
    </div>
  );
};
