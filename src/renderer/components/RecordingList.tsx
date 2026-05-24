import React, { useState } from "react";
import type { RecordingMetadata } from "@shared/types";
import { formatDuration, formatDisplayDate } from "@shared/formatters";
import { MAX_HISTORY_ITEMS } from "@shared/constants";

export interface RecordingListProps {
  recordings: RecordingMetadata[];
  playingId: string | null;
  onPlay: (id: string) => void;
  onPause: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function RecordingList({
  recordings,
  playingId,
  onPlay,
  onPause,
  onDelete,
  onRename,
}: RecordingListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const visible = recordings.slice(0, MAX_HISTORY_ITEMS);

  if (visible.length === 0) {
    return <p className="empty-state">Nenhuma gravação ainda.</p>;
  }

  const startEdit = (rec: RecordingMetadata) => {
    setEditingId(rec.id);
    setEditValue(rec.name ?? formatDisplayDate(rec.createdAt));
  };

  const commitEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  return (
    <ul className="recording-list" aria-label="Histórico de gravações">
      {visible.map((rec) => (
        <li key={rec.id} className="recording-item">
          {editingId === rec.id ? (
            <input
              className="rename-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit(rec.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              autoFocus
              aria-label="Novo nome"
            />
          ) : (
            <span>
              {rec.name ?? formatDisplayDate(rec.createdAt)} —{" "}
              {formatDuration(rec.durationMs)}
            </span>
          )}
          {playingId === rec.id ? (
            <button
              className="btn btn--play"
              onClick={onPause}
              aria-label="Pausar"
            >
              ⏸ Pausa
            </button>
          ) : (
            <button
              className="btn btn--play"
              onClick={() => onPlay(rec.id)}
              aria-label="Reproduzir"
            >
              ▶ Play
            </button>
          )}
          <button
            className="btn btn--rename"
            onClick={() => startEdit(rec)}
            aria-label="Renomear"
          >
            ✏
          </button>
          <button
            className="btn btn--delete"
            onClick={() => onDelete(rec.id)}
            aria-label="Excluir"
          >
            🗑
          </button>
        </li>
      ))}
    </ul>
  );
}
