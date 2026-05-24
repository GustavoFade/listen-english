import { useState, useRef, useCallback } from 'react';
import type { IAudioRecorder } from '@shared/types';
import { AUDIO_MIME_TYPE } from '@shared/constants';

export interface UseAudioRecorderReturn extends IAudioRecorder {
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const resolveStopRef = useRef<((blob: Blob) => void) | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const sources = await window.electronAPI.getDesktopSources();
      if (!sources || sources.length === 0) {
        throw new Error('Nenhuma fonte de áudio do sistema encontrada.');
      }
      const sourceId = sources[0].id;

      // Captura áudio do sistema (desktop loopback)
      const desktopStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId },
        } as MediaTrackConstraints,
        video: {
          mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId },
        } as MediaTrackConstraints,
      });
      desktopStream.getVideoTracks().forEach((t) => t.stop());

      // Captura microfone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Mistura os dois via Web Audio API
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const destination = audioCtx.createMediaStreamDestination();

      audioCtx.createMediaStreamSource(desktopStream).connect(destination);
      audioCtx.createMediaStreamSource(micStream).connect(destination);

      const mixedStream = destination.stream;
      streamRef.current = mixedStream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(mixedStream, { mimeType: AUDIO_MIME_TYPE });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: AUDIO_MIME_TYPE });
        resolveStopRef.current!(blob);
        desktopStream.getTracks().forEach((t) => t.stop());
        micStream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      resolveStopRef.current = resolve;
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    });
  }, []);

  return { start, stop, isRecording, error };
}
