# Plano de Desenvolvimento — Listen English

**Baseado em:** PRD v1.0.0  
**Stack:** Electron 42 + TypeScript 6 + Vite 8 + electron-vite 5  
**Node:** 22.5.1 LTS | **npm:** 10.8.2  
**Cobertura de testes:** 100% (linhas, funções, branches, statements)

---

## Convenções do Plano

### Tipos de Gates

| Sigla | Tipo | Comando padrão |
|-------|------|---------------|
| `[GATE-NPM]` | Verificação de instalação npm | `npm ls <pacote>` |
| `[GATE-TS]` | Verificação de sintaxe TypeScript | `npx tsc --noEmit` |
| `[GATE-TEST]` | Execução de testes da atividade | `npx jest <arquivo>` |
| `[GATE-COV]` | Cobertura 100% do módulo | `npx jest <arquivo> --coverage` |
| `[GATE-BUILD]` | Build sem erros | `npm run build` |

### Critério de Conclusão de Atividade

Uma atividade está **concluída** somente quando **todos os gates passam sem erros**.  
Atividades com testes estão **concluídas** somente quando os testes passam **e** a cobertura é **100%** no módulo.

### Formato BDD dos Testes

Cada cenário de teste segue a estrutura:
```
Cenário: [Nome do cenário]
  Dado  [contexto inicial]
  Quando [ação executada]
  Então [resultado esperado]
```

Mapeado para Jest como:
```typescript
describe('NomeDoModulo', () => {
  it('deve [resultado] quando [ação] dado [contexto]', () => { ... });
});
```

---

## Dependências Adicionais ao PRD

Para atingir cobertura 100% incluindo renderer e hooks:

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `react` | `^19.1.0` | Runtime do renderer |
| `react-dom` | `^19.1.0` | Mount do renderer |
| `@types/react` | `^19.1.6` | Tipos TypeScript para React |
| `@types/react-dom` | `^19.1.5` | Tipos TypeScript para ReactDOM |
| `@testing-library/react` | `^16.3.0` | Testes de componentes React |
| `@testing-library/user-event` | `^14.6.1` | Simulação de eventos do usuário |
| `@testing-library/jest-dom` | `^6.6.3` | Matchers customizados para DOM |
| `@types/testing-library__jest-dom` | `^5.14.9` | Tipos para jest-dom |

---

## Mapa de Cobertura

| Arquivo | Testado por | Cobertura alvo |
|---------|------------|----------------|
| `src/shared/types.ts` | (tipos — sem lógica) | N/A |
| `src/shared/constants.ts` | (constantes — sem lógica) | N/A |
| `src/shared/formatters.ts` | `tests/unit/formatters.test.ts` | 100% |
| `src/main/recordings/FileRecordingRepository.ts` | `tests/unit/FileRecordingRepository.test.ts` | 100% |
| `src/main/recordings/RecordingService.ts` | `tests/unit/RecordingService.test.ts` | 100% |
| `src/main/ipc-handlers.ts` | `tests/integration/ipc-handlers.test.ts` | 100% |
| `src/main/window.ts` | `tests/unit/window.test.ts` | 100% |
| `src/preload/api.ts` | (tipos — sem lógica) | N/A |
| `src/renderer/hooks/useAudioRecorder.ts` | `tests/unit/useAudioRecorder.test.ts` | 100% |
| `src/renderer/components/RecordButton.tsx` | `tests/unit/RecordButton.test.tsx` | 100% |
| `src/renderer/components/RecordingList.tsx` | `tests/unit/RecordingList.test.tsx` | 100% |
| `src/renderer/App.tsx` | `tests/unit/App.test.tsx` | 100% |
| `src/main/main.ts` | excluído¹ | — |
| `src/preload/index.ts` | excluído¹ | — |
| `src/renderer/main.tsx` | excluído¹ | — |

> ¹ Entry points e bridge do contextBridge são boilerplate Electron sem lógica de negócio testável de forma isolada. Cobertos por testes manuais de fumaça (smoke test).

---

## Fase 1: Bootstrap do Projeto

### Atividade 1.1 — Inicializar o projeto npm

**Objetivo:** Criar `package.json` com a configuração exata do PRD (seção 12).

**Passos:**
1. Criar o arquivo `package.json` conforme seção 12 do PRD, acrescentando os pacotes de renderer e testing-library listados acima.

**Gates:**
```bash
# [GATE-NPM] Verificar se package.json existe e tem a chave "name"
node -e "const p = require('./package.json'); console.assert(p.name === 'listen-english', 'FALHOU'); console.log('OK: name =', p.name);"
```
**✅ Concluída quando:** gate passa sem assertion error.

---

### Atividade 1.2 — Instalar dependências de produção

**Objetivo:** Instalar `electron`.

**Passos:**
1. Executar `npm install` (com package.json já preenchido) ou `npm install electron`.

**Gates:**
```bash
# [GATE-NPM] Verificar instalação do Electron
npm ls electron --depth=0

# [GATE-NPM] Verificar versão >= 42
node -e "const v = require('./node_modules/electron/package.json').version; console.log('Electron:', v); console.assert(parseInt(v) >= 42, 'versão abaixo do esperado');"
```
**✅ Concluída quando:** ambos os gates passam.

---

### Atividade 1.3 — Instalar dependências de desenvolvimento

**Objetivo:** Instalar todos os devDependencies do PRD + pacotes adicionais de renderer e testes.

**Passos:**
1. Executar `npm install --save-dev <todos os pacotes>`.

