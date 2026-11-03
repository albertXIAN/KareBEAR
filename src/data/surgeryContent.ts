/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KareBEAR Pre-Op & Post-Op Content Store — Bilingual (English & French),
 * Age-Adapted (3-6, 7-9, 10-12), and Grounded in Verified Public Sources.
 */

import type {
  AgeBand,
  AppLanguage,
  BearStoryDraft,
  CosmeticRewardItem,
  DetailPreference,
  MachineTranscriptObject,
  PlainLanguageSummaryDraft,
  PostOpCareTask,
  PreOpLessonItem,
  TranscriptUncertaintyFlag,
} from '../utils/surgeryDataModel';
import { detectDisallowedReassurancePhrases } from '../utils/surgeryDataModel';
import type { RecoveryPointContent } from './demoContent';

/* -------------------------------------------------------------------------- */
/* 1. VERIFIED SOURCE METADATA                                                */
/* -------------------------------------------------------------------------- */

export interface VerifiedSourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  applicability: Record<AppLanguage, string>;
  reviewStatus: 'verified-public-source' | 'team-reported-context';
  summaryNote: Record<AppLanguage, string>;
}

export const VERIFIED_SOURCES: Record<string, VerifiedSourceRecord> = {
  'boston-childrens-7551': {
    id: 'boston-childrens-7551',
    title: 'Preparing Your Child for Surgery (EFPEC Sheet #7551)',
    publisher: "Boston Children's Hospital",
    url: 'https://extapps.childrenshospital.org/EFPEC/Home/Sheet/7551',
    applicability: {
      en: 'General pre-operative family preparation and familiarization with hospital routines.',
      fr: 'Préparation préopératoire générale des familles et familiarisation avec les routines hospitalières.',
    },
    reviewStatus: 'verified-public-source',
    summaryNote: {
      en: 'Explains how honest, age-appropriate explanations of sights, sounds, and hospital staff roles help children prepare before surgery.',
      fr: 'Explique comment des explications honnêtes et adaptées à l’âge sur ce que l’enfant verra et entendra aident à se préparer avant la chirurgie.',
    },
  },
  'aap-anesthesia-day': {
    id: 'aap-anesthesia-day',
    title:
      'Preparing Your Child for Anesthesia: What to Expect on the Day of the Procedure',
    publisher:
      'American Academy of Pediatrics (HealthyChildren.org — Justin L. Lockman, MD, MSEd, FAAP)',
    url: 'https://www.healthychildren.org/English/health-issues/conditions/treatments/Pages/Anesthesia-and-Children-The-Day-of-the-Procedure.aspx',
    applicability: {
      en: 'Day-of-procedure arrival, anesthesia mask vs. IV options, caregiver presence variability, and safety rules.',
      fr: 'Arrivée le jour de l’intervention, options masque ou intraveineuse (IV), présence variable du parent et règles de sécurité.',
    },
    reviewStatus: 'verified-public-source',
    summaryNote: {
      en: 'Details how anesthesia may start by mask or IV depending on age, procedure, and emergency status; notes that fasting rules and parent presence in the operating room vary by facility and clinical safety.',
      fr: 'Explique que l’anesthésie peut débuter par masque ou IV selon l’âge, l’intervention et l’urgence; précise que le jeûne et la présence parentale varient selon l’hôpital.',
    },
  },
  'ahrq-teach-back': {
    id: 'ahrq-teach-back',
    title:
      'Use the Teach-Back Method: Tool #5 (AHRQ Health Literacy Universal Precautions Toolkit)',
    publisher: 'Agency for Healthcare Research and Quality (AHRQ)',
    url: 'https://www.ahrq.gov/health-literacy/improve/precautions/tool5.html',
    applicability: {
      en: 'Checking understanding by inviting learners and caregivers to explain key points in their own words.',
      fr: 'Vérification de la compréhension en invitant l’enfant et le parent à expliquer les points clés dans leurs propres mots.',
    },
    reviewStatus: 'verified-public-source',
    summaryNote: {
      en: 'Recommends asking patients and families to state instructions in their own words to spot gaps in communication rather than testing or grading them.',
      fr: 'Recommande d’inviter les familles à reformuler les consignes dans leurs propres mots afin de repérer les points flous sans les noter.',
    },
  },
  'sickkids-cast': {
    id: 'sickkids-cast',
    title: 'Cast Care: Arm or Leg Cast',
    publisher: 'The Hospital for Sick Children (SickKids — AboutKidsHealth)',
    url: 'https://www.aboutkidshealth.ca/cast',
    applicability: {
      en: 'Used for the retained Non-Waterproof Arm Cast Demo Example (regression test suite).',
      fr: 'Utilisé pour l’exemple de démonstration du plâtre non imperméable (tests de régression).',
    },
    reviewStatus: 'verified-public-source',
    summaryNote: {
      en: 'Provides home-care instructions for keeping a non-waterproof cast dry, never putting objects inside, and checking fingers/toes for warning signs.',
      fr: 'Fournit les consignes pour garder un plâtre non imperméable au sec, ne rien glisser à l’intérieur et surveiller les doigts.',
    },
  },
  'wcag-22': {
    id: 'wcag-22',
    title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
    publisher: 'W3C Web Accessibility Initiative (WAI)',
    url: 'https://www.w3.org/TR/WCAG22/',
    applicability: {
      en: 'Contrast, keyboard focus, large touch targets, reduced motion, and text alternatives.',
      fr: 'Contraste, navigation au clavier, grandes cibles tactiles, réduction des mouvements et équivalents textuels.',
    },
    reviewStatus: 'verified-public-source',
    summaryNote: {
      en: 'Guides accessible contrast, focus visibility, target sizing, and prefers-reduced-motion compliance.',
      fr: 'Guide le contraste accessible, la visibilité du focus, la taille des boutons et le respect de prefers-reduced-motion.',
    },
  },
};

/* -------------------------------------------------------------------------- */
/* 2. BILINGUAL UI STRINGS (EN & FR)                                          */
/* -------------------------------------------------------------------------- */

