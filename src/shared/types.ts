export interface RecordingMetadata {
  id: string;
  fileName: string;
  createdAt: string;   // ISO 8601
  durationMs: number;
  name?: string;
}

export interface IAudioRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  readonly isRecording: boolean;
}

export interface IRecordingRepository {
  save(audioBuffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string>;
  list(): Promise<RecordingMetadata[]>;
  getFilePath(id: string): string;
  delete(id: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
}

export interface IAIProvider {
  transcribe(audioPath: string): Promise<string>;
  summarize(text: string): Promise<string>;
}

export interface ElectronAPI {
  saveRecording(buffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string>;
  listRecordings(): Promise<RecordingMetadata[]>;
  getRecordingPath(id: string): Promise<string>;
  getDesktopSources(): Promise<{ id: string; name: string }[]>;
  deleteRecording(id: string): Promise<void>;
  renameRecording(id: string, name: string): Promise<void>;
}
