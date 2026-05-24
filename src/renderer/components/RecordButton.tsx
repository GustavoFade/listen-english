import React from 'react';

export interface RecordButtonProps {
  isRecording: boolean;
  onRecord: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onRecord, onStop, disabled = false }: RecordButtonProps) {
  return (
    <div className="controls">
      <button
        className="btn btn--record"
        onClick={onRecord}
        disabled={isRecording || disabled}
        aria-label="Iniciar gravação"
      >
        Gravar
      </button>
      <button
        className="btn btn--stop"
        onClick={onStop}
        disabled={!isRecording || disabled}
        aria-label="Parar gravação"
      >
        Parar
      </button>
    </div>
  );
}
