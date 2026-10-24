# Configuração de IA e voz com fallback

## Preencher localmente

1. Copie `.env.example` para `.env`, na raiz do projeto. Não envie chaves pelo chat nem faça commit desse arquivo.
2. Preencha `AI_API_KEY` (IA compatível com Chat Completions), `FISH_API_KEY` (voz principal), `FISH_REFERENCE_ID` ou `FISH_REFERENCE_ID_HOMER` (voz original/licenciada, preferencialmente pt-BR) e `TTS_API_KEY` (OpenAI secundário). `OPENAI_API_KEY` é um alias compartilhado opcional para IA e OpenAI TTS; não substitui a chave Fish.
3. Mantenha `TTS_PRIMARY=fish` e `TTS_SECONDARY=openai`. Use `none` no secundário para desativá-lo. `TTS_PROVIDER` é um alias legado do principal; `TTS_PRIMARY` prevalece. Sem os seletores, instalações antigas mantêm o adaptador OpenAI anterior.
4. Ajustes: `AI_BASE_URL`, `AI_MODEL`, `FISH_MODEL`, `TTS_BASE_URL`, `TTS_MODEL`, `TTS_VOICE` e `TTS_VOICE_HOMER`. Há overrides para Marge, Bart, Lisa e Maggie no exemplo. `FISH_SPEED` aceita 0.5–2; `TTS_SPEED`, 0.25–4. `TTS_TIMEOUT_MS` aceita 100–30000 ms por provedor (padrão 10000). Formato fixo MP3. O volume permanece nos controles existentes.
5. Execute `npm install`, `npm run build`, `npm start`. Reinicie ao mudar variáveis. O servidor lê `.env`, depois `.env.local`; variáveis exportadas no processo têm prioridade. Testes com ambiente injetado não leem arquivos pessoais.
6. No painel existente, selecione IA externa (OpenAI-compatible), voz externa (OpenAI-compatible — o rótulo legado é preservado, mas o servidor usa a ordem configurada), ative áudio no navegador e escolha modo automático. Sem isso, o modo local/voz do navegador continua selecionado. Não houve redesenho do painel.

`HOST`, `PORT`, `DATA_DIR`, `ADMIN_TOKEN` e `PUBLIC_ORIGIN` continuam opcionais conforme `.env.example`. Nunca coloque chaves em variáveis `VITE_*`. Arquivos .env, chaves privadas e diretórios secrets/credentials estão ignorados. Isso não substitui revisão de arquivos com nomes arbitrários antes de um commit.

## Provedores e documentação consultada em 24/10/2026

- Fish Audio: [contrato oficial](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech.md). POST `/v1/tts`, Bearer, cabeçalho model, texto, referência e prosody.speed. O sotaque depende da referência; não há garantia de pt-BR apenas com uma chave.
- OpenAI: [Speech API](https://developers.openai.com/api/docs/guides/text-to-speech) e [parâmetros](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create). Alternativa autorizada, paga e transitória: a documentação consultada anuncia descontinuação de gpt-4o-mini-tts/tts-1/tts-1-hd em 06/01/2027. Não colocar modelo Realtime neste endpoint: exige outra integração. Planejar substituição antes dessa data.
- AnyToSpeech **possui API autorizada**: [OpenAPI](https://anytospeech.com/openapi.json), [índice](https://anytospeech.com/llms.txt), [MCP](https://anytospeech.com/mcp). A geração HTTP publicada não fornece schema de entrada/saída. A descoberta MCP sem credenciais retornou 401. Assim, não foi possível verificar um contrato de geração compatível nesta sessão. Não há adaptador AnyToSpeech implementado nem endpoints presumidos. A integração futura exige credenciais autorizadas e descoberta do contrato. O plano/créditos limitam uso; o site gratuito não implica API ilimitada.

## Comportamento e testes locais

O fluxo existente IA → ação TALK validada → fila do cliente → `/api/tts` permanece. Fish falha/ausente → OpenAI, no máximo uma tentativa por provedor por fala; provedores duplicados são deduplicados. Erros 401/429/5xx, rede, timeout ou resposta não áudio permitem fallback. Encerramento cancela sem iniciar outro provedor. Não há retry infinito nem geração simultânea dos dois. Limite de 8 MB por resposta e cache de 64 MB; chave do cache inclui URL, modelo, voz, texto e velocidade. Cache secundário é reaproveitado após a tentativa principal; a próxima fala volta a tentar o principal.

Se ambos estiverem indisponíveis, HTTP 503 sanitizado, status/evento no painel, voz do navegador/legendas. Estado, memória e transmissão não são pausados. A fila serial existente evita sobreposição local; lip-sync continua pela intensidade do áudio. O cliente aguarda até 65 s para cobrir o máximo de duas tentativas de 30 s. As requisições já enviadas podem ser cobradas mesmo após timeout.

Para conferir sem credenciais: `npm test` e `npm run build`; `GET /api/health` lista pendências sem expor segredos. Com chaves, use o teste TTS já existente no painel ou POST `/api/tts` com JSON `{"text":"Olá! Esta é uma fala de teste em português brasileiro.","character":"homer"}` (autenticação do operador quando configurada). O retorno deve ser MP3; diagnósticos indicam qual provedor atendeu. Para testar fallback real, em ambiente local de teste remova temporariamente FISH_API_KEY, reinicie e repita com TTS_API_KEY válido. Essa chamada ao secundário é paga.

Validação realizada sem chaves reais: configuração e precedência, ignorados Git, principal bem-sucedido, cache, concorrência, principal ausente, HTTP 401/429/503, timeout, payload inválido, falha dos dois, cancelamento e suíte de regressão. Serviços pagos foram simulados com fetch controlado. Somente documentação pública e rejeição 401 do MCP foram acessadas de verdade; timbre, latência e créditos reais permanecem não verificados.