**Gates:**
```bash
# [GATE-NPM] Verificar pacotes críticos
npm ls typescript vite electron-vite jest ts-jest @types/jest --depth=0
npm ls @testing-library/react @testing-library/user-event @testing-library/jest-dom --depth=0
npm ls react react-dom @types/react @types/react-dom --depth=0

# [GATE-NPM] Verificar versões críticas (jest 29 + ts-jest 29)
node -e "
  const j = require('./node_modules/jest/package.json').version;
  const tsj = require('./node_modules/ts-jest/package.json').version;
  console.log('jest:', j, '| ts-jest:', tsj);
  console.assert(j.startsWith('29'), 'jest deve ser 29.x');
  console.assert(tsj.startsWith('29'), 'ts-jest deve ser 29.x');
  console.log('OK: versões compatíveis');
"
```
**✅ Concluída quando:** todos os gates passam.

---

### Atividade 1.4 — Criar estrutura de diretórios

**Objetivo:** Criar todos os diretórios do projeto conforme seção 8 do PRD.

**Passos:**
1. Criar os diretórios: `src/main/recordings/`, `src/preload/`, `src/renderer/components/`, `src/renderer/hooks/`, `src/renderer/styles/`, `src/shared/`, `tests/unit/`, `tests/integration/`, `assets/`.

**Gates:**
```bash
# [GATE-NPM] Verificar estrutura de diretórios
node -e "
  const fs = require('fs');
  const dirs = [
    'src/main/recordings', 'src/preload', 'src/renderer/components',
    'src/renderer/hooks', 'src/renderer/styles', 'src/shared',
    'tests/unit', 'tests/integration', 'assets'
  ];
  dirs.forEach(d => {
    console.assert(fs.existsSync(d), 'FALTANDO: ' + d);
    console.log('OK:', d);
  });
"
```
**✅ Concluída quando:** todos os diretórios existem.

---

### Atividade 1.5 — Configurar `tsconfig.json`

**Objetivo:** Arquivo de configuração base do TypeScript para o projeto.

**Conteúdo:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Gates:**
```bash
# [GATE-TS] Verificar configuração do TypeScript
npx tsc --version
npx tsc --showConfig 2>&1 | head -5
```
**✅ Concluída quando:** `tsc --version` retorna versão 6.x.

---

### Atividade 1.6 — Configurar `tsconfig.node.json`

**Objetivo:** Configuração estendida para main, preload e testes (CommonJS para Jest).

**Conteúdo:** conforme seção 10 do PRD.

**Gates:**
```bash
# [GATE-TS] Verificar arquivo e herança correta
node -e "
  const c = require('./tsconfig.node.json');
  console.assert(c.extends === './tsconfig.json', 'deve herdar tsconfig.json');
  console.assert(c.compilerOptions.module === 'CommonJS', 'deve ser CommonJS para Jest');
  console.log('OK: tsconfig.node.json válido');
"
```
**✅ Concluída quando:** gate passa.

---

### Atividade 1.7 — Configurar `jest.config.ts`

**Objetivo:** Configuração do Jest com cobertura 100% para todos os módulos de lógica.

**Conteúdo baseado no PRD seção 10, com ajustes para 100% e renderer:**
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
  },
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/!(*.test.tsx|useAudio*)', '<rootDir>/tests/integration/**/*.ts'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@main/(.*)$': '<rootDir>/src/main/$1',
      },
      globals: { 'ts-jest': { tsconfig: 'tsconfig.node.json' } },
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/unit/*.test.tsx', '<rootDir>/tests/unit/useAudioRecorder.test.ts'],
      setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
      },
      globals: { 'ts-jest': { tsconfig: 'tsconfig.node.json' } },
    },
  ],
  collectCoverageFrom: [
    'src/shared/formatters.ts',
    'src/main/recordings/**/*.ts',
    'src/main/ipc-handlers.ts',
    'src/main/window.ts',
    'src/renderer/hooks/useAudioRecorder.ts',
    'src/renderer/components/**/*.tsx',
    'src/renderer/App.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe do jest.config.ts
npx tsc --noEmit --project tsconfig.node.json

# [GATE-TEST] Verificar se Jest reconhece a configuração (sem executar testes)
npx jest --listTests 2>&1 | head -3 || echo "OK: Jest configurado (sem testes ainda)"
```
**✅ Concluída quando:** `tsc --noEmit` não retorna erros.

---

### Atividade 1.8 — Configurar `electron.vite.config.ts`

**Objetivo:** Configuração do electron-vite para build do main, preload e renderer.

**Conteúdo:**
```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared'), '@main': resolve('src/main') },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: { '@shared': resolve('src/shared'), '@renderer': resolve('src/renderer') },
    },
  },
});
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 1.9 — Criar `tests/setup.ts`

**Objetivo:** Arquivo de setup global para testes do renderer (mocks de APIs do browser e do Electron).

**Conteúdo:**
```typescript
import '@testing-library/jest-dom';

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: {
    saveRecording: jest.fn(),
    listRecordings: jest.fn().mockResolvedValue([]),
    getRecordingPath: jest.fn().mockReturnValue(''),
  },
});

// Mock MediaRecorder
class MockMediaRecorder {
  state: string = 'inactive';
  ondataavailable: ((e: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  start = jest.fn(() => { this.state = 'recording'; });
  stop = jest.fn(() => {
    this.state = 'inactive';
    this.onstop?.();
  });
  static isTypeSupported = jest.fn().mockReturnValue(true);
}
(global as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder = MockMediaRecorder;

// Mock navigator.mediaDevices.getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    }),
  },
});
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

## Fase 2: Camada Compartilhada

### Atividade 2.1 — Criar `src/shared/types.ts`

**Objetivo:** Tipos compartilhados conforme seção 9 do PRD.

**Conteúdo:**
```typescript
export interface RecordingMetadata {
  id: string;
  fileName: string;
  createdAt: string;   // ISO 8601
  durationMs: number;
}

export interface IAudioRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  readonly isRecording: boolean;
}

