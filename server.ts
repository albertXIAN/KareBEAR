import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { extractLocalStepsFromTranscript } from './src/utils/careStoreLogic.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'KareBEAR' });
  });

  // Server-side Gemini care step extraction with deterministic local fallback
  app.post('/api/extract-steps', async (req, res) => {
    const transcript = typeof req.body?.transcript === 'string' ? req.body.transcript.trim() : '';
    const recoveryFocus = typeof req.body?.recoveryFocus === 'string' ? req.body.recoveryFocus.trim() : 'recovery';

    if (!transcript) {
      res.status(400).json({ error: 'Transcript is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You extract parent-facing home-care steps from a care conversation transcript for a child recovering from ${recoveryFocus}.
Return ONLY a JSON array of 1 to 6 short, actionable care steps that were explicitly stated in the transcript.
Do NOT invent doses, medicines, or instructions not present in the transcript.
Each item must have:
- "title": short action title (2 to 5 words, e.g. "Cold sips", "Pain medicine", "Quiet rest")
- "detail": clear 1-sentence instruction including any stated amount (e.g. "5 mL") or clock time (e.g. "8:00 AM") so a parent can review and approve it.

Transcript:
"""
${transcript}
"""`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ['title', 'detail'],
              },
            },
          },
        });

        const rawText = response.text?.trim() || '[]';
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const steps = parsed
            .filter((item) => item && typeof item.title === 'string' && typeof item.detail === 'string')
            .map((item) => ({
              title: item.title.trim(),
              detail: item.detail.trim(),
            }))
            .filter((item) => item.title.length > 0 || item.detail.length > 0);

          if (steps.length > 0) {
            res.json({ steps, source: 'gemini' });
            return;
          }
        }
      } catch (err) {
        console.warn('Gemini extraction fallback to deterministic local parser:', err);
      }
    }

    const fallbackSteps = extractLocalStepsFromTranscript(transcript);
    res.json({ steps: fallbackSteps, source: 'local' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KareBEAR server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
