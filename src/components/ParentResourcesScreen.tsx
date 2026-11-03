/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dedicated Parent & Caregiver Resources Tab:
 * 1. Verified Hospital & Child-Life Sources (with publisher, title, applicability, and review status).
 * 2. Care-Team Contact & Procedure-Specific Link Placeholder (session-only, never fabricates hospital contacts).
 * 3. Reserved Parent Testimonials Section (explicitly empty; never fabricates parent quotes).
 */

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  MessageSquareQuote,
  PhoneCall,
  Plus,
  Trash2,
} from 'lucide-react';
import { SURGERY_UI_COPY, VERIFIED_SOURCES } from '../data/surgeryContent';
import type { AppLanguage } from '../utils/surgeryDataModel';

interface ParentResourcesScreenProps {
  language: AppLanguage;
}

interface SessionCareTeamContact {
  id: string;
  roleOrClinic: string;
  phoneOrLink: string;
  notes: string;
}

export const ParentResourcesScreen: React.FC<ParentResourcesScreenProps> = ({
  language,
}) => {
  const copy = SURGERY_UI_COPY[language].parentResources;
  const [contacts, setContacts] = useState<SessionCareTeamContact[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const handleAddSessionContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim() && !phoneInput.trim()) return;
    setContacts((prev) => [
      ...prev,
      {
        id: `contact-${Date.now()}`,
        roleOrClinic: roleInput.trim() || 'Care Team Contact',
        phoneOrLink: phoneInput.trim(),
        notes: notesInput.trim(),
      },
    ]);
    setRoleInput('');
    setPhoneInput('');
    setNotesInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6">
        <span className="text-xs font-extrabold uppercase tracking-wide text-[#1F6F6B]">
          KareBEAR · Caregiver &amp; Family Reference
        </span>
        <h1 className="mt-1 font-child text-2xl font-extrabold text-[#3A2E26] sm:text-3xl">
          {copy.heading}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[#3A2E26]/90">
          {copy.subheading}
        </p>
      </section>

      {/* 1. Verified Hospital & Child-Life Sources */}
      <section
        aria-labelledby="verified-sources-heading"
        className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 shrink-0 text-[#1F6F6B]" aria-hidden="true" />
          <h2
            id="verified-sources-heading"
            className="font-child text-xl font-extrabold text-[#3A2E26]"
          >
            {copy.verifiedSourcesHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.values(VERIFIED_SOURCES).map((source) => (
            <article
              key={source.id}
              className="flex flex-col justify-between rounded-xl border-2 border-[#1F6F6B]/25 bg-[#FFF8EC] p-4 space-y-3"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-md bg-[#1F6F6B] px-2.5 py-0.5 text-xs font-extrabold text-white">
                    {source.publisher}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#DDF1EE] px-2.5 py-0.5 text-xs font-bold text-[#1F6F6B]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{source.reviewStatus}</span>
                  </span>
                </div>

                <h3 className="font-child text-lg font-extrabold text-[#3A2E26]">
                  {source.title}
                </h3>

                <p className="text-xs font-bold text-[#1F6F6B]">
                  {language === 'fr' ? 'Portée :' : 'Applicability:'}{' '}
                  {source.applicability[language]}
                </p>

                <p className="text-sm text-[#3A2E26]/90">
                  {source.summaryNote[language]}
                </p>
              </div>

              <div className="pt-2 border-t border-[#3A2E26]/10">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#1F6F6B] underline hover:text-[#3A2E26]"
                >
                  <span>
                    {language === 'fr'
                      ? 'Ouvrir la ressource officielle'
                      : 'Open Official Source'}
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 2. Care-Team Contact & Procedure-Specific Links (Placeholder + Session Notes) */}
      <section
        aria-labelledby="careteam-contacts-heading"
        className="rounded-2xl border-2 border-[#3A2E26]/20 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <PhoneCall
            className="h-6 w-6 shrink-0 text-[#1F6F6B]"
            aria-hidden="true"
          />
          <h2
            id="careteam-contacts-heading"
            className="font-child text-xl font-extrabold text-[#3A2E26]"
          >
            {copy.careTeamPlaceholderHeading}
          </h2>
        </div>

        <p className="rounded-xl border border-[#1F6F6B]/30 bg-[#DDF1EE]/40 p-4 text-sm font-medium leading-relaxed text-[#3A2E26]">
          {copy.careTeamPlaceholderBody}
        </p>

        {contacts.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#1F6F6B]/30 bg-[#FFF8EC] p-3.5 text-sm"
              >
                <div className="space-y-1">
                  <p className="font-extrabold text-[#1F6F6B]">
                    {c.roleOrClinic}
                  </p>
                  {c.phoneOrLink && (
                    <p className="font-bold text-[#3A2E26]">{c.phoneOrLink}</p>
                  )}
                  {c.notes && (
                    <p className="text-xs text-[#3A2E26]/80">{c.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setContacts((prev) => prev.filter((item) => item.id !== c.id))
                  }
                  aria-label={`Remove ${c.roleOrClinic}`}
                  className="rounded-lg border border-[#3A2E26]/20 bg-[#FFFDF8] p-2 text-[#E76F51] hover:bg-[#FDE8D4] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAddSessionContact}
          className="grid grid-cols-1 gap-3 rounded-xl border border-[#3A2E26]/15 bg-[#FFF8EC] p-4 sm:grid-cols-3"
        >
          <div>
            <label
              htmlFor="careteam-role-input"
              className="block text-xs font-bold text-[#3A2E26]"
            >
              {language === 'fr'
                ? 'Clinique ou rôle (session actuelle)'
                : 'Clinic or Role (session only)'}
            </label>
            <input
              id="careteam-role-input"
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder={
                language === 'fr'
                  ? 'Ex. : Infirmière de chirurgie d’un jour'
                  : 'e.g., Day Surgery Nurse Line'
              }
              className="mt-1 w-full rounded-lg border border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#3A2E26]"
            />
          </div>

          <div>
            <label
              htmlFor="careteam-phone-input"
              className="block text-xs font-bold text-[#3A2E26]"
            >
              {language === 'fr'
                ? 'Téléphone ou lien de la feuille de congé'
                : 'Phone or Discharge Sheet Link'}
            </label>
            <input
              id="careteam-phone-input"
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={
                language === 'fr'
                  ? 'Ex. : Voir feuille de congé p. 1'
                  : 'e.g., See discharge sheet page 1'
              }
              className="mt-1 w-full rounded-lg border border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#3A2E26]"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="careteam-notes-input"
                className="block text-xs font-bold text-[#3A2E26]"
              >
                {language === 'fr' ? 'Heures / Note' : 'Hours / Note'}
              </label>
              <input
                id="careteam-notes-input"
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={
                  language === 'fr' ? 'Ex. : 24h/24' : 'e.g., 24/7 on-call'
                }
                className="mt-1 w-full rounded-lg border border-[#3A2E26]/25 bg-[#FFFDF8] px-3 py-2 text-sm text-[#3A2E26]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#1F6F6B] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#165350] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'fr' ? 'Ajouter' : 'Add'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 3. Reserved Parent Testimonials Section (No Fabricated Quotes) */}
      <section
        aria-labelledby="testimonials-reserved-heading"
        className="rounded-2xl border-2 border-dashed border-[#3A2E26]/30 bg-[#FFFDF8] p-5 shadow-xs sm:p-6 space-y-3"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquareQuote
            className="h-6 w-6 shrink-0 text-[#E76F51]"
            aria-hidden="true"
          />
          <h2
            id="testimonials-reserved-heading"
            className="font-child text-xl font-extrabold text-[#3A2E26]"
          >
            {copy.testimonialsReservedHeading}
          </h2>
        </div>

        <p className="rounded-xl border border-[#E76F51]/40 bg-[#FDE8D4]/55 p-4 text-sm font-medium leading-relaxed text-[#3A2E26]">
          {copy.testimonialsReservedBody}
        </p>
      </section>
    </div>
  );
};
