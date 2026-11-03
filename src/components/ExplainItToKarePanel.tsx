/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * "Explain it to Kare" shared learning activity panel.
 * Combines:
 * 1. "Type to Kare" (gemini-3.8-flash multi-turn grounded chatbot + "Explain this page another way")
 * 2. "Talk to Kare" (gemini-3.8-live real-time spoken conversation with live captions, mic handling, End Conversation, and typed fallback)
 * 3. "Record Answer" (gemini-3.5-transcribe optional recorded-answer mode with editable transcript confirmation before feedback)
 *
 * Shares the same lesson context, SickKids source excerpt, expected learning points,
 * and conversation history across all modes.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  HelpCircle,
  Keyboard,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Send,
  Square,
  Volume2,
} from 'lucide-react';
import { type RecoveryPointContent } from '../data/demoContent';
import {
  generateLocalExplainResponse,
  type ExplainInteractionSource,
  type ExplainMessage,
  type PointExplainObservation,
} from '../utils/explainKareLogic';
import { KareMascot } from '../mascot/KareMascot';
import { useMascotRuntime } from '../mascot/MascotRuntimeContext';
import { rmsToMouthOpen } from '../mascot/mascotStateArbiter';

export type ExplainModeTab = 'type' | 'talk' | 'record';

interface ExplainItToKarePanelProps {
  point: RecoveryPointContent;
  observation: PointExplainObservation;
  onRecordTurn: (
    pointId: string,
    newMessages: ExplainMessage[],
    coveredPointIds: string[]
  ) => void;
  onJumpToExplanation: (pointId: string) => void;
  isOnLearnScreen?: boolean;
}

/**
 * Helper to encode Float32Array audio samples (-1..1) to base64 16-bit PCM little-endian.
 */
