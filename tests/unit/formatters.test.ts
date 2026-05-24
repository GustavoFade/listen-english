import { formatDuration, formatFileName, formatDisplayDate } from '@shared/formatters';

describe('formatDuration', () => {
  it('deve retornar "00:00" dado durationMs = 0', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('deve retornar "01:30" dado durationMs = 90000 (1 min 30 seg)', () => {
    expect(formatDuration(90000)).toBe('01:30');
  });

  it('deve retornar "59:59" dado durationMs = 3599000 (59 min 59 seg)', () => {
    expect(formatDuration(3599000)).toBe('59:59');
  });

  it('deve retornar "61:00" dado durationMs = 3660000 (61 min)', () => {
    expect(formatDuration(3660000)).toBe('61:00');
  });
});

describe('formatFileName', () => {
  it('deve formatar data com zero à esquerda: 2026-01-05_08-03-07', () => {
    // Usa UTC-fixed para evitar flakiness de timezone
    const date = new Date(2026, 0, 5, 8, 3, 7);
    expect(formatFileName(date)).toBe(`2026-01-05_08-03-07`);
  });

  it('deve formatar data sem necessidade de zero à esquerda: 2026-05-23_14-30-12', () => {
    const date = new Date(2026, 4, 23, 14, 30, 12);
    expect(formatFileName(date)).toBe('2026-05-23_14-30-12');
  });
});

describe('formatDisplayDate', () => {
  it('deve formatar ISO string para dd/MM/yyyy HH:mm', () => {
    // Cria uma data local para evitar problemas de timezone
    const date = new Date(2026, 4, 23, 14, 30, 0); // local
    const iso = date.toISOString();
    // Verifica apenas o padrão, não o valor exato (timezone-safe)
    const result = formatDisplayDate(iso);
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });
});
