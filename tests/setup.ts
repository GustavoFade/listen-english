import '@testing-library/jest-dom';

// Polyfill Blob.prototype.arrayBuffer for jsdom environment (jsdom 20 lacks this method)
if (typeof (Blob.prototype as unknown as Record<string, unknown>).arrayBuffer !== 'function') {
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    value: function (this: Blob): Promise<ArrayBuffer> {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    },
    writable: true,
    configurable: true,
  });
}

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: {
    saveRecording: jest.fn(),
    listRecordings: jest.fn().mockResolvedValue([]),
    getRecordingPath: jest.fn().mockResolvedValue(''),
    deleteRecording: jest.fn().mockResolvedValue(undefined),
    renameRecording: jest.fn().mockResolvedValue(undefined),
    getDesktopSources: jest.fn().mockResolvedValue([{ id: 'screen:0:0', name: 'Entire Screen' }]),
  },
});

// Mock MediaRecorder
class MockMediaRecorder {
  state: string = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start = jest.fn(() => { this.state = 'recording'; });
  stop = jest.fn(() => {
    this.state = 'inactive';
    // Fire ondataavailable with a non-empty chunk and an empty chunk to cover both branches
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    this.ondataavailable?.({ data: new Blob([], { type: 'audio/webm' }) });
    // Call onstop asynchronously so resolveStopRef is set before it fires
    Promise.resolve().then(() => this.onstop?.());
  });
  static isTypeSupported = jest.fn().mockReturnValue(true);
}
(global as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder = MockMediaRecorder;

// Mock navigator.mediaDevices.getUserMedia
function makeMockStream() {
  const trackStop = jest.fn();
  const track = { stop: trackStop };
  return {
    getVideoTracks: jest.fn().mockReturnValue([track]),
    getAudioTracks: jest.fn().mockReturnValue([track]),
    getTracks: jest.fn().mockReturnValue([track]),
  };
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(makeMockStream()),
  },
});

// Mock AudioContext
class MockAudioContext {
  createMediaStreamSource = jest.fn().mockReturnValue({ connect: jest.fn() });
  createMediaStreamDestination = jest.fn().mockReturnValue({ stream: makeMockStream() });
  close = jest.fn();
}
(global as unknown as Record<string, unknown>).AudioContext = MockAudioContext;
