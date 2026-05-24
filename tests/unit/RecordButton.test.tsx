import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordButton } from '@renderer/components/RecordButton';

describe('RecordButton', () => {
  it('deve habilitar "Gravar" e desabilitar "Parar" quando isRecording=false', () => {
    render(<RecordButton isRecording={false} onRecord={jest.fn()} onStop={jest.fn()} />);
    expect(screen.getByRole('button', { name: /iniciar gravação/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /parar gravação/i })).toBeDisabled();
  });

  it('deve desabilitar "Gravar" e habilitar "Parar" quando isRecording=true', () => {
    render(<RecordButton isRecording={true} onRecord={jest.fn()} onStop={jest.fn()} />);
    expect(screen.getByRole('button', { name: /iniciar gravação/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /parar gravação/i })).not.toBeDisabled();
  });

  it('deve chamar onRecord ao clicar em "Gravar"', async () => {
    const onRecord = jest.fn();
    render(<RecordButton isRecording={false} onRecord={onRecord} onStop={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /iniciar gravação/i }));
    expect(onRecord).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onStop ao clicar em "Parar"', async () => {
    const onStop = jest.fn();
    render(<RecordButton isRecording={true} onRecord={jest.fn()} onStop={onStop} />);
    await userEvent.click(screen.getByRole('button', { name: /parar gravação/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar ambos os botões quando disabled=true', () => {
    render(<RecordButton isRecording={false} onRecord={jest.fn()} onStop={jest.fn()} disabled={true} />);
    expect(screen.getByRole('button', { name: /iniciar gravação/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /parar gravação/i })).toBeDisabled();
  });
});