function float32ToBase64Pcm16(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to decode base64 16-bit PCM little-endian (24kHz) into an AudioBuffer,
 * compute approximate RMS mouth opening, and schedule gapless playback.
 */
function schedulePcm24kPlayback(
  audioCtx: AudioContext,
  base64Data: string,
  nextStartTimeRef: React.MutableRefObject<number>,
  activeSourcesRef: React.MutableRefObject<AudioBufferSourceNode[]>,
  onPlaybackChange: (playing: boolean, mouthOpen?: number) => void
) {
  const binary = atob(base64Data);
  const byteLength = binary.length;
  const sampleCount = Math.floor(byteLength / 2);
  if (sampleCount <= 0) return;

  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const audioBuffer = audioCtx.createBuffer(1, sampleCount, 24000);
  const channelData = audioBuffer.getChannelData(0);
  let sumSq = 0;
  for (let i = 0; i < sampleCount; i++) {
    const sample = view.getInt16(i * 2, true) / 32768;
    channelData[i] = sample;
    sumSq += sample * sample;
  }
  const rms = Math.sqrt(sumSq / sampleCount);
  const mouthOpen = rmsToMouthOpen(rms);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  const startAt = Math.max(now, nextStartTimeRef.current);
  source.start(startAt);
  nextStartTimeRef.current = startAt + audioBuffer.duration;

  activeSourcesRef.current.push(source);
  onPlaybackChange(true, mouthOpen);

  source.onended = () => {
    activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
    if (activeSourcesRef.current.length === 0) {
      onPlaybackChange(false, 0);
    }
  };
}

export const ExplainItToKarePanel: React.FC<ExplainItToKarePanelProps> = ({
  point,
  observation,
  onRecordTurn,
  onJumpToExplanation,
  isOnLearnScreen = false,
}) => {
  const {
    resolvedState,
    renderMode,
    setModelAudioSpeaking,
    setMicrophoneListening,
    triggerTransientGesture,
  } = useMascotRuntime();

  const [activeTab, setActiveTab] = useState<ExplainModeTab>('type');

  // Typed mode state
  const [typedInput, setTypedInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Live voice mode state
  const [liveStatus, setLiveStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'mic-error'
  >('idle');
  const [liveErrorMessage, setLiveErrorMessage] = useState<string | null>(null);
  const [liveChildCaption, setLiveChildCaption] = useState('');
  const [liveKareCaption, setLiveKareCaption] = useState('');

  // Optional Recorded-answer mode state (gemini-3.5-transcribe)
  const [recordStatus, setRecordStatus] = useState<
    'idle' | 'recording' | 'transcribing' | 'review-transcript' | 'mic-error'
  >('idle');
  const [recordErrorMessage, setRecordErrorMessage] = useState<string | null>(null);
  const [draftTranscript, setDraftTranscript] = useState('');

  // Refs for Live WebSocket & WebAudio
  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const coveredIdsRef = useRef<string[]>(observation.coveredLearningPointIds);

  // Refs for MediaRecorder in optional Record Answer mode
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Ref for chat scroll thread
  const threadContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    coveredIdsRef.current = observation.coveredLearningPointIds;
  }, [observation.coveredLearningPointIds]);

  // Synchronize real microphone listening state (ONLY when permission is granted & capture is active)
  useEffect(() => {
    const isActivelyCapturing =
      liveStatus === 'connected' || recordStatus === 'recording';
    setMicrophoneListening(isActivelyCapturing);
  }, [liveStatus, recordStatus, setMicrophoneListening]);

  // Scroll conversation thread when messages update
  useEffect(() => {
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTop =
        threadContainerRef.current.scrollHeight;
    }
  }, [observation.messages, liveChildCaption, liveKareCaption]);

  // Clean up Live voice or MediaRecorder when unmounting or switching steps
  useEffect(() => {
    return () => {
      stopLiveConversation();
      stopMediaRecordingCleanup();
      setMicrophoneListening(false);
      setModelAudioSpeaking(false, 0);
    };
  }, [point.id]);

  /* ------------------------------------------------------------------------ */
  /* SHARED CHAT / FEEDBACK REQUEST HANDLER (gemini-3.8-flash + fallback)      */
  /* ------------------------------------------------------------------------ */
  const sendExplanationToKare = async (
    text: string,
    mode: 'respond' | 'rephrase',
    source: ExplainInteractionSource
  ) => {
    const trimmed = text.trim();
    if (mode === 'respond' && !trimmed) return;

    setIsSendingChat(true);

    const childMsg: ExplainMessage | null =
      mode === 'respond'
        ? {
            id: `child-${Date.now()}`,
            role: 'child',
            text: trimmed,
            source,
            timestamp: Date.now(),
          }
        : {
            id: `child-rephrase-${Date.now()}`,
            role: 'child',
            text: 'Can you explain this page another way?',
            source: 'rephrase',
            timestamp: Date.now(),
          };

    try {
      const response = await fetch('/api/explain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointId: point.id,
          userMessage: trimmed,
          mode,
          coveredPointIds: observation.coveredLearningPointIds,
          conversationHistory: observation.messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = (await response.json()) as {
        reply: string;
        isOutOfScope: boolean;
        allCoveredPointIds: string[];
      };

      const kareMsg: ExplainMessage = {
        id: `kare-${Date.now() + 1}`,
        role: 'kare',
        text: data.reply,
        source,
        timestamp: Date.now() + 1,
        isOutOfScopeRedirect: data.isOutOfScope,
      };

      const nextCovered =
        data.allCoveredPointIds ?? observation.coveredLearningPointIds;
      onRecordTurn(
        point.id,
        childMsg ? [childMsg, kareMsg] : [kareMsg],
        nextCovered
      );
      if (nextCovered.length >= point.expectedLearningPoints.length) {
        triggerTransientGesture('celebrating', 2600);
      } else {
        triggerTransientGesture('encouraging', 2200);
      }
    } catch {
      // Deterministic grounded fallback if network/API is unavailable
      const fallback = generateLocalExplainResponse(
        point,
        trimmed,
        mode,
        observation.coveredLearningPointIds
      );
      const kareMsg: ExplainMessage = {
        id: `kare-fb-${Date.now() + 1}`,
        role: 'kare',
        text: fallback.reply,
        source,
        timestamp: Date.now() + 1,
        isOutOfScopeRedirect: fallback.isOutOfScope,
      };
      onRecordTurn(
        point.id,
        childMsg ? [childMsg, kareMsg] : [kareMsg],
        fallback.allCoveredPointIds
      );
      if (
        fallback.allCoveredPointIds.length >=
        point.expectedLearningPoints.length
      ) {
        triggerTransientGesture('celebrating', 2600);
      } else {
        triggerTransientGesture('encouraging', 2200);
      }
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSendTypedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim() || isSendingChat) return;
    const messageToSend = typedInput;
    setTypedInput('');
    await sendExplanationToKare(messageToSend, 'respond', 'typed');
  };

  const handleExplainAnotherWay = async () => {
    if (isSendingChat) return;
    await sendExplanationToKare('', 'rephrase', 'rephrase');
  };

  /* ------------------------------------------------------------------------ */
  /* GEMINI LIVE VOICE CONVERSATION (gemini-3.8-live via /api/live)            */
  /* ------------------------------------------------------------------------ */
  const stopLiveConversation = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setLiveChildCaption('');
    setLiveKareCaption('');
    setModelAudioSpeaking(false, 0);
    setLiveStatus((prev) => (prev === 'mic-error' ? 'mic-error' : 'idle'));
  };

  const startLiveConversation = async () => {
    setLiveErrorMessage(null);
    setLiveChildCaption('');
    setLiveKareCaption('');

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setLiveStatus('mic-error');
      setLiveErrorMessage(
        'Microphone access is not available in this browser. You can use "Type to Kare" right away.'
      );
      return;
    }

    setLiveStatus('connecting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;
    } catch {
      setLiveStatus('mic-error');
      setLiveErrorMessage(
        'Microphone permission was declined or no microphone was found. Switch to "Type to Kare" anytime to keep practicing!'
      );
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?pointId=${encodeURIComponent(
        point.id
      )}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            initCoveredIds: coveredIdsRef.current,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            audio?: string;
            text?: string;
            fullTurnText?: string;
            childTurnText?: string;
            kareTurnText?: string;
            coveredPointIds?: string[];
            message?: string;
          };

          if (msg.type === 'ready') {
            setLiveStatus('connected');
            // Start streaming 16kHz PCM from microphone
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (ws.readyState === WebSocket.OPEN) {
                const channelData = e.inputBuffer.getChannelData(0);
                const base64Audio = float32ToBase64Pcm16(channelData);
                ws.send(JSON.stringify({ audio: base64Audio }));
              }
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          } else if (msg.type === 'input_caption') {
            setLiveChildCaption(msg.fullTurnText ?? msg.text ?? '');
          } else if (msg.type === 'output_caption') {
            setLiveKareCaption(msg.fullTurnText ?? msg.text ?? '');
          } else if (msg.type === 'audio' && msg.audio && outputAudioCtxRef.current) {
            schedulePcm24kPlayback(
              outputAudioCtxRef.current,
              msg.audio,
              nextStartTimeRef,
              activeSourcesRef,
              setModelAudioSpeaking
            );
          } else if (msg.type === 'interrupted') {
            activeSourcesRef.current.forEach((s) => {
              try {
                s.stop();
              } catch {}
            });
            activeSourcesRef.current = [];
            nextStartTimeRef.current = 0;
            setModelAudioSpeaking(false, 0);
          } else if (msg.type === 'turn_complete') {
            const newMsgs: ExplainMessage[] = [];
            if (msg.childTurnText) {
              newMsgs.push({
                id: `live-child-${Date.now()}`,
                role: 'child',
                text: msg.childTurnText,
                source: 'live-voice',
                timestamp: Date.now(),
              });
            }
            if (msg.kareTurnText) {
              newMsgs.push({
                id: `live-kare-${Date.now() + 1}`,
                role: 'kare',
                text: msg.kareTurnText,
                source: 'live-voice',
                timestamp: Date.now() + 1,
              });
            }
            if (newMsgs.length > 0 || (msg.coveredPointIds && msg.coveredPointIds.length > 0)) {
              onRecordTurn(
                point.id,
                newMsgs,
                msg.coveredPointIds ?? coveredIdsRef.current
              );
            }
            setLiveChildCaption('');
            setLiveKareCaption('');
          } else if (msg.type === 'error') {
            setLiveErrorMessage(
              msg.message ?? 'Live voice session ended. You can switch to Type to Kare.'
            );
            stopLiveConversation();
            setLiveStatus('mic-error');
          }
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onerror = () => {
        setLiveErrorMessage(
          'Could not connect to Live voice right now. Please use "Type to Kare".'
        );
        stopLiveConversation();
        setLiveStatus('mic-error');
      };

      ws.onclose = () => {
        setLiveStatus((prev) => (prev === 'mic-error' ? 'mic-error' : 'idle'));
      };
    } catch {
      stopLiveConversation();
      setLiveStatus('mic-error');
      setLiveErrorMessage(
        'Could not start Live voice conversation. You can switch to "Type to Kare".'
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* OPTIONAL RECORDED ANSWER MODE (gemini-3.5-transcribe)                     */
  /* ------------------------------------------------------------------------ */
  const stopMediaRecordingCleanup = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  };

  const startRecordedAnswerCapture = async () => {
    setRecordErrorMessage(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setRecordStatus('review-transcript');
      setRecordErrorMessage(
        'Microphone recording is not available on this device. You can type or edit your transcript below and confirm it!'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;

        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        setRecordStatus('transcribing');

        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              const base64 = res.includes(',') ? res.split(',')[1] : res;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const response = await fetch('/api/explain/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
            }),
          });

          const data = (await response.json()) as {
            transcript?: string;
            error?: string;
          };

          if (!response.ok || data.error) {
            setRecordErrorMessage(
              data.error ??
                'Could not transcribe automatically. Please type or edit your explanation below before confirming.'
            );
          } else if (data.transcript) {
            setDraftTranscript(data.transcript);
          }
        } catch {
          setRecordErrorMessage(
            'Transcription service unavailable. You can type or edit your words directly below and confirm.'
          );
        } finally {
          setRecordStatus('review-transcript');
        }
      };

      recorder.start();
      setRecordStatus('recording');
    } catch {
      setRecordStatus('review-transcript');
      setRecordErrorMessage(
        'Microphone permission was declined. You can still type or edit your transcript in the box below before confirming!'
      );
    }
  };

  const stopRecordedAnswerCapture = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleConfirmTranscript = async () => {
    const confirmed = draftTranscript.trim();
    if (!confirmed || isSendingChat) return;
    setDraftTranscript('');
    setRecordStatus('idle');
    setRecordErrorMessage(null);
    await sendExplanationToKare(confirmed, 'respond', 'recorded-audio');
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */
  const coveredSet = new Set(observation.coveredLearningPointIds);

  return (
    <section
      aria-labelledby={`explain-kare-heading-${point.id}`}
      className="rounded-2xl border-2 border-[#1F6F6B] bg-[#FFFDF8] p-5 shadow-xs space-y-4"
    >
      {/* Panel Header */}
      <div className="space-y-3 border-b border-[#3A2E26]/15 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1F6F6B]/30 bg-white p-1 shrink-0">
            <KareMascot
              size="xs"
              preset="cast"
              state={resolvedState}
              renderMode={renderMode}
              decorative={true}
            />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1F6F6B]">
              Interactive Practice · Step {point.stepNumber}: {point.shortTitle}
            </span>
            <h2
              id={`explain-kare-heading-${point.id}`}
              className="font-child text-[22px] font-extrabold text-[#1F6F6B]"
            >
              Explain it to Kare (in your own words)
            </h2>
          </div>
        </div>

        {/* Mode Selector Tabs: Type to Kare | Talk to Kare | Record Answer (Optional) */}
        <div
          role="tablist"
          aria-label="Choose how to explain to Kare"
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'type'}
            onClick={() => {
              stopLiveConversation();
              setActiveTab('type');
            }}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm sm:text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'type'
                ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26] hover:border-[#1F6F6B]'
            }`}
          >
            <Keyboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Type to Kare</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'talk'}
            onClick={() => setActiveTab('talk')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm sm:text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'talk'
                ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26] hover:border-[#1F6F6B]'
            }`}
          >
            <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Talk to Kare</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'record'}
            onClick={() => {
              stopLiveConversation();
              setActiveTab('record');
            }}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm sm:text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'record'
                ? 'border-[#1F6F6B] bg-[#1F6F6B] text-white'
                : 'border-[#3A2E26]/25 bg-[#FFF8EC] text-[#3A2E26] hover:border-[#1F6F6B]'
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Record Answer</span>
          </button>
        </div>
      </div>

      {/* Shared Conversation Thread */}
      <div
        ref={threadContainerRef}
        aria-live="polite"
        aria-label="Conversation with Kare"
        className="max-h-[240px] overflow-y-auto rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3"
      >
        {observation.messages.map((msg) => {
          const isKare = msg.role === 'kare';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isKare ? 'items-start' : 'items-end'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl border px-4 py-3 text-[18px] leading-relaxed ${
                  isKare
                    ? msg.isOutOfScopeRedirect
                      ? 'border-[#F2994A] bg-[#FDE8D4] text-[#3A2E26]'
                      : 'border-[#1F6F6B]/30 bg-[#FFFDF8] text-[#3A2E26]'
                    : 'border-[#1F6F6B] bg-[#DDF1EE] text-[#3A2E26]'
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-[#1F6F6B]">
                  <span>{isKare ? 'Kare' : 'You'}</span>
                  {msg.source === 'live-voice' && (
                    <span>· Spoken (Live caption)</span>
                  )}
                  {msg.source === 'recorded-audio' && (
                    <span>· Confirmed transcript</span>
                  )}
                </div>
                <p className="font-child text-[19px] font-bold">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {isSendingChat && (
          <div className="flex items-start">
            <div className="rounded-xl border border-[#1F6F6B]/30 bg-[#FFFDF8] px-4 py-2.5 text-base font-bold text-[#1F6F6B]">
              Kare is listening and thinking…
            </div>
          </div>
        )}

        {/* Real-time Captions during active Gemini Live conversation */}
        {liveStatus === 'connected' && (liveChildCaption || liveKareCaption) && (
          <div className="rounded-xl border-2 border-dashed border-[#1F6F6B] bg-[#DDF1EE]/50 p-3 space-y-1.5 text-base">
            <p className="text-xs font-bold text-[#1F6F6B]">
              Live Conversation Captions
            </p>
            {liveChildCaption && (
              <p className="font-semibold text-[#3A2E26]">
                <strong>You (speaking):</strong> {liveChildCaption}
              </p>
            )}
            {liveKareCaption && (
              <p className="font-semibold text-[#1F6F6B]">
                <strong>Kare (speaking):</strong> {liveKareCaption}
              </p>
            )}
          </div>
        )}
      </div>

      {/* MODE 1: TYPE TO KARE */}
      {activeTab === 'type' && (
        <div role="tabpanel" aria-label="Type to Kare" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-medium text-[#3A2E26]">
              Type how you would explain this step in your own words, or ask Kare to explain it another way.
            </p>
            <button
              type="button"
              disabled={isSendingChat}
              onClick={handleExplainAnotherWay}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFF8EC] px-4 py-2 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Explain this page another way</span>
            </button>
          </div>

          <form onSubmit={handleSendTypedSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={`typed-explain-input-${point.id}`} className="sr-only">
              Type your explanation for Kare
            </label>
            <input
              id={`typed-explain-input-${point.id}`}
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Type your explanation here (for example: Keep my cast out of bath water)..."
              className="min-h-[56px] flex-1 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFF8EC] px-4 py-3 text-[19px] font-medium text-[#3A2E26] placeholder:text-[#3A2E26]/55"
            />
            <button
              type="submit"
              disabled={isSendingChat || !typedInput.trim()}
              className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl px-6 py-3 text-lg font-bold whitespace-nowrap shrink-0 ${
                isSendingChat || !typedInput.trim()
                  ? 'bg-[#3A2E26]/20 text-[#3A2E26]/60 cursor-not-allowed'
                  : 'bg-[#1F6F6B] text-white hover:bg-[#165350] cursor-pointer'
              }`}
            >
              <Send className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{isSendingChat ? 'Sending...' : 'Send to Kare'}</span>
            </button>
          </form>
        </div>
      )}

      {/* MODE 2: TALK TO KARE (Gemini Live gemini-3.8-live) */}
      {activeTab === 'talk' && (
        <div role="tabpanel" aria-label="Talk to Kare" className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-child text-[20px] font-bold text-[#1F6F6B]">
                Spoken Conversation with Kare (Live Voice &amp; Captions)
              </p>
              <p className="text-base text-[#3A2E26]">
                {liveStatus === 'connected'
                  ? 'Microphone is active. Speak naturally to Kare — live captions appear above.'
                  : liveStatus === 'connecting'
                    ? 'Connecting to Kare and checking microphone permission...'
                    : 'Press "Start Talking with Kare" to use your microphone, or switch to typing anytime.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {liveStatus === 'idle' || liveStatus === 'mic-error' ? (
                <button
                  type="button"
                  onClick={startLiveConversation}
                  className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl bg-[#1F6F6B] px-6 py-3 text-lg font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Volume2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>Start Talking with Kare</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveConversation}
                  className="inline-flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#3A2E26] bg-[#F2994A] px-6 py-3 text-lg font-bold text-[#3A2E26] hover:bg-[#e58938] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PhoneOff className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>End Conversation</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopLiveConversation();
                  setActiveTab('type');
                }}
                className="inline-flex min-h-[56px] items-center gap-2 rounded-xl border-2 border-[#1F6F6B] bg-[#FFFDF8] px-5 py-3 text-base font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Keyboard className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Use Typed Fallback</span>
              </button>
            </div>
          </div>

          {liveErrorMessage && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#F2994A] bg-[#FDE8D4] p-3.5 text-base font-medium text-[#3A2E26]"
            >
              <div className="flex items-center gap-2.5">
                <MicOff className="h-5 w-5 shrink-0 text-[#3A2E26]" aria-hidden="true" />
                <span>{liveErrorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('type')}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#1F6F6B] px-4 py-2 text-sm font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Switch to Type to Kare</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: OPTIONAL RECORDED ANSWER MODE (gemini-3.5-transcribe) */}
      {activeTab === 'record' && (
        <div
          role="tabpanel"
          aria-label="Record Answer"
          className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-child text-[20px] font-bold text-[#1F6F6B]">
                Optional Recorded Answer (Review &amp; Confirm Transcript First)
              </p>
              <p className="text-base text-[#3A2E26]">
                Record a short voice clip. We will transcribe it so you and your grown-up can fix any words before Kare gives feedback.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {recordStatus !== 'recording' ? (
                <button
                  type="button"
                  disabled={recordStatus === 'transcribing'}
                  onClick={startRecordedAnswerCapture}
                  className="inline-flex min-h-[56px] items-center gap-2 rounded-xl bg-[#1F6F6B] px-5 py-3 text-lg font-bold text-white hover:bg-[#165350] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    {recordStatus === 'transcribing'
                      ? 'Transcribing...'
                      : 'Record Short Answer'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecordedAnswerCapture}
                  className="inline-flex min-h-[56px] items-center gap-2 rounded-xl border-2 border-[#3A2E26] bg-[#F2994A] px-5 py-3 text-lg font-bold text-[#3A2E26] hover:bg-[#e58938] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Square className="h-5 w-5 fill-current shrink-0" aria-hidden="true" />
                  <span>Stop &amp; Transcribe</span>
                </button>
              )}
            </div>
          </div>

          {recordErrorMessage && (
            <p className="rounded-lg border border-[#F2994A] bg-[#FDE8D4] px-3.5 py-2 text-sm font-medium text-[#3A2E26]">
              {recordErrorMessage}
            </p>
          )}

          {/* Transcript Review & Confirmation Box */}
          <div className="space-y-2 pt-1">
            <label
              htmlFor={`transcript-confirm-box-${point.id}`}
              className="block text-sm font-bold text-[#1F6F6B]"
            >
              Review and edit your transcript before sending to Kare:
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id={`transcript-confirm-box-${point.id}`}
                type="text"
                value={draftTranscript}
                onChange={(e) => setDraftTranscript(e.target.value)}
                placeholder="Your transcribed words will appear here so you can check or edit them..."
                className="min-h-[56px] flex-1 rounded-xl border-2 border-[#3A2E26]/30 bg-[#FFFDF8] px-4 py-3 text-[18px] font-medium text-[#3A2E26]"
              />
              <button
                type="button"
                disabled={!draftTranscript.trim() || isSendingChat}
                onClick={handleConfirmTranscript}
                className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl px-6 py-3 text-lg font-bold whitespace-nowrap shrink-0 ${
                  !draftTranscript.trim() || isSendingChat
                    ? 'bg-[#3A2E26]/20 text-[#3A2E26]/60 cursor-not-allowed'
                    : 'bg-[#1F6F6B] text-white hover:bg-[#165350] cursor-pointer'
                }`}
              >
                <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Confirm &amp; Get Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUGGESTED OBSERVATIONS FOR CAREGIVER REVIEW (Learning Points Covered vs Unclear) */}
      <div className="rounded-xl border border-[#3A2E26]/20 bg-[#FFF8EC] p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#1F6F6B]">
              Suggested Observations for Caregiver Review (Step {point.stepNumber})
            </h3>
            <p className="text-xs font-medium text-[#3A2E26]/80">
              Shows which learning points were mentioned or remain unclear — for caregiver discussion, not a validated comprehension score.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onJumpToExplanation(point.id)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#1F6F6B] bg-[#FFFDF8] px-3 py-1.5 text-sm font-bold text-[#1F6F6B] hover:bg-[#DDF1EE] cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isOnLearnScreen
                ? 'Expand "More about this" explanation above'
                : `Review Step ${point.stepNumber} explanation`}
            </span>
          </button>
        </div>

        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {point.expectedLearningPoints.map((lp) => {
            const isCovered = coveredSet.has(lp.id);
            return (
              <li
                key={lp.id}
                className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${
                  isCovered
                    ? 'border-[#1F6F6B] bg-[#DDF1EE]/65 text-[#3A2E26]'
                    : 'border-[#3A2E26]/20 bg-[#FDE8D4]/55 text-[#3A2E26]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isCovered ? (
                    <Check
                      className="h-5 w-5 shrink-0 text-[#1F6F6B] stroke-[3] mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <HelpCircle
                      className="h-5 w-5 shrink-0 text-[#3A2E26]/75 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <span className="block font-bold">
                      {isCovered ? 'Covered in explanation:' : 'Still unclear / not yet mentioned:'}
                    </span>
                    <span className="block font-medium">{lp.label}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
