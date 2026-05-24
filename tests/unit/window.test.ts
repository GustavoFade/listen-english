// Mock do módulo electron ANTES de qualquer import
const mockBrowserWindow = jest.fn();
const mockGetPrimaryDisplay = jest.fn();

jest.mock('electron', () => ({
  BrowserWindow: mockBrowserWindow,
  screen: {
    getPrimaryDisplay: mockGetPrimaryDisplay,
  },
}));

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));

import { createMainWindow, WINDOW_CONFIG } from '@main/window';

const mockLoadURL = jest.fn();
const mockLoadFile = jest.fn();

describe('WINDOW_CONFIG', () => {
  it('deve ter width = 320 e height = 120', () => {
    expect(WINDOW_CONFIG.width).toBe(320);
    expect(WINDOW_CONFIG.height).toBe(120);
  });
});

describe('createMainWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env['ELECTRON_RENDERER_URL'];
    mockGetPrimaryDisplay.mockReturnValue({
      workAreaSize: { width: 1920, height: 1080 },
    });
    mockBrowserWindow.mockImplementation((opts: unknown) => ({
      _opts: opts,
      loadURL: mockLoadURL,
      loadFile: mockLoadFile,
    }));
  });

  it('deve criar BrowserWindow com resizable: false e alwaysOnTop: true', () => {
    createMainWindow();
    expect(mockBrowserWindow).toHaveBeenCalledTimes(1);
    const opts = mockBrowserWindow.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.resizable).toBe(false);
    expect(opts.alwaysOnTop).toBe(true);
  });

  it('deve posicionar a janela no canto superior direito (x = screenWidth - 320 - 16)', () => {
    createMainWindow();
    const opts = mockBrowserWindow.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.x).toBe(1920 - 320 - 16);
    expect(opts.y).toBe(16);
  });

  it('deve habilitar contextIsolation e desabilitar nodeIntegration e sandbox', () => {
    createMainWindow();
    const opts = mockBrowserWindow.mock.calls[0][0] as Record<string, unknown>;
    const webPrefs = opts.webPreferences as Record<string, unknown>;
    expect(webPrefs.contextIsolation).toBe(true);
    expect(webPrefs.nodeIntegration).toBe(false);
    expect(webPrefs.sandbox).toBe(true);
  });

  it('deve criar janela com dimensões 320x120', () => {
    createMainWindow();
    const opts = mockBrowserWindow.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.width).toBe(320);
    expect(opts.height).toBe(120);
  });

  it('deve chamar loadURL com ELECTRON_RENDERER_URL quando em modo dev', () => {
    process.env['ELECTRON_RENDERER_URL'] = 'http://localhost:5173/';
    createMainWindow();
    expect(mockLoadURL).toHaveBeenCalledWith('http://localhost:5173/');
    expect(mockLoadFile).not.toHaveBeenCalled();
  });

  it('deve chamar loadFile com caminho do index.html quando em modo produção', () => {
    createMainWindow();
    expect(mockLoadFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));
    expect(mockLoadURL).not.toHaveBeenCalled();
  });
});
