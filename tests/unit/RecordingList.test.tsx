import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordingList } from '@renderer/components/RecordingList';
import type { RecordingMetadata } from '@shared/types';
import { MAX_HISTORY_ITEMS } from '@shared/constants';

function makeRecording(id: string, createdAt = new Date().toISOString(), durationMs = 90000): RecordingMetadata {
  return { id, fileName: `${id}.webm`, createdAt, durationMs };
}

const defaultProps = {
  playingId: null,
  onPlay: jest.fn(),
  onPause: jest.fn(),
  onDelete: jest.fn(),
  onRename: jest.fn(),
};

describe('RecordingList', () => {
  it('deve exibir "Nenhuma gravação ainda." quando recordings = []', () => {
    render(<RecordingList recordings={[]} {...defaultProps} />);
    expect(screen.getByText(/nenhuma gravação ainda/i)).toBeInTheDocument();
  });

  it('deve exibir data e duração formatada para cada item', () => {
    const recordings = [makeRecording('r1', '2026-05-23T14:30:00.000Z', 90000)];
    render(<RecordingList recordings={recordings} {...defaultProps} />);
    // Duração 90000ms = 01:30
    expect(screen.getByText(/01:30/)).toBeInTheDocument();
  });

  it('deve exibir botão "▶ Play" quando playingId é null', () => {
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} />);
    expect(screen.getByRole('button', { name: /reproduzir/i })).toBeInTheDocument();
  });

  it('deve exibir botão "⏸ Pausa" para o item com playingId ativo', () => {
    const recordings = [makeRecording('r1'), makeRecording('r2')];
    render(<RecordingList recordings={recordings} {...defaultProps} playingId="r1" />);
    expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
    // O outro item ainda tem Play
    expect(screen.getByRole('button', { name: /reproduzir/i })).toBeInTheDocument();
  });

  it('deve chamar onPlay com o id correto ao clicar em Play', async () => {
    const onPlay = jest.fn();
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} onPlay={onPlay} />);
    await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    expect(onPlay).toHaveBeenCalledWith('r1');
  });

  it('deve chamar onPause ao clicar em Pausa', async () => {
    const onPause = jest.fn();
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} playingId="r1" onPause={onPause} />);
    await userEvent.click(screen.getByRole('button', { name: /pausar/i }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it(`deve renderizar no máximo ${MAX_HISTORY_ITEMS} itens quando há 55 gravações`, () => {
    const recordings = Array.from({ length: 55 }, (_, i) => makeRecording(`r${i}`));
    render(<RecordingList recordings={recordings} {...defaultProps} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(MAX_HISTORY_ITEMS);
  });

  it('deve exibir botões Renomear e Excluir para cada item', () => {
    const recordings = [makeRecording('r1'), makeRecording('r2')];
    render(<RecordingList recordings={recordings} {...defaultProps} />);
    expect(screen.getAllByRole('button', { name: /excluir/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /renomear/i })).toHaveLength(2);
  });

  it('deve chamar onDelete com o id correto ao clicar em Excluir', async () => {
    const onDelete = jest.fn();
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /excluir/i }));
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('deve exibir input de renomeação ao clicar em Renomear', async () => {
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /renomear/i }));
    expect(screen.getByRole('textbox', { name: /novo nome/i })).toBeInTheDocument();
  });

  it('deve chamar onRename com o novo nome ao pressionar Enter', async () => {
    const onRename = jest.fn();
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} onRename={onRename} />);
    await userEvent.click(screen.getByRole('button', { name: /renomear/i }));
    const input = screen.getByRole('textbox', { name: /novo nome/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Minha gravação{Enter}');
    expect(onRename).toHaveBeenCalledWith('r1', 'Minha gravação');
  });

  it('deve cancelar renomeação ao pressionar Escape sem chamar onRename', async () => {
    const onRename = jest.fn();
    const recordings = [makeRecording('r1')];
    render(<RecordingList recordings={recordings} {...defaultProps} onRename={onRename} />);
    await userEvent.click(screen.getByRole('button', { name: /renomear/i }));
    await userEvent.keyboard('{Escape}');
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: /novo nome/i })).not.toBeInTheDocument();
  });

  it('deve exibir o name customizado quando definido', () => {
    const recordings = [{ ...makeRecording('r1'), name: 'Áudio especial' }];
    render(<RecordingList recordings={recordings} {...defaultProps} />);
    expect(screen.getByText(/Áudio especial/)).toBeInTheDocument();
  });
});
