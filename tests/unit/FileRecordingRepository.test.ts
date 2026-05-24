import path from 'path';

// Factory mock: garante que fs.promises também seja mockado corretamente
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

import fs from 'fs';
import { FileRecordingRepository } from '@main/recordings/FileRecordingRepository';
import type { RecordingMetadata } from '@shared/types';
import { AUDIO_EXTENSION, MAX_HISTORY_ITEMS } from '@shared/constants';

// Tipos explícitos para o mock de fs
type FsMock = {
  existsSync: jest.Mock;
  mkdirSync: jest.Mock;
  promises: {
    writeFile: jest.Mock;
    readFile: jest.Mock;
    unlink: jest.Mock;
  };
};

const mockFs = fs as unknown as FsMock;
const mockWriteFile = mockFs.promises.writeFile;
const mockReadFile = mockFs.promises.readFile;
const mockUnlink = mockFs.promises.unlink;

beforeEach(() => {
  jest.clearAllMocks();
  // Reaplica a implementação padrão após clearAllMocks (não limpa implementação, mas garante)
  mockWriteFile.mockResolvedValue(undefined);
  mockUnlink.mockResolvedValue(undefined);
});

const USER_DATA = '/fake/userdata';
const RECORDINGS_PATH = path.join(USER_DATA, 'recordings');
const METADATA_PATH = path.join(RECORDINGS_PATH, 'recordings.json');

function makeMetadata(id: string, createdAt: string): RecordingMetadata {
  return { id, fileName: `${id}.webm`, createdAt, durationMs: 5000 };
}

describe('FileRecordingRepository.save', () => {
  it('deve criar o diretório recordings/ se não existir', async () => {
    mockFs.existsSync.mockReturnValue(false);
    mockReadFile.mockResolvedValue(JSON.stringify([]));

    const repo = new FileRecordingRepository(USER_DATA);
    const meta = makeMetadata('test-id', new Date().toISOString());
    await repo.save(new ArrayBuffer(8), meta);

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(RECORDINGS_PATH, { recursive: true });
  });

  it('deve não criar diretório se ele já existir', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify([]));

    const repo = new FileRecordingRepository(USER_DATA);
    const meta = makeMetadata('test-id', new Date().toISOString());
    await repo.save(new ArrayBuffer(8), meta);

    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
  });

  it('deve chamar fs.writeFile com o caminho correto e os dados do buffer', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify([]));

    const repo = new FileRecordingRepository(USER_DATA);
    const buffer = new ArrayBuffer(8);
    const meta = makeMetadata('my-recording', new Date().toISOString());
    await repo.save(buffer, meta);

    const expectedPath = path.join(RECORDINGS_PATH, meta.fileName);
    expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, Buffer.from(buffer));
  });

  it('deve criar recordings.json com 1 item quando não existe', async () => {
    mockFs.existsSync
      .mockReturnValueOnce(true)  // diretório existe
      .mockReturnValueOnce(false); // metadata file não existe

    const repo = new FileRecordingRepository(USER_DATA);
    const meta = makeMetadata('new-id', new Date().toISOString());
    await repo.save(new ArrayBuffer(4), meta);

    const calls = mockWriteFile.mock.calls as unknown[][];
    const metaCall = calls.find((c) => (c[0] as string) === METADATA_PATH);
    expect(metaCall).toBeDefined();
    const written = JSON.parse(metaCall![1] as string) as RecordingMetadata[];
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe('new-id');
  });

  it('deve adicionar ao recordings.json existente com 1 item', async () => {
    const existing = [makeMetadata('old-id', '2026-01-01T00:00:00.000Z')];
    mockFs.existsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(existing));

    const repo = new FileRecordingRepository(USER_DATA);
    const newMeta = makeMetadata('new-id', new Date().toISOString());
    await repo.save(new ArrayBuffer(4), newMeta);

    const calls = mockWriteFile.mock.calls as unknown[][];
    const metaCall = calls.find((c) => (c[0] as string) === METADATA_PATH);
    const written = JSON.parse(metaCall![1] as string) as RecordingMetadata[];
    expect(written).toHaveLength(2);
  });
});

describe('FileRecordingRepository.list', () => {
  it('deve retornar array vazio quando recordings.json não existe', async () => {
    mockFs.existsSync.mockReturnValue(false);

    const repo = new FileRecordingRepository(USER_DATA);
    const result = await repo.list();
    expect(result).toEqual([]);
  });

  it('deve retornar gravações ordenadas da mais recente para a mais antiga', async () => {
    const data: RecordingMetadata[] = [
      makeMetadata('old', '2026-01-01T00:00:00.000Z'),
      makeMetadata('new', '2026-06-01T00:00:00.000Z'),
      makeMetadata('mid', '2026-03-15T00:00:00.000Z'),
    ];
    mockFs.existsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(data));

    const repo = new FileRecordingRepository(USER_DATA);
    const result = await repo.list();

    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('mid');
    expect(result[2].id).toBe('old');
  });

  it(`deve retornar no máximo ${MAX_HISTORY_ITEMS} itens quando há mais de 50`, async () => {
    const data: RecordingMetadata[] = Array.from({ length: 60 }, (_, i) =>
      makeMetadata(`id-${i}`, new Date(2026, 0, i + 1).toISOString())
    );
    mockFs.existsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(data));

    const repo = new FileRecordingRepository(USER_DATA);
    const result = await repo.list();
    expect(result).toHaveLength(MAX_HISTORY_ITEMS);
  });
});

