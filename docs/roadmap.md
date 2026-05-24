# Roadmap Pós-MVP

Este documento descreve as evoluções planejadas após a entrega do MVP. Cada fase é independente e pode ser implementada de forma incremental.

---

## Fase 1 — Transcrição com IA

**Objetivo:** Converter automaticamente a gravação em texto após o término.

**O que fazer:**

- Implementar `IAIProvider` (interface já definida em `shared/types.ts`) com um provider concreto, ex: `OpenAIProvider`
- Enviar o arquivo `.webm` para a API Whisper da OpenAI (ou equivalente local como `whisper.cpp`)
- Exibir a transcrição no histórico abaixo de cada item
- Persistir o texto da transcrição no `recordings.json` (novo campo `transcription?: string`)

**Pontos de extensão já preparados:**

- `IAIProvider` com métodos `transcribe()` e `summarize()`
- `IRecordingRepository` pode ser estendido com `saveTranscription(id, text)`

---

## Fase 2 — Extração de Correções do Professor

**Objetivo:** Identificar e destacar erros gramaticais e correções mencionadas durante a aula.

**O que fazer:**

- Usar a transcrição da Fase 1 como entrada
- Enviar para um LLM (ex: GPT-4o) com prompt especializado para extrair correções no formato estruturado
- Exibir as correções por gravação com destaque visual
- Persistir como `corrections?: Correction[]` no JSON

```typescript
interface Correction {
  original: string;
  corrected: string;
  explanation?: string;
}
```

---

## Fase 3 — Geração de Cards para Anki

**Objetivo:** Transformar as correções extraídas em flashcards prontos para revisão.

**O que fazer:**

- Gerar cards no formato `{ front: string; back: string }` a partir das `Correction[]`
- Exportar como arquivo `.apkg` (Anki Package) ou via **AnkiConnect** (REST local)
- Adicionar botão "Exportar para Anki" no histórico de cada gravação

**Referências:**

- [AnkiConnect API](https://foosoft.net/projects/anki-connect/)
- [genanki](https://github.com/kerrickstaley/genanki) (Python) ou equivalente em Node.js

---

## Fase 4 — Captura de Áudio do Sistema (Refinamento)

**Objetivo:** Melhorar a confiabilidade e compatibilidade da captura de loopback.

**O que fazer:**

- Tratar casos em que `desktopCapturer` não retorna fontes (ex: permissões negadas no macOS)
- Adicionar seleção manual de fonte de áudio (lista de dispositivos de entrada)
- Suporte a captura separada (microfone e sistema em canais distintos) para melhor qualidade de transcrição
- Testar comportamento no macOS (requer permissão explícita de "Screen Recording")

---

## Fase 5 — Empacotamento e Distribuição

**Objetivo:** Gerar instaladores para Windows e macOS prontos para distribuição.

**O que fazer:**

- Configurar `electron-builder` (já listado como devDependency)
- Definir ícones para cada plataforma em `assets/`
- Configurar assinatura de código (code signing) para macOS e Windows
- Publicar releases via GitHub Actions com `electron-builder --publish always`

**Comandos a adicionar no `package.json`:**

```json
"build:win":  "electron-vite build && electron-builder --win",
"build:mac":  "electron-vite build && electron-builder --mac",
"build:linux": "electron-vite build && electron-builder --linux"
```

---

## Fase 6 — Sincronização em Nuvem (Opcional)

**Objetivo:** Backup e acesso às gravações e transcrições em múltiplos dispositivos.

**O que fazer:**

- Implementar um segundo `IRecordingRepository` — ex: `S3RecordingRepository` ou `DriveRecordingRepository`
- A troca de provider não requer modificar `RecordingService` (OCP já garantido)
- Adicionar configurações de conta na UI (tela de preferências)

---

## Backlog Técnico

| Item                 | Prioridade | Descrição                                                    |
| -------------------- | ---------- | ------------------------------------------------------------ |
| Auto-update          | Alta       | Integrar `electron-updater` para atualizações automáticas    |
| Testes E2E           | Alta       | Adicionar Playwright ou Spectron para cobrir fluxos de UI    |
| Tela de preferências | Média      | Pasta de destino configurável, formato de exportação, idioma |
| Atalhos de teclado   | Média      | Iniciar/parar gravação sem clicar na janela                  |
| Notificações         | Baixa      | Notificação nativa ao salvar ou ao completar transcrição     |
| Tema escuro/claro    | Baixa      | Respeitar preferência do sistema (`prefers-color-scheme`)    |
| Modo silencioso      | Baixa      | Minimizar para bandeja (system tray) sem fechar o app        |