export interface IRecordingRepository {
  save(audioBuffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string>;
  list(): Promise<RecordingMetadata[]>;
  getFilePath(id: string): string;
}

export interface IAIProvider {
  transcribe(audioPath: string): Promise<string>;
  summarize(text: string): Promise<string>;
}

export interface ElectronAPI {
  saveRecording(buffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string>;
  listRecordings(): Promise<RecordingMetadata[]>;
  getRecordingPath(id: string): string;
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 2.2 — Criar `src/shared/constants.ts`

**Objetivo:** Constantes compartilhadas conforme seção 8 do PRD.

**Conteúdo:**
```typescript
export const RECORDINGS_DIR = 'recordings';
export const RECORDINGS_METADATA_FILE = 'recordings.json';
export const AUDIO_EXTENSION = '.webm';
export const AUDIO_MIME_TYPE = 'audio/webm';
export const MAX_HISTORY_ITEMS = 50;
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 2.3 — Criar `src/shared/formatters.ts`

**Objetivo:** Funções puras de formatação de data e duração, testáveis isoladamente.

**Conteúdo:**
```typescript
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
 * Exemplo: new Date('2026-05-23T14:30:12') → "2026-05-23_14-30-12"
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
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 2.4 — Criar `tests/unit/formatters.test.ts`

**Objetivo:** Cobertura 100% de `formatters.ts` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Duração zero
  Dado  durationMs = 0
  Quando formatDuration(0) é chamado
  Então retorna "00:00"

Cenário 2: Duração de 1 minuto e 30 segundos
  Dado  durationMs = 90000
  Quando formatDuration(90000) é chamado
  Então retorna "01:30"

Cenário 3: Duração máxima de minutos completos
  Dado  durationMs = 3599000 (59 min 59 seg)
  Quando formatDuration(3599000) é chamado
  Então retorna "59:59"

Cenário 4: Duração acima de 60 minutos
  Dado  durationMs = 3660000 (61 min)
  Quando formatDuration(3660000) é chamado
  Então retorna "61:00"

Cenário 5: Formatação de nome de arquivo com zero à esquerda
  Dado  date = new Date(2026, 0, 5, 8, 3, 7) (05/jan/2026 08:03:07)
  Quando formatFileName(date) é chamado
  Então retorna "2026-01-05_08-03-07"

Cenário 6: Formatação de nome de arquivo sem necessidade de zero à esquerda
  Dado  date = new Date(2026, 4, 23, 14, 30, 12)
  Quando formatFileName(date) é chamado
  Então retorna "2026-05-23_14-30-12"

Cenário 7: Formatação de data para exibição
  Dado  isoString = "2026-05-23T14:30:00.000Z"
  Quando formatDisplayDate(isoString) é chamado
  Então retorna string no formato dd/MM/yyyy HH:mm
```

**Gates:**
```bash
# [GATE-TEST] Executar testes de formatters
npx jest tests/unit/formatters.test.ts --verbose

# [GATE-COV] Verificar cobertura 100%
npx jest tests/unit/formatters.test.ts --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 7 testes passam e cobertura é 100%.

---

## Fase 3: Repositório de Gravações

### Atividade 3.1 — Criar `src/main/recordings/FileRecordingRepository.ts`

**Objetivo:** Implementação concreta de `IRecordingRepository` que persiste em disco.

**Conteúdo:**
```typescript
import fs from 'fs';
import path from 'path';
import { IRecordingRepository, RecordingMetadata } from '@shared/types';
import { RECORDINGS_DIR, RECORDINGS_METADATA_FILE, AUDIO_EXTENSION, MAX_HISTORY_ITEMS } from '@shared/constants';

export class FileRecordingRepository implements IRecordingRepository {
  private readonly recordingsPath: string;
  private readonly metadataPath: string;

  constructor(userDataPath: string) {
    this.recordingsPath = path.join(userDataPath, RECORDINGS_DIR);
    this.metadataPath = path.join(this.recordingsPath, RECORDINGS_METADATA_FILE);
  }

  async save(audioBuffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string> {
    this.ensureDirectoryExists();
    const filePath = path.join(this.recordingsPath, metadata.fileName);
    await fs.promises.writeFile(filePath, Buffer.from(audioBuffer));
    await this.appendMetadata(metadata);
    return filePath;
  }

  async list(): Promise<RecordingMetadata[]> {
    if (!fs.existsSync(this.metadataPath)) return [];
    const raw = await fs.promises.readFile(this.metadataPath, 'utf-8');
    const all: RecordingMetadata[] = JSON.parse(raw);
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_HISTORY_ITEMS);
  }

  getFilePath(id: string): string {
    return path.join(this.recordingsPath, `${id}${AUDIO_EXTENSION}`);
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.recordingsPath)) {
      fs.mkdirSync(this.recordingsPath, { recursive: true });
    }
  }

  private async appendMetadata(metadata: RecordingMetadata): Promise<void> {
    let existing: RecordingMetadata[] = [];
    if (fs.existsSync(this.metadataPath)) {
      const raw = await fs.promises.readFile(this.metadataPath, 'utf-8');
      existing = JSON.parse(raw);
    }
    existing.push(metadata);
    await fs.promises.writeFile(this.metadataPath, JSON.stringify(existing, null, 2));
  }
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 3.2 — Criar `tests/unit/FileRecordingRepository.test.ts`

**Objetivo:** Cobertura 100% de `FileRecordingRepository.ts` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Criação automática do diretório
  Dado  o diretório recordings/ não existe
  Quando save() é chamado com buffer e metadados válidos
  Então o diretório é criado antes de gravar o arquivo

Cenário 2: Salvamento do buffer em disco
  Dado  um ArrayBuffer com dados de áudio válidos
  Quando save() é chamado
  Então fs.writeFile é chamado com o caminho correto e os dados do buffer

Cenário 3: Atualização do arquivo de metadados
  Dado  um recordings.json existente com 1 item
  Quando save() é chamado com novos metadados
  Então recordings.json passa a ter 2 itens com o novo item adicionado

Cenário 4: Criação do recordings.json quando não existe
  Dado  recordings.json não existe
  Quando save() é chamado
  Então recordings.json é criado com um array contendo o item salvo

Cenário 5: Retorno de lista vazia quando sem gravações
  Dado  recordings.json não existe
  Quando list() é chamado
  Então retorna um array vazio []

Cenário 6: Ordenação decrescente por data
  Dado  recordings.json com 3 gravações em datas diferentes
  Quando list() é chamado
  Então retorna as gravações ordenadas da mais recente para a mais antiga

Cenário 7: Limite de 50 itens no histórico
  Dado  recordings.json com 60 gravações
  Quando list() é chamado
  Então retorna apenas 50 itens (os mais recentes)

Cenário 8: Retorno do caminho correto por ID
  Dado  um id "abc123"
  Quando getFilePath("abc123") é chamado
  Então retorna o caminho completo terminando em "abc123.webm"
```

**Gates:**
```bash
# [GATE-TEST] Executar testes do repositório
npx jest tests/unit/FileRecordingRepository.test.ts --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/FileRecordingRepository.test.ts --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 8 testes passam e cobertura é 100%.

---

## Fase 4: Serviço de Gravações

### Atividade 4.1 — Criar `src/main/recordings/RecordingService.ts`

**Objetivo:** Orquestração de salvamento e metadados, dependendo da interface `IRecordingRepository`.

**Conteúdo:**
```typescript
import { v4 as uuidv4 } from 'uuid';  // ou implementar UUID simples sem dependência
import { IRecordingRepository, RecordingMetadata } from '@shared/types';
import { AUDIO_EXTENSION } from '@shared/constants';
import { formatFileName } from '@shared/formatters';

// Nota: se não quiser adicionar dependência de uuid, usar:
// const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export class RecordingService {
  constructor(private readonly repository: IRecordingRepository) {}

  async save(audioBuffer: ArrayBuffer, durationMs: number): Promise<RecordingMetadata> {
    if (audioBuffer.byteLength === 0) {
      throw new Error('O buffer de áudio está vazio. Nenhuma gravação foi salva.');
    }

    const now = new Date();
    const id = formatFileName(now);
    const fileName = `${id}${AUDIO_EXTENSION}`;
    const metadata: RecordingMetadata = {
      id,
      fileName,
      createdAt: now.toISOString(),
      durationMs,
    };

    await this.repository.save(audioBuffer, metadata);
    return metadata;
  }

  async list(): Promise<RecordingMetadata[]> {
    return this.repository.list();
  }

  getFilePath(id: string): string {
    return this.repository.getFilePath(id);
  }
}
```

> **Nota:** Para evitar adicionar a dependência `uuid`, a implementação usa `formatFileName` como ID (garante unicidade por segundo). Se necessário unicidade sub-segundo, adicionar `uuid` às dependências.

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 4.2 — Criar `tests/unit/RecordingService.test.ts`

**Objetivo:** Cobertura 100% de `RecordingService.ts` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Rejeição de buffer vazio
  Dado  um ArrayBuffer de 0 bytes
  Quando save() é chamado
  Então lança um Error com mensagem indicando buffer vazio

Cenário 2: Geração de nome de arquivo no formato correto
  Dado  um ArrayBuffer válido e durationMs = 5000
  Quando save() é chamado
  Então o metadata.fileName retornado segue o padrão YYYY-MM-DD_HH-mm-ss.webm

Cenário 3: Delegação para o repositório
  Dado  um repositório mockado e um buffer válido
  Quando save() é chamado
  Então repository.save() é chamado exatamente uma vez com os parâmetros corretos

Cenário 4: Retorno correto de metadados
  Dado  um buffer de 1024 bytes e durationMs = 30000
  Quando save() é chamado
  Então retorna um RecordingMetadata com id, fileName, createdAt (ISO) e durationMs = 30000

Cenário 5: Listagem delegada ao repositório
  Dado  um repositório mockado com 3 gravações
  Quando list() é chamado
  Então retorna exatamente o resultado de repository.list()

Cenário 6: getFilePath delegado ao repositório
  Dado  um id "2026-05-23_14-30-12"
  Quando getFilePath(id) é chamado
  Então retorna repository.getFilePath(id)
```

**Gates:**
```bash
# [GATE-TEST] Executar testes do serviço
npx jest tests/unit/RecordingService.test.ts --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/RecordingService.test.ts --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 6 testes passam e cobertura é 100%.

---

## Fase 5: Handlers IPC

### Atividade 5.1 — Criar `src/main/ipc-handlers.ts`

**Objetivo:** Registrar todos os handlers IPC do processo main, validando entradas antes de processar.

**Conteúdo:**
```typescript
import { ipcMain } from 'electron';
import { RecordingService } from './recordings/RecordingService';
import { RecordingMetadata } from '@shared/types';

export const IPC_CHANNELS = {
  SAVE_RECORDING: 'save-recording',
  LIST_RECORDINGS: 'list-recordings',
  GET_RECORDING_PATH: 'get-recording-path',
} as const;

export function registerIpcHandlers(service: RecordingService): void {
  ipcMain.handle(IPC_CHANNELS.SAVE_RECORDING, async (_event, buffer: ArrayBuffer, metadata: RecordingMetadata) => {
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new Error('Buffer inválido recebido via IPC.');
    }
    if (!metadata || typeof metadata.durationMs !== 'number') {
      throw new Error('Metadados inválidos recebidos via IPC.');
    }
    return service.save(buffer, metadata.durationMs);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_RECORDINGS, async () => {
    return service.list();
  });

  ipcMain.handle(IPC_CHANNELS.GET_RECORDING_PATH, (_event, id: string) => {
    if (!id || typeof id !== 'string') {
      throw new Error('ID inválido recebido via IPC.');
    }
    return service.getFilePath(id);
  });
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 5.2 — Criar `tests/integration/ipc-handlers.test.ts`

**Objetivo:** Cobertura 100% de `ipc-handlers.ts` com cenários BDD de integração.

**Casos de teste BDD:**

```
Cenário 1: Salvamento via IPC com dados válidos
  Dado  o handler "save-recording" está registrado
  E     um ArrayBuffer de 512 bytes com durationMs = 5000
  Quando o IPC "save-recording" é invocado
  Então RecordingService.save() é chamado com os dados corretos
  E     retorna o RecordingMetadata com o fileName no formato correto

Cenário 2: Rejeição de buffer inválido via IPC
  Dado  o handler "save-recording" está registrado
  Quando o IPC "save-recording" é invocado com buffer = null
  Então o handler lança um Error com mensagem "Buffer inválido"

Cenário 3: Rejeição de metadados inválidos via IPC
  Dado  o handler "save-recording" está registrado
  Quando o IPC "save-recording" é invocado com metadata sem durationMs
  Então o handler lança um Error com mensagem "Metadados inválidos"

Cenário 4: Listagem de gravações via IPC
  Dado  o handler "list-recordings" está registrado
  E     o serviço tem 2 gravações salvas
  Quando o IPC "list-recordings" é invocado
  Então retorna um array com 2 RecordingMetadata

Cenário 5: Busca de caminho por ID via IPC
  Dado  o handler "get-recording-path" está registrado
  E     um id válido "2026-05-23_14-30-12"
  Quando o IPC "get-recording-path" é invocado
  Então retorna o caminho completo para o arquivo .webm

Cenário 6: Rejeição de ID inválido via IPC
  Dado  o handler "get-recording-path" está registrado
  Quando o IPC "get-recording-path" é invocado com id = ""
  Então o handler lança um Error com mensagem "ID inválido"
```

**Gates:**
```bash
# [GATE-TEST] Executar testes de integração IPC
npx jest tests/integration/ipc-handlers.test.ts --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/integration/ipc-handlers.test.ts --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 6 testes passam e cobertura é 100%.

---

## Fase 6: Processo Principal Electron

### Atividade 6.1 — Criar `src/main/window.ts`

**Objetivo:** Configuração e posicionamento da BrowserWindow conforme RF-01.

**Conteúdo:**
```typescript
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
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  return win;
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 6.2 — Criar `tests/unit/window.test.ts`

**Objetivo:** Cobertura 100% de `window.ts` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Dimensões da janela conforme especificação
  Dado  a configuração WINDOW_CONFIG
  Quando os valores são verificados
  Então width é 320 e height é 120

Cenário 2: Criação da janela com configurações corretas
  Dado  o módulo electron mockado
  Quando createMainWindow() é chamado
  Então BrowserWindow é instanciado com resizable: false e alwaysOnTop: true

Cenário 3: Janela posicionada no canto superior direito
  Dado  uma tela mockada com workAreaSize { width: 1920 }
  Quando createMainWindow() é chamado
  Então a posição x é screenWidth - 320 - 16

Cenário 4: Segurança — contextIsolation ativo
  Dado  o BrowserWindow mockado
  Quando createMainWindow() é chamado
  Então webPreferences.contextIsolation é true
  E     webPreferences.nodeIntegration é false
  E     webPreferences.sandbox é true
```

**Gates:**
```bash
# [GATE-TEST] Executar testes de window
npx jest tests/unit/window.test.ts --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/window.test.ts --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 4 testes passam e cobertura é 100%.

---

### Atividade 6.3 — Criar `src/main/main.ts`

**Objetivo:** Entry point do processo main — inicializa o app Electron, cria a janela e registra handlers IPC.

**Conteúdo:**
```typescript
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
```

> Este arquivo é **excluído da cobertura** (entry point sem lógica de negócio). Verificado por smoke test manual.

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

## Fase 7: Bridge Preload

### Atividade 7.1 — Criar `src/preload/api.ts`

**Objetivo:** Tipagem da ponte IPC (ElectronAPI) reexportada de shared/types.

**Conteúdo:**
```typescript
export type { ElectronAPI } from '@shared/types';
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 7.2 — Criar `src/preload/index.ts`

**Objetivo:** Expor a `ElectronAPI` via `contextBridge` de forma segura.

**Conteúdo:**
```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './api';
import { IPC_CHANNELS } from '../main/ipc-handlers';

const api: ElectronAPI = {
  saveRecording: (buffer, metadata) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_RECORDING, buffer, metadata),
  listRecordings: () =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_RECORDINGS),
  getRecordingPath: (id) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_RECORDING_PATH, id),
};

