# Evolução da IA — etapa 1

Esta entrega prioriza interpretação, contexto de conversa e consciência ambiental. Não conclui todas as etapas do pedido.

## Implementado

- IA externa interpreta mensagens livres, incluindo pedidos locais antes interceptados pelo parser demonstrativo. O parser por palavras-chave continua apenas na demonstração.
- Catálogo extensível em `server/brain.ts`: fala, expressão, movimento entre cômodos reais e interações com água, rosquinha, geladeira e TV. A lista é deliberadamente restrita às operações validadas nesta etapa.
- JSON validado por Zod, proibição de propriedades extras, personagens ausentes, cômodos inexistentes, comandos administrativos e prioridades impostas pelo modelo. Conteúdo de chat e contexto separado das instruções de sistema. Isso limita efeitos de prompt injection; não garante que o texto gerado nunca seja enganado.
- Até três ações por decisão, fila compartilhada limitada a oito, execução após falas/animações críticas. Objetos preparam deslocamento ao cômodo correto. Logs distinguem início da ação dos eventos de conclusão já emitidos pelo motor.
- Contexto usa a posição e fase reais de deslocamento, rosquinha e IRL, incluindo destino de retorno, fila, necessidades, expressão e resultados do motor. Nenhum arquivo de cena, câmera ou rig foi alterado.
- Histórico recente separado por origem e identificador de usuário disponível no chat: oito trocas por consulta, oitenta no total, expiração em uma hora, sem persistir esse novo histórico no SQLite. Não é ainda um cadastro duradouro de espectadores nem usa ID numérico estável do TikTok. Não reúne nomes parecidos.
- Controle de comandos interpretados no painel de memória. Limpar memória também apaga o novo histórico.
- Durante IRL, conversa e expressões continuam disponíveis; pedidos físicos da IA são recusados. Presentes conservam seu fluxo existente.

## Configuração

Selecione IA externa (`openai-compatible`), modo automático e informe `AI_API_KEY` ou `OPENAI_API_KEY` no `.env` do servidor. Modelo e endpoint seguem `AI_MODEL` e `AI_BASE_URL`. Nunca inclua credenciais no frontend.

Voz não foi modificada: selecione Fish Audio → OpenAI e configure `FISH_API_KEY`, `FISH_REFERENCE_ID_HOMER` e a chave do provedor secundário. Navegador permanece último recurso nesse modo; modo demonstração continua explicitamente limitado.

## Limites e próximas etapas

- Ainda faltam memória persistente consentida por ID estável, preferências, filtragem de dados sensíveis e resumos de históricos longos.
- Ainda faltam cache semântico de FAQs/variações, limites configuráveis de gastos e controles correspondentes. O cache de áudio existente permanece.
- Seleção de chat mantém prioridade de presentes, cooldown e limites existentes; ainda não há novo ranking semântico nem política configurável de justiça entre participantes.
- Não foram acrescentados novos estados emocionais ou parâmetros expressivos de TTS.
- Aprovação semiautomática segue o fluxo existente, por ação, não aprovação transacional de um plano completo.
- A IA é instruída a falar no futuro para pedidos enfileirados; não há verificador linguístico que garanta ausência de toda afirmação incorreta. Perguntas factuais continuam sujeitas a erros do modelo.

## Validação

Testes locais com HTTP de IA simulado: continuidade por participante, expiração/limpeza, catálogo enviado ao modelo, variantes de pedidos, rejeição de ações maliciosas, contexto da rosquinha/IRL, fila de fala e movimento/geladeira e fluxo HTTP de pedido local. Os testes de variantes verificam o contrato, não comprovam compreensão semântica de um modelo real.

Nenhuma chamada paga ou conexão TikTok real foi realizada. A qualidade das respostas, gírias, referências entre participantes, comportamento sob volume real e voz precisam ser avaliados em live com credenciais.

## Atualização posterior

A etapa de operação adicionou memória persistente conservadora por ID estável, limites de chamadas/orçamento estimado, diagnóstico, reconexão, humor e votação IRL. Os detalhes atuais estão em [LIVE-OPERATIONS.md](LIVE-OPERATIONS.md). Cache semântico de perguntas, resumos livres e ranking semântico de chat continuam fora desta entrega.
