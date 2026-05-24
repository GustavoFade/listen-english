import { app } from 'electron';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipc-handlers';
import { RecordingService } from './recordings/RecordingService';
import { FileRecordingRepository } from './recordings/FileRecordingRepository';

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  const repository = new FileRecordingRepository(userDataPath);
  const service = new RecordingService(repository);

  registerIpcHandlers(service);
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