contextBridge.exposeInMainWorld('electronAPI', api);
```

> Este arquivo é **excluído da cobertura** (bridge do contextBridge). Verificado por integração manual.

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** sem erros de TypeScript.

---

## Fase 8: Renderer

### Atividade 8.1 — Criar `src/renderer/styles/global.css`

**Objetivo:** Estilos da UI compacta.

**Conteúdo:**
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  background: #1a1a1a;
  color: #f0f0f0;
  user-select: none;
  overflow: hidden;
  height: 120px;
  width: 320px;
}

.app { display: flex; flex-direction: column; height: 100%; padding: 8px; gap: 6px; }

.controls { display: flex; align-items: center; gap: 8px; }

.btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: opacity 0.15s;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn--record { background: #e53e3e; color: #fff; }
.btn--stop   { background: #718096; color: #fff; }
.btn--play   { background: #2b6cb0; color: #fff; padding: 2px 8px; }

.recording-list { flex: 1; overflow-y: auto; }
.recording-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid #2d2d2d;
  font-size: 11px;
}
.recording-item:last-child { border-bottom: none; }
.empty-state { color: #718096; font-size: 11px; text-align: center; margin-top: 8px; }
.error-msg { color: #fc8181; font-size: 11px; }
```

> CSS não requer gate de TypeScript. Validado visualmente via smoke test.

