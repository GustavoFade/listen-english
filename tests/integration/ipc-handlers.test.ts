// Mock do Electron ANTES de qualquer import
const mockHandle = jest.fn();
const mockGetSources = jest.fn();

jest.mock('electron', () => ({
  ipcMain: {
    handle: mockHandle,
  },
  desktopCapturer: {
    getSources: mockGetSources,
  },
}));

import { registerIpcHandlers, IPC_CHANNELS } from '@main/ipc-handlers';
import { RecordingService } from '@main/recordings/RecordingService';
import type { RecordingMetadata } from '@shared/types';

// Helper: extrai o handler registrado para um canal
function getHandler(channel: string): (...args: unknown[]) => Promise<unknown> {
  const call = mockHandle.mock.calls.find((c: unknown[]) => c[0] === channel);
  if (!call) throw new Error(`Handler para "${channel}" não encontrado`);
  return call[1] as (...args: unknown[]) => Promise<unknown>;
}

function makeMockService(overrides: Partial<RecordingService> = {}): jest.Mocked<RecordingService> {
  const meta: RecordingMetadata = {
    id: '2026-05-23_14-30-12',
    fileName: '2026-05-23_14-30-12.webm',
    createdAt: '2026-05-23T14:30:12.000Z',
    durationMs: 5000,
  };
  return {
    save: jest.fn().mockResolvedValue(meta),
    list: jest.fn().mockResolvedValue([meta]),
    getFilePath: jest.fn().mockReturnValue('/fake/path/2026-05-23_14-30-12.webm'),
    delete: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as jest.Mocked<RecordingService>;
}

describe('registerIpcHandlers', () => {
  let service: jest.Mocked<RecordingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = makeMockService();
    registerIpcHandlers(service);
  });

  describe(`Canal "${IPC_CHANNELS.SAVE_RECORDING}"`, () => {
    it('deve chamar service.save com buffer e durationMs quando dados válidos', async () => {
      const handler = getHandler(IPC_CHANNELS.SAVE_RECORDING);
      const buffer = new ArrayBuffer(512);
      const metadata: RecordingMetadata = { id: '', fileName: '', createdAt: '', durationMs: 5000 };
      await handler({}, buffer, metadata);
      expect(service.save).toHaveBeenCalledWith(buffer, 5000);
    });

    it('deve lançar erro quando buffer é null', async () => {
      const handler = getHandler(IPC_CHANNELS.SAVE_RECORDING);
      await expect(handler({}, null, { durationMs: 1000 })).rejects.toThrow(/buffer inválido/i);
    });

    it('deve lançar erro quando metadata não tem durationMs numérico', async () => {
      const handler = getHandler(IPC_CHANNELS.SAVE_RECORDING);
      const buffer = new ArrayBuffer(512);
      await expect(handler({}, buffer, { durationMs: 'invalid' })).rejects.toThrow(/metadados inválidos/i);
    });

    it('deve lançar erro quando metadata é null', async () => {
      const handler = getHandler(IPC_CHANNELS.SAVE_RECORDING);
      const buffer = new ArrayBuffer(512);
      await expect(handler({}, buffer, null)).rejects.toThrow(/metadados inválidos/i);
    });
  });

  describe(`Canal "${IPC_CHANNELS.LIST_RECORDINGS}"`, () => {
    it('deve retornar array de RecordingMetadata via service.list()', async () => {
      const handler = getHandler(IPC_CHANNELS.LIST_RECORDINGS);
      const result = await handler({});
      expect(service.list).toHaveBeenCalledTimes(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe(`Canal "${IPC_CHANNELS.GET_RECORDING_PATH}"`, () => {
    it('deve retornar o caminho via service.getFilePath(id)', async () => {
      const handler = getHandler(IPC_CHANNELS.GET_RECORDING_PATH);
      const result = await handler({}, '2026-05-23_14-30-12');
      expect(service.getFilePath).toHaveBeenCalledWith('2026-05-23_14-30-12');
      expect(result).toContain('.webm');
    });

    it('deve lançar erro quando id é string vazia', async () => {
      const handler = getHandler(IPC_CHANNELS.GET_RECORDING_PATH);
      await expect(handler({}, '')).rejects.toThrow(/id inválido/i);
    });

    it('deve lançar erro quando id não é string', async () => {
      const handler = getHandler(IPC_CHANNELS.GET_RECORDING_PATH);
      await expect(handler({}, null)).rejects.toThrow(/id inválido/i);
    });
  });

  describe(`Canal "${IPC_CHANNELS.GET_DESKTOP_SOURCES}"`, () => {
    it('deve retornar sources mapeados com id e name', async () => {
      mockGetSources.mockResolvedValue([
        { id: 'screen:0:0', name: 'Entire Screen', thumbnail: {}, appIcon: null },
        { id: 'screen:1:0', name: 'Monitor 2', thumbnail: {}, appIcon: null },
      ]);
      const handler = getHandler(IPC_CHANNELS.GET_DESKTOP_SOURCES);
      const result = await handler({}) as { id: string; name: string }[];
      expect(mockGetSources).toHaveBeenCalledWith({ types: ['screen'] });
      expect(result).toEqual([
        { id: 'screen:0:0', name: 'Entire Screen' },
        { id: 'screen:1:0', name: 'Monitor 2' },
      ]);
    });
  });

  describe(`Canal "${IPC_CHANNELS.DELETE_RECORDING}"`, () => {
    it('deve chamar service.delete com o id correto', async () => {
      const handler = getHandler(IPC_CHANNELS.DELETE_RECORDING);
      await handler({}, '2026-05-23_14-30-12');
      expect(service.delete).toHaveBeenCalledWith('2026-05-23_14-30-12');
    });

    it('deve lançar erro quando id é string vazia', async () => {
      const handler = getHandler(IPC_CHANNELS.DELETE_RECORDING);
      await expect(handler({}, '')).rejects.toThrow(/id inválido/i);
    });

    it('deve lançar erro quando id não é string', async () => {
      const handler = getHandler(IPC_CHANNELS.DELETE_RECORDING);
      await expect(handler({}, null)).rejects.toThrow(/id inválido/i);
    });
  });

  describe(`Canal "${IPC_CHANNELS.RENAME_RECORDING}"`, () => {
    it('deve chamar service.rename com id e nome corretos', async () => {
      const handler = getHandler(IPC_CHANNELS.RENAME_RECORDING);
      await handler({}, '2026-05-23_14-30-12', 'Meu Áudio');
      expect(service.rename).toHaveBeenCalledWith('2026-05-23_14-30-12', 'Meu Áudio');
    });

    it('deve lançar erro quando id é string vazia', async () => {
      const handler = getHandler(IPC_CHANNELS.RENAME_RECORDING);
      await expect(handler({}, '', 'Nome')).rejects.toThrow(/id inválido/i);
    });

    it('deve lançar erro quando nome é string vazia', async () => {
      const handler = getHandler(IPC_CHANNELS.RENAME_RECORDING);
      await expect(handler({}, '2026-05-23_14-30-12', '')).rejects.toThrow(/nome inválido/i);
    });

    it('deve lançar erro quando nome não é string', async () => {
      const handler = getHandler(IPC_CHANNELS.RENAME_RECORDING);
      await expect(handler({}, '2026-05-23_14-30-12', null)).rejects.toThrow(/nome inválido/i);
    });
  });
});
