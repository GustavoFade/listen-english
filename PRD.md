# PRD — Listen English: App Desktop de Gravação para Aprendizado de Idiomas

**Versão:** 1.0.0  
**Data:** 2026-05-23  
**Stack:** Electron + TypeScript + Vite  

---

## 1. Visão Geral do Produto

App desktop minimalista que fica fixado no canto superior da tela e permite gravar áudio de aulas de idiomas. Cada gravação é salva automaticamente com data e hora no nome. O app é a base para evoluções futuras como transcrição por IA, extração de correções do professor e geração de cards para Anki.

---

## 2. Problema que Resolve

Alunos de idiomas perdem o contexto das correções e observações feitas durante as aulas. Um app discreto, sempre visível e de operação simples elimina essa fricção, criando um arquivo local confiável de toda a prática oral.

---

## 3. Objetivos do MVP

| # | Objetivo |
|---|----------|
| 1 | Janela pequena e fixa no topo da tela |
| 2 | Botão **Gravar** para iniciar captura de áudio |
| 3 | Botão **Parar** para encerrar e salvar |
| 4 | Arquivo salvo automaticamente com nome `YYYY-MM-DD_HH-mm-ss.webm` |
| 5 | Histórico simples das gravações com data, hora e duração |
| 6 | Reprodução dos áudios salvos diretamente no app |

---

## 4. Fora do Escopo do MVP

- Integração com IA (transcição, resumo, correções)
- Geração de cards para Anki
- Sincronização em nuvem
- Captura de áudio do sistema (apenas microfone no MVP)
- Autenticação ou contas de usuário

---

## 5. Requisitos Funcionais

### RF-01 — Janela sempre visível
- A janela principal deve ter dimensões fixas de **320 × 120px**
- Deve ficar sempre acima das outras janelas (`alwaysOnTop: true`)
- Não deve ser redimensionável (`resizable: false`)
- Deve ser posicionada no canto superior direito da tela ao abrir

### RF-02 — Gravação de áudio
- O botão **Gravar** inicia a captura pelo microfone via `getUserMedia`
- O botão fica desabilitado durante gravação ativa
- O botão **Parar** encerra a gravação e dispara o salvamento
- Os chunks de áudio são coletados em memória durante a gravação
- O formato de saída é `.webm` (codec `audio/webm`)

### RF-03 — Salvamento de arquivos
- O arquivo é salvo na pasta `recordings/` dentro do diretório de dados do app (`app.getPath('userData')`)
- O nome segue o padrão: `YYYY-MM-DD_HH-mm-ss.webm`
- Um arquivo de metadados `recordings.json` é mantido na mesma pasta com: `id`, `fileName`, `createdAt`, `durationMs`

### RF-04 — Histórico de gravações
- A lista exibe as gravações em ordem cronológica decrescente
- Cada item mostra: data, hora e duração formatada (`mm:ss`)
- Máximo de 50 itens exibidos no histórico (rolagem vertical)

### RF-05 — Reprodução de áudio
- Cada item do histórico tem um botão **Play/Pause**
- A reprodução usa o elemento `<audio>` nativo do HTML
- Apenas uma gravação pode ser reproduzida por vez

---

## 6. Requisitos Não-Funcionais

### RNF-01 — Arquitetura SOLID
- **S** — Cada módulo tem uma única responsabilidade bem definida
- **O** — Novas funcionalidades (ex: envio para IA) são adicionadas por extensão, não por modificação
- **L** — Implementações são substituíveis via interfaces (ex: trocar provedor de IA)
- **I** — Interfaces pequenas e focadas (ex: `IAudioRecorder` não expõe métodos de salvamento)
- **D** — Módulos de alto nível dependem de abstrações, não de implementações concretas

### RNF-02 — Separação de processos Electron
- O processo `main` gerencia janela, ciclo de vida e acesso ao sistema de arquivos
- O `preload` expõe apenas as funções necessárias via `contextBridge`
- O `renderer` não tem acesso direto ao Node.js

### RNF-03 — Segurança
- `contextIsolation: true` e `nodeIntegration: false` no renderer
- Todos os dados de entrada do renderer são validados no processo main antes de serem usados
- Nenhum caminho de arquivo é construído a partir de entrada direta do usuário sem sanitização

### RNF-04 — Performance
- O app não deve consumir mais de **2% de CPU** em idle
- O salvamento do arquivo não deve bloquear a UI

### RNF-05 — Testabilidade
- Toda lógica de negócio (gravação, nomes de arquivos, metadados) é testável de forma isolada, sem dependência do Electron ou do DOM

---

## 7. Stack Tecnológica — Versões Fixadas

> Versões verificadas em 2026-05-23 com Node.js v22.5.1

### Runtime

| Dependência | Versão | Justificativa |
|-------------|--------|---------------|
| Node.js | `22.5.1` (LTS) | Versão LTS ativa em uso no ambiente |
| npm | `10.8.2` | Versão instalada com Node 22 LTS |

