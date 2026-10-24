# Inteligência e Fish Audio

A implementação mantém o painel, cenário, câmeras e todos os clientes existentes. O modo de voz externa já existente usa Fish quando o servidor recebe `TTS_PROVIDER=fish`.

Variáveis no servidor (nunca usar prefixo VITE):

```
TTS_PROVIDER=fish
FISH_API_KEY=
FISH_MODEL=s2.1-pro
FISH_REFERENCE_ID=
# Opcional por personagem: FISH_REFERENCE_ID_HOMER
AI_API_KEY=
AI_MODEL=gpt-4o-mini
# AI_BASE_URL opcional para outro provedor compatível
```

Escolha IA externa e voz externa nos controles existentes. Sem chave Fish, a API informa configuração ausente e o cliente mantém sua recuperação por voz do navegador/legendas. Sem chave de IA, use o modo local existente, que continua sendo um banco de regras, não uma IA generativa.

A voz usa o texto brasileiro da IA; escolha uma referência original/licenciada com português brasileiro para controlar sotaque e timbre. Não há parâmetro de idioma inventado. Sem referência, o provedor usa sua seleção padrão, sem garantia de sotaque. Créditos, chave válida e acesso ao modelo são necessários. Nenhuma chamada paga real foi verificada nesta etapa.

Contrato consultado em 24/10/2026: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech.md e https://docs.fish.audio/llms.txt. POST https://api.fish.audio/v1/tts, Authorization Bearer, cabeçalho model, JSON text/format/reference_id e resposta MP3. Modelo padrão documentado: s2.1-pro.

Cache, coalescência, limite de 8 MB, timeout de 30 segundos, erros HTTP sanitizados e cancelamento no encerramento são reaproveitados. Sem repetição automática de requisições pagas. A boca continua usando a intensidade RMS do áudio reproduzido, sem alegar sincronização fonética.

A IA recebe estado, família, eventos e memória recente. As respostas entram na memória limitada a 30 registros e todas as ações passam pelo validador existente. No modo automático externo, após dois minutos sem chat nem resposta, pode comentar espontaneamente se não houver fala, fila, deslocamento ou jogo. Manual e semiautomático não recebem esse disparo. O modo local conserva seu comportamento anterior.

Verificação: testes com respostas HTTP controladas para contrato Fish, cache, credenciais ausentes e HTTP 401/429/500; teste do contexto de IA; suíte existente e build. Autenticação real, qualidade da voz, sotaque e latência dependem das credenciais.
