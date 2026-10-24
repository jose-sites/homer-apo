# Personagens articulados 2.5D

A revisão parte dos sprites existentes. Cabeça, tronco, braço e antebraço usam camadas independentes; os pivôs não são desenhados. As mangas cobrem os ombros e as silhuetas de pele se sobrepõem nas junções, sem círculos de articulação. A mão direita tem quadro específico de apontar.

Homer permanece em pé perto do sofá. Sete gestos (explicar, apontar, concordar, comemorar, surpresa, dúvida, irritação) usam entrada/saída suave, pausas e alternância em falas longas. Eventos de reprodução do AudioDirector, e não apenas o tempo estimado do servidor, comandam a animação. A boca usa os níveis de áudio existentes. Pausa, desativação e encerramento de reprodução continuam respeitados. Sem reprodução, a boca não inventa amplitude; no modo de legendas os gestos podem acompanhar o texto.

A família tem poses sentadas específicas. Marge tem joelhos e pernas sob o vestido; Bart e Lisa têm pernas relaxadas, mãos próximas ao colo e reações menores. Maggie usa uma silhueta de bebê sentado, pernas dobradas curtas e chupeta sincronizada. As posições ficam em `src/scene/characterLayout.ts`, sem remodelar o sofá. Cabeças têm pequenas inclinações e olhares laterais; piscadas têm fases distintas.

Volume é sugerido por superfícies levemente curvas, separação em profundidade, materiais que recebem iluminação da cena, gradientes e sombras de apoio no chão/assento. Pernas sentadas avançam em profundidade para não atravessar a frente do sofá. Ainda são personagens 2.5D; ângulos traseiros sem arte apropriada são ocultados pelo sistema anterior, e não apresentados como modelos completos. Overrides externos de sprite permanecem compatíveis e mantêm sua animação anterior.

Enquadramentos persistidos não são alterados. O diretor mantém uma câmera frontal/ampla já segura e evita o corte automático para close que esconda as mãos. Mudanças manuais continuam disponíveis. A atividade anterior à fala é restaurada pelo motor, respeitando mudanças manuais durante a fala.

## Verificação reproduzível

```
npm test
npm run build
npx playwright install chromium ffmpeg
CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/capture-characters.ts
CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/capture-animation.ts
```

CHROMIUM_PATH é opcional se o Chromium do Playwright estiver instalado. O teste de movimento usa oscilador Web Audio e análise RMS, sem credenciais ou clonagem. O vídeo gravado pelo Playwright não inclui trilha sonora; as legendas identificam o áudio sintético. A captura de movimento usa qualidade baixa por ser renderização de software; capturas de posição usam média. Não é um benchmark de GPU.

A inspeção visual abrange frente, esquerda e direita, poses de repouso, fala curta/longa, apontar e demais gestos. Os testes cobrem seleção sem repetição imediata, envelopes e limites, camadas independentes, ausência de círculos nos membros e restauração da atividade anterior.

## Evidências desta revisão

- [Família e Homer](verification/characters/family.png)
- [Ângulo esquerdo](verification/characters/left.png) e [direito](verification/characters/right.png)
- [Demonstração em movimento, sem trilha](verification/characters/animation.mp4)
- [Relatório do navegador](verification/characters/browser-report.json) e [teste do Pages](verification/characters/pages-report.json)

Resultado local: 76 testes, build normal, build Pages, 16 verificações do estúdio e teste estático do Pages aprovados. A revisão visual corrigiu Maggie escondida pelo braço do sofá, pernas ocluídas pela frente do assento, mãos atrás do tronco e apoio dos pés do Homer. O projeto anterior está preservado na tag `before-character-refinement-20261024`.