export const SURGERY_UI_COPY = {
  en: {
    topNav: {
      preOpHub: 'Pre-Op Prep Hub',
      postOpHub: 'Post-Op Recovery',
      parentResources: 'Parent Resources',
      castDemo: 'Cast Demo (Regression)',
      setupBtn: 'Setup: Age & Language',
      activatePostOpBtn: 'Activate post-op mode',
      resetBtn: 'Reset Demo',
    },
    nav: {
      preOpHub: 'Pre-Op Prep Hub',
      postOpHub: 'Post-Op Recovery',
      resourcesTab: 'Parent Resources',
      castDemoTab: 'Cast Demo (Regression)',
      setupButton: 'Setup: Age & Language',
      activatePostOpButton: 'Activate post-op mode',
      returnToPreOpButton: 'Return to pre-op lessons',
      resetDemoButton: 'Reset Demo',
      homeButton: 'Home',
      backButton: 'Back',
    },
    modeBanner: {
      preOpActive: 'Current Mode: Pre-Op Surgical Preparation',
      postOpActive:
        'Current Mode: Post-Op Recovery (Manual Caregiver Mode — Does not indicate medical discharge)',
      castDemoActive: 'Current Mode: Cast Care Demo Examples (Regression Area)',
      frenchReviewBadge:
        '⚑ French clinical translation marked for bilingual clinical review',
    },
    badges: {
      reviewedDemo: '✓ Reviewed Demo Copy (EN)',
      needsClinicalReview: '⚑ Needs Clinical Review (FR Demo)',
      alwaysIncluded: 'Always included in this demonstration',
      unreviewedAiDraft: '⚑ Unreviewed Summary Draft — Caregiver Review Required',
      staleWarning: '⚑ Stale — Source Edited (Re-Review Required)',
    },
    setupModal: {
      title: 'Caregiver Setup: Age Group, Language & Presentation',
      subtitle:
        'Adjust how Kare presents lessons and stories. These settings change vocabulary and detail level only — they never alter medication quantities, timing, restrictions, or warning urgency. No child name, birth date, or diagnosis is collected.',
      ageLabel:
        '1. Age Band (Prototype assumption pending pediatric testing):',
      ageBandLabel:
        '1. Age Band (Prototype assumption pending pediatric testing):',
      ageBandDescriptions: {
        '3-6':
          'Ages 3–6 (Early Childhood) — Caregiver-led illustrations, very short concrete sentences, and read-aloud support.',
        '7-9':
          'Ages 7–9 (Middle Childhood) — Clear step-by-step explanations of what you may see, hear, and feel.',
        '10-12':
          'Ages 10–12 (Older Children / Pre-Teen) — More context on how hospital tools work and how to ask questions.',
      },
      ageBands: {
        '3-6': {
          label: 'Ages 3–6 (Early Childhood)',
          desc: 'Caregiver-led illustrations, very short concrete sentences, and read-aloud support.',
        },
        '7-9': {
          label: 'Ages 7–9 (Middle Childhood)',
          desc: 'Clear step-by-step explanations of what you may see, hear, and feel.',
        },
        '10-12': {
          label: 'Ages 10–12 (Older Children / Pre-Teen)',
          desc: 'More context on how hospital tools work and how to ask questions.',
        },
      },
      detailLabel:
        '2. Reading & Detail Preference (Independent of chronological age):',
      detailSimple: 'Simple Essentials (Short sentences first)',
      detailExtra: 'Include Extra Detail Automatically',
      detailOptions: {
        simple: 'Simple Essentials (Short sentences first)',
        'extra-detail': 'Include Extra Detail Automatically',
      },
      languageLabel: '3. Language Selection (Reviewed EN / Demo FR):',
      frenchReviewNote:
        '⚑ French medical strings are prototype translations flagged as "Needs clinical review" until verified by a bilingual clinical reviewer.',
      languageOptions: {
        en: 'English (Reviewed prototype strings)',
        fr: 'Français (Traduction de démonstration — marquée pour révision clinique)',
      },
      narrationLabel: '4. Enable Listen / Read-Aloud buttons across pages',
      narrationToggle: 'Enable Listen / Read-Aloud buttons across pages',
      privacyNote:
        'Privacy guardrail: Only non-sensitive presentation preferences (age band, language, detail level, and narration toggle) are saved locally. No child name, birth date, audio, or diagnosis is persisted.',
      saveButton: 'Save Preferences & Close',
      saveCloseButton: 'Save Preferences & Close',
    },
    postOpModal: {
      title: 'Adult Confirmation: Activate Post-Op Mode',
      explanation:
        'Important: Switching to Post-Op Mode is a manual caregiver action that changes the app’s educational content mode. The app cannot detect whether surgery is complete, and switching modes does NOT mean your child has been medically assessed or discharged.',
      checkboxLabel:
        'I am a parent, guardian, or evaluator, and I understand that post-op tasks and stories must be confirmed against our care team’s actual discharge instructions.',
      confirmButton: 'Activate Post-Op Mode Now',
      cancelButton: 'Stay in Pre-Op Mode',
    },
    postOpGateModal: {
      title: 'Adult Confirmation: Activate Post-Op Mode',
      warningBox:
        'Important: Switching to Post-Op Mode is a manual caregiver action that changes the app’s educational content mode. The app cannot detect whether surgery is complete, and switching modes does NOT mean your child has been medically assessed or discharged.',
      checkboxLabel:
        'I am a parent, guardian, or evaluator, and I understand that post-op tasks and stories must be confirmed against our care team’s actual discharge instructions.',
      confirmButton: 'Activate Post-Op Mode Now',
      cancelButton: 'Stay in Pre-Op Mode',
    },
    preOpHub: {
      heading: 'Getting Ready for Surgery Day with Kare',
      subheading:
        'Explore the hospital clothes, gentle check-up tools, and sleep helpers you may meet before your procedure — with honest, calm explanations grounded in pediatric child-life guides.',
      scopeBanner:
        'Scope & Safety Guardrail: These 8 lessons prepare children and caregivers for common pre-operative check-in steps. KareBEAR never makes false promises like "it won’t hurt" and never invents fasting (NPO) cutoffs — always follow your hospital’s exact arrival and eating/drinking rules.',
      completedBadge: 'Explored',
      exploreLesson: 'Open Lesson',
      backToHub: 'Back to All 8 Pre-Op Lessons',
      whatItIsHeading: '1. What It Is',
      whatYouMaySeeHeading: '2. What You May See, Hear, or Feel',
      whyItHelpsHeading: '3. How It Helps the Care Team',
      sourceHeading: 'Verified Hospital & Child-Life Sources',
      extraDetailHeading: 'More Detail for Curious Learners & Grown-Ups',
      comprehensionHeading: 'Quick Check with Kare',
      askOrExplainHeading: 'Ask a Grown-Up or Explain in Your Own Words',
      previousLesson: 'Previous Lesson',
      nextLesson: 'Next Lesson',
      listen: 'Listen',
      stop: 'Stop',
      loadingAudio: 'Preparing voice...',
    },
    appointment: {
      returnToPreOpBtn: 'Return to Pre-Op Lessons',
      heading: 'Capture or Load Post-Operative Discharge Instructions',
      subheading:
        'Record your clinician’s discharge review (with explicit permission), upload an audio note, or load the fictional tonsillectomy discharge fixture to test transcript correction, uncertainty flags, and story release.',
      discardBtn: 'Discard Session Transcript & Notes',
      consentLabel:
        'I confirm that I have permission from the clinician and family to record or process this post-operative instruction audio in this session.',
      startRecording: 'Start Appointment Recording',
      stopRecording: 'Stop & Transcribe',
      cancelRecording: 'Cancel Recording',
      loadSampleFixture: 'Load Sample Post-Op Appointment Fixture',
      uploadAudio: 'Upload Audio File',
      privacyBanner:
        'Session-only guardrail: Appointment audio, transcripts, summaries, and caregiver edits stay in memory for this session only and are never saved to localStorage.',
      machineTranscriptTitle: 'Original Machine Transcript',
      correctedTranscriptTitle: 'Caregiver-Corrected Transcript',
      uncertaintyHeading: 'Flagged Uncertainties & Missing Schedule Details',
      summaryHeading: 'Plain-Language Post-Op Summary',
      summarySections: {
        discussed: '1. What Was Discussed',
        whatToDo: '2. What To Do at Home',
        whenToSeekHelp: '3. When To Seek Immediate Medical Help',
        questionsToClarify: '4. Questions To Clarify with Care Team / Sheet',
      },
      markSummaryReviewedBtn: 'Mark Summary Reviewed by Caregiver',
      storyDraftHeading: 'Kare’s 3-Page Post-Op Recovery Story',
      regenerateStoryBtn: 'Rebuild from Summary',
      releaseStoryBtn: 'Release Story to Child View',
    },
    postOpTasks: {
      bearStatusHeading: 'Kare’s Cozy Recovery Corner',
      bearPositiveNote:
        'Positive-only companion rule: Kare celebrates confirmed recovery steps with stars and cozy accessories. Kare never becomes sad, sick, or disappointed if a task is skipped, delayed, or corrected.',
      heading: 'Grounded Post-Op Recovery Tasks & Caregiver Confirmation',
      subheading:
        'Tasks show exact source quotes and distinguish supplied fields from missing details (for example, "twice daily" never invents clock times). Only a caregiver can confirm task completion.',
      blockedBadge: '⚑ Blocked — Clarify Uncertainty First',
      childReadyBtn: 'Child: I’m Ready / Ask Grown-Up',
      caregiverConfirmBtn: 'Caregiver: Confirm Completed (+10 pts)',
      undoConfirmBtn: 'Correct Record (Undo)',
      rewardsHeading: 'Cozy Star Rewards & Idempotent Event Ledger',
      pointsLabel: 'Confirmed Recovery Stars',
    },
    parentResources: {
      heading: 'Parent & Caregiver Resources',
      subheading:
        'Verified pediatric hospital and child-life references used in this prototype, plus a session-only scratchpad for your care team’s contact information.',
      verifiedSourcesHeading: '1. Verified Hospital & Child-Life Sources',
      careTeamPlaceholderHeading:
        '2. Your Care-Team Contacts & Discharge Sheet Notes (Session-Only)',
      careTeamPlaceholderBody:
        'KareBEAR never fabricates hospital phone numbers or surgeon contact links. Use your printed discharge sheet for urgent calls, or jot down session-only contact notes below while reviewing with your family.',
      testimonialsReservedHeading:
        '3. Parent & Family Testimonials (Reserved — Intentionally Empty)',
      testimonialsReservedBody:
        'No parent testimonials are displayed in this prototype. This section is reserved for future IRB/REB-approved family study quotes so that KareBEAR never fabricates parent endorsements or clinical outcomes.',
    },
  },
  fr: {
    topNav: {
      preOpHub: 'Préparation Pré-Op',
      postOpHub: 'Récupération Post-Op',
      parentResources: 'Ressources Parents',
      castDemo: 'Démo Plâtre (Tests)',
      setupBtn: 'Réglages : Âge et Langue',
      activatePostOpBtn: 'Activer le mode post-op',
      resetBtn: 'Réinitialiser',
    },
    nav: {
      preOpHub: 'Préparation Pré-Op',
      postOpHub: 'Récupération Post-Op',
      resourcesTab: 'Ressources Parents',
      castDemoTab: 'Démo Plâtre (Tests)',
      setupButton: 'Réglages : Âge et Langue',
      activatePostOpButton: 'Activer le mode post-op',
      returnToPreOpButton: 'Retour aux leçons pré-op',
      resetDemoButton: 'Réinitialiser',
      homeButton: 'Accueil',
      backButton: 'Retour',
    },
    modeBanner: {
      preOpActive: 'Mode actuel : Préparation chirurgicale pré-opératoire',
      postOpActive:
        'Mode actuel : Récupération post-opératoire (Activé manuellement par l’adulte — n’indique pas un congé médical)',
      castDemoActive: 'Mode actuel : Exemple de soins du plâtre (Zone de test)',
      frenchReviewBadge:
        '⚑ Traduction clinique française marquée pour révision clinique',
    },
    badges: {
      reviewedDemo: '✓ Texte de démo vérifié (EN)',
      needsClinicalReview: '⚑ À réviser cliniquement (Démo FR)',
      alwaysIncluded: 'Toujours inclus dans cette démonstration',
      unreviewedAiDraft: '⚑ Brouillon non vérifié — Validation adulte requise',
      staleWarning: '⚑ Obsolète — Source modifiée (Re-vérification requise)',
    },
    setupModal: {
      title: 'Configuration Parent : Tranche d’âge, Langue et Présentation',
      subtitle:
        'Adaptez la façon dont Kare présente les leçons. Ces préférences modifient uniquement le vocabulaire et le niveau de détail — jamais les doses, les horaires, les restrictions ou l’urgence des signes d’alerte. Aucun nom ni diagnostic n’est recueilli.',
      ageLabel:
        '1. Tranche d’âge (Hypothèse de prototype en attente d’évaluation) :',
      ageBandLabel:
        '1. Tranche d’âge (Hypothèse de prototype en attente d’évaluation) :',
      ageBandDescriptions: {
        '3-6':
          '3 à 6 ans (Petite enfance) — Illustrations guidées par le parent, phrases très courtes et narration vocale.',
        '7-9':
          '7 à 9 ans (Enfance) — Explications claires de ce que l’enfant peut voir, entendre et ressentir.',
        '10-12':
          '10 à 12 ans (Pré-adolescents) — Plus de contexte sur le rôle des appareils médicaux et les questions à poser.',
      },
      ageBands: {
        '3-6': {
          label: '3 à 6 ans (Petite enfance)',
          desc: 'Illustrations guidées par le parent, phrases très courtes et narration vocale.',
        },
        '7-9': {
          label: '7 à 9 ans (Enfance)',
          desc: 'Explications claires de ce que l’enfant peut voir, entendre et ressentir.',
        },
        '10-12': {
          label: '10 à 12 ans (Pré-adolescents)',
          desc: 'Plus de contexte sur le rôle des appareils médicaux et les questions à poser.',
        },
      },
      detailLabel:
        '2. Niveau de détail (Indépendant de l’âge chronologique) :',
      detailSimple: 'Essentiel simple (Phrases courtes d’abord)',
      detailExtra: 'Afficher automatiquement les détails supplémentaires',
      detailOptions: {
        simple: 'Essentiel simple (Phrases courtes d’abord)',
        'extra-detail': 'Afficher automatiquement les détails supplémentaires',
      },
      languageLabel: '3. Langue (Anglais révisé / Français démo) :',
      frenchReviewNote:
        '⚑ Les textes médicaux en français sont des traductions de prototype marquées « À réviser cliniquement » en attente de validation bilingue.',
      languageOptions: {
        en: 'English (Textes de démonstration révisés)',
        fr: 'Français (Traduction de démonstration — marquée pour révision clinique)',
      },
      narrationLabel: '4. Activer les boutons Écouter sur les pages',
      narrationToggle: 'Activer les boutons Écouter sur les pages',
      privacyNote:
        'Confidentialité : Seules les préférences de présentation (âge, langue, niveau de détail, narration) sont enregistrées localement. Aucune donnée personnelle ou médicale n’est conservée.',
      saveButton: 'Enregistrer et fermer',
      saveCloseButton: 'Enregistrer et fermer',
    },
    postOpModal: {
      title: 'Confirmation Adulte : Activer le mode post-opératoire',
      explanation:
        'Important : L’activation du mode post-opératoire est une action manuelle du parent qui change le mode de contenu. L’application ne détecte pas si la chirurgie est terminée et ce changement ne signifie PAS que l’enfant a reçu son congé médical.',
      checkboxLabel:
        'Je suis un parent, tuteur ou évaluateur, et je comprends que les activités post-opératoires doivent être vérifiées avec les consignes réelles de l’équipe soignante.',
      confirmButton: 'Activer le mode post-op maintenant',
      cancelButton: 'Rester en mode pré-op',
    },
    postOpGateModal: {
      title: 'Confirmation Adulte : Activer le mode post-opératoire',
      warningBox:
        'Important : L’activation du mode post-opératoire est une action manuelle du parent qui change le mode de contenu. L’application ne détecte pas si la chirurgie est terminée et ce changement ne signifie PAS que l’enfant a reçu son congé médical.',
      checkboxLabel:
        'Je suis un parent, tuteur ou évaluateur, et je comprends que les activités post-opératoires doivent être vérifiées avec les consignes réelles de l’équipe soignante.',
      confirmButton: 'Activer le mode post-op maintenant',
      cancelButton: 'Rester en mode pré-op',
    },
    preOpHub: {
      heading: 'Se préparer pour le jour de l’intervention avec Kare',
      subheading:
        'Découvre les vêtements d’hôpital, les appareils de vérification doux et les aides au sommeil que tu pourrais voir avant l’intervention.',
      scopeBanner:
        'Cadre et sécurité : Ces 8 leçons préparent les enfants aux étapes pré-opératoires courantes. KareBEAR ne fait jamais de fausses promesses (« ça ne fera pas mal ») et n’invente aucune règle de jeûne.',
      completedBadge: 'Exploré',
      exploreLesson: 'Ouvrir la leçon',
      backToHub: 'Retour aux 8 leçons pré-op',
      whatItIsHeading: '1. Qu’est-ce que c’est ?',
      whatYouMaySeeHeading: '2. Ce que tu peux voir, entendre ou ressentir',
      whyItHelpsHeading: '3. Comment cela aide l’équipe soignante',
      sourceHeading: 'Sources hospitalières vérifiées',
      extraDetailHeading: 'Détails supplémentaires pour les curieux et les parents',
      comprehensionHeading: 'Petite vérification avec Kare',
      askOrExplainHeading: 'Demande à ton parent ou explique avec tes mots',
      previousLesson: 'Leçon précédente',
      nextLesson: 'Leçon suivante',
      listen: 'Écouter',
      stop: 'Arrêter',
      loadingAudio: 'Préparation de la voix...',
    },
    appointment: {
      returnToPreOpBtn: 'Retour aux leçons pré-op',
      heading: 'Enregistrer ou charger les consignes post-opératoires',
      subheading:
        'Enregistrez les consignes de congé avec autorisation, importez un fichier audio ou chargez l’exemple fictif d’amygdalectomie pour vérifier la transcription, les incertitudes et l’histoire de Kare.',
      discardBtn: 'Effacer les notes de la session',
      consentLabel:
        'Je confirme avoir l’autorisation du clinicien et de la famille pour enregistrer ou traiter cet audio pendant cette session.',
      startRecording: 'Démarrer l’enregistrement',
      stopRecording: 'Arrêter et transcrire',
      cancelRecording: 'Annuler l’enregistrement',
      loadSampleFixture: 'Charger l’exemple de rendez-vous post-op',
      uploadAudio: 'Importer un fichier audio',
      privacyBanner:
        'Session uniquement : L’audio, les transcriptions et les résumés restent uniquement en mémoire pendant la session et ne sont jamais sauvegardés dans localStorage.',
      machineTranscriptTitle: 'Transcription automatique originale',
      correctedTranscriptTitle: 'Transcription corrigée par le parent',
      uncertaintyHeading: 'Incertitudes signalées et détails d’horaire manquants',
      summaryHeading: 'Résumé post-opératoire en langage clair',
      summarySections: {
        discussed: '1. Ce qui a été discuté',
        whatToDo: '2. Ce qu’il faut faire à la maison',
        whenToSeekHelp: '3. Quand consulter immédiatement',
        questionsToClarify: '4. Questions à clarifier avec l’équipe / la feuille',
      },
      markSummaryReviewedBtn: 'Marquer le résumé comme vérifié par le parent',
      storyDraftHeading: 'Histoire post-opératoire de Kare (3 pages)',
      regenerateStoryBtn: 'Actualiser depuis le résumé',
      releaseStoryBtn: 'Publier l’histoire pour la vue Enfant',
    },
    postOpTasks: {
      bearStatusHeading: 'Le coin repos de Kare',
      bearPositiveNote:
        'Règle positive : Kare célèbre les étapes confirmées avec des étoiles et des accessoires. Kare ne devient jamais triste ou malade si une tâche est sautée, retardée ou corrigée.',
      heading: 'Tâches post-opératoires et confirmation par le parent',
      subheading:
        'Les tâches affichent la citation exacte et distinguent les informations fournies des détails manquants (« deux fois par jour » n’invente jamais d’heures). Seul un adulte peut confirmer une tâche.',
      blockedBadge: '⚑ Bloqué — Clarifier l’incertitude d’abord',
      childReadyBtn: 'Enfant : Je suis prêt / Demander à mon parent',
      caregiverConfirmBtn: 'Parent : Confirmer la tâche (+10 pts)',
      undoConfirmBtn: 'Corriger le dossier (Annuler)',
      rewardsHeading: 'Récompenses de Kare et journal idempotent',
      pointsLabel: 'Étoiles de récupération confirmées',
    },
    parentResources: {
      heading: 'Ressources pour les parents et proches aidants',
      subheading:
        'Sources hospitalières pédiatriques vérifiées utilisées dans ce prototype et espace de notes temporaires pour les coordonnées de votre équipe soignante.',
      verifiedSourcesHeading: '1. Sources hospitalières et pédiatriques vérifiées',
      careTeamPlaceholderHeading:
        '2. Coordonnées de votre équipe soignante (Session uniquement)',
      careTeamPlaceholderBody:
        'KareBEAR n’invente jamais de numéros d’urgence ou de coordonnées médicales. Consultez votre feuille de congé imprimée ou notez vos repères ci-dessous pour la session.',
      testimonialsReservedHeading:
        '3. Témoignages de parents (Espace réservé — Intentionnellement vide)',
      testimonialsReservedBody:
        'Aucun témoignage n’est affiché dans ce prototype afin de ne jamais fabriquer de citations de familles ou de résultats cliniques.',
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* 3. EIGHT PRE-OP PREPARATION LESSONS (ALL 8 REQUIRED TOPICS)                */
/* -------------------------------------------------------------------------- */

export const PRE_OP_LESSONS: PreOpLessonItem[] = [
  {
    id: 'preop-1-scrubs',
    stepNumber: 1,
    iconEmoji: '🩺',
    sceneBadgeText: {
      en: 'People Wearing Scrubs',
      fr: 'Personnes en tenue d’hôpital',
    },
    karePreset: 'doctor',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['boston-childrens-7551', 'aap-anesthesia-day'],
    variants: {
      en: {
        title: 'Meeting People Wearing Scrubs',
        shortSubtitle: 'Nurses, doctors, and helpers in soft hospital clothes',
        whatItIs: {
          '3-6':
            'Scrubs are clean, comfy shirts and pants that hospital helpers wear at work.',
          '7-9':
            'Scrubs are special clean uniforms worn by nurses, doctors, and anesthesia helpers in the hospital.',
          '10-12':
            'Scrubs are clean hospital uniforms worn by your surgical and anesthesia care team to help keep the procedure area clean.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Some helpers also wear a soft hat, a mask over their nose and mouth, and a name badge.',
          '7-9':
            'You may see helpers wearing blue, green, or patterned scrubs, plus a soft cap, mask, and name badge.',
          '10-12':
            'Team members may wear caps, masks, and ID badges. Because several people may visit to ask questions, you can always ask what their job is.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'They check your name band and talk with your grown-up to help take care of you.',
          '7-9':
            'Your care team checks your wristband, reviews your plan with your grown-up, and answers questions before the procedure.',
          '10-12':
            'Before your procedure, nurses, surgeons, and anesthesia clinicians review your records, check your ID band, and explain how they will care for you.',
        },
        extraDetail:
          'Even when someone wears a mask, you can see their eyes and hear their voice. Different hospitals have different check-in routines, and your grown-up can help introduce each team member.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare in your own words: Why do hospital helpers wear clean scrubs and check your wristband?',
        comprehensionQuestion:
          'Why do nurses and doctors wear scrubs and a mask in the procedure area?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'To keep things clean while they care for you',
            isCorrect: true,
            supportiveFeedback:
              'That’s right! Clean scrubs and masks help keep the hospital room clean while the team cares for you.',
          },
          {
            id: 'c2',
            text: 'Because they are playing dress-up for a party',
            isCorrect: false,
            supportiveFeedback:
              'Good guess, but scrubs are work clothes that help keep the hospital clean.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-scrubs-1',
            label: 'Scrubs are clean hospital work clothes worn by nurses and doctors',
            childFriendlyHint: 'Mention that scrubs are clean clothes for nurses and doctors.',
            keywords: ['clean', 'clothes', 'uniform', 'scrubs', 'nurse', 'doctor', 'helper', 'propre', 'tenue'],
          },
          {
            id: 'tb-scrubs-2',
            label: 'They check your name band and talk with your grown-up',
            childFriendlyHint: 'Mention checking your name band or talking with your grown-up.',
            keywords: ['name', 'band', 'wristband', 'grown-up', 'parent', 'questions', 'bracelet', 'nom'],
          },
        ],
      },
      fr: {
        title: 'Rencontrer l’équipe en tenue d’hôpital (Scrubs)',
        shortSubtitle: 'Infirmières, médecins et intervenants en vêtements propres',
        whatItIs: {
          '3-6':
            'Les tenues d’hôpital sont des vêtements doux et propres que portent les aides à l’hôpital.',
          '7-9':
            'Les « scrubs » sont des uniformes propres portés par les infirmières, les médecins et l’équipe d’anesthésie.',
          '10-12':
            'Les tenues chirurgicales sont des uniformes propres portés par l’équipe médicale pour garder la zone de soin propre.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Certaines personnes portent aussi un bonnet doux, un masque et un porte-nom.',
          '7-9':
            'Tu verras peut-être des personnes avec un bonnet, un masque sur le nez et la bouche, et une carte d’identité.',
          '10-12':
            'Les membres de l’équipe portent souvent un bonnet, un masque et un badge. Tu peux toujours demander quel est leur rôle.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Ils regardent ton bracelet de nom et parlent avec ton parent pour prendre soin de toi.',
          '7-9':
            'L’équipe vérifie ton bracelet d’identité, discute du plan avec ton parent et répond à vos questions.',
          '10-12':
            'Avant l’intervention, l’équipe vérifie ton dossier et ton bracelet d’identification et explique comment elle veillera sur ta sécurité.',
        },
        extraDetail:
          'Même avec un masque, tu peux voir leurs yeux et entendre leur voix. L’ordre des visites varie selon l’hôpital et l’intervention.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare dans tes propres mots : pourquoi l’équipe porte-t-elle des vêtements propres et vérifie-t-elle ton bracelet ?',
        comprehensionQuestion:
          'Pourquoi les infirmières et les médecins portent-ils une tenue spéciale et un masque ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Pour garder la salle propre pendant qu’ils prennent soin de toi',
            isCorrect: true,
            supportiveFeedback:
              'Exactement ! Ces vêtements propres aident à garder la salle propre pendant tes soins.',
          },
          {
            id: 'c2',
            text: 'Pour faire un concours de déguisement',
            isCorrect: false,
            supportiveFeedback:
              'Ce sont plutôt des vêtements de travail pour garder l’hôpital bien propre.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-scrubs-1',
            label: 'Les tenues d’hôpital gardent la salle propre',
            childFriendlyHint: 'Mentionne que ce sont des vêtements propres pour les médecins et infirmières.',
            keywords: ['propre', 'vêtement', 'tenue', 'uniforme', 'médecin', 'infirmière', 'clean', 'scrubs'],
          },
          {
            id: 'tb-scrubs-2',
            label: 'Ils vérifient le bracelet de nom et parlent au parent',
            childFriendlyHint: 'Mentionne la vérification du bracelet ou la discussion avec ton parent.',
            keywords: ['bracelet', 'nom', 'parent', 'adulte', 'question', 'band', 'wristband'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-2-gown',
    stepNumber: 2,
    iconEmoji: '👕',
    sceneBadgeText: {
      en: 'Hospital Gown',
      fr: 'Blouse d’hôpital',
    },
    karePreset: 'neutral',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['boston-childrens-7551', 'aap-anesthesia-day'],
    variants: {
      en: {
        title: 'Changing into a Hospital Gown',
        shortSubtitle: 'A loose, soft shirt or pyjamas for your procedure',
        whatItIs: {
          '3-6':
            'A hospital gown is a loose, soft shirt that snaps or ties in the back.',
          '7-9':
            'A hospital gown (or surgical pyjamas) is a loose shirt with snaps or ties that you put on before your procedure.',
          '10-12':
            'A hospital gown is a loose-fitting garment with snaps or ties that makes it easy for nurses to place monitors and keep your own clothes clean.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'It feels loose and airy. You might also get grippy socks for your feet.',
          '7-9':
            'It may feel cool or big at first, and you can ask for a warm hospital blanket or non-slip socks.',
          '10-12':
            'Hospital rooms can feel cool, so nurses often offer warm blankets and non-slip socks while you wait.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Wearing a gown helps nurses place gentle stickers or cuffs without tight sleeves in the way.',
          '7-9':
            'Loose sleeves and snaps let the team check your vital signs and care for you comfortably during the procedure.',
          '10-12':
            'Wearing a hospital gown ensures no metal zippers or tight sleeves interfere with monitoring equipment during your procedure.',
        },
        extraDetail:
          'You can ask your care team if you can bring a favourite stuffed animal or blanket from home while waiting in the pre-op area.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: How does a loose hospital gown help the nurses take care of you?',
        comprehensionQuestion:
          'Why do children often change into a loose hospital gown before a procedure?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'So nurses can easily place check-up cuffs or stickers and keep your home clothes clean',
            isCorrect: true,
            supportiveFeedback:
              'Spot on! A loose gown makes it easy to use check-up tools and keeps your own clothes clean.',
          },
          {
            id: 'c2',
            text: 'Because regular clothes are not allowed inside the hospital building',
            isCorrect: false,
            supportiveFeedback:
              'You can wear comfy clothes to the hospital; the gown is just for the procedure and check-up.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-gown-1',
            label: 'It is a loose shirt with snaps or ties for the procedure',
            childFriendlyHint: 'Mention that the gown is loose or has snaps/ties.',
            keywords: ['loose', 'gown', 'shirt', 'snaps', 'ties', 'pyjamas', 'blouse', 'ample'],
          },
          {
            id: 'tb-gown-2',
            label: 'It helps nurses place check-up cuffs/stickers and keeps clothes clean',
            childFriendlyHint: 'Mention helping nurses use check-up cuffs or keeping your clothes clean.',
            keywords: ['cuff', 'sticker', 'clean', 'monitor', 'blanket', 'nurse', 'propre', 'brassard'],
          },
        ],
      },
      fr: {
        title: 'Mettre une blouse d’hôpital',
        shortSubtitle: 'Un vêtement ample et doux pour l’intervention',
        whatItIs: {
          '3-6':
            'Une blouse d’hôpital est une chemise douce et ample qui s’attache dans le dos.',
          '7-9':
            'Une blouse d’hôpital (ou pyjama chirurgical) est un vêtement ample avec des boutons-pression ou des cordons.',
          '10-12':
            'La blouse d’hôpital est un vêtement ample qui permet aux infirmières d’installer les capteurs facilement et de garder tes vêtements propres.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Elle est grande et légère. Tu peux demander une couverture chaude et des chaussettes antidérapantes.',
          '7-9':
            'Elle peut sembler fraîche au début, mais tu peux demander une couverture chaude.',
          '10-12':
            'Les salles d’attente peuvent être fraîches; l’équipe offre souvent des couvertures chauffées et des chaussettes antidérapantes.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Les manches larges aident l’infirmière à poser le brassard sans que tes manches ne gênent.',
          '7-9':
            'Les attaches permettent à l’équipe de vérifier tes signes vitaux facilement et confortablement.',
          '10-12':
            'La blouse évite que des fermetures éclair ou des manches serrées ne gênent les appareils de surveillance.',
        },
        extraDetail:
          'Selon les règles de l’hôpital, tu peux souvent garder un doudou ou un jouet réconfortant avec toi dans la salle d’attente pré-opératoire.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : comment la blouse ample aide-t-elle l’équipe soignante ?',
        comprehensionQuestion:
          'Pourquoi met-on souvent une blouse d’hôpital ample avant une intervention ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Pour faciliter la pose des appareils de contrôle et garder ses vêtements propres',
            isCorrect: true,
            supportiveFeedback:
              'Bravo ! La blouse ample facilite les contrôles et garde tes vêtements propres.',
          },
          {
            id: 'c2',
            text: 'Parce qu’il est interdit d’entrer à l’hôpital avec un chandail',
            isCorrect: false,
            supportiveFeedback:
              'Tu peux venir en vêtements confortables; la blouse sert seulement pour l’intervention.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-gown-1',
            label: 'C’est une chemise ample avec des attaches ou boutons-pression',
            childFriendlyHint: 'Mentionne que la blouse est ample ou confortable.',
            keywords: ['blouse', 'ample', 'chemise', 'pyjama', 'couverture', 'loose', 'gown'],
          },
          {
            id: 'tb-gown-2',
            label: 'Elle aide à poser les appareils et garde les vêtements propres',
            childFriendlyHint: 'Mentionne qu’elle aide les infirmières ou garde tes vêtements propres.',
            keywords: ['appareil', 'brassard', 'propre', 'infirmière', 'vêtement', 'clean', 'cuff'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-3-bp-cuff',
    stepNumber: 3,
    iconEmoji: '💪',
    sceneBadgeText: {
      en: 'Blood-Pressure Cuff & Vitals',
      fr: 'Brassard de tension et signes vitaux',
    },
    karePreset: 'doctor',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['boston-childrens-7551', 'aap-anesthesia-day'],
    variants: {
      en: {
        title: 'Blood-Pressure Cuff and Taking Vital Signs',
        shortSubtitle: 'A soft arm wrap that gives your arm a firm hug',
        whatItIs: {
          '3-6':
            'A blood-pressure cuff is a soft band with Velcro that wraps around your upper arm.',
          '7-9':
            'A blood-pressure cuff is an inflatable fabric wrap that checks how strongly your heart pumps blood.',
          '10-12':
            'A blood-pressure cuff and pulse oximeter check your blood pressure, heart rate, and oxygen level as part of your vital signs.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'It puffs up with air, gives your arm a tight hug for a few seconds, and then lets go.',
          '7-9':
            'You will hear a gentle humming sound as the cuff fills with air and squeezes your arm firmly before relaxing.',
          '10-12':
            'The cuff inflates with air, feels snug around your arm for about 15–20 seconds, and then deflates. You may also get a soft light sticker on your finger.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Holding your arm still helps the machine finish its arm hug faster.',
          '7-9':
            'Checking vital signs tells the nurses and doctors how your body is doing before and after your procedure.',
          '10-12':
            'Measuring baseline vital signs helps your anesthesia and nursing team monitor your body safely before, during, and after the procedure.',
        },
        extraDetail:
          'Often the nurse also places a small glowing red-light sticker (pulse oximeter) on your finger or toe. It does not poke—it just shines a tiny light to read your oxygen.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: What does the blood-pressure cuff feel like when it puffs up with air?',
        comprehensionQuestion:
          'What happens when the blood-pressure cuff checks your arm?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'It puffs up with air to give a short, firm arm hug and then lets go',
            isCorrect: true,
            supportiveFeedback:
              'Yes! It fills with air for a short squeeze and then softens right away.',
          },
          {
            id: 'c2',
            text: 'It stays puffed up for the whole day',
            isCorrect: false,
            supportiveFeedback:
              'Thankfully no—it only squeezes for a few seconds and then lets the air out.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-bp-1',
            label: 'Wraps around the arm and puffs up with air like a firm hug',
            childFriendlyHint: 'Mention that it wraps on your arm and gives a hug or squeeze with air.',
            keywords: ['hug', 'squeeze', 'air', 'puff', 'arm', 'cuff', 'tight', 'brassard', 'serre', 'bras'],
          },
          {
            id: 'tb-bp-2',
            label: 'Holding still helps check how the heart and body are doing',
            childFriendlyHint: 'Mention holding still or checking your heart/vital signs.',
            keywords: ['still', 'heart', 'vital', 'let go', 'relax', 'seconds', 'coeur', 'immobile'],
          },
        ],
      },
      fr: {
        title: 'Le brassard de tension et les signes vitaux',
        shortSubtitle: 'Une bande douce qui fait un câlin ferme à ton bras',
        whatItIs: {
          '3-6':
            'Le brassard est une bande douce avec du Velcro qui s’enroule autour de ton bras.',
          '7-9':
            'Le brassard de tension est une bande gonflable qui mesure comment ton cœur fait circuler le sang.',
          '10-12':
            'Le brassard de tension et le petit capteur au bout du doigt mesurent ta tension artérielle, ton pouls et ton oxygène.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Il se gonfle d’air, serre fort ton bras quelques secondes comme un câlin, puis se dégonfle.',
          '7-9':
            'Tu entendras un petit bourdonnement pendant qu’il se gonfle d’air et serre ton bras avant de se relâcher.',
          '10-12':
            'Le brassard se gonfle pendant 15 à 20 secondes, serre fermement le bras, puis relâche l’air complètement.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Garder ton bras immobile aide la machine à terminer plus vite.',
          '7-9':
            'Prendre les signes vitaux indique à l’équipe comment ton corps se porte avant et après l’intervention.',
          '10-12':
            'Ces mesures de base aident l’équipe d’anesthésie et les infirmières à surveiller ta sécurité tout au long des soins.',
        },
        extraDetail:
          'On pose souvent aussi un petit autocollant lumineux rouge au bout du doigt (saturomètre). Il utilise seulement de la lumière pour lire l’oxygène.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : que ressent-on quand le brassard se gonfle d’air ?',
        comprehensionQuestion:
          'Que fait le brassard de tension autour de ton bras ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Il se gonfle d’air quelques secondes comme un câlin ferme, puis se dégonfle',
            isCorrect: true,
            supportiveFeedback:
              'Très bien ! Il serre quelques secondes puis relâche l’air tout de suite.',
          },
          {
            id: 'c2',
            text: 'Il reste gonflé toute la journée',
            isCorrect: false,
            supportiveFeedback:
              'Non, il ne reste gonflé que quelques secondes avant de se relâcher.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-bp-1',
            label: 'Se gonfle d’air autour du bras puis se dégonfle',
            childFriendlyHint: 'Mentionne qu’il se gonfle d’air ou fait un câlin au bras.',
            keywords: ['gonfle', 'air', 'câlin', 'serre', 'bras', 'brassard', 'hug', 'squeeze'],
          },
          {
            id: 'tb-bp-2',
            label: 'Rester immobile aide à vérifier le cœur et les signes vitaux',
            childFriendlyHint: 'Mentionne de garder le bras immobile ou de vérifier le cœur.',
            keywords: ['immobile', 'cœur', 'coeur', 'signes', 'vitaux', 'dégonfle', 'still', 'heart'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-4-stethoscope',
    stepNumber: 4,
    iconEmoji: '🎧',
    sceneBadgeText: {
      en: 'Stethoscope',
      fr: 'Stéthoscope',
    },
    karePreset: 'doctor',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['boston-childrens-7551', 'aap-anesthesia-day'],
    variants: {
      en: {
        title: 'Listening with a Stethoscope',
        shortSubtitle: 'A small round listener for your heartbeat and breathing',
        whatItIs: {
          '3-6':
            'A stethoscope has earpieces for the doctor and a little round circle that rests on your chest.',
          '7-9':
            'A stethoscope is a listening tool that lets nurses and doctors hear your heart beating and air moving in your lungs.',
          '10-12':
            'A stethoscope amplifies internal body sounds so your clinician can listen clearly to your heart rhythm and breath sounds.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'The round circle touches your chest or back. Sometimes it feels a little cool at first!',
          '7-9':
            'The flat disc rests gently against your chest or back while you take slow, deep breaths.',
          '10-12':
            'The metal or plastic disc may feel cool for a second when placed on your chest or back, and the doctor may ask you to breathe in and out.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'The doctor listens to your "lub-dub" heartbeat and your big breaths.',
          '7-9':
            'Listening to your lungs and heart before anesthesia helps the care team make sure your breathing is clear.',
          '10-12':
            'Checking heart and lung sounds is a standard part of the pre-anesthesia check-up to confirm your airways are clear.',
        },
        extraDetail:
          'You can ask the nurse or doctor if they can warm the stethoscope disc with their hand first, or even let you listen to Kare’s chest or your own heartbeat!',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: What sounds does the doctor listen for with a stethoscope?',
        comprehensionQuestion:
          'What does a nurse or doctor do with a stethoscope?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Listens to your heartbeat and breathing on your chest or back',
            isCorrect: true,
            supportiveFeedback:
              'Exactly right! The stethoscope lets them hear your heart and lungs.',
          },
          {
            id: 'c2',
            text: 'Takes a photograph of your bones',
            isCorrect: false,
            supportiveFeedback:
              'An X-ray camera takes bone pictures; a stethoscope is just for listening to sounds.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-steth-1',
            label: 'Rests gently on the chest or back (may feel cool)',
            childFriendlyHint: 'Mention that the round part rests on your chest or back.',
            keywords: ['chest', 'back', 'circle', 'disc', 'cool', 'touch', 'poitrine', 'dos', 'froid'],
          },
          {
            id: 'tb-steth-2',
            label: 'Listens to your heartbeat and breathing / lungs',
            childFriendlyHint: 'Mention listening to your heartbeat or breathing.',
            keywords: ['heart', 'heartbeat', 'breath', 'breathing', 'lungs', 'listen', 'lub-dub', 'cœur', 'respiration'],
          },
        ],
      },
      fr: {
        title: 'Écouter avec un stéthoscope',
        shortSubtitle: 'Un petit disque pour écouter ton cœur et ta respiration',
        whatItIs: {
          '3-6':
            'Le stéthoscope a des écouteurs pour le médecin et un petit rond qui se pose sur ta poitrine.',
          '7-9':
            'Le stéthoscope est un outil d’écoute qui permet d’entendre les battements de ton cœur et l’air dans tes poumons.',
          '10-12':
            'Le stéthoscope amplifie les sons internes pour que le médecin écoute clairement ton rythme cardiaque et tes poumons.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Le petit rond touche ta poitrine ou ton dos. Il peut sembler un peu frais au début !',
          '7-9':
            'Le disque plat se pose doucement sur ta poitrine ou ton dos pendant que tu prends de grandes respirations.',
          '10-12':
            'Le disque peut être un peu frais au contact de la peau, et le médecin te demandera de respirer lentement.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Le médecin écoute le « boum-boum » de ton cœur et tes grandes respirations.',
          '7-9':
            'Écouter ton cœur et tes poumons avant l’anesthésie aide l’équipe à vérifier que ta respiration est bien dégagée.',
          '10-12':
            'L’auscultation du cœur et des poumons fait partie de l’examen pré-anesthésique habituel.',
        },
        extraDetail:
          'Tu peux demander à l’infirmière ou au médecin de réchauffer le disque dans sa main avant de le poser !',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : qu’est-ce que le médecin écoute avec le stéthoscope ?',
        comprehensionQuestion:
          'À quoi sert le stéthoscope lors de l’examen pré-opératoire ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'À écouter les battements de ton cœur et ta respiration',
            isCorrect: true,
            supportiveFeedback:
              'C’est exact ! Il sert uniquement à écouter ton cœur et tes poumons.',
          },
          {
            id: 'c2',
            text: 'À mesurer ta taille debout',
            isCorrect: false,
            supportiveFeedback:
              'Non, le stéthoscope sert à écouter les sons de ton cœur et de ta respiration.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-steth-1',
            label: 'Se pose doucement sur la poitrine ou le dos',
            childFriendlyHint: 'Mentionne qu’il se pose sur la poitrine ou le dos.',
            keywords: ['poitrine', 'dos', 'rond', 'disque', 'frais', 'chest', 'back'],
          },
          {
            id: 'tb-steth-2',
            label: 'Écoute les battements du cœur et la respiration',
            childFriendlyHint: 'Mentionne qu’il écoute le cœur ou la respiration.',
            keywords: ['cœur', 'coeur', 'respiration', 'poumons', 'écouter', 'heart', 'breath'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-5-thermometer',
    stepNumber: 5,
    iconEmoji: '🌡️',
    sceneBadgeText: {
      en: 'Thermometer',
      fr: 'Thermomètre',
    },
    karePreset: 'doctor',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['boston-childrens-7551', 'aap-anesthesia-day'],
    variants: {
      en: {
        title: 'Checking Temperature with a Thermometer',
        shortSubtitle: 'A quick beep to check how warm your body is',
        whatItIs: {
          '3-6':
            'A thermometer is a small wand that checks how warm your body is and makes a little beep.',
          '7-9':
            'A hospital thermometer measures your body temperature to check that you do not have a fever.',
          '10-12':
            'A digital thermometer checks your body temperature before and after your procedure to make sure you don’t have a fever or infection.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'It may glide across your forehead, rest gently by your ear, or sit under your tongue or arm for a few seconds.',
          '7-9':
            'Depending on the hospital’s thermometer, it may swipe gently across your forehead, rest in your ear, or go under your tongue or armpit until it beeps.',
          '10-12':
            'Hospitals use forehead scanners, ear (tympanic), oral, or under-arm thermometers. It takes only a few seconds and beeps when finished.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'When it beeps, your nurse sees a number that shows how warm you are.',
          '7-9':
            'Knowing your temperature helps your anesthesia and nursing team make sure you are healthy for your procedure.',
          '10-12':
            'Checking for a fever before anesthesia and during recovery is an important safety check.',
        },
        extraDetail:
          'If you have had a recent cold, cough, or fever before the day of surgery, your grown-up should let the surgical and anesthesia team know right away.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: Where might the nurse place a thermometer to check your temperature?',
        comprehensionQuestion:
          'What does the thermometer check when it beeps?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'How warm your body is (your temperature)',
            isCorrect: true,
            supportiveFeedback:
              'Right! It checks your body temperature in just a few seconds.',
          },
          {
            id: 'c2',
            text: 'How tall you have grown this year',
            isCorrect: false,
            supportiveFeedback:
              'A height chart checks how tall you are; a thermometer checks how warm your body is.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-therm-1',
            label: 'Checks how warm your body is / checks for a fever',
            childFriendlyHint: 'Mention checking how warm your body is or checking temperature.',
            keywords: ['warm', 'temperature', 'fever', 'heat', 'beep', 'chaud', 'température', 'fièvre'],
          },
          {
            id: 'tb-therm-2',
            label: 'Touches the forehead, ear, mouth, or under the arm for a few seconds',
            childFriendlyHint: 'Mention where it goes (forehead, ear, mouth, or arm).',
            keywords: ['forehead', 'ear', 'tongue', 'mouth', 'arm', 'seconds', 'front', 'oreille', 'bouche', 'bras'],
          },
        ],
      },
      fr: {
        title: 'Vérifier la température avec un thermomètre',
        shortSubtitle: 'Un petit bip rapide pour voir la chaleur de ton corps',
        whatItIs: {
          '3-6':
            'Un thermomètre est un petit appareil qui vérifie si ton corps est chaud et fait un petit « bip ».',
          '7-9':
            'Le thermomètre mesure la température de ton corps pour vérifier que tu n’as pas de fièvre.',
          '10-12':
            'Le thermomètre numérique mesure ta température corporelle avant et après l’intervention.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Il peut passer doucement sur ton front, près de ton oreille, sous ta langue ou sous ton bras.',
          '7-9':
            'Selon le modèle utilisé par l’hôpital, il passe sur le front, dans l’oreille, sous la langue ou sous le bras pendant quelques secondes.',
          '10-12':
            'La mesure ne prend que quelques secondes sur le front, l’oreille, la bouche ou l’aisselle, jusqu’au signal sonore.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Quand il fait « bip », l’infirmière voit ta température sur le petit écran.',
          '7-9':
            'Connaître ta température aide l’équipe à s’assurer que ton corps est prêt pour l’intervention.',
          '10-12':
            'Vérifier l’absence de fièvre fait partie des contrôles de sécurité avant l’anesthésie et pendant le réveil.',
        },
        extraDetail:
          'Si tu as eu un rhume, une toux ou de la fièvre récemment, ton parent doit en informer l’équipe médicale.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : que vérifie le thermomètre quand il fait « bip » ?',
        comprehensionQuestion:
          'Que mesure le thermomètre de l’infirmière ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'La température de ton corps (savoir si tu as de la fièvre)',
            isCorrect: true,
            supportiveFeedback:
              'Exact ! Il mesure la température de ton corps en quelques secondes.',
          },
          {
            id: 'c2',
            text: 'La couleur de tes chaussures',
            isCorrect: false,
            supportiveFeedback:
              'Non, le thermomètre sert à mesurer la température de ton corps.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-therm-1',
            label: 'Mesure la température du corps / vérifie la fièvre',
            childFriendlyHint: 'Mentionne la température ou la chaleur du corps.',
            keywords: ['température', 'chaud', 'fièvre', 'bip', 'warm', 'temperature'],
          },
          {
            id: 'tb-therm-2',
            label: 'Se place sur le front, l’oreille, la bouche ou sous le bras',
            childFriendlyHint: 'Mentionne le front, l’oreille, la bouche ou le bras.',
            keywords: ['front', 'oreille', 'bouche', 'langue', 'bras', 'forehead', 'ear'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-6-height-weight',
    stepNumber: 6,
    iconEmoji: '📏',
    sceneBadgeText: {
      en: 'Height & Weight',
      fr: 'Taille et Poids',
    },
    karePreset: 'checklist',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['boston-childrens-7551', 'aap-anesthesia-day'],
    variants: {
      en: {
        title: 'Height and Weight Measurement',
        shortSubtitle: 'Stepping on a scale and standing tall by a ruler',
        whatItIs: {
          '3-6':
            'You step onto a flat scale and stand tall like a tree so the nurse can see how big you are.',
          '7-9':
            'Before a procedure, the nurse measures how much you weigh on a scale and how tall you are.',
          '10-12':
            'Measuring your exact current weight and height is one of the first steps when you check in at the hospital.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'You slip off your shoes, stand still on the flat platform for a moment, and touch the top bar to your head.',
          '7-9':
            'You stand on a flat scale for a few seconds while a gentle sliding bar measures the top of your head.',
          '10-12':
            'You simply stand still on a digital scale and height stadiometer for a few seconds.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Doctors use your exact size so they know just the right amount of sleepy medicine for your body.',
          '7-9':
            'In pediatric care, doctors and pharmacists calculate medicines carefully using your exact weight.',
          '10-12':
            'Anesthesiologists and pediatric clinicians use your exact day-of-procedure weight and height to calculate safe, individualized medication amounts.',
        },
        extraDetail:
          'Even if your grown-up weighed you at home recently, the hospital always checks on their own scale on the day of the procedure for safety.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: Why do doctors need to know your exact weight before a procedure?',
        comprehensionQuestion:
          'Why does the nurse check your weight and height on the day of your procedure?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'So the care team can plan the right amount of medicine for your body size',
            isCorrect: true,
            supportiveFeedback:
              'That’s it! Your exact weight helps the doctors choose the right amount for your body.',
          },
          {
            id: 'c2',
            text: 'To see if you are tall enough to ride a roller coaster',
            isCorrect: false,
            supportiveFeedback:
              'Roller coasters are fun, but at the hospital your weight helps the team plan safely for your body size.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-hw-1',
            label: 'Stand still on a scale and measure height',
            childFriendlyHint: 'Mention standing on a scale or measuring how tall you are.',
            keywords: ['scale', 'tall', 'height', 'weight', 'stand', 'balance', 'poids', 'taille', 'grand'],
          },
          {
            id: 'tb-hw-2',
            label: 'Helps doctors calculate the right amount of medicine for your body size',
            childFriendlyHint: 'Mention that your size helps doctors know the right amount of medicine.',
            keywords: ['medicine', 'amount', 'size', 'body', 'doctor', 'safe', 'médicament', 'quantité', 'corps'],
          },
        ],
      },
      fr: {
        title: 'Mesurer la taille et le poids',
        shortSubtitle: 'Monter sur la balance et se tenir bien droit',
        whatItIs: {
          '3-6':
            'Tu montes sur une balance plate et tu te tiens droit comme un arbre pour voir combien tu as grandi.',
          '7-9':
            'Avant l’intervention, l’infirmière mesure ton poids sur une balance et ta taille.',
          '10-12':
            'La mesure exacte de ton poids et de ta taille du jour est une étape essentielle dès ton arrivée.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Tu enlèves tes chaussures et tu restes immobile quelques secondes sur la balance.',
          '7-9':
            'Tu restes debout sur la balance quelques secondes pendant qu’une petite toise touche le haut de ta tête.',
          '10-12':
            'Tu te tiens immobile quelques secondes sur la balance numérique et sous la toise.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Les médecins utilisent ton poids exact pour préparer la bonne quantité de soins pour ton corps.',
          '7-9':
            'En pédiatrie, les médecins calculent les médicaments avec précision selon ton poids exact.',
          '10-12':
            'Les anesthésistes utilisent ton poids exact du jour pour calculer des doses sécuritaires adaptées à ton corps.',
        },
        extraDetail:
          'Même si tu t’es pesé à la maison récemment, l’hôpital vérifie toujours sur sa propre balance le jour même par sécurité.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : pourquoi les médecins ont-ils besoin de connaître ton poids exact ?',
        comprehensionQuestion:
          'Pourquoi l’infirmière mesure-t-elle ton poids et ta taille avant l’intervention ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Pour que l’équipe adapte précisément les soins à la taille de ton corps',
            isCorrect: true,
            supportiveFeedback:
              'Très juste ! Ton poids exact permet aux médecins de prévoir exactement ce qu’il te faut.',
          },
          {
            id: 'c2',
            text: 'Pour savoir quelle pointure de souliers acheter',
            isCorrect: false,
            supportiveFeedback:
              'À l’hôpital, le poids et la taille servent à adapter tes soins en toute sécurité.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-hw-1',
            label: 'Monter sur la balance et mesurer sa taille',
            childFriendlyHint: 'Mentionne la balance, le poids ou la taille.',
            keywords: ['balance', 'poids', 'taille', 'grand', 'debout', 'scale', 'weight', 'height'],
          },
          {
            id: 'tb-hw-2',
            label: 'Aide les médecins à calculer la bonne quantité de médicaments pour ton corps',
            childFriendlyHint: 'Mentionne que cela aide les médecins à choisir la bonne quantité pour ton corps.',
            keywords: ['médicament', 'quantité', 'dose', 'corps', 'médecin', 'medicine', 'size'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-7-mask',
    stepNumber: 7,
    iconEmoji: '😷',
    sceneBadgeText: {
      en: 'Anaesthesia Mask',
      fr: 'Masque d’anesthésie',
    },
    karePreset: 'doctor',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['aap-anesthesia-day', 'boston-childrens-7551'],
    variants: {
      en: {
        title: 'The Anaesthesia Mask',
        shortSubtitle: 'A soft cushion mask that helps some children breathe sleepy air',
        whatItIs: {
          '3-6':
            'An anaesthesia mask is a clear, soft plastic cup with a squishy cushion rim that fits over your nose and mouth.',
          '7-9':
            'An anaesthesia mask is a soft cushioned mask connected to a tube that can deliver oxygen and sleepy air.',
          '10-12':
            'An anaesthesia mask is a cushioned face mask used to deliver oxygen or inhaled anesthetic gas when anesthesia is started by breathing.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'It rests gently on your face like an astronaut mask. The sleepy air inside may have a strong or fruity smell, and you take slow breaths.',
          '7-9':
            'The mask does not poke, though having it over your nose and mouth can feel unfamiliar and the medicine air can have a strong smell.',
          '10-12':
            'Breathing through the mask does not hurt, though not everyone likes the feeling of a mask on their face and the anesthetic gas can smell strong.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Your anesthesia doctor decides whether you will use a mask or another way to fall into a deep surgery sleep.',
          '7-9':
            'Many children start anesthesia by breathing through a mask, while others start with an IV depending on their age, preferences, and procedure.',
          '10-12':
            'Per AAP guidance, many children can start anesthesia by mask, while older children or emergency procedures may start with an IV instead. Your anesthesiologist will explain the safest plan for you.',
        },
        extraDetail:
          'Important to know: Whether a grown-up can come into the procedure room when anesthesia starts depends on the hospital’s rules and whether the surgery is scheduled or an emergency. Your anesthesia team will tell your family what to expect.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: What might you feel or smell if you breathe through an anaesthesia mask?',
        comprehensionQuestion:
          'What is true about the anaesthesia mask?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'It has a soft cushion rim for breathing oxygen or sleepy air, and your anesthesia doctor explains if it will be used for your procedure',
            isCorrect: true,
            supportiveFeedback:
              'That’s right! It rests over your nose and mouth, and your anesthesia team chooses the safest plan for you.',
          },
          {
            id: 'c2',
            text: 'Every single child in every hospital always uses the exact same mask routine',
            isCorrect: false,
            supportiveFeedback:
              'Actually, anesthesia can start with a mask or an IV depending on your age, procedure, and hospital.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-mask-1',
            label: 'Soft cushion mask over nose and mouth for breathing oxygen or sleepy air (may smell strong)',
            childFriendlyHint: 'Mention breathing through the soft mask over your nose/mouth or its smell.',
            keywords: ['mask', 'breathe', 'nose', 'mouth', 'cushion', 'sleepy', 'smell', 'oxygen', 'masque', 'respirer', 'odeur'],
          },
          {
            id: 'tb-mask-2',
            label: 'The anesthesia team chooses whether a mask or IV is best for your specific procedure',
            childFriendlyHint: 'Mention that the anesthesia doctor explains whether you will use a mask or another method.',
            keywords: ['doctor', 'team', 'choose', 'plan', 'iv', 'procedure', 'safe', 'médecin', 'équipe', 'plan'],
          },
        ],
      },
      fr: {
        title: 'Le masque d’anesthésie',
        shortSubtitle: 'Un masque à coussin doux pour respirer de l’air qui aide à dormir',
        whatItIs: {
          '3-6':
            'Le masque d’anesthésie est un masque transparent avec un rebord tout mou qui se pose sur ton nez et ta bouche.',
          '7-9':
            'Le masque d’anesthésie est un masque souple relié à un tube qui donne de l’oxygène et un gaz pour dormir.',
          '10-12':
            'Le masque d’anesthésie est un masque facial coussiné utilisé pour administrer de l’oxygène ou un gaz anesthésique.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Il se pose sur ton visage comme un masque d’astronaute. L’air peut avoir une odeur forte ou fruitée pendant que tu respires.',
          '7-9':
            'Le masque ne pique pas, mais le sentir sur le visage peut surprendre et le gaz peut avoir une odeur assez forte.',
          '10-12':
            'Respirer dans le masque ne fait pas mal, mais le contact sur le visage ou l’odeur prononcée du gaz peut sembler inhabituel.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'Le médecin d’anesthésie explique à ton parent comment tu vas t’endormir pour l’opération.',
          '7-9':
            'Certains enfants commencent l’anesthésie avec le masque et d’autres avec une intraveineuse (IV), selon leur âge et l’intervention.',
          '10-12':
            'Selon les recommandations pédiatriques (AAP), le début de l’anesthésie (masque ou IV) et la présence d’un parent dépendent de l’âge, de l’intervention, de l’urgence et de l’hôpital.',
        },
        extraDetail:
          'Bon à savoir : la possibilité qu’un parent t’accompagne au début de l’anesthésie dépend des règles de l’hôpital et du caractère programmé ou urgent de la chirurgie.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : que peut-on sentir avec le masque d’anesthésie ?',
        comprehensionQuestion:
          'Qu’est-ce qui est vrai à propos du masque d’anesthésie ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Il a un coussin souple pour respirer, et l’anesthésiste explique la méthode choisie pour ton intervention',
            isCorrect: true,
            supportiveFeedback:
              'Exactement ! L’équipe d’anesthésie choisit et explique la méthode la plus sécuritaire pour toi.',
          },
          {
            id: 'c2',
            text: 'Tous les hôpitaux font exactement la même chose pour chaque enfant sans exception',
            isCorrect: false,
            supportiveFeedback:
              'La méthode (masque ou IV) et les règles varient selon l’enfant, l’intervention et l’hôpital.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-mask-1',
            label: 'Masque à coussin souple sur le nez et la bouche (peut avoir une odeur forte)',
            childFriendlyHint: 'Mentionne qu’on respire dans le masque souple ou qu’il a une odeur.',
            keywords: ['masque', 'respirer', 'nez', 'bouche', 'coussin', 'odeur', 'mask', 'breathe'],
          },
          {
            id: 'tb-mask-2',
            label: 'L’équipe d’anesthésie choisit le plan adapté à ton intervention',
            childFriendlyHint: 'Mentionne que le médecin ou l’équipe choisit la méthode adaptée.',
            keywords: ['médecin', 'anesthésie', 'équipe', 'plan', 'iv', 'choisir', 'doctor', 'team'],
          },
        ],
      },
    },
  },
  {
    id: 'preop-8-iv',
    stepNumber: 8,
    iconEmoji: '💧',
    sceneBadgeText: {
      en: 'IV & IV Pole',
      fr: 'Intraveineuse (IV) et tige à roulette',
    },
    karePreset: 'doctor-cast',
    contentVersion: 1,
    reviewStatus: {
      en: 'reviewed-demo',
      fr: 'needs-clinical-review',
    },
    sourceReferenceIds: ['aap-anesthesia-day', 'boston-childrens-7551'],
    variants: {
      en: {
        title: 'The IV and IV Pole',
        shortSubtitle: 'A tiny flexible straw taped on your hand or arm and a rolling stand',
        whatItIs: {
          '3-6':
            'An IV is a tiny, bendy plastic straw taped on your hand or arm so your body can get water or medicine.',
          '7-9':
            'An IV (intravenous line) is a tiny flexible tube taped on your hand or arm that connects to a bag on a rolling IV pole.',
          '10-12':
            'An IV is a thin, flexible catheter placed into a vein on your hand or arm to give fluids and medications, hung on a wheeled IV pole.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Some children only see their IV taped under a soft wrap when they wake up. If it is placed while you are awake, the nurse can use numbing cream or spray, and you may feel a quick pinch.',
          '7-9':
            'Depending on your procedure, an IV may be placed after you are already asleep from the mask, or before surgery using numbing medicine or distraction so the brief pinch is easier.',
          '10-12':
            'Whether an IV is placed before anesthesia or while you are asleep depends on your age, procedure, and clinical plan. Once in place, only the soft plastic straw stays taped on your skin.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'The tall pole has wheels so it can roll beside you if you go for a walk with your grown-up.',
          '7-9':
            'The IV gives your body fluids and medicine so you do not have to swallow everything while you recover.',
          '10-12':
            'The IV allows your care team to give hydration, anesthesia, or pain medicine smoothly, and the wheeled pole rolls with you.',
        },
        extraDetail:
          'Co-creation partners noted that many younger children only see the IV when they wake up after surgery, while older children or emergency patients may have it placed beforehand with numbing cream or distraction activities like blowing bubbles.',
        askOrExplainPrompt:
          'Tell your grown-up or Kare: What does the tiny straw (IV) and rolling pole do to help your body?',
        comprehensionQuestion:
          'What stays taped on your hand or arm when an IV is in place?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'A tiny, bendy plastic straw under tape or a soft wrap to give fluids or medicine',
            isCorrect: true,
            supportiveFeedback:
              'Correct! Only the tiny flexible plastic straw stays taped in place, and the wheeled pole rolls with you.',
          },
          {
            id: 'c2',
            text: 'A heavy metal machine that you have to carry in your backpack',
            isCorrect: false,
            supportiveFeedback:
              'No need to carry it—the IV bag hangs on a tall pole with wheels that rolls beside you.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-iv-1',
            label: 'A tiny flexible straw/tube taped on the hand or arm to give water/fluids or medicine',
            childFriendlyHint: 'Mention the tiny bendy straw/tube that gives water or medicine.',
            keywords: ['straw', 'tube', 'water', 'fluid', 'medicine', 'hand', 'arm', 'tape', 'paille', 'eau', 'médicament', 'main'],
          },
          {
            id: 'tb-iv-2',
            label: 'Timing varies (placed while asleep or awake with numbing/distraction) and hangs on a wheeled pole',
            childFriendlyHint: 'Mention the rolling pole with wheels or that some kids see it when waking up / use numbing cream.',
            keywords: ['pole', 'wheel', 'roll', 'asleep', 'wake', 'numbing', 'pinch', 'tige', 'roulette', 'endormi'],
          },
        ],
      },
      fr: {
        title: 'L’intraveineuse (IV) et la tige à roulettes',
        shortSubtitle: 'Une toute petite paille souple sur ta main ou ton bras',
        whatItIs: {
          '3-6':
            'L’IV est une toute petite paille souple collée sur ta main ou ton bras pour donner de l’eau ou des médicaments à ton corps.',
          '7-9':
            'Une intraveineuse (IV) est un petit tube flexible fixé sur la main ou le bras et relié à une tige à roulettes.',
          '10-12':
            'L’IV est un fin cathéter souple placé dans une veine pour administrer des liquides et des médicaments, suspendu à une tige sur roulettes.',
        },
        whatYouMaySeeOrFeel: {
          '3-6':
            'Certains enfants voient seulement le pansement de l’IV en se réveillant. Si on la pose quand tu es réveillé, on peut mettre une crème magique et tu peux sentir un petit pincement rapide.',
          '7-9':
            'Selon l’intervention, l’IV peut être posée pendant que tu dors déjà, ou avant avec une crème anesthésiante et une activité de distraction.',
          '10-12':
            'Le moment où l’IV est posée (avant l’anesthésie ou pendant le sommeil) dépend de ton âge et de l’intervention. Seul le petit tube souple reste fixé sous le pansement.',
        },
        sourceGroundedExplanation: {
          '3-6':
            'La grande tige a des roulettes pour rouler à côté de toi quand tu te déplaces avec ton parent.',
          '7-9':
            'L’IV permet de donner de l’eau et des médicaments à ton corps sans que tu aies besoin de tout avaler.',
          '10-12':
            'L’IV permet à l’équipe d’administrer l’hydratation et les médicaments contre la douleur en douceur.',
        },
        extraDetail:
          'Les partenaires cliniques ont souligné que plusieurs enfants ne voient l’IV qu’à leur réveil, tandis que d’autres la reçoivent avant l’intervention avec de la crème anesthésiante ou des bulles de distraction.',
        askOrExplainPrompt:
          'Explique à ton parent ou à Kare : à quoi servent la petite paille souple (IV) et la tige à roulettes ?',
        comprehensionQuestion:
          'Qu’est-ce qui reste fixé sous le pansement quand tu as une IV ?',
        comprehensionChoices: [
          {
            id: 'c1',
            text: 'Une toute petite paille souple en plastique pour donner des liquides ou des médicaments',
            isCorrect: true,
            supportiveFeedback:
              'Bravo ! Seule la petite paille souple reste en place, et la tige roule à côté de toi.',
          },
          {
            id: 'c2',
            text: 'Un gros appareil lourd à porter sur son dos',
            isCorrect: false,
            supportiveFeedback:
              'Non, le sac est suspendu à une tige sur roulettes qui roule facilement.',
          },
        ],
        expectedTeachBackPoints: [
          {
            id: 'tb-iv-1',
            label: 'Petite paille/tube souple sur la main ou le bras pour donner de l’eau ou des médicaments',
            childFriendlyHint: 'Mentionne la petite paille souple qui donne de l’eau ou des médicaments.',
            keywords: ['paille', 'tube', 'souple', 'eau', 'liquide', 'médicament', 'main', 'bras', 'straw', 'water'],
          },
          {
            id: 'tb-iv-2',
            label: 'Reliée à une tige à roulettes (posée pendant le sommeil ou avec crème/distraction)',
            childFriendlyHint: 'Mentionne la tige à roulettes ou le moment où elle est posée.',
            keywords: ['tige', 'roulette', 'rouler', 'réveil', 'endormi', 'crème', 'pole', 'wheel'],
          },
        ],
      },
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 4. FICTIONAL POST-OP APPOINTMENT FIXTURE (RECORD -> TRANSCRIPT -> SUMMARY) */
/* -------------------------------------------------------------------------- */

export const SAMPLE_MACHINE_TRANSCRIPT: MachineTranscriptObject = {
  id: 'machine-tx-sample-1',
  version: 1,
  sourceType: 'sample-fixture',
  createdAt: 1730650000000,
  verbatimText:
    '[00:08] Clinician: Alright, Leo did well with the tonsillectomy today. For drinking at home, offer small sips of water, apple juice, or popsicles often every hour while awake so the throat stays moist.\n' +
    '[00:26] Clinician: For food, stick to soft, cool or lukewarm foods like yogurt, applesauce, or scrambled eggs for the first 7 days. Do NOT give hot, spicy, or crunchy foods like chips or toast.\n' +
    '[00:45] Clinician: For pain medicine, give liquid acetaminophen every 6 hours as needed for throat or ear discomfort—uh, wait, check the exact milligram dose and concentration on your printed discharge sheet because we wrote the weight-based milliliters there. Do NOT give ibuprofen or aspirin unless the surgeon specifically updates your sheet.\n' +
    '[01:12] careGiver: What about the oral antibiotic you mentioned earlier?\n' +
    '[01:16] Clinician: Give the amoxicillin suspension twice daily for 5 days. If you see any bright red blood from the mouth or nose, a fever at or above 38.5 degrees Celsius, or if your child cannot keep liquids down, call the ENT clinic or go to the emergency department right away.',
  segments: [
    {
      id: 'seg-1',
      timestampLabel: '00:08',
      speaker: 'Clinician',
      text: 'Alright, Leo did well with the tonsillectomy today. For drinking at home, offer small sips of water, apple juice, or popsicles often every hour while awake so the throat stays moist.',
    },
    {
      id: 'seg-2',
      timestampLabel: '00:26',
      speaker: 'Clinician',
      text: 'For food, stick to soft, cool or lukewarm foods like yogurt, applesauce, or scrambled eggs for the first 7 days. Do NOT give hot, spicy, or crunchy foods like chips or toast.',
    },
    {
      id: 'seg-3',
      timestampLabel: '00:45',
      speaker: 'Clinician',
      text: 'For pain medicine, give liquid acetaminophen every 6 hours as needed for throat or ear discomfort—uh, wait, check the exact milligram dose and concentration on your printed discharge sheet because we wrote the weight-based milliliters there. Do NOT give ibuprofen or aspirin unless the surgeon specifically updates your sheet.',
    },
    {
      id: 'seg-4',
      timestampLabel: '01:12',
      speaker: 'Caregiver',
      text: 'What about the oral antibiotic you mentioned earlier?',
    },
    {
      id: 'seg-5',
      timestampLabel: '01:16',
      speaker: 'Clinician',
      text: 'Give the amoxicillin suspension twice daily for 5 days. If you see any bright red blood from the mouth or nose, a fever at or above 38.5 degrees Celsius, or if your child cannot keep liquids down, call the ENT clinic or go to the emergency department right away.',
    },
  ],
};

export const INITIAL_UNCERTAINTY_FLAGS: TranscriptUncertaintyFlag[] = [
  {
    id: 'flag-acetaminophen-dose',
    segmentId: 'seg-3',
    timestampLabel: '00:45',
    category: 'missing-detail',
    description: {
      en: 'Self-correction & missing exact dose in audio: Clinician said "uh, wait, check the exact milligram dose and concentration on your printed discharge sheet." Exact mL/mg dose is not in the audio transcript.',
      fr: 'Auto-correction et dose exacte absente de l’audio : Le clinicien renvoie à la feuille de congé imprimée pour la dose exacte en mg/mL.',
    },
    sourceExcerpt:
      'give liquid acetaminophen every 6 hours as needed... uh, wait, check the exact milligram dose and concentration on your printed discharge sheet',
    blocksTaskOrStoryIds: ['task-acetaminophen', 'sum-todo-3'],
    resolvedByCaregiver: false,
    caregiverClarificationNote: '',
  },
  {
    id: 'flag-amoxicillin-schedule',
    segmentId: 'seg-5',
    timestampLabel: '01:16',
    category: 'missing-detail',
    description: {
      en: 'Missing schedule & dose fields: Transcript says "Give the amoxicillin suspension twice daily for 5 days" without specifying exact mL dose or specific clock times. KareBEAR never invents clock times from "twice daily".',
      fr: 'Horaire et dose incomplets : La transcription mentionne « deux fois par jour pendant 5 jours » sans préciser la dose en mL ni les heures exactes.',
    },
    sourceExcerpt: 'Give the amoxicillin suspension twice daily for 5 days.',
    blocksTaskOrStoryIds: ['task-amoxicillin', 'sum-todo-4'],
    resolvedByCaregiver: false,
    caregiverClarificationNote: '',
  },
];

export const INITIAL_SUMMARY_DRAFT: PlainLanguageSummaryDraft = {
  id: 'summary-sample-v1',
  version: 1,
  basedOnTranscriptVersion: 1,
  reviewStatus: 'unreviewed',
  reviewedAt: null,
  whatWasDiscussed: [
    {
      id: 'sum-disc-1',
      text: 'Post-operative home recovery after tonsillectomy, focusing on frequent cool fluids, soft foods for 7 days, pain medicine rules, and warning signs.',
      sourceSegmentId: 'seg-1',
      timestampLabel: '00:08',
      sourceQuote:
        'Alright, Leo did well with the tonsillectomy today. For drinking at home, offer small sips of water, apple juice, or popsicles often every hour while awake',
    },
  ],
  whatToDo: [
    {
      id: 'sum-todo-1',
      text: 'Offer small sips of cool water, apple juice, or popsicles every hour while awake to keep the throat moist.',
      sourceSegmentId: 'seg-1',
      timestampLabel: '00:08',
      sourceQuote:
        'offer small sips of water, apple juice, or popsicles often every hour while awake so the throat stays moist.',
    },
    {
      id: 'sum-todo-2',
      text: 'Serve only soft, cool or lukewarm foods (yogurt, applesauce, scrambled eggs) for the first 7 days. Do NOT give hot, spicy, or crunchy foods (chips, toast).',
      sourceSegmentId: 'seg-2',
      timestampLabel: '00:26',
      sourceQuote:
        'stick to soft, cool or lukewarm foods like yogurt, applesauce, or scrambled eggs for the first 7 days. Do NOT give hot, spicy, or crunchy foods like chips or toast.',
    },
    {
      id: 'sum-todo-3',
      text: 'Liquid acetaminophen every 6 hours as needed for throat/ear discomfort (EXACT DOSE NOT IN AUDIO — check printed discharge sheet). Do NOT give ibuprofen or aspirin unless the surgeon updates your sheet.',
      sourceSegmentId: 'seg-3',
      timestampLabel: '00:45',
      sourceQuote:
        'give liquid acetaminophen every 6 hours as needed... check the exact milligram dose and concentration on your printed discharge sheet... Do NOT give ibuprofen or aspirin',
      hasUnresolvedUncertainty: true,
    },
    {
      id: 'sum-todo-4',
      text: 'Amoxicillin suspension twice daily for 5 days (EXACT DOSE & CLOCK TIMES NOT SPECIFIED IN AUDIO — verify on discharge prescription before enabling).',
      sourceSegmentId: 'seg-5',
      timestampLabel: '01:16',
      sourceQuote: 'Give the amoxicillin suspension twice daily for 5 days.',
      hasUnresolvedUncertainty: true,
    },
  ],
  whenToSeekHelp: [
    {
      id: 'sum-help-1',
      text: 'Call the ENT clinic or go to the emergency department right away if you see any bright red blood from the mouth or nose, a fever at or above 38.5 °C, or if your child cannot keep liquids down.',
      sourceSegmentId: 'seg-5',
      timestampLabel: '01:16',
      sourceQuote:
        'If you see any bright red blood from the mouth or nose, a fever at or above 38.5 degrees Celsius, or if your child cannot keep liquids down, call the ENT clinic or go to the emergency department right away.',
    },
  ],
  questionsToClarify: [
    {
      id: 'sum-clarify-1',
      text: 'Confirm the exact weight-based liquid acetaminophen dose (mg and mL) and bottle concentration written on the printed discharge sheet.',
      sourceSegmentId: 'seg-3',
      timestampLabel: '00:45',
      sourceQuote:
        'check the exact milligram dose and concentration on your printed discharge sheet because we wrote the weight-based milliliters there.',
      hasUnresolvedUncertainty: true,
    },
    {
      id: 'sum-clarify-2',
      text: 'Confirm the exact amoxicillin dose (mL) and preferred morning/evening clock times for the "twice daily for 5 days" instruction.',
      sourceSegmentId: 'seg-5',
      timestampLabel: '01:16',
      sourceQuote: 'Give the amoxicillin suspension twice daily for 5 days.',
      hasUnresolvedUncertainty: true,
    },
  ],
};

export const INITIAL_POSTOP_TASKS: PostOpCareTask[] = [
  {
    id: 'task-sips-water',
    occurrenceId: 'occ-postop-sips-water-1',
    sourceSummaryItemId: 'sum-todo-1',
    sourceSegmentId: 'seg-1',
    timestampLabel: '00:08',
    exactSourceInstruction:
      'Offer small sips of water, apple juice, or popsicles often every hour while awake so the throat stays moist.',
    category: 'hydration-nutrition',
    title: {
      en: 'Cool Sips or Popsicle Check-In',
      fr: 'Petites gorgées fraîches ou sucette glacée',
    },
    childFriendlyDescription: {
      en: {
        '3-6': 'Take tiny sips of cool water, apple juice, or a popsicle with your grown-up!',
        '7-9': 'Take small sips of cool water, apple juice, or a popsicle every hour while awake so your throat stays moist.',
        '10-12': 'Sip cool water, apple juice, or a popsicle every hour while awake to keep your throat moist during recovery.',
      },
      fr: {
        '3-6': 'Prends de toutes petites gorgées d’eau fraîche ou de sucette glacée avec ton parent !',
        '7-9': 'Prends de petites gorgées d’eau, de jus de pomme ou de sucette glacée chaque heure quand tu es réveillé.',
        '10-12': 'Bois de petites gorgées fraîches chaque heure d’éveil pour garder ta gorge humide.',
      },
    },
    suppliedFields: {
      medicationOrItemName: 'Water, apple juice, or popsicle',
      doseSupplied: 'Small sips',
      frequencySupplied: 'Every hour while awake',
      clockTimesSupplied: null,
      durationSupplied: null,
      routeSupplied: 'By mouth (oral fluids)',
    },
    unresolvedWarning: null,
    approvalState: 'draft',
    childAskedHelpOrReady: false,
    caregiverConfirmedCompletion: false,
    caregiverConfirmedAt: null,
    pointsValue: 10,
  },
  {
    id: 'task-soft-foods',
    occurrenceId: 'occ-postop-soft-foods-1',
    sourceSummaryItemId: 'sum-todo-2',
    sourceSegmentId: 'seg-2',
    timestampLabel: '00:26',
    exactSourceInstruction:
      'Stick to soft, cool or lukewarm foods like yogurt, applesauce, or scrambled eggs for the first 7 days. Do NOT give hot, spicy, or crunchy foods like chips or toast.',
    category: 'hydration-nutrition',
    title: {
      en: 'Soft, Cool Foods (No Crunchy or Hot Foods)',
      fr: 'Aliments doux et tièdes/frais (sans croustillant)',
    },
    childFriendlyDescription: {
      en: {
        '3-6': 'Eat soft, cool foods like yogurt or applesauce. Skip crunchy chips and toast!',
        '7-9': 'Choose soft, cool or lukewarm foods like yogurt, applesauce, or eggs for 7 days, and skip hot, spicy, or crunchy foods.',
        '10-12': 'For the first 7 days, eat soft, cool or lukewarm foods (yogurt, applesauce, scrambled eggs) and avoid hot, spicy, or scratchy foods like chips or toast.',
      },
      fr: {
        '3-6': 'Mange des aliments tout doux comme du yogourt ou de la compote. Pas de croustilles !',
        '7-9': 'Choisis des aliments doux et frais (yogourt, compote, œufs brouillés) pendant 7 jours, sans aliments chauds ou croustillants.',
        '10-12': 'Pendant 7 jours, prends des aliments doux et frais ou tièdes et évite tout aliment chaud, épicé ou croustillant.',
      },
    },
    suppliedFields: {
      medicationOrItemName: 'Soft, cool/lukewarm foods (yogurt, applesauce, eggs)',
      doseSupplied: null,
      frequencySupplied: 'Mealtimes / snacks',
      clockTimesSupplied: null,
      durationSupplied: 'First 7 days',
      routeSupplied: 'By mouth',
    },
    unresolvedWarning: null,
    approvalState: 'draft',
    childAskedHelpOrReady: false,
    caregiverConfirmedCompletion: false,
    caregiverConfirmedAt: null,
    pointsValue: 10,
  },
  {
    id: 'task-acetaminophen',
    occurrenceId: 'occ-postop-acetaminophen-1',
    sourceSummaryItemId: 'sum-todo-3',
    sourceSegmentId: 'seg-3',
    timestampLabel: '00:45',
    exactSourceInstruction:
      'Give liquid acetaminophen every 6 hours as needed for throat or ear discomfort—uh, wait, check the exact milligram dose and concentration on your printed discharge sheet... Do NOT give ibuprofen or aspirin unless the surgeon specifically updates your sheet.',
    category: 'medication-caregiver-only',
    title: {
      en: 'Caregiver-Only: Liquid Acetaminophen Check (Dose Unresolved in Audio)',
      fr: 'Parent seulement : Acétaminophène liquide (Dose à vérifier sur la feuille)',
    },
    childFriendlyDescription: {
      en: {
        '3-6': 'Tell your grown-up if your throat or ears feel sore so they can check your medicine plan.',
        '7-9': 'If your throat or ears feel sore, tell your grown-up so they can check your printed discharge sheet.',
        '10-12': 'Let your caregiver know if you have throat or ear discomfort; only a caregiver checks the printed sheet and gives medicine.',
      },
      fr: {
        '3-6': 'Dis à ton parent si ta gorge ou tes oreilles font mal pour qu’il vérifie ton plan.',
        '7-9': 'Si ta gorge ou tes oreilles sont sensibles, préviens ton parent pour qu’il consulte la feuille de congé.',
        '10-12': 'Préviens ton parent en cas d’inconfort; seul l’adulte vérifie la feuille imprimée et donne le médicament.',
      },
    },
    suppliedFields: {
      medicationOrItemName:
        'Liquid acetaminophen (Do NOT give ibuprofen or aspirin)',
      doseSupplied: null, // Explicitly missing in audio transcript!
      frequencySupplied: 'Every 6 hours as needed',
      clockTimesSupplied: null,
      durationSupplied: null,
      routeSupplied: 'Liquid by mouth (Caregiver-administered only)',
    },
    unresolvedWarning: {
      en: 'Blocked until caregiver clarifies exact mg/mL dose from the printed discharge sheet (audio transcript does not state the dose; app never calculates doses).',
      fr: 'Bloqué jusqu’à ce que le parent précise la dose exacte inscrite sur la feuille de congé imprimée (l’application ne calcule jamais de dose).',
    },
    approvalState: 'blocked-unresolved',
    childAskedHelpOrReady: false,
    caregiverConfirmedCompletion: false,
    caregiverConfirmedAt: null,
    pointsValue: 10,
  },
  {
    id: 'task-amoxicillin',
    occurrenceId: 'occ-postop-amoxicillin-1',
    sourceSummaryItemId: 'sum-todo-4',
    sourceSegmentId: 'seg-5',
    timestampLabel: '01:16',
    exactSourceInstruction:
      'Give the amoxicillin suspension twice daily for 5 days.',
    category: 'medication-caregiver-only',
    title: {
      en: 'Caregiver-Only: Amoxicillin Suspension ("Twice Daily" — Clock Times & Dose Missing)',
      fr: 'Parent seulement : Suspension d’amoxicilline (« Deux fois par jour » — Heures et dose manquantes)',
    },
    childFriendlyDescription: {
      en: {
        '3-6': 'Help your grown-up when it is time for your caregiver-checked medicine.',
        '7-9': 'Check the plan together with your grown-up when it is time for your prescribed antibiotic.',
        '10-12': 'Check with your caregiver regarding your prescribed 5-day antibiotic schedule; only a caregiver confirms medication.',
      },
      fr: {
        '3-6': 'Vérifie le plan avec ton parent quand c’est le moment de ton médicament.',
        '7-9': 'Vérifie avec ton parent le plan pour ton antibiotique prescrit.',
        '10-12': 'Consulte ton parent pour le suivi de l’antibiotique prescrit; seul le parent confirme la prise.',
      },
    },
    suppliedFields: {
      medicationOrItemName: 'Amoxicillin suspension',
      doseSupplied: null, // Missing in transcript
      frequencySupplied: 'Twice daily',
      clockTimesSupplied: null, // "Twice daily" never invents two clock times!
      durationSupplied: '5 days',
      routeSupplied: 'Suspension by mouth (Caregiver-administered only)',
    },
    unresolvedWarning: {
      en: 'Phrase "twice daily" does NOT authorize inventing clock times, and exact mL dose is missing in audio. Clarify from prescription label before enabling.',
      fr: 'L’expression « deux fois par jour » n’autorise pas à inventer des heures, et la dose en mL manque. Vérifiez l’étiquette de prescription.',
    },
    approvalState: 'blocked-unresolved',
    childAskedHelpOrReady: false,
    caregiverConfirmedCompletion: false,
    caregiverConfirmedAt: null,
    pointsValue: 10,
  },
];

/* -------------------------------------------------------------------------- */
/* 5. GROUNDED STORY DRAFT BUILDER (ADAPTS TO AGE, LANGUAGE & DETAIL)         */
/* -------------------------------------------------------------------------- */

export function buildGroundedStoryDraftFromSummary(
  summary: PlainLanguageSummaryDraft,
  language: AppLanguage = 'en',
  ageBand: AgeBand = '7-9',
  detailLevel: DetailPreference = 'simple',
  version = 1
): BearStoryDraft {
  const todo1Quote =
    summary.whatToDo[0]?.sourceQuote ??
    'offer small sips of water, apple juice, or popsicles often every hour while awake';
  const todo2Quote =
    summary.whatToDo[1]?.sourceQuote ??
    'stick to soft, cool or lukewarm foods like yogurt, applesauce, or scrambled eggs for the first 7 days.';
  const helpQuote =
    summary.whenToSeekHelp[0]?.sourceQuote ??
    'If you see any bright red blood from the mouth or nose, a fever at or above 38.5 degrees Celsius, or if your child cannot keep liquids down, call the ENT clinic or go to the emergency department right away.';

  const pagesEn = [
    {
      id: 'story-postop-p1',
      pageNumber: 1,
      title: 'Page 1: Cool Sips Every Hour with Kare',
      bodyText:
        ageBand === '3-6'
          ? 'Kare is resting at home after surgery. Every hour while awake, Kare takes tiny sips of cool water, apple juice, or a popsicle to keep the throat moist.'
          : ageBand === '7-9'
          ? 'At home after the procedure, Kare practices taking small sips of cool water, apple juice, or a popsicle every hour while awake so the throat stays moist.'
          : 'Back home for recovery, Kare follows the care team’s hydration plan: taking small sips of water, apple juice, or popsicles every hour while awake so the throat stays moist.',
      extraDetailText:
        'Staying hydrated with small, frequent cool liquids helps care for your throat while you rest at home.',
      sourceSummaryItemId: summary.whatToDo[0]?.id ?? 'sum-todo-1',
      sourceQuote: todo1Quote,
      karePreset: 'cast' as const,
    },
    {
      id: 'story-postop-p2',
      pageNumber: 2,
      title: 'Page 2: Soft, Cool Foods for 7 Days',
      bodyText:
        ageBand === '3-6'
          ? 'For 7 days, Kare eats soft, cool foods like yogurt, applesauce, and scrambled eggs. Kare says "No thank you!" to hot, spicy, or crunchy chips and toast.'
          : ageBand === '7-9'
          ? 'For the first 7 days, Kare chooses soft, cool or lukewarm foods like yogurt, applesauce, or scrambled eggs, and stays away from hot, spicy, or crunchy foods like chips or toast.'
          : 'For the first 7 days, the care instructions say to eat only soft, cool or lukewarm foods (yogurt, applesauce, scrambled eggs) and strictly avoid hot, spicy, or crunchy foods such as chips or toast.',
      extraDetailText:
        'For any medicine, Kare never takes medicine alone—Kare’s grown-up checks the printed discharge sheet and prescription label first.',
      sourceSummaryItemId: summary.whatToDo[1]?.id ?? 'sum-todo-2',
      sourceQuote: todo2Quote,
      karePreset: 'checklist' as const,
    },
    {
      id: 'story-postop-p3',
      pageNumber: 3,
      title: 'Page 3: Telling a Grown-Up Right Away',
      bodyText:
        ageBand === '3-6'
          ? 'Kare tells a grown-up right away if the throat hurts, if tummy liquids will not stay down, or if there is any bright red blood from the mouth or nose.'
          : ageBand === '7-9'
          ? 'Kare and the grown-up watch for warning signs: any bright red blood from the mouth or nose, a fever of 38.5 °C or higher, or not being able to keep liquids down means calling the clinic or going to the emergency department right away.'
          : 'Kare and the caregiver know when to get medical help immediately: any bright red blood from the mouth or nose, a fever at or above 38.5 °C, or inability to keep liquids down requires calling the ENT clinic or going to the emergency department right away.',
      extraDetailText:
        'Your grown-up keeps the clinic phone number and discharge sheet handy so your care team can help whenever needed.',
      sourceSummaryItemId: summary.whenToSeekHelp[0]?.id ?? 'sum-help-1',
      sourceQuote: helpQuote,
      karePreset: 'doctor' as const,
    },
  ];

  const pagesFr = [
    {
      id: 'story-postop-p1',
      pageNumber: 1,
      title: 'Page 1 : De petites gorgées fraîches chaque heure',
      bodyText:
        ageBand === '3-6'
          ? 'Kare se repose à la maison. Chaque heure quand il est réveillé, Kare prend de toutes petites gorgées d’eau fraîche, de jus de pomme ou de sucette glacée.'
          : ageBand === '7-9'
          ? 'À la maison après l’intervention, Kare prend de petites gorgées d’eau, de jus de pomme ou de sucette glacée chaque heure d’éveil pour garder sa gorge humide.'
          : 'De retour à la maison, Kare suit la consigne d’hydratation : boire de petites gorgées d’eau, de jus de pomme ou de sucette glacée chaque heure d’éveil pour garder la gorge humide.',
      extraDetailText:
        'Boire souvent de petites quantités fraîches aide à garder la gorge humide pendant le repos.',
      sourceSummaryItemId: summary.whatToDo[0]?.id ?? 'sum-todo-1',
      sourceQuote: todo1Quote,
      karePreset: 'cast' as const,
    },
    {
      id: 'story-postop-p2',
      pageNumber: 2,
      title: 'Page 2 : Des aliments doux et frais pendant 7 jours',
      bodyText:
        ageBand === '3-6'
          ? 'Pendant 7 jours, Kare mange des aliments doux comme du yogourt, de la compote et des œufs brouillés. Pas d’aliments chauds, épicés ou croustillants comme les croustilles ou le pain grillé !'
          : ageBand === '7-9'
          ? 'Pendant les 7 premiers jours, Kare choisit des aliments doux, frais ou tièdes (yogourt, compote, œufs brouillés) et évite les aliments chauds, épicés ou croustillants.'
          : 'Pour les 7 premiers jours, la consigne indique de manger uniquement des aliments mous, frais ou tièdes et d’éviter tout aliment chaud, épicé ou croustillant comme les croustilles ou les rôties.',
      extraDetailText:
        'Pour les médicaments, Kare ne prend jamais rien seul : c’est toujours l’adulte qui vérifie la feuille de congé imprimée.',
      sourceSummaryItemId: summary.whatToDo[1]?.id ?? 'sum-todo-2',
      sourceQuote: todo2Quote,
      karePreset: 'checklist' as const,
    },
    {
      id: 'story-postop-p3',
      pageNumber: 3,
      title: 'Page 3 : Prévenir son parent tout de suite',
      bodyText:
        ageBand === '3-6'
          ? 'Kare prévient son parent tout de suite s’il a mal, s’il ne garde pas les liquides, ou s’il voit du sang rouge vif par la bouche ou le nez.'
          : ageBand === '7-9'
          ? 'Kare et son parent surveillent les signes importants : du sang rouge vif par la bouche ou le nez, une fièvre de 38,5 °C ou plus, ou l’incapacité de garder les liquides nécessite d’appeler la clinique ou d’aller à l’urgence tout de suite.'
          : 'Kare et son parent connaissent les signes d’alerte : tout saignement rouge vif du nez ou de la bouche, une fièvre à 38,5 °C ou plus, ou l’incapacité de garder les liquides exige de contacter la clinique ORL ou de se rendre aux urgences immédiatement.',
      extraDetailText:
        'Ton parent garde le numéro de la clinique et la feuille de congé à portée de main.',
      sourceSummaryItemId: summary.whenToSeekHelp[0]?.id ?? 'sum-help-1',
      sourceQuote: helpQuote,
      karePreset: 'doctor' as const,
    },
  ];

  const selectedPages = language === 'fr' ? pagesFr : pagesEn;
  const combinedText = selectedPages
    .map((p) => `${p.title} ${p.bodyText} ${p.extraDetailText}`)
    .join(' ');
  const flaggedReassuranceWarnings =
    detectDisallowedReassurancePhrases(combinedText);

  return {
    id: `story-draft-v${version}`,
    version,
    originatingSummaryVersion: summary.version,
    language,
    ageBand,
    detailLevel,
    status: 'draft',
    releasedAt: null,
    narrationVersion: version,
    flaggedReassuranceWarnings,
    pages: selectedPages,
  };
}

/* -------------------------------------------------------------------------- */
/* 6. MODEST COSMETIC REWARDS (POSITIVE ONLY — NO PUNISHMENT MECHANICS)       */
/* -------------------------------------------------------------------------- */

export const COSMETIC_REWARDS: CosmeticRewardItem[] = [
  {
    id: 'cosmetic-star-sticker',
    name: {
      en: 'Golden Star Helper Sticker',
      fr: 'Autocollant Étoile Dorée',
    },
    description: {
      en: 'A cheerful star badge for Kare’s board after completing 1 confirmed activity.',
      fr: 'Un badge étoile pour le tableau de Kare après 1 activité confirmée.',
    },
    costPoints: 10,
    iconEmoji: '⭐',
    mascotAccessoryPreview: 'neutral',
  },
  {
    id: 'cosmetic-checklist-glasses',
    name: {
      en: 'Kare’s Reading Glasses & Clipboard Look',
      fr: 'Lunettes et Planchette de Kare',
    },
    description: {
      en: 'Equips Kare’s cozy reading glasses and checklist clipboard on the dashboard.',
      fr: 'Équipe Kare de ses lunettes de lecture et de sa planchette sur le tableau de bord.',
    },
    costPoints: 20,
    iconEmoji: '👓',
    mascotAccessoryPreview: 'checklist',
  },
  {
    id: 'cosmetic-doctor-coat',
    name: {
      en: 'Junior Care-Team Coat & Headset Look',
      fr: 'Blouse et Casque d’Équipe de Kare',
    },
    description: {
      en: 'Equips Kare’s white care-team coat and headset on the dashboard.',
      fr: 'Équipe Kare de sa blouse blanche et de son casque sur le tableau de bord.',
    },
    costPoints: 30,
    iconEmoji: '🥼',
    mascotAccessoryPreview: 'doctor',
  },
];

/* -------------------------------------------------------------------------- */
/* 7. HOST-ONLY FIVE-MINUTE PEER EVALUATION TASKS (OUTSIDE CHILD SCREENS)     */
/* -------------------------------------------------------------------------- */

export const HOST_PEER_EVALUATION_TASKS = {
  disclaimer:
    'Host/Facilitator Only: Keep expected action sequences and error-path tests out of participant-facing screens. Adult classmates’ role-play checks usability and workflow clarity only—it does not establish pediatric anxiety reduction, adherence improvement, or clinical effectiveness.',
  task1: {
    title:
      'Peer Task 1 (5 Minutes): Age & Language Preparation for an Unfamiliar Hospital Item',
    participantPrompt:
      'Imagine you are a caregiver waiting with a young child (or a French-speaking family) who is nervous about unfamiliar hospital equipment before a scheduled procedure. Set up the app for your child’s age and language preferences, explore an unfamiliar piece of pre-operative equipment together, listen to or read the explanation, and help the child practice explaining what to expect in their own words.',
    expectedActionSequence: [
      '1. Open Setup (Age & Language) and select an age band (e.g., 3–6 or 7–9), detail preference, and language (English or French).',
      '2. In the Pre-Op Preparation Hub, select an unfamiliar hospital item (e.g., Anaesthesia Mask, IV & IV Pole, or Blood-Pressure Cuff).',
      '3. Read or play the Listen narration for what the item is and what the child may see or feel, noting that preferences changed presentation without inventing fasting rules or promising the procedure cannot hurt.',
      '4. Complete the short comprehension check or try the "Explain it to Kare" teach-back prompt together.',
    ],
    developerErrorPathCheck:
      'Verify independently that when Gemini TTS or Live API is unavailable or microphone permission is denied, the Listen fallback and typed teach-back path remain fully functional.',
  },
  task2: {
    title:
      'Peer Task 2 (5 Minutes): Post-Op Appointment Review, Story Release & Caregiver Task Confirmation',
    participantPrompt:
      'Imagine your child’s procedure is finished and you want to use the app’s recovery tools at home. Switch the app into post-operative mode, load or record the post-operative appointment discussion, review the transcript and plain-language summary (resolving any unclear medication details using a discharge sheet note), release the illustrated bear story for your child, and confirm one eligible recovery task.',
    expectedActionSequence: [
      '1. Activate post-op mode via the adult control and confirm the disclaimer that mode activation does not mean medical discharge.',
      '2. On the Record Appointment screen, confirm recording permission or load the Sample Fictional Post-Op Appointment Fixture.',
      '3. Inspect the immutable Original Machine Transcript beside the editable Corrected Transcript and review the flagged uncertainties (missing acetaminophen mL dose on the discharge sheet and missing clock times for "twice daily" amoxicillin).',
      '4. Mark the plain-language summary as reviewed, inspect the generated 3-page Kare Bear Story Draft alongside the summary, and explicitly Release the story to the child view.',
      '5. On the Post-Op Tasks & Bear Dashboard, confirm one eligible care task as the caregiver and observe that points are awarded once (idempotently) without punishing unconfirmed tasks.',
    ],
    developerErrorPathCheck:
      'Verify independently that editing the corrected transcript or summary after releasing the story immediately marks the story and confirmed tasks as "Stale (Needs Re-Review)", and that repeated clicks on a confirmed task never multiply points.',
  },
};

/* -------------------------------------------------------------------------- */
/* 8. ADAPTER FOR REUSING "EXPLAIN IT TO KARE" PANEL ON PRE-OP LESSONS        */
/* -------------------------------------------------------------------------- */

export function convertPreOpLessonToRecoveryPoint(
  lesson: PreOpLessonItem,
  language: AppLanguage = 'en',
  ageBand: AgeBand = '7-9'
): RecoveryPointContent {
  const variant = lesson.variants[language];
  const primarySource =
    VERIFIED_SOURCES[lesson.sourceReferenceIds[0]] ??
    VERIFIED_SOURCES['boston-childrens-7551'];

  return {
    id: lesson.id,
    stepNumber: lesson.stepNumber,
    shortTitle: variant.title,
    childInstruction: `${variant.whatItIs[ageBand]} ${variant.whatYouMaySeeOrFeel[ageBand]}`,
    needsClinicalReviewFlag:
      lesson.reviewStatus[language] === 'needs-clinical-review',
    moreAboutThis: `${variant.sourceGroundedExplanation[ageBand]} ${variant.extraDetail}`,
    moreAboutNeedsReviewFlag:
      lesson.reviewStatus[language] === 'needs-clinical-review',
    alwaysIncludedBadge:
      language === 'fr'
        ? 'Toujours inclus dans cette démonstration'
        : 'Always included in this demonstration',
    originalSourceWording: variant.sourceGroundedExplanation['10-12'],
    sourceCitationLabel: `${primarySource.publisher}: ${primarySource.title}`,
    sourceUrl: primarySource.url,
    explainToCaregiverPrompt: variant.askOrExplainPrompt,
    expectedLearningPoints: variant.expectedTeachBackPoints,
    kareLearnExpression: 'waving',
    sceneProp: 'keep-cast-dry',
    comprehensionCheck: {
      id: `${lesson.id}-check`,
      scenarioQuestion: variant.comprehensionQuestion,
      choices: variant.comprehensionChoices.map((c) => ({
        id: c.id,
        label: c.text,
        isCorrect: c.isCorrect,
        iconType: c.isCorrect ? 'play-dry' : 'wait',
      })),
      correctFeedback:
        variant.comprehensionChoices.find((c) => c.isCorrect)
          ?.supportiveFeedback ?? 'Great job!',
      firstIncorrectFeedback:
        variant.comprehensionChoices.find((c) => !c.isCorrect)
          ?.supportiveFeedback ?? 'Let us look again together!',
      secondIncorrectExplanation: variant.sourceGroundedExplanation[ageBand],
    },
  };
}

