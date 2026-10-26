# Correções do primeiro teste Windows

## Implementado

- O modelo permanece oculto quando uma câmera ainda está dentro do volume do corpo, inclusive na saída da primeira pessoa. Trocas de presets usam fade para evitar percorrer o interior do personagem. O IRL respeita limites horizontais de paredes e portas fechadas. A câmera da cozinha mira a posição de Homer durante a chegada e a alimentação; o preset principal da sala não foi editado.
- Passos avançam conforme a distância percorrida, em vez do delta de quadros limitado. A rosquinha mantém 38 segundos, com aceleração/desaceleração nas extremidades. A pose parada usa média das fases do ciclo original para equilibrar braços e pernas. O braço IRL continua estabilizado. O pau de selfie permanece removido conforme solicitado anteriormente.
- Pedidos locais do operador são reconhecidos por uma lista explícita de intenções, sem executar texto arbitrário: ir à cozinha, voltar à sala, comer rosquinha e beber água. Até oito pedidos aguardam movimentos, falas e interações atuais. TikTok continua sendo entrada de espectadores, não comando administrativo. Não é interpretação irrestrita de qualquer ordem em linguagem natural.
- Água reutiliza o trajeto e a câmera da cozinha; Homer pega um copo, aproxima da boca, devolve à mesa e retorna. A reação falada só é enfileirada ao terminar. É uma animação simples, sem simulação física do líquido. Se estiver fora da sala, um retorno preparatório precede essa interação.
- Comentários locais e do TikTok entram automaticamente na seleção em modo automático. Fila existente limitada a 80 mensagens; seleção externa ignora mensagens com mais de três minutos, preserva prioridades e não responde novamente após sucesso. O modo demo continua sendo um banco limitado, não uma IA capaz de responder qualquer pergunta corretamente.
- A reprodução informa ao backend que uma fala está sendo preparada/reproduzida; a fila espera a conclusão real, com prazo máximo de 120 segundos e expiração se o navegador deixar de enviar sinais. Ative áudio em apenas uma janela.
- Minijogos: botão Mostrar/Ocultar jogo na live no painel. Perguntas, alternativas, resultados e vencedor (quando aplicável) aparecem na parte inferior, sem cobrir o rosto. Chat participa pelos comandos existentes ou respostas reconhecidas pelo jogo.
- Overlay: retirados PRÉVIA LOCAL, identificação de câmera/cômodo e créditos sobre a imagem. Relógio mantido; comentários, presentes e jogo preservados. Créditos CC BY 4.0 disponíveis em Configurações e no arquivo público original.
- Áudio: painel mostra status do servidor e reprodução deste navegador. A resposta TTS identifica Fish/OpenAI efetivamente utilizado; fallback do navegador informa que é uma voz genérica. Diagnóstico informa IDs de voz configurados, sem expor chaves.

## Configuração manual de voz

No `.env`, configure `FISH_API_KEY` e `FISH_REFERENCE_ID_HOMER` com um ID válido e autorizado obtido no Fish Audio; `FISH_SPEED` controla velocidade. Reinicie o servidor e escolha **Fish Audio → OpenAI** em Áudio e voz. OpenAI usa `OPENAI_API_KEY`/`TTS_API_KEY`, `TTS_VOICE_HOMER`/`TTS_VOICE` e `TTS_SPEED`. A seleção de voz é feita nesses campos, não em um catálogo online no painel. Não foi escolhido nem validado um ID de voz oficial de Homer. Sem ID adequado, não há promessa de timbre parecido com a dublagem.

## Validação e limites

106 testes aprovados e build TypeScript/Vite concluído. Novos testes: pedidos na fila, interação com água, comentários sem seleção, enquadramento da cozinha, aceleração, bloqueio de paredes/portas, voz aguardando reprodução e braço estabilizado. Nenhuma API paga foi chamada; testes de IA/TTS usam respostas simuladas.

Capturas reais em Chromium/WebGL de primeira pessoa, porta, coleta, alimentação, retorno, água e jogo: `docs/captures/feedback/`. Relógio avançado para inspecionar fases específicas, não uma avaliação contínua da fluidez. A nuvem apresenta baixa taxa de quadros por renderização via software.

Ainda testar no Windows: caminhada contínua e contato dos pés, transições em curvas/escadas, todos os móveis e ambientes do IRL, copo junto à boca e devolução, voz real/licenciada e sincronização sob latência real de rede. Os limites da câmera tratam paredes e portas; não equivalem a um sistema universal de colisão com qualquer móvel. Não foi adicionada simulação física de pés ou líquidos. Há novos cuidados e verificações, não garantia de ausência absoluta de clipping em toda a casa.