### Dependências de produção

| Pacote | Versão | Justificativa |
|--------|--------|---------------|
| `electron` | `^42.2.0` | Última versão estável; suporte nativo a TypeScript e APIs modernas |

### Dependências de desenvolvimento

| Pacote | Versão | Justificativa |
|--------|--------|---------------|
| `typescript` | `^6.0.3` | Última versão estável; compatível com Electron 42 e Node 22 |
| `vite` | `^8.0.14` | Build tool principal; compatível com electron-vite 5 |
| `electron-vite` | `^5.0.0` | Plugin oficial Vite para Electron; substitui configuração manual |
| `@vitejs/plugin-react` | `^6.0.2` | Suporte a JSX/TSX no renderer, se necessário |
| `electron-builder` | `^26.8.1` | Empacotamento e distribuição (adicionado apenas na etapa de build) |
| `@types/node` | `^22.19.19` | Tipos do Node 22; alinhado com a versão do runtime |
| `jest` | `^29.7.0` | **Jest 29** — versão compatível com ts-jest 29 (ts-jest ainda não suporta jest 30) |
| `ts-jest` | `^29.4.11` | Transformer TypeScript para Jest; requer jest 29.x |
| `@types/jest` | `^29.5.14` | Tipos para Jest 29 |

> **Atenção:** `ts-jest` na versão `29.x` **não é compatível** com `jest 30.x`. Use `jest@^29.7.0` até que `ts-jest` publique a versão 30.

---

## 8. Estrutura de Arquivos

```text
listen_english/
├── src/
│   ├── main/
│   │   ├── main.ts               # Entry point: inicializa o app Electron e a janela
│   │   ├── window.ts             # Configuração da BrowserWindow (tamanho, posição, alwaysOnTop)
│   │   ├── ipc-handlers.ts       # Registra todos os handlers IPC do processo main
│   │   └── recordings/
│   │       ├── FileRecordingRepository.ts  # Implementação: salva gravações em disco
│   │       └── RecordingService.ts         # Orquestra salvamento e metadados
│   ├── preload/
│   │   ├── index.ts              # Expõe a API via contextBridge
│   │   └── api.ts                # Tipagem da ponte IPC (ElectronAPI)
│   ├── renderer/
│   │   ├── index.html            # HTML principal
│   │   ├── main.tsx              # Entry point do renderer (monta o app React/TS)
│   │   ├── App.tsx               # Componente raiz
│   │   ├── components/
│   │   │   ├── RecordButton.tsx  # Botão gravar/parar com estado visual
│   │   │   └── RecordingList.tsx # Lista de gravações com play/pause
│   │   ├── hooks/
│   │   │   └── useAudioRecorder.ts  # Encapsula MediaRecorder, chunks e estado
│   │   └── styles/
│   │       └── global.css        # Estilos globais da UI compacta
│   └── shared/
│       ├── types.ts              # Tipos compartilhados entre main, preload e renderer
│       └── constants.ts          # Pasta de gravações, extensão, limite do histórico
├── tests/
│   ├── unit/
│   │   ├── RecordingService.test.ts       # Testa lógica de nomes e metadados
│   │   ├── FileRecordingRepository.test.ts # Testa salvamento em disco (com mock de fs)
│   │   └── formatters.test.ts             # Testa funções de formatação de data/duração
│   └── integration/
│       └── ipc-handlers.test.ts           # Testa fluxo IPC com mocks do Electron
├── recordings/                    # Gerado em runtime (não versionado)
├── assets/
│   └── icon.png
├── package.json
├── tsconfig.json
├── tsconfig.node.json             # Configs específicas para main e preload
├── electron.vite.config.ts        # Configuração do electron-vite
└── jest.config.ts                 # Configuração do Jest
```

---

## 9. Interfaces e Contratos

### `IAudioRecorder`
```typescript
interface IAudioRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  readonly isRecording: boolean;
}
```

### `IRecordingRepository`
```typescript
interface IRecordingRepository {
  save(audioBlob: ArrayBuffer, metadata: RecordingMetadata): Promise<string>;
  list(): Promise<RecordingMetadata[]>;
  getFilePath(id: string): string;
}
```

### `IAIProvider` *(extensão futura — não implementada no MVP)*
```typescript
interface IAIProvider {
  transcribe(audioPath: string): Promise<string>;
  summarize(text: string): Promise<string>;
}
```

### `RecordingMetadata` (em `shared/types.ts`)
```typescript
interface RecordingMetadata {
  id: string;
  fileName: string;
  createdAt: string;   // ISO 8601
  durationMs: number;
}
```

### `ElectronAPI` (bridge do preload)
```typescript
interface ElectronAPI {
  saveRecording(buffer: ArrayBuffer, metadata: RecordingMetadata): Promise<string>;
  listRecordings(): Promise<RecordingMetadata[]>;
  getRecordingPath(id: string): string;
}
```

