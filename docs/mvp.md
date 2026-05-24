# O que foi feito no MVP

**Versão:** 0.1.0  
**Data:** Maio 2026

---

## Visão Geral

O MVP do **Listen English** entrega um app desktop funcional para gravação de aulas de idiomas. A janela fica sempre visível no canto superior direito da tela e permite gravar, listar, reproduzir, renomear e deletar gravações, tudo salvo localmente sem dependência de serviços externos.

---

## Funcionalidades Implementadas

### Janela principal

- Dimensões: **320 × 320 px** (ajustado do PRD original de 120px para acomodar o histórico)
- `alwaysOnTop: true` — sempre visível sobre outras janelas
- Frame removido (`frame: false`) com fundo transparente para visual compacto
- Posicionada automaticamente no **canto superior direito** da tela ao abrir
- `sandbox: true` no renderer para máxima segurança

### Gravação de áudio

- Captura simultânea de **microfone + áudio do sistema** (desktop loopback) via Web Audio API e `desktopCapturer` do Electron
- Os dois streams são misturados com `AudioContext` + `MediaStreamDestination` antes de chegar ao `MediaRecorder`
- Tracks de vídeo do desktop stream são descartadas imediatamente após captura
- Formato de saída: `.webm` (`audio/webm`)
- Estado de gravação controlado pelo hook `useAudioRecorder`

### Salvamento

- Arquivo salvo em `%APPDATA%/listen-english/recordings/` (Windows) com nome `YYYY-MM-DD_HH-mm-ss.webm`
- Metadados (`id`, `fileName`, `createdAt`, `durationMs`, `name?`) mantidos em `recordings.json` na mesma pasta
- A pasta é criada automaticamente se não existir
- O salvamento é assíncrono e não bloqueia a UI

### Histórico de gravações

- Lista em ordem cronológica decrescente
- Exibe: data/hora formatada (`dd/MM/yyyy HH:mm`) e duração (`mm:ss`)
- Máximo de **50 itens** exibidos com rolagem vertical
- Ações por item: **Play/Pause**, **Renomear** (inline) e **Deletar**
- Apenas uma gravação reproduzida por vez (a anterior é pausada automaticamente)

### IPC (comunicação Main ↔ Renderer)

Os seguintes canais estão registrados via `ipcMain.handle`:

| Canal                 | Descrição                                               |
| --------------------- | ------------------------------------------------------- |
| `save-recording`      | Salva buffer + metadados, retorna `RecordingMetadata`   |
| `list-recordings`     | Retorna array ordenado dos metadados                    |
| `get-recording-path`  | Retorna caminho absoluto do arquivo por `id`            |
| `get-desktop-sources` | Retorna fontes de captura de tela via `desktopCapturer` |
| `delete-recording`    | Remove arquivo `.webm` e entrada no JSON                |
| `rename-recording`    | Atualiza campo `name` no JSON                           |

Toda entrada recebida via IPC é **validada no processo main** antes de ser processada.

---

## Arquitetura

```
Renderer (React)
  └─ useAudioRecorder      → captura áudio (mic + sistema)
  └─ App.tsx               → orquestra estado e chamadas IPC
  └─ RecordButton          → UI: gravar / parar
  └─ RecordingList         → UI: histórico com play, rename, delete
         │ window.electronAPI (contextBridge)
         ▼
Preload (index.ts)
  └─ expõe ElectronAPI via contextBridge
         │ ipcRenderer.invoke
         ▼
Main (ipc-handlers.ts)
  └─ RecordingService      → lógica de negócio (nomes, metadados)
  └─ FileRecordingRepository → persistência em disco (fs)
```

**Princípios aplicados:**

- **SRP** — cada módulo tem uma única responsabilidade
- **OCP** — novas fontes de armazenamento ou provedores de IA são adicionados por extensão (`IRecordingRepository`, `IAIProvider`)
- **DIP** — `RecordingService` depende de `IRecordingRepository`, não de `FileRecordingRepository` diretamente
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` no renderer

---

## Desvios em relação ao PRD original

| Item                           | PRD                 | Implementado                 | Motivo                                                        |
| ------------------------------ | ------------------- | ---------------------------- | ------------------------------------------------------------- |
| Altura da janela               | 120 px              | 320 px                       | 120 px era insuficiente para exibir o histórico               |
| Redimensionável                | `false`             | `true`                       | Permite o usuário ajustar conforme necessidade                |
| Captura de áudio               | Apenas microfone    | Microfone + sistema          | Requisito real identificado durante o desenvolvimento         |
| Ações no histórico             | Apenas Play/Pause   | Play/Pause + Rename + Delete | Funcionalidades básicas de gerenciamento incluídas no MVP     |
| `vite`                         | `^8.0.14`           | `^7.0.0`                     | Versão 8 ainda não disponível no npm no momento da instalação |
| `@vitejs/plugin-react`         | `^6.0.2`            | `^5.1.4`                     | Versão compatível com Vite 7                                  |
| `ElectronAPI.getRecordingPath` | `string` (síncrono) | `Promise<string>`            | Alinhado com o padrão assíncrono do IPC                       |

---

## Cobertura de Testes

Suite Jest com `ts-jest`, cobrindo:

| Módulo                       | Tipo                                          |
| ---------------------------- | --------------------------------------------- |
| `formatters.ts`              | Unit                                          |
| `RecordingService.ts`        | Unit                                          |
| `FileRecordingRepository.ts` | Unit                                          |
| `window.ts`                  | Unit                                          |
| `useAudioRecorder.ts`        | Unit (mocks de MediaRecorder e Web Audio API) |
| `RecordButton.tsx`           | Unit (Testing Library)                        |
| `RecordingList.tsx`          | Unit (Testing Library)                        |
| `App.tsx`                    | Unit (Testing Library)                        |
| `ipc-handlers.ts`            | Integration (mocks do Electron)               |

Threshold configurado: **≥ 80%** em linhas, funções, branches e statements.

---

## Dependências Reais (fonte: `package.json`)

### Produção

| Pacote      | Versão    |
| ----------- | --------- |
| `electron`  | `^42.2.0` |
| `react`     | `^19.1.0` |
| `react-dom` | `^19.1.0` |

### Desenvolvimento

| Pacote                        | Versão      |
| ----------------------------- | ----------- |
| `typescript`                  | `^6.0.3`    |
| `vite`                        | `^7.0.0`    |
| `electron-vite`               | `^5.0.0`    |
| `@vitejs/plugin-react`        | `^5.1.4`    |
| `jest`                        | `^29.7.0`   |
| `ts-jest`                     | `^29.4.11`  |
| `ts-node`                     | `^10.9.2`   |
| `jest-environment-jsdom`      | `^29.7.0`   |
| `@testing-library/react`      | `^16.3.0`   |
| `@testing-library/user-event` | `^14.6.1`   |
| `@testing-library/jest-dom`   | `^6.6.3`    |
| `@types/jest`                 | `^29.5.14`  |
| `@types/node`                 | `^22.19.19` |
| `@types/react`                | `^19.1.6`   |
| `@types/react-dom`            | `^19.1.5`   |
| `electron-builder`            | `^26.8.1`   |
