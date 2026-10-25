# Modo IRL — primeira versão

Ative em Configurações → Ativar Modo IRL. Começa desligado em uma sessão nova. Deve ser iniciado na sala, sem deslocamento ou rosquinha em execução. Desativar solicita o retorno; não encerra o trajeto no meio. A pausa geral permanece disponível.

Reutiliza o corredor arredondado e a cozinha existentes: ida, breve parada na cozinha, volta e pausa na posição original. O ciclo dura 44 segundos. Uma haste leve acompanha a mão esquerda; o rig original é mantido. A câmera de selfie acompanha a direção de caminhada com suavização, sem editar presets normais. Não há navegação livre, rotas alternativas ou detecção dinâmica de obstáculos nesta versão. O percurso foi reaproveitado dos testes de circulação existentes; a folga da câmera e da haste em curvas ainda precisa de conferência visual no computador.

Comentários reais usam a fila e IA existentes durante o passeio; contexto inclui cômodo, destino e objetos relevantes. No modo demonstrativo continuam disponíveis as respostas locais limitadas. Voz já iniciada não é cortada. Gestos ociosos cedem ao passeio.

Rosquinhas recebidas durante o passeio aguardam a chegada à sala (até três solicitações pendentes). A sequência normal de 38 segundos usa os presets normais, então o passeio retoma se habilitado. Alternância fica bloqueada durante a rosquinha. A primeira versão usa um circuito fixo, e a desativação pode aguardar o restante do circuito.

Validação: testes do motor e continuidade do passeio, fila da rosquinha e retorno, além da suíte existente; build TypeScript/Vite. Não foi conectada live real. Testar manualmente no Windows: enquadramento 9:16 nas curvas e porta, braço/haste, contato dos pés, fala durante movimento e transição IRL → rosquinha → IRL. Não houve validação visual completa desta nova câmera nesta entrega. Nenhuma credencial nova é necessária.
