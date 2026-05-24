import { RecordingService } from '@main/recordings/RecordingService';
import type { IRecordingRepository, RecordingMetadata } from '@shared/types';
import { AUDIO_EXTENSION } from '@shared/constants';

function makeMockRepository(overrides: Partial<IRecordingRepository> = {}): jest.Mocked<IRecordingRepository> {
  return {
    save: jest.fn().mockResolvedValue('/fake/path/recording.webm'),
    list: jest.fn().mockResolvedValue([]),
    getFilePath: jest.fn().mockReturnValue('/fake/path/recording.webm'),
    delete: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<IRecordingRepository>;
}

describe('RecordingService.save', () => {
  it('deve lançar erro quando buffer está vazio (0 bytes)', async () => {
    const repo = makeMockRepository();
    const service = new RecordingService(repo);
    await expect(service.save(new ArrayBuffer(0), 1000)).rejects.toThrow(/buffer/i);
  });

  it('deve gerar fileName no formato YYYY-MM-DD_HH-mm-ss.webm', async () => {
    const repo = makeMockRepository();
    const service = new RecordingService(repo);
    const result = await service.save(new ArrayBuffer(512), 5000);
    // Formato: YYYY-MM-DD_HH-mm-ss.webm
    expect(result.fileName).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.webm$/);
  });

  it('deve chamar repository.save exatamente uma vez com os parâmetros corretos', async () => {
    const repo = makeMockRepository();
    const service = new RecordingService(repo);
    const buffer = new ArrayBuffer(1024);
    await service.save(buffer, 5000);
    expect(repo.save).toHaveBeenCalledTimes(1);
    const [calledBuffer, calledMeta] = repo.save.mock.calls[0] as [ArrayBuffer, RecordingMetadata];
    expect(calledBuffer).toBe(buffer);
    expect(calledMeta.durationMs).toBe(5000);
  });

  it('deve retornar RecordingMetadata com id, fileName, createdAt ISO e durationMs correto', async () => {
    const repo = makeMockRepository();
    const service = new RecordingService(repo);
    const result = await service.save(new ArrayBuffer(1024), 30000);
    expect(result.id).toBeTruthy();
    expect(result.fileName).toContain(AUDIO_EXTENSION);
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.durationMs).toBe(30000);
  });
});

describe('RecordingService.list', () => {
  it('deve retornar o resultado de repository.list()', async () => {
    const recordings: RecordingMetadata[] = [
      { id: 'a', fileName: 'a.webm', createdAt: new Date().toISOString(), durationMs: 1000 },
      { id: 'b', fileName: 'b.webm', createdAt: new Date().toISOString(), durationMs: 2000 },
      { id: 'c', fileName: 'c.webm', createdAt: new Date().toISOString(), durationMs: 3000 },
    ];
    const repo = makeMockRepository({ list: jest.fn().mockResolvedValue(recordings) });
    const service = new RecordingService(repo);
    const result = await service.list();
    expect(result).toEqual(recordings);
    expect(repo.list).toHaveBeenCalledTimes(1);
  });
});

describe('RecordingService.getFilePath', () => {
  it('deve retornar o resultado de repository.getFilePath(id)', () => {
    const expectedPath = '/fake/path/2026-05-23_14-30-12.webm';
    const repo = makeMockRepository({ getFilePath: jest.fn().mockReturnValue(expectedPath) });
    const service = new RecordingService(repo);
    const result = service.getFilePath('2026-05-23_14-30-12');
    expect(result).toBe(expectedPath);
    expect(repo.getFilePath).toHaveBeenCalledWith('2026-05-23_14-30-12');
  });
});

describe('RecordingService.delete', () => {
  it('deve delegar a chamada ao repository.delete(id)', async () => {
    const repo = makeMockRepository();
    const service = new RecordingService(repo);
    await service.delete('abc');
    expect(repo.delete).toHaveBeenCalledWith('abc');
  });
});

describe('RecordingService.rename', () => {
  it('deve delegar a chamada ao repository.rename(id, name)', async () => {
    const repo = makeMockRepository();
    const service = new RecordingService(repo);
    await service.rename('abc', 'Novo Nome');
    expect(repo.rename).toHaveBeenCalledWith('abc', 'Novo Nome');
  });
});
