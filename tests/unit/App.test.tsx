import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@renderer/App';
import type { RecordingMetadata } from '@shared/types';

// window.electronAPI está mockado em tests/setup.ts

function makeRecording(id: string): RecordingMetadata {
  return { id, fileName: `${id}.webm`, createdAt: new Date().toISOString(), durationMs: 5000 };
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.electronAPI.listRecordings as jest.Mock).mockResolvedValue([]);
    (window.electronAPI.saveRecording as jest.Mock).mockResolvedValue({} as RecordingMetadata);
    (window.electronAPI.getRecordingPath as jest.Mock).mockResolvedValue('/fake/path/rec.webm');
  });

  it('deve chamar listRecordings ao montar e exibir "Nenhuma gravação ainda."', async () => {
    render(<App />);
    await waitFor(() => {
      expect(window.electronAPI.listRecordings).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/nenhuma gravação ainda/i)).toBeInTheDocument();
  });

  it('deve exibir erro quando listRecordings falha', async () => {
    (window.electronAPI.listRecordings as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('deve exibir 2 gravações na lista após carregar', async () => {
    const recordings = [makeRecording('r1'), makeRecording('r2')];
    (window.electronAPI.listRecordings as jest.Mock).mockResolvedValue(recordings);
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });

  it('deve chamar saveRecording e atualizar lista após ciclo completo de gravação', async () => {
    const recording = makeRecording('r1');
    (window.electronAPI.saveRecording as jest.Mock).mockResolvedValue(recording);
    (window.electronAPI.listRecordings as jest.Mock)
      .mockResolvedValueOnce([])      // mount
      .mockResolvedValueOnce([recording]); // após salvar

    render(<App />);
    await waitFor(() => expect(window.electronAPI.listRecordings).toHaveBeenCalledTimes(1));

    // Clica em Gravar
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /iniciar gravação/i }));
    });

    // Clica em Parar
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /parar gravação/i }));
    });

    await waitFor(() => {
      expect(window.electronAPI.saveRecording).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.listRecordings).toHaveBeenCalledTimes(2);
    });
  });

  it('deve exibir erro de salvamento quando saveRecording falha', async () => {
    (window.electronAPI.saveRecording as jest.Mock).mockRejectedValue(new Error('Disk full'));

    render(<App />);
    await waitFor(() => expect(window.electronAPI.listRecordings).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /iniciar gravação/i }));
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /parar gravação/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('deve chamar getRecordingPath ao clicar em Play', async () => {
    const recording = makeRecording('r1');
    (window.electronAPI.listRecordings as jest.Mock).mockResolvedValue([recording]);

    // Mock HTMLAudioElement
    const mockPlay = jest.fn().mockResolvedValue(undefined);
    const mockAudio = { play: mockPlay, pause: jest.fn(), onended: null as (() => void) | null };
    global.Audio = jest.fn().mockImplementation(() => mockAudio) as unknown as typeof Audio;

    render(<App />);
    await waitFor(() => screen.getAllByRole('listitem'));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    });

    await waitFor(() => {
      expect(window.electronAPI.getRecordingPath).toHaveBeenCalledWith('r1');
    });
  });

  it('deve pausar áudio atual ao clicar em Play em outra gravação', async () => {
    const recordings = [makeRecording('r1'), makeRecording('r2')];
    (window.electronAPI.listRecordings as jest.Mock).mockResolvedValue(recordings);

    const mockPause = jest.fn();
    const mockPlay = jest.fn().mockResolvedValue(undefined);
    const mockAudio = { play: mockPlay, pause: mockPause, onended: null as (() => void) | null };
    global.Audio = jest.fn().mockImplementation(() => mockAudio) as unknown as typeof Audio;

    render(<App />);
    await waitFor(() => screen.getAllByRole('listitem'));

    // Play r1
    const playButtons = screen.getAllByRole('button', { name: /reproduzir/i });
    await act(async () => {
      await userEvent.click(playButtons[0]);
    });
    await waitFor(() => expect(window.electronAPI.getRecordingPath).toHaveBeenCalledWith('r1'));

    // Play r2 while r1 is playing — should pause r1 first
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    });
    await waitFor(() => {
      expect(mockPause).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.getRecordingPath).toHaveBeenCalledWith('r2');
    });
  });

  it('deve pausar reprodução ao clicar em Pausa', async () => {
    const recording = makeRecording('r1');
    (window.electronAPI.listRecordings as jest.Mock).mockResolvedValue([recording]);

    const mockPause = jest.fn();
    const mockPlay = jest.fn().mockResolvedValue(undefined);
    const mockAudio = { play: mockPlay, pause: mockPause, onended: null as (() => void) | null };
    global.Audio = jest.fn().mockImplementation(() => mockAudio) as unknown as typeof Audio;

    render(<App />);
    await waitFor(() => screen.getAllByRole('listitem'));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    });
    await waitFor(() => screen.getByRole('button', { name: /pausar/i }));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /pausar/i }));
    });

    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('deve limpar playingId quando áudio termina (onended)', async () => {
    const recording = makeRecording('r1');
    (window.electronAPI.listRecordings as jest.Mock).mockResolvedValue([recording]);

    const mockPlay = jest.fn().mockResolvedValue(undefined);
    const mockAudio = { play: mockPlay, pause: jest.fn(), onended: null as (() => void) | null };
    global.Audio = jest.fn().mockImplementation(() => mockAudio) as unknown as typeof Audio;

    render(<App />);
    await waitFor(() => screen.getAllByRole('listitem'));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    });
    await waitFor(() => screen.getByRole('button', { name: /pausar/i }));

    // Trigger the onended callback set by handlePlay
    await act(async () => {
      mockAudio.onended?.();
    });

    // After onended fires, playingId resets and Play button shows again
    await waitFor(() => screen.getByRole('button', { name: /reproduzir/i }));
  });
});
