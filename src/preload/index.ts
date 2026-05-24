import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './api';
import { IPC_CHANNELS } from '../main/ipc-handlers';

const api: ElectronAPI = {
  saveRecording: (buffer, metadata) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_RECORDING, buffer, metadata),
  listRecordings: () =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_RECORDINGS),
  getRecordingPath: (id) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_RECORDING_PATH, id),
  getDesktopSources: () =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DESKTOP_SOURCES),
  deleteRecording: (id) =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_RECORDING, id),
  renameRecording: (id, name) =>
    ipcRenderer.invoke(IPC_CHANNELS.RENAME_RECORDING, id, name),
};

contextBridge.exposeInMainWorld('electronAPI', api);
