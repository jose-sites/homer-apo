# Voz falhando e respostas prontas

## Correção da seleção de IA

Com `AI_API_KEY` ou `OPENAI_API_KEY` configurada, a inicialização seleciona IA externa, inclusive quando um snapshot antigo tinha salvo `provider=demo`. Não muda câmera, modo manual/automático ou pausa. O chat mostra claramente qual modo de IA está em uso. `HOMER_DEMO=true` preserva a seleção manual dos provedores para quem quiser demonstração explícita.

Chave de voz disponível seleciona o TTS do servidor, preservando a escolha explícita de silêncio. Sem seletor explícito e com chave Fish, Fish passa a ser o principal. `TTS_PRIMARY` e `TTS_SECONDARY` continuam respeitados.

Não existe substituição de uma falha da OpenAI por uma resposta pronta no fluxo externo. A demonstração continua limitada e identificada. Perguntas livres são enviadas à API com o contexto existente; qualidade e precisão exigem validação real.

## Erros relatados pelo operador

- Fish HTTP 402: bloqueio de pagamento/créditos/acesso de cobrança da API. Verifique sua conta Fish; não é resolvido apenas trocando a chave ou a referência de voz.
- OpenAI HTTP 429: pode significar quota financeira/créditos insuficientes ou limite temporário de requisições. O servidor agora classifica códigos conhecidos do corpo da resposta, sem expor mensagens brutas ou segredos. Se o provedor não retornar um código conhecido, mantém a distinção como incerta.
- Códigos `insufficient_quota`/`credit_balance_exhausted`: confira saldo e limites do projeto da API. `rate_limit_exceeded`/`rate_limit_error`: aguarde e reduza frequência.
- HTTP 401: credencial recusada; 403: permissões; 404/422: confira recurso/parâmetros.

O navegador agora mostra a causa devolvida pelo servidor antes de recorrer à síntese genérica. Consulte também Áudio → diagnóstico. ID da voz não comprova acesso à geração nem saldo.

Fontes: [OpenAI: erros 429](https://help.openai.com/en/articles/5955604-troubleshooting-api-rate-limits-and-429-errors), [documentação Fish](https://docs.fish.audio/). O modelo Fish `s2.1-pro` continua configurado; não foi trocado com base em um erro financeiro.

## Aplicar no Windows

Esta correção foi feita no workspace na nuvem, não no PC do operador. Para uma instalação clonada via Git, feche o servidor, execute `git pull origin main` na pasta do projeto e reabra `iniciar-homer.bat`. O `.env` local não é versionado e deve ser preservado. Se o Git informar alterações locais conflitantes, não use reset/clean: preserve esses arquivos antes de atualizar. Instalações via ZIP precisam atualizar os arquivos do projeto preservando `.env` e `data/`.

Reinicie após editar as variáveis. Use `http://localhost:3001`, ative o áudio e retome a operação. Para responder sem cliques individuais, selecione modo Automático. Não foi realizada nenhuma chamada paga para validar estas correções.