**✅ Concluída quando:** arquivo criado e app renderiza sem erros de CSS.

---

### Atividade 8.2 — Criar `src/renderer/hooks/useAudioRecorder.ts`

**Objetivo:** Hook React que encapsula `MediaRecorder`, chunks e estado de gravação (RF-02).

**Conteúdo:**
```typescript
import { useState, useRef, useCallback } from 'react';
import type { IAudioRecorder } from '@shared/types';
import { AUDIO_MIME_TYPE } from '@shared/constants';

export interface UseAudioRecorderReturn extends IAudioRecorder {
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveStopRef = useRef<((blob: Blob) => void) | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: AUDIO_MIME_TYPE });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: AUDIO_MIME_TYPE });
        resolveStopRef.current?.(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao acessar o microfone.';
      setError(message);
      throw err;
    }
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      resolveStopRef.current = resolve;
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    });
  }, []);

  return { start, stop, isRecording, error };
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 8.3 — Criar `tests/unit/useAudioRecorder.test.ts`

**Objetivo:** Cobertura 100% do hook `useAudioRecorder.ts` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Estado inicial inativo
  Dado  o hook é inicializado
  Quando o estado é lido antes de qualquer ação
  Então isRecording é false e error é null

Cenário 2: Iniciar gravação com microfone disponível
  Dado  navigator.mediaDevices.getUserMedia retorna stream mockado
  Quando start() é chamado
  Então getUserMedia é chamado com { audio: true }
  E     isRecording passa a ser true

Cenário 3: Blob gerado ao parar gravação
  Dado  uma gravação em andamento com chunks disponíveis
  Quando stop() é chamado
  Então retorna um Blob com type "audio/webm"
  E     isRecording volta a ser false

Cenário 4: Stream encerrado ao parar gravação
  Dado  uma gravação ativa com stream mockado
  Quando stop() é chamado
  Então track.stop() é chamado em todas as faixas do stream

Cenário 5: Tratamento de erro de permissão negada
  Dado  getUserMedia rejeita com NotAllowedError
  Quando start() é chamado
  Então a exceção é relançada
  E     error é definido com a mensagem do erro

Cenário 6: Chunks vazios são ignorados
  Dado  MediaRecorder dispara ondataavailable com Blob de tamanho 0
  Quando stop() é chamado
  Então o Blob final não inclui o chunk vazio
```

