import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { RecordingMetadata } from '@shared/types';
import { RecordButton } from './components/RecordButton';
import { RecordingList } from './components/RecordingList';
import { useAudioRecorder } from './hooks/useAudioRecorder';

export function App() {
  const { start, stop, isRecording, error: recorderError } = useAudioRecorder();
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    window.electronAPI.listRecordings().then(setRecordings).catch(() => {
      setSaveError('Erro ao carregar histórico de gravações.');
    });
  }, []);

  const handleRecord = useCallback(async () => {
    setSaveError(null);
    startTimeRef.current = Date.now();
    try {
      await start();
    } catch {
      // error já capturado pelo hook
    }
  }, [start]);

  const handleStop = useCallback(async () => {
    const blob = await stop();
    const durationMs = Date.now() - startTimeRef.current;
    const buffer = await blob.arrayBuffer();
    const metadata: Omit<RecordingMetadata, 'id' | 'fileName'> = {
      createdAt: new Date().toISOString(),
      durationMs,
    };

    try {
      await window.electronAPI.saveRecording(buffer, metadata as RecordingMetadata);
      const updated = await window.electronAPI.listRecordings();
      setRecordings(updated);
    } catch {
      setSaveError('Erro ao salvar a gravação.');
    }
  }, [stop]);

  const handlePlay = useCallback(async (id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const filePath = await window.electronAPI.getRecordingPath(id);
    const audio = new Audio(`file://${filePath}`);
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    audio.play();
    setPlayingId(id);
  }, []);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setPlayingId(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await window.electronAPI.deleteRecording(id);
    const updated = await window.electronAPI.listRecordings();
    setRecordings(updated);
  }, []);

  const handleRename = useCallback(async (id: string, name: string) => {
    await window.electronAPI.renameRecording(id, name);
    const updated = await window.electronAPI.listRecordings();
    setRecordings(updated);
  }, []);

  const displayError = recorderError ?? saveError;

  return (
    <div className="app">
      <RecordButton isRecording={isRecording} onRecord={handleRecord} onStop={handleStop} />
      {displayError && <p className="error-msg" role="alert">{displayError}</p>}
      <RecordingList recordings={recordings} playingId={playingId} onPlay={handlePlay} onPause={handlePause} onDelete={handleDelete} onRename={handleRename} />
    </div>
  );
}
