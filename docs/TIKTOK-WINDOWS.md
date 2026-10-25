# Preparação Windows e TikTok

Instale Node.js 24 LTS, baixe/clone o repositório e execute `iniciar-homer.bat`. Ele cria `.env` se faltar, instala dependências quando necessário, compila e inicia o servidor. Abra http://localhost:3001. O arquivo BAT foi revisado, mas não executado em Windows nesta entrega.

Preencha `.env`: `AI_API_KEY` (ou `OPENAI_API_KEY`), `FISH_API_KEY`, `FISH_REFERENCE_ID`, `TTS_API_KEY` (ou `OPENAI_API_KEY`). `TTS_PRIMARY=fish`, `TTS_SECONDARY=openai`. Escolha IA OpenAI-compatible, voz OpenAI-compatible (usa o roteador Fish/fallback) e modo automático no painel; retome a operação se estiver pausada. Veja também API-SETUP.md.

## Conector

Usamos tiktok-live-connector 2.5.0, comunitário e não oficial: https://github.com/zerodytrash/TikTok-Live-Connector . Sua documentação descreve CHAT, GIFT, repeatEnd e fetchAvailableGifts. Pode depender de mudanças no TikTok e do serviço de assinatura Euler Stream. `TIKTOK_SIGN_API_KEY` é opcional conforme o serviço exigir; não existe promessa de disponibilidade ou gratuidade.

Não houve conexão com uma live nesta entrega. Quando estiver pronto, configure `TIKTOK_ENABLED=true`, `TIKTOK_USERNAME=seu_usuario`, mantenha a live ativa e faça POST `/api/tiktok/connect`. Nunca conecta sozinho ao iniciar. GET `/api/tiktok/status` mostra conexão, IDs verificados e solicitação de encerramento. POST `/api/tiktok/disconnect` desliga. Reconexão é manual, sem loops infinitos. Use ADMIN_TOKEN se expuser o servidor; todas essas rotas passam pela autenticação existente.

Os IDs NÃO estão inventados ou fixados: são obtidos de `fetchAvailableGifts()` da sala e habilitados apenas quando há um único par nome/valor correspondente: Rose/1, Tiny Diny/10, Doughnut/30, Hand Heart/100. Variantes regionais não reconhecidas ficam desabilitadas. Portanto a confirmação numérica final depende do catálogo da sua sala, ainda não consultado. Eventos repetidos e atualizações intermediárias de combos não disparam várias ações.

Rosa prioriza comentário recente do remetente (ou seu próximo comentário); não interrompe áudio em reprodução. Dino enfileira salve. Doughnut aciona o motor existente, apenas quando Homer estiver livre na sala. Hand Heart gera solicitação de 60 segundos. POST `/api/tiktok/confirm-end` com `{ "id": "id retornado no status" }` pausa a aplicação e desconecta o receptor; **não encerra a transmissão na plataforma**. O operador deve encerrá-la no TikTok Live Studio. Nenhum OBS ou comando remoto foi adicionado.

## Testar sem live

No PowerShell, com o servidor aberto:

```powershell
$headers = @{} # Se ADMIN_TOKEN configurado: @{ Authorization = 'Bearer SEU_TOKEN' }
Invoke-RestMethod http://localhost:3001/api/tiktok/demo -Method Post -Headers $headers -ContentType 'application/json' -Body '{"kind":"chat","user":"visitante","text":"Oi Homer!"}'
Invoke-RestMethod http://localhost:3001/api/tiktok/demo -Method Post -Headers $headers -ContentType 'application/json' -Body '{"kind":"gift","user":"visitante","gift":"donut"}'
```

Presentes de teste: rose, dino, donut, heart. São nomes internos de demonstração, não IDs do TikTok. Em modo automático, comentários entram na seleção da IA e fila existentes. Sem chaves use provedor demo e voz navegador/silenciosa. `TIKTOK_DEMO=false` desliga a rota. O overlay mantém o ciclo e PNGs existentes; comentários reais são rotulados TikTok LIVE.

Testes locais usam eventos simulados e catálogos fictícios exclusivamente como fixtures. Fish/OpenAI permanecem cobertos pelos testes HTTP simulados existentes. Validação de live real e permissões do serviço ficam para o computador do operador.
