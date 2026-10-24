# Sala e cozinha — geometria e acabamento

Revisão localizada: conserva câmeras, coordenadas, personagens, navegação, portas e ações da televisão/geladeira. Móveis dos outros ambientes permanecem intactos. O acabamento adicional da escada é renderizado com a sala sobre a estrutura navegável existente.

## Mudanças

- Sofá com assentos individuais, encostos inclinados, costuras, braços cilíndricos, pés e almofadas.
- Mesas com bordas, saias e pernas afuniladas; controle remoto, livros, prato, tapete oval com faixas e bordado periférico.
- Traseira da TV com volume, ventilação, etiqueta e cabo, preservando a tela funcional.
- Abajur cerâmico, cúpula, plantas de folhas orientadas, molduras e acabamento dos degraus e balaústres.
- Armários emoldurados, puxadores curvos, rodapés, prateleira com louça, azulejos, potes e utensílios.
- Pia com borda, ralo e torneira curva; fogão com grades, painel, forno e pano; coifa inclinada com grelha.
- Geladeira com portas visuais separadas, puxadores, ventilação e ímãs. Mantém o mecanismo de abertura conjunta existente.
- Mesa azul e cadeiras com assentos moldados, travessas e pernas afuniladas. Orientação corrigida: todos os assentos voltados à mesa.
- Luz lateral quente, sombras de 512 px (desativadas em qualidade baixa), materiais específicos para cerâmica e metal. Nenhuma dependência adicionada.

## Inspeção visual

Capturas reais de Chromium/WebGL nas câmeras existentes foram abertas e comparadas à referência. A inspeção resultou em correções dos potes sem apoio, continuidade dos armários, volume da coifa e orientação das cadeiras apontada pelo usuário.

Composição: sofá ao fundo, TV no primeiro plano esquerdo, mesa central, arco esquerdo e escada direita. Cozinha: pia sob janela, bancada em L, fogão ao fundo, geladeira direita, mesa azul e cadeiras vermelhas.

A planta e as câmeras preservadas limitam a reprodução exata da referência. Paisagem nas janelas, texturas e densidade de decoração continuam mais simples. Testes automatizados verificam funcionamento, não qualidade artística.

Capturas finais: [sala](verification/deep-remodel/living.png), [cozinha](verification/deep-remodel/kitchen.png), [família](verification/deep-remodel/family.png).

## Recuperação e validação

Tag anterior: `before-deep-room-remodel-20261024`, commit `08c3cae`. Backup Git completo local: `/workspace/homer-recovery/before-deep-room-remodel.bundle`.

61 testes, build TypeScript/Vite e 16 verificações de navegador. SwiftShader não representa medição de FPS em GPU física. O relatório de captura registra erros de página; as imagens são a evidência visual.
