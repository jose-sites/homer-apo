# Servidor local

O Node é a autoridade da sessão. Painel e `/overlay` recebem snapshots pelo WebSocket `/ws`; ações passam por `POST /api/action` e pelo validador do motor. Reconectar obtém o estado atual, sem reproduzir uma fila antiga. O processo atende somente `127.0.0.1` por padrão. O Vite encaminha `/api` e `/ws` durante desenvolvimento.

SQLite usa o módulo nativo `node:sqlite` (Node 22.13+; validado com Node 24). Banco: `data/homer.sqlite`, journal WAL. Configuração, catálogos, câmeras e memória integram um snapshot transacional, salvo até 1,5 segundos após mudanças e no encerramento normal. Reinicializações recuperam a configuração em pausa, eliminando movimentos, jogos, propostas e falas em andamento. Chat bruto e nomes de espectadores não são persistidos. O histórico de eventos respeita retenção de 1–90 dias e teto de 10.000 eventos. Uma falha abrupta pode perder o último intervalo de gravação.

## Rotas

| Rota | Uso |
| --- | --- |
| `GET /api/health` | Saúde, autenticação necessária e provedores configurados. Configurado não significa conexão testada. |
| `GET /api/state` | Snapshot atual. |
| `POST /api/action` | Ação estruturada conforme `shared/types.ts`. |
| `GET /api/diagnostics` | Memória RSS real, uptime, conexões, SQLite, erros e cache de voz. |
| `GET /api/history` | Últimos 100 eventos persistidos. |
| `POST /api/ai/respond` | `{messageId?}`: resposta local ou chamada real ao provedor selecionado. |
| `POST /api/tts` | `{text,character}`: MP3 do provedor configurado; retorna 503 sem chave. |
| `DELETE /api/audio-cache` | Limpa os MP3 gerados. |
| `POST /api/session` | `{token}`: cria cookie HttpOnly para o painel/overlay autenticado. |
| `WS /ws` | Somente leitura: `{type:"state",state}`. Escritas são rejeitadas. |

O modo de demonstração usa regras e um banco de falas: não faz chamadas a modelos. O modo externo usa `/chat/completions` com JSON, timeout de 20 s, máximo de três ações e validação completa antes da execução. A IA nunca pode alterar configurações, executar comandos, ler arquivos ou fornecer código executável. No modo semiautomático, ações do provedor entram como propostas. Falhas ficam nos logs e não são apresentadas como respostas reais. A compatibilidade depende de o provedor suportar `response_format: json_object`.

TTS externo usa `/audio/speech`, timeout de 30 s, MP3 e cache de até 64 MB no servidor. `TTS_VOICE_*` permite vozes por personagem, com fallback `TTS_VOICE`. O modo navegador depende das vozes instaladas no dispositivo e permissão de reprodução; não imita as vozes da série. Não há integração Twitch/YouTube implementada: o chat local é uma interface de teste.

As chaves ficam exclusivamente no ambiente do servidor. Com `ADMIN_TOKEN`, todas as rotas de dados e o WebSocket exigem autenticação; o painel pode enviar `Authorization: Bearer ...` e criar cookie de sessão para o socket. Cookies duram 12 horas e não sobrevivem à reinicialização. A origem é validada contra localhost ou `PUBLIC_ORIGIN`, inclusive no upgrade do socket; HTTP possui limites de tamanho e frequência. Para acesso remoto, configure TLS e um proxy de confiança, `ADMIN_TOKEN` e `PUBLIC_ORIGIN`. Não exponha o modo local sem autenticação na rede.

`npm run build` gera a interface. `npm start` serve o build e backend em `http://127.0.0.1:3001`; o overlay fica em `/overlay`. O SQLite e o WebSocket persistente exigem servidor Node; esta aplicação não foi publicada em hospedagem estática/Workers.