**Gates:**
```bash
# [GATE-TEST] Executar testes do hook
npx jest tests/unit/useAudioRecorder.test.ts --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/useAudioRecorder.test.ts --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 6 testes passam e cobertura é 100%.

---

### Atividade 8.4 — Criar `src/renderer/components/RecordButton.tsx`

**Objetivo:** Componente de botão Gravar/Parar com estado visual (RF-02).

**Conteúdo:**
```tsx
import React from 'react';

export interface RecordButtonProps {
  isRecording: boolean;
  onRecord: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onRecord, onStop, disabled = false }: RecordButtonProps) {
  return (
    <div className="controls">
      <button
        className="btn btn--record"
        onClick={onRecord}
        disabled={isRecording || disabled}
        aria-label="Iniciar gravação"
      >
        Gravar
      </button>
      <button
        className="btn btn--stop"
        onClick={onStop}
        disabled={!isRecording || disabled}
        aria-label="Parar gravação"
      >
        Parar
      </button>
    </div>
  );
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 8.5 — Criar `tests/unit/RecordButton.test.tsx`

**Objetivo:** Cobertura 100% do componente `RecordButton.tsx` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Botão Gravar habilitado quando não está gravando
  Dado  isRecording = false
  Quando RecordButton é renderizado
  Então o botão "Gravar" está habilitado
  E     o botão "Parar" está desabilitado

Cenário 2: Botão Gravar desabilitado durante gravação
  Dado  isRecording = true
  Quando RecordButton é renderizado
  Então o botão "Gravar" está desabilitado
  E     o botão "Parar" está habilitado

Cenário 3: Callback onRecord chamado ao clicar em Gravar
  Dado  isRecording = false e onRecord é uma função mockada
  Quando o usuário clica no botão "Gravar"
  Então onRecord é chamado exatamente uma vez

Cenário 4: Callback onStop chamado ao clicar em Parar
  Dado  isRecording = true e onStop é uma função mockada
  Quando o usuário clica no botão "Parar"
  Então onStop é chamado exatamente uma vez

Cenário 5: Ambos os botões desabilitados quando disabled = true
  Dado  disabled = true
  Quando RecordButton é renderizado
  Então tanto "Gravar" quanto "Parar" estão desabilitados
```

**Gates:**
```bash
# [GATE-TEST] Executar testes do RecordButton
npx jest tests/unit/RecordButton.test.tsx --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/RecordButton.test.tsx --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 5 testes passam e cobertura é 100%.

---

### Atividade 8.6 — Criar `src/renderer/components/RecordingList.tsx`

**Objetivo:** Lista de gravações com play/pause e exibição de metadados (RF-04 e RF-05).

**Conteúdo:**
```tsx
import React from 'react';
import type { RecordingMetadata } from '@shared/types';
import { formatDuration, formatDisplayDate } from '@shared/formatters';
import { MAX_HISTORY_ITEMS } from '@shared/constants';

export interface RecordingListProps {
  recordings: RecordingMetadata[];
  playingId: string | null;
  onPlay: (id: string) => void;
  onPause: () => void;
}

export function RecordingList({ recordings, playingId, onPlay, onPause }: RecordingListProps) {
  const visible = recordings.slice(0, MAX_HISTORY_ITEMS);

  if (visible.length === 0) {
    return <p className="empty-state">Nenhuma gravação ainda.</p>;
  }

  return (
    <ul className="recording-list" aria-label="Histórico de gravações">
      {visible.map((rec) => (
        <li key={rec.id} className="recording-item">
          <span>{formatDisplayDate(rec.createdAt)} — {formatDuration(rec.durationMs)}</span>
          {playingId === rec.id ? (
            <button className="btn btn--play" onClick={onPause} aria-label="Pausar">⏸ Pausa</button>
          ) : (
            <button className="btn btn--play" onClick={() => onPlay(rec.id)} aria-label="Reproduzir">▶ Play</button>
          )}
        </li>
      ))}
    </ul>
  );
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 8.7 — Criar `tests/unit/RecordingList.test.tsx`

**Objetivo:** Cobertura 100% do componente `RecordingList.tsx` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Estado vazio sem gravações
  Dado  recordings = []
  Quando RecordingList é renderizado
  Então exibe mensagem "Nenhuma gravação ainda."

Cenário 2: Exibição de gravações com data e duração
  Dado  recordings com 2 itens válidos
  Quando RecordingList é renderizado
  Então cada item exibe data/hora e duração no formato mm:ss

Cenário 3: Botão Play disponível para gravações não reproduzindo
  Dado  playingId = null e recordings com 1 item
  Quando RecordingList é renderizado
  Então o botão exibe "▶ Play"

Cenário 4: Botão Pausa para gravação em reprodução
  Dado  playingId = recordings[0].id
  Quando RecordingList é renderizado
  Então o item com playingId exibe "⏸ Pausa"
  E     os demais itens exibem "▶ Play"

Cenário 5: Callback onPlay chamado com ID correto
  Dado  recordings com 1 item e onPlay mockado
  Quando o usuário clica em "▶ Play"
  Então onPlay é chamado com o id do item clicado

Cenário 6: Callback onPause chamado ao pausar
  Dado  playingId ativo e onPause mockado
  Quando o usuário clica em "⏸ Pausa"
  Então onPause é chamado exatamente uma vez

Cenário 7: Limite de 50 itens exibidos
  Dado  recordings com 55 itens
  Quando RecordingList é renderizado
  Então apenas 50 itens são renderizados na lista
```

**Gates:**
```bash
# [GATE-TEST] Executar testes do RecordingList
npx jest tests/unit/RecordingList.test.tsx --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/RecordingList.test.tsx --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 7 testes passam e cobertura é 100%.

---

### Atividade 8.8 — Criar `src/renderer/App.tsx`

**Objetivo:** Componente raiz que orquestra gravação, salvamento e exibição do histórico.

**Conteúdo:**
```tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { RecordingMetadata } from '@shared/types';
import { RecordButton } from './components/RecordButton';
import { RecordingList } from './components/RecordingList';
import { useAudioRecorder } from './hooks/useAudioRecorder';

export function App() {
  const { start, stop, isRecording, error: recorderError } = useAudioRecorder();
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    window.electronAPI.listRecordings().then(setRecordings).catch(() => {
      setSaveError('Erro ao carregar histórico de gravações.');
    });
  }, []);

  const handleRecord = useCallback(async () => {
    setSaveError(null);
    startTimeRef.current = Date.now();
    try {
      await start();
    } catch {
      // error já capturado pelo hook
    }
  }, [start]);

  const handleStop = useCallback(async () => {
    const blob = await stop();
    const durationMs = Date.now() - startTimeRef.current;
    const buffer = await blob.arrayBuffer();
    const metadata: Omit<RecordingMetadata, 'id' | 'fileName'> = { createdAt: new Date().toISOString(), durationMs };

    try {
      await window.electronAPI.saveRecording(buffer, metadata as RecordingMetadata);
      const updated = await window.electronAPI.listRecordings();
      setRecordings(updated);
    } catch {
      setSaveError('Erro ao salvar a gravação.');
    }
  }, [stop]);

  const handlePlay = useCallback((id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const path = window.electronAPI.getRecordingPath(id);
    const audio = new Audio(`file://${path}`);
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    audio.play();
    setPlayingId(id);
  }, []);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setPlayingId(null);
  }, []);

  const displayError = recorderError ?? saveError;

  return (
    <div className="app">
      <RecordButton isRecording={isRecording} onRecord={handleRecord} onStop={handleStop} />
      {displayError && <p className="error-msg" role="alert">{displayError}</p>}
      <RecordingList recordings={recordings} playingId={playingId} onPlay={handlePlay} onPause={handlePause} />
    </div>
  );
}
```

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

### Atividade 8.9 — Criar `tests/unit/App.test.tsx`

**Objetivo:** Cobertura 100% do componente `App.tsx` com cenários BDD.

**Casos de teste BDD:**

```
Cenário 1: Carregamento do histórico na montagem
  Dado  window.electronAPI.listRecordings retorna 2 gravações
  Quando App é montado
  Então listRecordings é chamado
  E     o histórico com 2 itens é renderizado

