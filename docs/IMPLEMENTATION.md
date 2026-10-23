# Etapas e escopo verificado

O roteiro original foi preservado. A base cobre todas as dez áreas em uma versão local, mas várias funcionalidades avançadas continuam parciais. O relatório de verificação final está em VALIDATION.md.

| Etapa | Implementação presente | Pendências relevantes |
| --- | --- | --- |
| 1 Fundação | React/Vite/TS, Zustand, Express, WebSocket, SQLite, rotas painel/overlay, configuração | Hospedagem remota gerenciada não faz parte da execução local |
| 2 Casa | 16 áreas, geometria/móveis, portas, escada, exterior, iluminação e níveis de qualidade | Acabamento artístico final, oclusão GPU e medição em hardware alvo |
| 3 Câmeras | 52 posições, cadastro, diretor, POV por rota, exploração, cortes/fade/suavização | Editor de trilhos/trajectórias, colisão geral contra qualquer objeto |
| 4 Personagens | 5 sprites vetoriais, expressões/piscadas/respiração, boca e pontos de presença | Artes multivista finais e animação de membros/poses completas |
| 5 Inteligência | Regras, necessidades, validação de ações, contexto/memória, adaptador de API | Qualidade conversacional com provedor real não verificada |
| 6 Áudio | Fila, voz navegador/TTS backend, cache, fallback, efeitos procedurais e posicionamento | Assets naturais/licenciados, fonemas e confirmação real de duração ao servidor |
| 7 Eventos | 18 tipos, condições/cooldowns, ativação/probabilidade/duração, relógio, tempo, TV | Eventos narrativos mais elaborados; variedade audiovisual de produção |
| 8 Minijogos | Forca (50 palavras), Quiz (10 perguntas), adivinhação, votação, desafio e chat local | Editor administrativo completo de bancos e placar histórico |
| 9 Painel/OBS | Controles funcionais, diagnósticos, fontes substituíveis, overlay 1080p, reconexão | Integrações de plataformas reais e teste dentro do OBS instalado |
| 10 Testes | Testes de regras/API/dados/áudio/cena e automação do navegador | Teste prolongado com GPU intermediária, microfone/vozes reais e provedores pagos |

## Decisões de implementação

- Servidor autoritativo: múltiplas janelas recebem o mesmo snapshot e não criam diretores autônomos independentes.
- Sem acesso arbitrário a código: chat e resposta de IA são dados; ações passam por schema e regras de execução.
- Recuperação reinicia pausada: não repete fala antiga nem deslocamento incompleto.
- O motor usa estimativas de duração de fala. A fila local impede falas de áudio simultâneas; ainda há possibilidade de diferença entre legenda/câmera e áudio quando o TTS demora.
- Seleção de cômodos e frustum culling reduzem trabalho de renderização; isso não equivale a um sistema completo de occlusion culling por GPU.
- Marcadores das câmeras no painel são ilustrações esquemáticas, não thumbnails capturados da cena.
- Fontes de interface DM Sans e Space Grotesk são locais e acompanhadas de licença OFL.

## Recuperação e preservação

Não houve acesso ao disco do executor anterior. A restauração foi feita pelos registros de escrita da conversa; a igualdade byte a byte não pode ser comprovada sem hashes do disco perdido. Os arquivos-fonte conhecidos, inclusive os módulos dos agentes, estão versionados. O lockfile foi regenerado. A tag `recovered-baseline` e os inventários guardam essa distinção.