---

## 10. Estratégia de Testes

### Filosofia
- Testar **lógica de negócio pura** de forma isolada (sem Electron, sem DOM)
- Mockar dependências externas (`fs`, `electron`, `MediaRecorder`)
- Cobrir os caminhos felizes e os casos de erro principais

### Configuração do Jest (`jest.config.ts`)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/renderer/**',     // UI — coberta por testes e2e no futuro
    '!src/preload/index.ts', // Bridge — coberto por testes de integração
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
```

### Casos de Teste Prioritários

| Módulo | Cenário | Tipo |
|--------|---------|------|
| `RecordingService` | Gera nome de arquivo com formato correto | Unit |
| `RecordingService` | Salva metadados em JSON após gravação | Unit |
| `RecordingService` | Lança erro se o buffer estiver vazio | Unit |
| `FileRecordingRepository` | Cria pasta `recordings/` se não existir | Unit |
| `FileRecordingRepository` | Retorna lista ordenada por data decrescente | Unit |
| `formatters` | `formatDuration(90000)` retorna `"01:30"` | Unit |
| `formatters` | `formatFileName(date)` retorna padrão ISO | Unit |
| `ipc-handlers` | `save-recording` persiste e retorna path | Integration |
| `ipc-handlers` | `list-recordings` retorna array serializado | Integration |

### `tsconfig.json` para testes (`tsconfig.node.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "./dist-test",
    "types": ["jest", "node"]
  },
  "include": ["src/main/**/*", "src/shared/**/*", "tests/**/*"]
}
```

---

## 11. Fluxo Principal de Dados

```
[Usuário clica Gravar]
       │
       ▼
useAudioRecorder.start()
  └─ getUserMedia({ audio: true })
  └─ new MediaRecorder(stream)
  └─ mediaRecorder.start()
  └─ coleta chunks em onDataAvailable

[Usuário clica Parar]
       │
       ▼
useAudioRecorder.stop()
  └─ mediaRecorder.stop()
  └─ new Blob(chunks, { type: 'audio/webm' })
  └─ blob.arrayBuffer()
       │
       ▼
window.electronAPI.saveRecording(buffer, metadata)
  [IPC: save-recording]
       │
       ▼
RecordingService.save(buffer, metadata)
  └─ FileRecordingRepository.save()
       ├─ fs.writeFile(filePath, Buffer)
       └─ atualiza recordings.json
       │
       ▼
Retorna { id, fileName, createdAt, durationMs }
  └─ RecordingList atualiza a UI
```

---

## 12. Configuração do `package.json`

```json
{
  "name": "listen-english",
  "version": "0.1.0",
  "description": "App desktop para gravação de aulas de idiomas",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "electron": "^42.2.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^22.19.19",
    "@vitejs/plugin-react": "^6.0.2",
    "electron-builder": "^26.8.1",
    "electron-vite": "^5.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.11",
    "typescript": "^6.0.3",
    "vite": "^8.0.14"
  }
}
```

---

## 13. Marcos de Desenvolvimento

| Marco | Entregável | Critério de aceite |
|-------|-----------|-------------------|
| **M1 — Janela base** | Janela 320×120 sempre visível | App abre, fica no topo, não redimensiona |
| **M2 — Gravação funcional** | Botões Gravar/Parar | Clique grava, clique para e salva o `.webm` |
| **M3 — Salvamento correto** | Arquivo com nome padronizado | Nome segue `YYYY-MM-DD_HH-mm-ss.webm` |
| **M4 — Histórico** | Lista de gravações | Exibe itens ordenados, com data e duração |
| **M5 — Reprodução** | Play/Pause no histórico | Reproduz o áudio salvo sem travar a UI |
| **M6 — Cobertura de testes** | Suite Jest passando | ≥ 80% de cobertura nos módulos de lógica |

---

## 14. Roadmap Pós-MVP

1. **IA — Transcrição:** enviar `.webm` para API de STT (ex: OpenAI Whisper)
2. **IA — Correções:** extrair e destacar erros gramaticais apontados pelo professor
3. **Anki — Cards:** gerar cards a partir das correções extraídas
4. **Anki — Sync:** exportar deck ou sincronizar via AnkiConnect
5. **Áudio do sistema:** mesclar microfone + sistema com Web Audio API
6. **Empacotamento:** gerar instalador com `electron-builder` para Windows e macOS

---

## 15. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| `ts-jest` não suportar jest 30 | Alta | Médio | Fixar `jest@^29.7.0` até release de `ts-jest@30` |
| `getUserMedia` sem permissão | Média | Alto | Tratar erro com mensagem clara na UI |
| Arquivo corrompido se app fechar durante gravação | Baixa | Médio | Salvar chunks incrementalmente no futuro |
| Electron 42 com breaking changes em APIs futuras | Baixa | Baixo | Fixar versão com `^` e revisar changelog antes de atualizar |
