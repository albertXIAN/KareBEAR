/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Full-stack Express + WebSocket + Vite server for KareBEAR V0.
 * Handles all @google/genai calls server-side so API credentials remain secure:
 * - POST /api/explain/chat       -> gemini-3.8-flash (Typed chatbot & feedback)
 * - POST /api/explain/transcribe -> gemini-3.5-transcribe (Optional recorded answer transcription)
 * - WS   /api/live               -> gemini-3.8-live (Real-time voice conversation with live captions)
 */

import 'dotenv/config';
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
} from './src/data/demoContent';
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
      } = req.body as {
        pointId: string;
        userMessage?: string;
        mode?: 'respond' | 'rephrase';
        coveredPointIds?: string[];
        conversationHistory?: ExplainMessage[];
      };

      const point =
        RECOVERY_POINTS.find((p) => p.id === pointId) ?? RECOVERY_POINTS[0];

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
1. Decide if the child's message is outside the supplied cast-care educational material (e.g., asking for medication doses, pain medicine, diagnoses, cast removal timelines, or unrelated topics). If so, set isOutOfScope to true.
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
                    'True if the child asked about diagnoses, medications, timelines, or topics outside the supplied cast lesson.',
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

      // Combine model-detected IDs with keyword heuristic for consistency
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
      // Preserve activity with deterministic grounded fallback if API call fails
      const {
        pointId,
        userMessage = '',
        mode = 'respond',
        coveredPointIds = [],
      } = req.body ?? {};
      const point =
        RECOVERY_POINTS.find((p) => p.id === pointId) ?? RECOVERY_POINTS[0];
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
              text: 'Transcribe this child or caregiver audio recording about cast care into plain English text. Return only the spoken words without extra commentary.',
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
  /* 3. GEMINI LIVE VOICE WEBSOCKET BRIDGE (gemini-3.8-live)                  */
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
    const point =
      RECOVERY_POINTS.find((p) => p.id === pointId) ?? RECOVERY_POINTS[0];

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
      // Prompt Kare to greet the child warmly with one short question about the current step
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
  /* 4. VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)                         */
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
