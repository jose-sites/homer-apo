# Revisão de filas e recuperação

- A fila de fala agora aguarda a conclusão da interação da rosquinha antes de iniciar a próxima fala. Não corta áudio que já estava em reprodução.
- Comentários são marcados como processados somente após sucesso da IA. Falhas permitem nova tentativa no intervalo configurado, sem repetição imediata de requisições.
- Callbacks de clientes antigos do TikTok são ignorados após desconexão ou substituição da conexão. O catálogo de presentes é limpo ao desconectar, evitando reutilizar IDs de outra sala. A reconexão continua manual pela rota existente; não foi adicionada reconexão automática.

Validação: 97 testes passaram, incluindo fila durante os 38 segundos, limpeza do catálogo e os testes existentes de falhas, timeout e fallback do Fish Audio. Build de produção validado. Nenhuma live real ou API paga foi conectada. Cenário, modelo, enquadramentos e gestos não foram alterados. Reconexão com uma sala real ainda precisa de validação operacional.
