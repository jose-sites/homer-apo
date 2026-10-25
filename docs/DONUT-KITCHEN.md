# Rosquinha na cozinha — sequência de 38 segundos

Reutiliza a cozinha, a passagem `kitchen-living`, o Homer GLB, seu ciclo de caminhada e o alcance de braço já existentes. Nenhum preset da câmera principal foi editado. IA, TTS, TikTok e a coluna vertical de presentes continuam usando os mesmos sistemas.

- 0–1,8 s: primeira pessoa, giro inicial.
- 1,8–14 s: caminhada com cantos arredondados; aos 8 s, a câmera elevada mostra a aproximação da porta, a cerca de três passos. A câmera da cozinha assume quando Homer atravessa a passagem.
- 14–24,5 s: alcançar, pegar uma rosquinha, levá-la à boca, duas mordidas e baixar o braço. Outras três rosquinhas permanecem sobre a mesa.
- 24,5–37 s: retorno pelo mesmo corredor livre de móveis.
- 37–38 s: já na posição original, restauração da posição, alvo e FOV capturados da câmera principal.

As mudanças de plano usam fades curtos para não deslocar a câmera através de paredes. O formato 9:16 permanece intacto. A pausa geral congela a sequência. Ações concorrentes de câmera, movimento, objetos, eventos e animação são rejeitadas até o retorno; mensagens e áudio continuam disponíveis. A passagem é aberta ao iniciar.

## Validação

`npm test`: 91 testes aprovados. `npm run build`: concluído. Testes cobrem continuidade, duração, vão da porta, distância aos principais móveis, alcance da mão no GLB real, pausa, exclusão de ações concorrentes e preservação dos presets.

`CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/capture-donut.ts`: capturas reais em Chromium/WebGL, viewport 360×640, sem erros de execução. O script avança o relógio para inspecionar fases específicas; não é uma gravação contínua. Capturas em `docs/captures/donut-kitchen/`. Conferidas visualmente a coleta, alimentação, passagem e câmera restaurada. Não houve conexão com TikTok nem alteração de credenciais/deploy.