Cenário 2: Exibição de erro ao falhar carregamento do histórico
  Dado  window.electronAPI.listRecordings rejeita com erro
  Quando App é montado
  Então uma mensagem de erro é exibida na tela

Cenário 3: Ciclo completo de gravação e salvamento
  Dado  o microfone está disponível e saveRecording resolve com sucesso
  Quando o usuário clica em "Gravar" e depois em "Parar"
  Então saveRecording é chamado com buffer e metadados
  E     listRecordings é chamado novamente para atualizar a lista

Cenário 4: Exibição de erro ao falhar salvamento
  Dado  saveRecording rejeita com erro
  Quando o usuário completa o ciclo de gravação
  Então uma mensagem de erro de salvamento é exibida

Cenário 5: Reprodução de áudio ao clicar em Play
  Dado  a lista tem 1 gravação e getRecordingPath retorna um caminho
  Quando o usuário clica em Play
  Então getRecordingPath é chamado com o id correto

Cenário 6: Exibição de erro do microfone negado
  Dado  getUserMedia rejeita com NotAllowedError
  Quando o usuário clica em "Gravar"
  Então a mensagem de erro do microfone é exibida
```

**Gates:**
```bash
# [GATE-TEST] Executar testes do App
npx jest tests/unit/App.test.tsx --verbose

