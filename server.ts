/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Full-stack Express + WebSocket + Vite server for KareBEAR V0.
 * Handles all @google/genai calls server-side so API credentials remain secure:
 * - POST /api/explain/chat           -> gemini-3.8-flash (Typed chatbot & feedback for Pre-Op & Cast lessons)
 * - POST /api/explain/transcribe     -> gemini-3.5-transcribe (Child recorded answer transcription)
 * - WS   /api/live                   -> gemini-3.8-live (Real-time voice conversation with live captions)
 * - POST /api/tts                    -> gemini-3.8-flash-lite-tts (Natural narration with in-memory SHA-256 cache)
 * - POST /api/appointment/transcribe -> gemini-3.5-transcribe (Caregiver post-op appointment capture)
 * - POST /api/appointment/summarize  -> gemini-3.8-flash (Grounded plain-language appointment summary)
 * - POST /api/appointment/story      -> gemini-3.8-flash (Age- & language-adapted 3-page bear story draft)
 */

import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from '@google/genai';
import {
  FIXED_OUT_OF_SCOPE_MESSAGE,
  RECOVERY_POINTS,
  type RecoveryPointContent,
} from './src/data/demoContent';
import {
  buildGroundedStoryDraftFromSummary,
  convertPreOpLessonToRecoveryPoint,
  INITIAL_SUMMARY_DRAFT,
  PRE_OP_LESSONS,
  SAMPLE_MACHINE_TRANSCRIPT,
} from './src/data/surgeryContent';
import {
  detectDisallowedReassurancePhrases,
  type AgeBand,
  type AppLanguage,
  type DetailPreference,
  type PlainLanguageSummaryDraft,
  type TranscriptSegment,
} from './src/utils/surgeryDataModel';
import {
  buildExplainKareSystemInstruction,
  detectCoveredPointsFromText,
  generateLocalExplainResponse,
  isInputOutOfScope,
  type ExplainMessage,
} from './src/utils/explainKareLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveLessonPoint(
  pointId: string,
  language: AppLanguage = 'en',
  ageBand: AgeBand = '7-9'
): RecoveryPointContent {
  const castMatch = RECOVERY_POINTS.find((p) => p.id === pointId);
  if (castMatch) return castMatch;

  const preOpMatch = PRE_OP_LESSONS.find((l) => l.id === pointId);
  if (preOpMatch) {
    return convertPreOpLessonToRecoveryPoint(preOpMatch, language, ageBand);
  }

  return RECOVERY_POINTS[0];
}

// In-memory TTS cache keyed by exact sha256(text|language|voice|version)
const ttsAudioCache = new Map<
  string,
  { audioBase64: string; mimeType: string; cachedAt: number }
>();