describe('FileRecordingRepository.getFilePath', () => {
  it('deve retornar caminho completo terminando em <id>.webm', () => {
    const repo = new FileRecordingRepository(USER_DATA);
    const result = repo.getFilePath('abc123');
    expect(result).toBe(path.join(RECORDINGS_PATH, `abc123${AUDIO_EXTENSION}`));
  });
});

describe('FileRecordingRepository.delete', () => {
  it('deve chamar fs.unlink com o caminho correto quando o arquivo existe', async () => {
    const id = '2026-05-23_14-30-12';
    const expectedFilePath = path.join(RECORDINGS_PATH, `${id}${AUDIO_EXTENSION}`);
    mockFs.existsSync
      .mockReturnValueOnce(true)  // arquivo existe
      .mockReturnValueOnce(true); // metadata existe
    const existing = [makeMetadata(id, '2026-05-23T14:30:12.000Z'), makeMetadata('other-id', '2026-01-01T00:00:00.000Z')];
    mockReadFile.mockResolvedValue(JSON.stringify(existing));

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.delete(id);

    expect(mockUnlink).toHaveBeenCalledWith(expectedFilePath);
  });

  it('deve não chamar fs.unlink quando o arquivo não existe', async () => {
    mockFs.existsSync
      .mockReturnValueOnce(false) // arquivo não existe
      .mockReturnValueOnce(true); // metadata existe
    mockReadFile.mockResolvedValue(JSON.stringify([makeMetadata('id', '2026-01-01T00:00:00.000Z')]));

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.delete('id');

    expect(mockUnlink).not.toHaveBeenCalled();
  });

  it('deve remover o item correto do recordings.json', async () => {
    const id = 'target-id';
    mockFs.existsSync.mockReturnValue(true);
    const existing = [
      makeMetadata(id, '2026-05-23T14:30:12.000Z'),
      makeMetadata('other-id', '2026-01-01T00:00:00.000Z'),
    ];
    mockReadFile.mockResolvedValue(JSON.stringify(existing));

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.delete(id);

    const calls = mockWriteFile.mock.calls as unknown[][];
    const metaCall = calls.find((c) => (c[0] as string) === METADATA_PATH);
    expect(metaCall).toBeDefined();
    const written = JSON.parse(metaCall![1] as string) as RecordingMetadata[];
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe('other-id');
  });

  it('deve não escrever no metadata quando recordings.json não existe', async () => {
    mockFs.existsSync
      .mockReturnValueOnce(false) // arquivo não existe
      .mockReturnValueOnce(false); // metadata não existe

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.delete('some-id');

    const calls = mockWriteFile.mock.calls as unknown[][];
    const metaCall = calls.find((c) => (c[0] as string) === METADATA_PATH);
    expect(metaCall).toBeUndefined();
  });
});

describe('FileRecordingRepository.rename', () => {
  it('deve atualizar o campo name no recordings.json', async () => {
    mockFs.existsSync.mockReturnValue(true);
    const existing = [makeMetadata('r1', '2026-05-23T14:30:12.000Z')];
    mockReadFile.mockResolvedValue(JSON.stringify(existing));

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.rename('r1', 'Meu Áudio');

    const calls = mockWriteFile.mock.calls as unknown[][];
    const metaCall = calls.find((c) => (c[0] as string) === METADATA_PATH);
    expect(metaCall).toBeDefined();
    const written = JSON.parse(metaCall![1] as string) as RecordingMetadata[];
    expect(written[0].name).toBe('Meu Áudio');
  });

  it('deve não modificar outros itens ao renomear um específico', async () => {
    mockFs.existsSync.mockReturnValue(true);
    const existing = [
      makeMetadata('r1', '2026-05-23T14:30:12.000Z'),
      makeMetadata('r2', '2026-01-01T00:00:00.000Z'),
    ];
    mockReadFile.mockResolvedValue(JSON.stringify(existing));

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.rename('r1', 'Novo Nome');

    const calls = mockWriteFile.mock.calls as unknown[][];
    const metaCall = calls.find((c) => (c[0] as string) === METADATA_PATH);
    const written = JSON.parse(metaCall![1] as string) as RecordingMetadata[];
    expect(written[0].name).toBe('Novo Nome');
    expect(written[1].name).toBeUndefined();
  });

  it('deve não escrever quando recordings.json não existe', async () => {
    mockFs.existsSync.mockReturnValue(false);

    const repo = new FileRecordingRepository(USER_DATA);
    await repo.rename('r1', 'Nome');

    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
