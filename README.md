# Listen English

App desktop minimalista para gravação de aulas de idiomas. Fica fixado no canto superior da tela, permitindo iniciar e parar gravações com um clique. Cada sessão é salva automaticamente com data e hora no nome.

---

## Funcionalidades (MVP)

- Janela compacta, sempre visível no topo da tela (320 × 320 px, `alwaysOnTop`)
- Gravação de áudio com mistura de microfone + áudio do sistema via Web Audio API
- Salvamento automático em `.webm` com nome no padrão `YYYY-MM-DD_HH-mm-ss.webm`
- Histórico de gravações com data, hora e duração (máx. 50 itens)
- Reprodução direta no app (Play/Pause por item)
- Renomear e deletar gravações pelo histórico

---

## Stack

| Camada               | Tecnologia              | Versão                 |
| -------------------- | ----------------------- | ---------------------- |
| Runtime desktop      | Electron                | `^42.2.0`              |
| UI                   | React                   | `^19.1.0`              |
| Linguagem            | TypeScript              | `^6.0.3`               |
| Build                | Vite + electron-vite    | `^7.0.0` / `^5.0.0`    |
| Testes               | Jest + ts-jest          | `^29.7.0` / `^29.4.11` |
| Testes de componente | Testing Library (React) | `^16.3.0`              |
| Node.js              | LTS                     | `22.x`                 |

> Versões exatas em [`package.json`](./package.json).

---

## Pré-requisitos

- Node.js `22.x` LTS
- npm `10.x`

---

## Instalação

```bash
npm install
```

---

## Comandos

| Comando                 | Descrição                                         |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Inicia o app em modo desenvolvimento (hot reload) |
| `npm run build`         | Compila para produção na pasta `out/`             |
| `npm test`              | Executa a suite de testes                         |
| `npm run test:coverage` | Testes com relatório de cobertura                 |
| `npm run test:watch`    | Testes em modo watch                              |
| `npm run typecheck`     | Verifica tipos sem compilar                       |

---

## Estrutura do Projeto

```
src/
├── main/                        # Processo principal do Electron
│   ├── main.ts                  # Entry point: inicializa app e janela
│   ├── window.ts                # Configuração da BrowserWindow
│   ├── ipc-handlers.ts          # Handlers IPC (save, list, delete, rename...)
│   └── recordings/
│       ├── RecordingService.ts  # Lógica de negócio: nomes, metadados, orquestração
│       └── FileRecordingRepository.ts  # Persistência em disco (fs)
├── preload/
│   ├── index.ts                 # contextBridge — expõe API para o renderer
│   └── api.ts                   # Tipagem do ElectronAPI
├── renderer/                    # Interface React
│   ├── App.tsx                  # Componente raiz
│   ├── components/
│   │   ├── RecordButton.tsx     # Botão gravar/parar
│   │   └── RecordingList.tsx    # Lista com play, rename e delete
│   ├── hooks/
│   │   └── useAudioRecorder.ts  # MediaRecorder + Web Audio API
│   └── styles/global.css
└── shared/
    ├── types.ts                 # Interfaces compartilhadas
    ├── constants.ts             # Constantes globais
    └── formatters.ts            # Formatação de datas e durações
tests/
├── unit/                        # Testes unitários (lógica pura)
└── integration/                 # Testes de integração (fluxo IPC)
```

---

## Onde as gravações são salvas?

Os arquivos `.webm` e o índice `recordings.json` são salvos em:

| SO      | Caminho                                                    |
| ------- | ---------------------------------------------------------- |
| Windows | `%APPDATA%\listen-english\recordings\`                     |
| macOS   | `~/Library/Application Support/listen-english/recordings/` |
| Linux   | `~/.config/listen-english/recordings/`                     |

---

## Arquitetura

O projeto segue os princípios SOLID e a separação de processos do Electron:

- **Main** — acesso ao sistema de arquivos e ciclo de vida do app
- **Preload** — ponte segura via `contextBridge` (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`)
- **Renderer** — UI React sem acesso direto ao Node.js

Veja mais detalhes em [docs/mvp.md](./docs/mvp.md).

---

## Próximos Passos

Veja o roadmap em [docs/roadmap.md](./docs/roadmap.md).

---

## Licença

Uso pessoal.