function computeTtsCacheKey(
  text: string,
  language: string,
  voice: string,
  version: number | string
): string {
  return crypto
    .createHash('sha256')
    .update(`${text.trim()}|${language}|${voice}|${version}`)
    .digest('hex');
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '15mb' }));

  /* ------------------------------------------------------------------------ */
  /* 1. TYPED CHAT & FEEDBACK ENDPOINT (gemini-3.8-flash)                     */
  /* ------------------------------------------------------------------------ */
  app.post('/api/explain/chat', async (req, res) => {
    try {
      const {
        pointId,
        userMessage = '',
        mode = 'respond',
        coveredPointIds = [],
        conversationHistory = [],
        language = 'en',
        ageBand = '7-9',
      } = req.body as {
        pointId: string;
        userMessage?: string;
        mode?: 'respond' | 'rephrase';
        coveredPointIds?: string[];
        conversationHistory?: ExplainMessage[];
        language?: AppLanguage;
        ageBand?: AgeBand;
      };

      const point = resolveLessonPoint(pointId, language, ageBand);

      // Deterministic out-of-scope guardrail check before calling the model
      if (mode === 'respond' && isInputOutOfScope(userMessage)) {
        const unclearLearningPoints = point.expectedLearningPoints.filter(
          (lp) => !coveredPointIds.includes(lp.id)
        );
        res.json({
          reply: FIXED_OUT_OF_SCOPE_MESSAGE,
          isOutOfScope: true,
          newlyCoveredPointIds: [],
          allCoveredPointIds: coveredPointIds,
          unclearLearningPoints,
          usedFallback: false,
        });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        const fallbackResult = generateLocalExplainResponse(
          point,
          userMessage,
          mode,
          coveredPointIds
        );
        res.json(fallbackResult);
        return;
      }

      const systemInstruction = buildExplainKareSystemInstruction(
        point,
        coveredPointIds,
        conversationHistory
      );

      const promptText =
        mode === 'rephrase'
          ? `The child clicked "Explain this page another way" for Step ${point.stepNumber} (${point.shortTitle}). Explain "${point.childInstruction}" and "${point.moreAboutThis}" in a fresh, warm, simple way (2 to 3 short sentences), and finish with ONE short, friendly question inviting the child to explain it in their own words.`
          : `The child said: "${userMessage}".
1. Decide if the child's message is outside the supplied lesson educational material (e.g., asking for medication doses, pain medicine, diagnoses, fasting instructions, or unrelated topics). If so, set isOutOfScope to true.
2. Otherwise, identify which expected learning point IDs from [${point.expectedLearningPoints.map((lp) => lp.id).join(', ')}] the child has now covered in their explanation.
3. Write a warm, encouraging response as Kare (1 to 2 short sentences) grounded strictly in the lesson material, followed by at most ONE short question to help them mention any still-unclear learning point (or congratulate them if all points for this step are covered).`;

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description:
                    'Kare response to the child (warm, 1-3 short sentences, ending with at most one short question).',
                },
                isOutOfScope: {
                  type: Type.BOOLEAN,
                  description:
                    'True if the child asked about diagnoses, medications, timelines, or topics outside the supplied lesson.',
                },
                coveredPointIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    'IDs of expectedLearningPoints covered by the child in this turn or earlier.',
                },
              },
              required: ['reply', 'isOutOfScope', 'coveredPointIds'],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 3800)
        ),
      ]);

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        reply?: string;
        isOutOfScope?: boolean;
        coveredPointIds?: string[];
      };

      if (parsed.isOutOfScope) {
        const unclearLearningPoints = point.expectedLearningPoints.filter(
          (lp) => !coveredPointIds.includes(lp.id)
        );
        res.json({
          reply: FIXED_OUT_OF_SCOPE_MESSAGE,
          isOutOfScope: true,
          newlyCoveredPointIds: [],
          allCoveredPointIds: coveredPointIds,
          unclearLearningPoints,
          usedFallback: false,
        });
        return;
      }

      const heuristicIds =
        mode === 'respond'
          ? detectCoveredPointsFromText(point, userMessage, coveredPointIds)
          : coveredPointIds;
      const validIds = new Set(point.expectedLearningPoints.map((lp) => lp.id));
      const mergedSet = new Set<string>([
        ...coveredPointIds,
        ...heuristicIds,
        ...(parsed.coveredPointIds ?? []).filter((id) => validIds.has(id)),
      ]);
      const allCoveredPointIds = Array.from(mergedSet);
      const newlyCoveredPointIds = allCoveredPointIds.filter(
        (id) => !coveredPointIds.includes(id)
      );
      const unclearLearningPoints = point.expectedLearningPoints.filter(
        (lp) => !allCoveredPointIds.includes(lp.id)
      );

      res.json({
        reply:
          parsed.reply?.trim() ||
          generateLocalExplainResponse(point, userMessage, mode, coveredPointIds)
            .reply,
        isOutOfScope: false,
        newlyCoveredPointIds,
        allCoveredPointIds,
        unclearLearningPoints,
        usedFallback: false,
      });
    } catch (error) {
      const {
        pointId,
        userMessage = '',
        mode = 'respond',
        coveredPointIds = [],
        language = 'en',
        ageBand = '7-9',
      } = req.body ?? {};
      const point = resolveLessonPoint(pointId, language, ageBand);
      const fallbackResult = generateLocalExplainResponse(
        point,
        userMessage,
        mode,
        coveredPointIds
      );
      res.json({
        ...fallbackResult,
        apiNotice:
          error instanceof Error ? error.message : 'Using local lesson guide.',
      });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* 2. OPTIONAL RECORDED ANSWER TRANSCRIPTION (gemini-3.5-transcribe)        */
  /* ------------------------------------------------------------------------ */
  app.post('/api/explain/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm' } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'No audio data received.' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Audio transcription service is currently unavailable. You can type or edit your explanation directly in the box below.',
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe this child or caregiver audio recording into plain text. Return only the spoken words without extra commentary.',
            },
          ],
        },
      });

      const transcript = (response.text ?? '').trim();
      res.json({ transcript });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Could not transcribe audio clip. Please edit or type your answer below.',
      });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* 3. NATURAL NARRATION TTS ENDPOINT WITH CACHE (gemini-3.8-flash-lite-tts) */
  /* ------------------------------------------------------------------------ */
  app.post('/api/tts', async (req, res) => {
    try {
      const {
        text = '',
        language = 'en',
        voice = 'Kore',
        version = 1,
      } = req.body as {
        text?: string;
        language?: AppLanguage;
        voice?: string;
        version?: number | string;
      };

      const cleanedText = text.trim();
      if (!cleanedText) {
        res.status(400).json({ error: 'No narration text provided.' });
        return;
      }

      const cacheKey = computeTtsCacheKey(
        cleanedText,
        language,
        voice,
        version
      );
      const cached = ttsAudioCache.get(cacheKey);
      if (cached) {
        res.json({
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          cacheHit: true,
          cacheKey,
          fallbackToBrowserTts: false,
        });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.json({
          fallbackToBrowserTts: true,
          cacheHit: false,
          cacheKey,
          reason:
            'Gemini TTS API key is not configured; using browser speechSynthesis fallback.',
        });
        return;
      }

      // Style instructions are kept strictly in speechMetadata.style so they are never read aloud
      const deliveryStyle =
        language === 'fr'
          ? 'Warm, calm, gently paced, reassuring pediatric bear companion speaking clear Canadian French'
          : 'Warm, calm, gently paced, reassuring pediatric bear companion speaking clear Canadian English';

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanedText,
                  speechMetadata: {
                    style: deliveryStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini TTS timeout')), 3800)
        ),
      ]);

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType ||
        'audio/wav';

      if (!base64Audio) {
        res.json({
          fallbackToBrowserTts: true,
          cacheHit: false,
          cacheKey,
          reason: 'No audio bytes returned from Gemini TTS.',
        });
        return;
      }

      ttsAudioCache.set(cacheKey, {
        audioBase64: base64Audio,
        mimeType,
        cachedAt: Date.now(),
      });

      res.json({
        audioBase64: base64Audio,
        mimeType,
        cacheHit: false,
        cacheKey,
        fallbackToBrowserTts: false,
      });
    } catch (error) {
      res.json({
        fallbackToBrowserTts: true,
        cacheHit: false,
        reason:
          error instanceof Error
            ? error.message
            : 'Gemini TTS unavailable; using browser speechSynthesis fallback.',
      });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* 4. CAREGIVER POST-OP APPOINTMENT TRANSCRIBE (gemini-3.5-transcribe)      */
  /* ------------------------------------------------------------------------ */
  app.post('/api/appointment/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm' } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'No appointment audio data received.' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.json({
          usedSampleFallback: true,
          notice:
            'Live Gemini transcription is unavailable in this environment; loaded the realistic post-operative discharge transcript fixture so you can test the review workflow.',
          transcript: SAMPLE_MACHINE_TRANSCRIPT,
        });
        return;
      }

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this post-operative clinician-caregiver discussion accurately into plain text. Preserve speaker turns and exact medication or symptom wording without inventing missing details.',
              },
            ],
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Transcription timeout')), 4500)
        ),
      ]);

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.json({
          usedSampleFallback: true,
          notice:
            'No speech was detected in the recording; loaded the realistic post-operative appointment fixture for demonstration.',
          transcript: SAMPLE_MACHINE_TRANSCRIPT,
        });
        return;
      }

      const segments: TranscriptSegment[] = rawText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => ({
          id: `seg-live-${index + 1}`,
          timestampLabel: `00:${String(index * 12).padStart(2, '0')}`,
          speaker: line.toLowerCase().startsWith('caregiver')
            ? 'Caregiver'
            : 'Clinician',
          text: line.replace(/^(clinician|caregiver|doctor|nurse):\s*/i, ''),
        }));

      res.json({
        usedSampleFallback: false,
        transcript: {
          id: `mt-live-${Date.now()}`,
          version: 1,
          sourceType: 'live-recording',
          createdAt: Date.now(),
          verbatimText: rawText,
          segments:
            segments.length > 0 ? segments : SAMPLE_MACHINE_TRANSCRIPT.segments,
        },
      });
    } catch (error) {
      res.json({
        usedSampleFallback: true,
        notice:
          error instanceof Error
            ? `${error.message} — Loaded realistic post-operative appointment fixture.`
            : 'Loaded realistic post-operative appointment fixture.',
        transcript: SAMPLE_MACHINE_TRANSCRIPT,
      });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* 5. CAREGIVER POST-OP SUMMARY GENERATOR (gemini-3.8-flash)                */
  /* ------------------------------------------------------------------------ */
  app.post('/api/appointment/summarize', async (req, res) => {
    try {
      const {
        segments = [],
        transcriptVersion = 1,
        currentSummaryVersion = 1,
      } = req.body as {
        segments?: TranscriptSegment[];
        transcriptVersion?: number;
        currentSummaryVersion?: number;
      };

      const ai = getGenAIClient();
      if (!ai || segments.length === 0) {
        const updatedDraft: PlainLanguageSummaryDraft = {
          ...INITIAL_SUMMARY_DRAFT,
          version: currentSummaryVersion + 1,
          basedOnTranscriptVersion: transcriptVersion,
          reviewStatus: 'unreviewed',
          reviewedAt: null,
        };
        res.json({ summary: updatedDraft, usedFallback: true });
        return;
      }

      const transcriptBlock = segments
        .map((s) => `[${s.id} @ ${s.timestampLabel}] ${s.speaker}: ${s.text}`)
        .join('\n');

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Summarize this corrected post-operative appointment transcript for a caregiver into four sections: whatWasDiscussed, whatToDo, whenToSeekHelp, and questionsToClarify.
CRITICAL SAFETY RULES:
- Use ONLY facts explicitly stated in the transcript below.
- Do NOT invent medication doses, clock times (e.g., if it says "twice daily", do not invent 8am/8pm), or missed-dose rules.
- Link every bullet to its sourceSegmentId, timestampLabel, and exact sourceQuote.

Transcript:
${transcriptBlock}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                whatWasDiscussed: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      sourceSegmentId: { type: Type.STRING },
                      timestampLabel: { type: Type.STRING },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'text',
                      'sourceSegmentId',
                      'timestampLabel',
                      'sourceQuote',
                    ],
                  },
                },
                whatToDo: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      sourceSegmentId: { type: Type.STRING },
                      timestampLabel: { type: Type.STRING },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'text',
                      'sourceSegmentId',
                      'timestampLabel',
                      'sourceQuote',
                    ],
                  },
                },
                whenToSeekHelp: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      sourceSegmentId: { type: Type.STRING },
                      timestampLabel: { type: Type.STRING },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'text',
                      'sourceSegmentId',
                      'timestampLabel',
                      'sourceQuote',
                    ],
                  },
                },
                questionsToClarify: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      sourceSegmentId: { type: Type.STRING },
                      timestampLabel: { type: Type.STRING },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'text',
                      'sourceSegmentId',
                      'timestampLabel',
                      'sourceQuote',
                    ],
                  },
                },
              },
              required: [
                'whatWasDiscussed',
                'whatToDo',
                'whenToSeekHelp',
                'questionsToClarify',
              ],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Summary generation timeout')), 3800)
        ),
      ]);

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const nextSummary: PlainLanguageSummaryDraft = {
        id: `sum-${Date.now()}`,
        version: currentSummaryVersion + 1,
        basedOnTranscriptVersion: transcriptVersion,
        reviewStatus: 'unreviewed',
        reviewedAt: null,
        whatWasDiscussed:
          parsed.whatWasDiscussed ?? INITIAL_SUMMARY_DRAFT.whatWasDiscussed,
        whatToDo: parsed.whatToDo ?? INITIAL_SUMMARY_DRAFT.whatToDo,
        whenToSeekHelp:
          parsed.whenToSeekHelp ?? INITIAL_SUMMARY_DRAFT.whenToSeekHelp,
        questionsToClarify:
          parsed.questionsToClarify ?? INITIAL_SUMMARY_DRAFT.questionsToClarify,
      };
      res.json({ summary: nextSummary, usedFallback: false });
    } catch {
      const { transcriptVersion = 1, currentSummaryVersion = 1 } =
        req.body ?? {};
      res.json({
        summary: {
          ...INITIAL_SUMMARY_DRAFT,
          version: currentSummaryVersion + 1,
          basedOnTranscriptVersion: transcriptVersion,
          reviewStatus: 'unreviewed',
          reviewedAt: null,
        },
        usedFallback: true,
      });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* 6. POST-OP BEAR STORY GENERATOR (gemini-3.8-flash + grounded fallback)   */
  /* ------------------------------------------------------------------------ */
  app.post('/api/appointment/story', async (req, res) => {
    try {
      const {
        summary = INITIAL_SUMMARY_DRAFT,
        language = 'en',
        ageBand = '7-9',
        detailLevel = 'simple',
        storyVersion = 1,
      } = req.body as {
        summary?: PlainLanguageSummaryDraft;
        language?: AppLanguage;
        ageBand?: AgeBand;
        detailLevel?: DetailPreference;
        storyVersion?: number;
      };

      const groundedFallback = buildGroundedStoryDraftFromSummary(
        summary,
        language,
        ageBand,
        detailLevel,
        storyVersion
      );

      const ai = getGenAIClient();
      if (!ai) {
        res.json({ story: groundedFallback, usedFallback: true });
        return;
      }

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Create a 3-page child-friendly recovery story featuring Kare the bear based ONLY on this caregiver-reviewed post-operative summary.
Target Age Band: ${ageBand}
Language: ${language === 'fr' ? 'Canadian French' : 'Canadian English'}
Detail Preference: ${detailLevel}

CRITICAL CLINICAL SAFETY RULES:
- Use ONLY facts present in the summary below.
- NEVER promise "it won't hurt", "painless", or "you'll get better soon".
- NEVER invent medication doses or clock times. Emphasize that a grown-up checks the discharge sheet and gives all medicine.

Reviewed Summary JSON:
${JSON.stringify({
  whatToDo: summary.whatToDo,
  whenToSeekHelp: summary.whenToSeekHelp,
})}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      bodyText: { type: Type.STRING },
                      extraDetailText: { type: Type.STRING },
                    },
                    required: ['title', 'bodyText', 'extraDetailText'],
                  },
                },
              },
              required: ['pages'],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Story generation timeout')), 3800)
        ),
      ]);

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        pages?: { title: string; bodyText: string; extraDetailText: string }[];
      };

      if (!Array.isArray(parsed.pages) || parsed.pages.length < 3) {
        res.json({ story: groundedFallback, usedFallback: true });
        return;
      }

      const mergedPages = groundedFallback.pages.map((basePage, idx) => ({
        ...basePage,
        title: parsed.pages?.[idx]?.title || basePage.title,
        bodyText: parsed.pages?.[idx]?.bodyText || basePage.bodyText,
        extraDetailText:
          parsed.pages?.[idx]?.extraDetailText || basePage.extraDetailText,
      }));

      const combinedText = mergedPages
        .map((p) => `${p.title} ${p.bodyText} ${p.extraDetailText}`)
        .join(' ');
      const flaggedReassuranceWarnings =
        detectDisallowedReassurancePhrases(combinedText);

      res.json({
        story: {
          ...groundedFallback,
          pages: mergedPages,
          flaggedReassuranceWarnings,
        },
        usedFallback: false,
      });
    } catch {
      const {
        summary = INITIAL_SUMMARY_DRAFT,
        language = 'en',
        ageBand = '7-9',
        detailLevel = 'simple',
        storyVersion = 1,
      } = req.body ?? {};
      const groundedFallback = buildGroundedStoryDraftFromSummary(
        summary,
        language,
        ageBand,
        detailLevel,
        storyVersion
      );
      res.json({ story: groundedFallback, usedFallback: true });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* 7. GEMINI LIVE VOICE WEBSOCKET BRIDGE (gemini-3.8-live)                  */
  /* ------------------------------------------------------------------------ */
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(
      request.url ?? '/',
      `http://${request.headers.host ?? 'localhost'}`
    ).pathname;

    if (pathname === '/api/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request) => {
    const url = new URL(
      request.url ?? '/api/live',
      `http://${request.headers.host ?? 'localhost'}`
    );
    const pointId = url.searchParams.get('pointId') ?? RECOVERY_POINTS[0].id;
    const language = (url.searchParams.get('lang') as AppLanguage) || 'en';
    const ageBand = (url.searchParams.get('ageBand') as AgeBand) || '7-9';
    const point = resolveLessonPoint(pointId, language, ageBand);

    const ai = getGenAIClient();
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message:
            'Live voice connection is unavailable right now. Please use "Type to Kare" below.',
        })
      );
      clientWs.close();
      return;
    }

    let coveredPointIds: string[] = [];
    let sessionPromise: ReturnType<typeof ai.live.connect> | null = null;
    let accumulatedChildTurn = '';
    let accumulatedKareTurn = '';

    const sysInstruction = buildExplainKareSystemInstruction(point, [], []);

    try {
      sessionPromise = ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
          systemInstruction: sysInstruction,
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              accumulatedChildTurn += content.inputTranscription.text;
              coveredPointIds = detectCoveredPointsFromText(
                point,
                accumulatedChildTurn,
                coveredPointIds
              );
              clientWs.send(
                JSON.stringify({
                  type: 'input_caption',
                  text: content.inputTranscription.text,
                  fullTurnText: accumulatedChildTurn.trim(),
                  coveredPointIds,
                })
              );
            }

            if (content?.outputTranscription?.text) {
              accumulatedKareTurn += content.outputTranscription.text;
              clientWs.send(
                JSON.stringify({
                  type: 'output_caption',
                  text: content.outputTranscription.text,
                  fullTurnText: accumulatedKareTurn.trim(),
                })
              );
            }

            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
            }

            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (content?.turnComplete) {
              clientWs.send(
                JSON.stringify({
                  type: 'turn_complete',
                  childTurnText: accumulatedChildTurn.trim(),
                  kareTurnText: accumulatedKareTurn.trim(),
                  coveredPointIds,
                })
              );
              accumulatedChildTurn = '';
              accumulatedKareTurn = '';
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  message:
                    err instanceof Error
                      ? err.message
                      : 'Live voice session encountered an error.',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });

      const session = await sessionPromise;
      session.sendRealtimeInput({
        text: `Greet the child warmly in one short sentence and ask them one short question about Step ${point.stepNumber}: "${point.childInstruction}"`,
      });
    } catch (err) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Unable to start Gemini Live voice session. Please use "Type to Kare".',
          })
        );
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!sessionPromise) return;
      try {
        const msg = JSON.parse(raw.toString()) as {
          audio?: string;
          text?: string;
          initCoveredIds?: string[];
        };
        if (Array.isArray(msg.initCoveredIds)) {
          coveredPointIds = Array.from(
            new Set([...coveredPointIds, ...msg.initCoveredIds])
          );
        }
        sessionPromise
          .then((session) => {
            if (msg.audio) {
              session.sendRealtimeInput({
                audio: {
                  data: msg.audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              });
            } else if (msg.text) {
              session.sendRealtimeInput({
                text: msg.text,
              });
            }
          })
          .catch(() => {});
      } catch {
        // Ignore malformed client frames
      }
    });

    clientWs.on('close', () => {
      if (sessionPromise) {
        sessionPromise.then((session) => session.close()).catch(() => {});
      }
    });
  });

  /* ------------------------------------------------------------------------ */
  /* 8. VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)                         */
  /* ------------------------------------------------------------------------ */
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`KareBEAR V0 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
