import { ipcMain, desktopCapturer } from 'electron';
import { RecordingService } from './recordings/RecordingService';
import { RecordingMetadata } from '@shared/types';

export const IPC_CHANNELS = {
  SAVE_RECORDING: 'save-recording',
  LIST_RECORDINGS: 'list-recordings',
  GET_RECORDING_PATH: 'get-recording-path',
  GET_DESKTOP_SOURCES: 'get-desktop-sources',
  DELETE_RECORDING: 'delete-recording',
  RENAME_RECORDING: 'rename-recording',
} as const;

export function registerIpcHandlers(service: RecordingService): void {
  ipcMain.handle(IPC_CHANNELS.SAVE_RECORDING, async (_event, buffer: ArrayBuffer, metadata: RecordingMetadata) => {
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new Error('Buffer inválido recebido via IPC.');
    }
    if (!metadata || typeof metadata.durationMs !== 'number') {
      throw new Error('Metadados inválidos recebidos via IPC.');
    }
    return service.save(buffer, metadata.durationMs);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_RECORDINGS, async () => {
    return service.list();
  });

  ipcMain.handle(IPC_CHANNELS.GET_RECORDING_PATH, async (_event, id: string) => {
    if (!id || typeof id !== 'string') {
      throw new Error('ID inválido recebido via IPC.');
    }
    return service.getFilePath(id);
  });

  ipcMain.handle(IPC_CHANNELS.GET_DESKTOP_SOURCES, async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    return sources.map((s) => ({ id: s.id, name: s.name }));
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_RECORDING, async (_event, id: string) => {
    if (!id || typeof id !== 'string') {
      throw new Error('ID inválido recebido via IPC.');
    }
    return service.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.RENAME_RECORDING, async (_event, id: string, name: string) => {
    if (!id || typeof id !== 'string') {
      throw new Error('ID inválido recebido via IPC.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Nome inválido recebido via IPC.');
    }
    return service.rename(id, name);
  });
}