# [GATE-COV] Cobertura 100%
npx jest tests/unit/App.test.tsx --coverage --coverageThreshold='{"global":{"lines":100,"functions":100,"branches":100,"statements":100}}'
```
**✅ Concluída quando:** todos os 6 testes passam e cobertura é 100%.

---

### Atividade 8.10 — Criar `src/renderer/main.tsx` e `src/renderer/index.html`

**Objetivo:** Entry point do renderer (monta o App React) e HTML principal.

**`index.html`:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Listen English</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.tsx"></script>
</body>
</html>
```

**`main.tsx`:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

> Ambos os arquivos são **excluídos da cobertura** (entry points de render sem lógica de negócio).

**Gates:**
```bash
# [GATE-TS] Verificar sintaxe
npx tsc --noEmit
```
**✅ Concluída quando:** sem erros de TypeScript.

---

## Fase 9: Verificação Final — Cobertura 100%

### Atividade 9.1 — Executar suite completa de testes

**Objetivo:** Garantir que todos os testes passam e a cobertura global é 100%.

**Gates:**
```bash
# [GATE-TEST] Executar todos os testes com saída verbosa
npx jest --verbose

# [GATE-COV] Verificar cobertura global 100%
npm run test:coverage

# Verificar saída: todas as métricas devem mostrar 100%
# Branches: 100% | Functions: 100% | Lines: 100% | Statements: 100%
```
**✅ Concluída quando:** `npm run test:coverage` termina com exit code 0 e sem falhas de threshold.

---

### Atividade 9.2 — Verificação de tipos completa

**Objetivo:** Zero erros de TypeScript em todo o projeto.

**Gates:**
```bash
# [GATE-TS] TypeScript check completo (todos os arquivos)
npx tsc --noEmit

# [GATE-TS] TypeScript check dos módulos node (main + preload + tests)
npx tsc --noEmit --project tsconfig.node.json
```
**✅ Concluída quando:** ambos os comandos retornam sem erros.

---

### Atividade 9.3 — Build de desenvolvimento (smoke test)

**Objetivo:** Confirmar que o app inicializa sem erros.

**Gates:**
```bash
# [GATE-BUILD] Build do projeto
npm run build

# Verificar que os artefatos foram gerados
node -e "
  const fs = require('fs');
  ['dist/main/main.js', 'dist/preload/index.js'].forEach(f => {
    console.assert(fs.existsSync(f), 'FALTANDO: ' + f);
    console.log('OK:', f);
  });
"
```

> Após o build, iniciar o app manualmente com `npm run dev` e verificar:
> - Janela 320×120 aparece no canto superior direito
> - `alwaysOnTop` funciona
> - Botão Gravar inicia captura de microfone
> - Botão Parar salva o arquivo `.webm`
> - Histórico exibe o item com data e duração
> - Play reproduz o áudio corretamente

**✅ Concluída quando:** build sem erros e smoke test manual aprovado.

---

## Critério de Conclusão Global

O projeto **Listen English MVP** está **concluído** quando:

| # | Critério | Verificação |
|---|---------|------------|
| 1 | Todos os 48 testes passam | `npx jest` — exit code 0 |
| 2 | Cobertura 100% em todos os módulos de lógica | `npm run test:coverage` — sem falhas de threshold |
| 3 | Zero erros de TypeScript | `npx tsc --noEmit` — sem output |
| 4 | Build completo sem erros | `npm run build` — exit code 0 |
| 5 | Smoke test manual aprovado | App funciona conforme marcos M1–M5 do PRD |

---

## Resumo de Testes

| Arquivo de teste | Módulo testado | Cenários | Tipo |
|-----------------|---------------|----------|------|
| `tests/unit/formatters.test.ts` | `shared/formatters.ts` | 7 | Unit |
| `tests/unit/FileRecordingRepository.test.ts` | `main/recordings/FileRecordingRepository.ts` | 8 | Unit |
| `tests/unit/RecordingService.test.ts` | `main/recordings/RecordingService.ts` | 6 | Unit |
| `tests/unit/window.test.ts` | `main/window.ts` | 4 | Unit |
| `tests/unit/useAudioRecorder.test.ts` | `renderer/hooks/useAudioRecorder.ts` | 6 | Unit |
| `tests/unit/RecordButton.test.tsx` | `renderer/components/RecordButton.tsx` | 5 | Unit |
| `tests/unit/RecordingList.test.tsx` | `renderer/components/RecordingList.tsx` | 7 | Unit |
| `tests/unit/App.test.tsx` | `renderer/App.tsx` | 6 | Unit |
| `tests/integration/ipc-handlers.test.ts` | `main/ipc-handlers.ts` | 6 | Integration |
| **Total** | | **55 cenários** | |
