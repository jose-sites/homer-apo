# Verificação de 25/10/2026

- 82 testes automatizados passaram: motor, persistência, IA/TTS com HTTP simulado, integridade da malha e skin, ciclo fechado dos pés, trajeto contínuo da rosquinha, pausa, comentários e PNGs RGBA.
- Build normal e build Pages concluídos.
- Navegador real (Chromium/WebGL): quadro 9:16, comentário selecionado e ciclo CSS dos presentes verificados. Tempos de visibilidade testados: 0, 9999, 10001, 14999 e 15001 ms.
- `standing.png` e `comment.png` são capturas reais, com família removida e coluna transparente.
- O ensaio chegou às fases de caminhada, coleta, alimentação e retorno. A última captura, após o retorno, excedeu o timeout de 20 segundos. Não houve nova tentativa de navegador/deploy após o timeout.
- Após observar a captura de alimentação, o alvo da mão foi corrigido para uma posição à frente da boca no espaço local do Homer, em vez da origem do osso da cabeça. Esse ajuste final compilou, mas não recebeu uma nova captura visual. A qualidade final desse gesto permanece como ponto de revisão visual.
- IA e TTS reais não foram chamados nesta etapa. Não há integração de presentes TikTok nem encerramento real da live.

As capturas são evidência de renderização, não uma promessa de FPS em qualquer computador.
