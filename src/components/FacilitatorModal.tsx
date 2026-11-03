/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adult / Facilitator modal containing Participant Scenario Tasks A & B,
 * SickKids source grounding, and Evidence mapping summary.
 * Kept strictly outside child-facing screens.
 */

import React from 'react';
import { X, ExternalLink, BookOpen, CheckCircle2 } from 'lucide-react';
import { FACILITATOR_TASKS, SICKKIDS_SOURCE_INFO } from '../data/demoContent';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E26]/60 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFF8EC] p-6 text-[#3A2E26] shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#3A2E26]/15 pb-4">
          <div>
            <p className="text-sm font-bold text-[#1F6F6B]">
              Grown-up &amp; Workshop Facilitator Reference (Not shown on child screens)
            </p>
            <h2
              id="facilitator-modal-title"
              className="mt-1 text-2xl font-extrabold text-[#3A2E26]"
            >
              Evaluation Tasks, Clinical Grounding &amp; Evidence Notes
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

        <div className="mt-5 space-y-6 text-[18px] leading-relaxed">
          {/* Participant-facing Scenario Tasks */}
          <section aria-labelledby="tasks-heading" className="space-y-4">
            <h3
              id="tasks-heading"
              className="flex items-center gap-2 text-xl font-bold text-[#1F6F6B]"
            >
              <BookOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Participant-Facing Workshop Tasks</span>
            </h3>
            <p className="text-base text-[#3A2E26]/90">
              Read aloud or hand to workshop participants. These tasks contain no button names,
              do not advise waiting until tomorrow after an injury, and do not instruct participants
              to deliberately make mistakes.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {FACILITATOR_TASKS.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-[#1F6F6B]">{task.title}</h4>
                    <span className="text-sm font-semibold text-[#3A2E26]/80">
                      {task.durationLabel}
                    </span>
                  </div>
                  <blockquote className="mt-2 rounded-lg bg-[#FFF8EC] p-3 text-[18px] font-medium text-[#3A2E26]">
                    “{task.participantPrompt}”
                  </blockquote>
                  <p className="mt-2 text-sm text-[#3A2E26]/80">
                    <strong>Evaluation design note:</strong> {task.developerVerificationNote}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SickKids Source Grounding */}
          <section
            aria-labelledby="source-grounding-heading"
            className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/50 p-4 space-y-2"
          >
            <h3
              id="source-grounding-heading"
              className="flex items-center gap-2 text-xl font-bold text-[#1F6F6B]"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>SickKids Source Grounding &amp; Scope</span>
            </h3>
            <p className="text-base">{SICKKIDS_SOURCE_INFO.castTypeNotice}</p>
            <p className="text-base">{SICKKIDS_SOURCE_INFO.scopeNotice}</p>
            <p className="text-base font-semibold">{SICKKIDS_SOURCE_INFO.approvalNotice}</p>
            <p className="pt-1">
              <a
                href={SICKKIDS_SOURCE_INFO.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-[#1F6F6B] underline hover:text-[#3A2E26]"
              >
                <span>
                  Open {SICKKIDS_SOURCE_INFO.organization}: {SICKKIDS_SOURCE_INFO.articleTitle}
                </span>
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </p>
          </section>

          {/* Summary of Clarifications & Design Choices Requiring Evaluation */}
          <section className="rounded-xl border border-[#3A2E26]/20 bg-[#FFFDF8] p-4 space-y-2 text-base">
            <h3 className="text-lg font-bold text-[#1F6F6B]">
              Design Hypotheses Requiring Evaluation (Full Mapping in EVIDENCE.md)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Target age band (7–12):</strong> Evaluates whether one primary reading level plus optional “More about this” detail works for both younger (7–8) and older (11–12) children.
              </li>
              <li>
                <strong>Kare bear mascot &amp; palette:</strong> Evaluates whether the bear character and warm cream/teal/orange palette reduce anxiety without feeling juvenile to 10–12-year-olds.
              </li>
              <li>
                <strong>Sentence-length targets (≤12 words):</strong> Evaluates readability vs. clinical precision when simplifying non-waterproof cast instructions.
              </li>
              <li>
                <strong>Always-included core care steps + caregiver detail controls:</strong> Ensures core safety instructions cannot be removed while giving caregivers control over supplemental detail and presentation preferences.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-6 flex justify-end border-t border-[#3A2E26]/15 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-[#1F6F6B] px-6 py-3 text-lg font-bold text-white hover:bg-[#165350] cursor-pointer"
          >
            Close facilitator guide
          </button>
        </div>
      </div>
    </div>
  );
};
