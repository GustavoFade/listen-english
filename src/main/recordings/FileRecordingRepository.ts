import fs from 'fs';
import path from 'path';
import { IRecordingRepository, RecordingMetadata } from '@shared/types';
import { RECORDINGS_DIR, RECORDINGS_METADATA_FILE, AUDIO_EXTENSION, MAX_HISTORY_ITEMS } from '@shared/constants';

export class FileRecordingRepository implements IRecordingRepository {
  private readonly recordingsPath: string;
  private readonly metadataPath: string;

  constructor(userDataPath: string) {
    this.recordingsPath = path.join(userDataPath, RECORDINGS_DIR);
    this.metadataPath = path.join(this.recordingsPath, RECORDINGS_METADATA_FILE);
  }

  async save(audioBuffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string> {
    this.ensureDirectoryExists();
    const filePath = path.join(this.recordingsPath, metadata.fileName);
    await fs.promises.writeFile(filePath, Buffer.from(audioBuffer));
    await this.appendMetadata(metadata);
    return filePath;
  }

  async list(): Promise<RecordingMetadata[]> {
    if (!fs.existsSync(this.metadataPath)) return [];
    const raw = await fs.promises.readFile(this.metadataPath, 'utf-8');
    const all: RecordingMetadata[] = JSON.parse(raw) as RecordingMetadata[];
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_HISTORY_ITEMS);
  }

  getFilePath(id: string): string {
    return path.join(this.recordingsPath, `${id}${AUDIO_EXTENSION}`);
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    if (!fs.existsSync(this.metadataPath)) return;
    const raw = await fs.promises.readFile(this.metadataPath, 'utf-8');
    const all: RecordingMetadata[] = JSON.parse(raw) as RecordingMetadata[];
    const filtered = all.filter((m) => m.id !== id);
    await fs.promises.writeFile(this.metadataPath, JSON.stringify(filtered, null, 2));
  }

  async rename(id: string, name: string): Promise<void> {
    if (!fs.existsSync(this.metadataPath)) return;
    const raw = await fs.promises.readFile(this.metadataPath, 'utf-8');
    const all: RecordingMetadata[] = JSON.parse(raw) as RecordingMetadata[];
    const updated = all.map((m) => m.id === id ? { ...m, name } : m);
    await fs.promises.writeFile(this.metadataPath, JSON.stringify(updated, null, 2));
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.recordingsPath)) {
      fs.mkdirSync(this.recordingsPath, { recursive: true });
    }
  }

  private async appendMetadata(metadata: RecordingMetadata): Promise<void> {
    let existing: RecordingMetadata[] = [];
    if (fs.existsSync(this.metadataPath)) {
      const raw = await fs.promises.readFile(this.metadataPath, 'utf-8');
      existing = JSON.parse(raw) as RecordingMetadata[];
    }
    existing.push(metadata);
    await fs.promises.writeFile(this.metadataPath, JSON.stringify(existing, null, 2));
  }
}
