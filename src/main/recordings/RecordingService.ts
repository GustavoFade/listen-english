import { IRecordingRepository, RecordingMetadata } from '@shared/types';
import { AUDIO_EXTENSION } from '@shared/constants';
import { formatFileName } from '@shared/formatters';

export class RecordingService {
  constructor(private readonly repository: IRecordingRepository) {}

  async save(audioBuffer: ArrayBuffer, durationMs: number): Promise<RecordingMetadata> {
    if (audioBuffer.byteLength === 0) {
      throw new Error('O buffer de áudio está vazio. Nenhuma gravação foi salva.');
    }

    const now = new Date();
    const id = formatFileName(now);
    const fileName = `${id}${AUDIO_EXTENSION}`;
    const metadata: RecordingMetadata = {
      id,
      fileName,
      createdAt: now.toISOString(),
      durationMs,
    };

    await this.repository.save(audioBuffer, metadata);
    return metadata;
  }

  async list(): Promise<RecordingMetadata[]> {
    return this.repository.list();
  }

  getFilePath(id: string): string {
    return this.repository.getFilePath(id);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async rename(id: string, name: string): Promise<void> {
    return this.repository.rename(id, name);
  }
}
