import { BrowserWindow, screen } from 'electron';
import path from 'path';

export interface WindowConfig {
  width: number;
  height: number;
}

export const WINDOW_CONFIG: WindowConfig = { width: 320, height: 120 };

export function createMainWindow(): BrowserWindow {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: WINDOW_CONFIG.width,
    height: WINDOW_CONFIG.height,
    x: screenWidth - WINDOW_CONFIG.width - 16,
    y: 16,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return win;
}
