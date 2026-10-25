# Finalização da rosquinha

Homer mantém a malha e o rig existentes. A interação continua com 12 segundos e não modifica cenário, câmera, voz, IA ou overlay.

1. Caminha até a frente da mesa pela rota existente.
2. Inclina o tronco e alcança a rosquinha com a mão direita. O solver CCD gira ombro e cotovelo sem alterar o comprimento dos ossos.
3. Transfere o objeto da mesa para a palma sem mudança abrupta de posição, endireita o tronco e volta-se para a câmera.
4. Leva a borda da rosquinha à boca imóvel. Dois momentos de consumo reduzem o objeto até desaparecer; não há lip sync nem animação de boca.
5. Abaixa o braço suavemente e caminha de volta à posição padrão.

O alvo da mordida fica no espaço local do personagem, à frente da boca e abaixo dos olhos. Não depende da origem do osso da cabeça. A linha do tempo é contínua e usa o relógio da interação existente; a pausa do motor continua preservando o tempo.

## Verificação

- `npx tsx --test tests/homer3d.test.ts tests/engine.test.ts`: 28 testes aprovados.
- Teste com o GLB real: mão a menos de 6 cm do alvo na coleta e na alimentação, sem alongamento do braço. A tolerância acomoda a espessura da palma e do objeto.
- Continuidade da coleta, transporte, dois momentos de consumo e relaxamento do braço.
- `npm run build`: aprovado, incluindo TypeScript.
- `CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/capture-donut.ts`: execução isolada com capturas da coleta, alimentação, último consumo e retorno; sem APIs externas. O teste mantém RAF e timers reais e fixa somente `Date.now` nas poses de inspeção.

Capturas finais em `docs/captures/donut/`. A limitação visual registrada na entrega anterior foi resolvida nesta finalização. A publicação no GitHub Pages não foi reavaliada; nenhuma integração foi adicionada.
