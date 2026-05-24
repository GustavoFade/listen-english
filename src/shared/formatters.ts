/**
 * Formata duração em milissegundos para o padrão mm:ss.
 * Exemplo: 90000 → "01:30"
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formata uma data para o padrão de nome de arquivo YYYY-MM-DD_HH-mm-ss.
 * Exemplo: new Date(2026, 4, 23, 14, 30, 12) → "2026-05-23_14-30-12"
 */
export function formatFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year  = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day   = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins  = pad(date.getMinutes());
  const secs  = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${mins}-${secs}`;
}

/**
 * Formata uma string ISO 8601 para exibição localizada: dd/MM/yyyy HH:mm.
 */
export function formatDisplayDate(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
