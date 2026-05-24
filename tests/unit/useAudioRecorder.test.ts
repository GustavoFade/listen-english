import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '@renderer/hooks/useAudioRecorder';

// Mocks globais em tests/setup.ts (MediaRecorder, getUserMedia, AudioContext, electronAPI)

function makeStream() {
  const trackStop = jest.fn();
  const track = { stop: trackStop };
  return {
    _trackStop: trackStop,
    getVideoTracks: jest.fn().mockReturnValue([track]),
    getAudioTracks: jest.fn().mockReturnValue([track]),
    getTracks: jest.fn().mockReturnValue([track]),
  };
}

describe('useAudioRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaura mocks padrão após clearAllMocks
    (window.electronAPI.getDesktopSources as jest.Mock).mockResolvedValue([
      { id: 'screen:0:0', name: 'Entire Screen' },
    ]);
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(makeStream());
  });

  it('deve ter isRecording=false e error=null no estado inicial', () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve chamar getDesktopSources e getUserMedia duas vezes ao chamar start()', async () => {
    const desktopStream = makeStream();
    const micStream = makeStream();
    (navigator.mediaDevices.getUserMedia as jest.Mock)
      .mockResolvedValueOnce(desktopStream)
      .mockResolvedValueOnce(micStream);

    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => { await result.current.start(); });

    expect(window.electronAPI.getDesktopSources).toHaveBeenCalledTimes(1);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    // primeira chamada contém chromeMediaSource (desktop)
    const firstCall = (navigator.mediaDevices.getUserMedia as jest.Mock).mock.calls[0][0];
    expect((firstCall.audio as Record<string, unknown>).mandatory).toMatchObject({
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: 'screen:0:0',
    });
    // segunda chamada é o microfone
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenNthCalledWith(2, { audio: true });
  });

  it('deve definir isRecording=true após start()', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => { await result.current.start(); });
    expect(result.current.isRecording).toBe(true);
  });

  it('deve parar as video tracks do stream de desktop imediatamente em start()', async () => {
    const desktopStream = makeStream();
    const micStream = makeStream();
    (navigator.mediaDevices.getUserMedia as jest.Mock)
      .mockResolvedValueOnce(desktopStream)
      .mockResolvedValueOnce(micStream);

    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => { await result.current.start(); });

    expect(desktopStream.getVideoTracks).toHaveBeenCalled();
    expect(desktopStream._trackStop).toHaveBeenCalled();
    // tracks do mic NÃO devem ter sido paradas durante start
    expect(micStream._trackStop).not.toHaveBeenCalled();
  });

  it('deve retornar Blob com type "audio/webm" ao chamar stop()', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => { await result.current.start(); });

    let blob: Blob | undefined;
    await act(async () => { blob = await result.current.stop(); });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob!.type).toBe('audio/webm');
    expect(result.current.isRecording).toBe(false);
  });

  it('deve parar tracks de desktop e mic e fechar AudioContext ao chamar stop()', async () => {
    const desktopStream = makeStream();
    const micStream = makeStream();
    (navigator.mediaDevices.getUserMedia as jest.Mock)
      .mockResolvedValueOnce(desktopStream)
      .mockResolvedValueOnce(micStream);

    const closeMock = jest.fn();
    // Substitui AudioContext para capturar a instância criada pelo hook
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).AudioContext = jest.fn().mockImplementation(() => ({
      close: closeMock,
      createMediaStreamSource: jest.fn().mockReturnValue({ connect: jest.fn() }),
      createMediaStreamDestination: jest.fn().mockReturnValue({ stream: makeStream() }),
    }));

    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.stop(); });

    expect(desktopStream.getTracks).toHaveBeenCalled();
    expect(micStream.getTracks).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('deve definir error e relançar quando getDesktopSources retorna lista vazia', async () => {
    (window.electronAPI.getDesktopSources as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await expect(result.current.start()).rejects.toThrow(/fonte de áudio/i);
    });

    expect(result.current.error).toMatch(/fonte de áudio/i);
  });

  it('deve definir error e relançar quando getUserMedia falha', async () => {
    const error = new Error('NotAllowedError: Permission denied');
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await expect(result.current.start()).rejects.toThrow('NotAllowedError');
    });

    expect(result.current.error).toBe('NotAllowedError: Permission denied');
  });
});
