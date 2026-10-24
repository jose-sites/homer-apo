# Sala, cozinha e personagens — revisão pela referência de 24/10/2026

Esta revisão altera a disposição física dos elementos, além das cores. A base anterior permanece na tag `before-reference-layout-20261024` e no histórico Git.

## Capturas da aplicação

- [Sala, sem personagens para conferir os móveis](verification/reference/living.png)
- [Cozinha](verification/reference/kitchen.png)
- [Família dentro da sala](verification/reference/family.png)
- [Cinco personagens e suas expressões](verification/reference/characters.png)
- [Verificação dos 16 ambientes](verification/reference/rooms.jpg)

A sala/cozinha/família são capturas do WebGL. A prancha de personagens é uma captura no navegador dos mesmos SVGs gerados pelo módulo de sprites usado na cena, com estados reais de expressão, boca e piscada.

## Composição implementada

| Referência | Implementação |
| --- | --- |
| Sofá central, encostado ao fundo | Sofá menor, deslocado levemente à esquerda, com três assentos, braços arredondados e almofada |
| TV à esquerda em primeiro plano | TV/console reposicionados; o enquadramento principal mostra suas costas e a tela continua funcional no ambiente 3D |
| Mesa à frente do sofá | Mesa redimensionada, rosquinha, caneca e objeto sobre o tampo; tapete oval e piso verde |
| Arco à esquerda | Passagem curva de geometria real conectando a sala à cozinha, com batente interativo |
| Escada à direita atrás do sofá | Escada, aberturas nos pisos e pontos do percurso deslocados juntos; mantém conexão com o andar superior |
| Quadro sobre o sofá e luminária à esquerda | Quadro do barco central, quadros menores, criado lateral roxo e luminária; planta ao lado direito |
| Pia e janela no fundo da cozinha | Pia deslocada para baixo da janela, com bancada e torneira |
| Armários e bancada em L | Armários roxos ao fundo e retorno na parede esquerda, puxadores, micro-ondas e pequenos objetos |
| Fogão ao centro-direita e geladeira à direita | Fogão, forno, coifa e geladeira reposicionados; geladeira conserva abertura e validação da interação |
| Mesa azul e cadeiras vermelhas à frente | Mesa, quatro cadeiras e objetos reorganizados, com circulação pela lateral direita |
| Arco à direita da cozinha | É a mesma passagem física vista da sala, não uma imagem ou um portal sem conexão |

## Personagens

Homer, Marge, Bart, Lisa e Maggie foram redesenhados em SVG, com silhuetas e proporções diferentes dos sprites anteriores, contornos mais finos e gradientes para volume. A escala da família dentro da sala também foi corrigida.

As cinco expressões são neutro, alegre, confuso, irritado e sonolento. Há estados de boca fechada/semiaberta/aberta, piscadas e variação da chupeta de Maggie. O motor de voz, os eventos e o carregador de artes substituíveis continuam usando as interfaces anteriores. Os desenhos são sprites 2.5D frontais, não modelos tridimensionais completos.

## Planta e compatibilidade

Os 16 ambientes e o grafo de conexões foram mantidos. Para colocar a cozinha à esquerda, os centros dos ambientes laterais conectados foram espelhados, incluindo os correspondentes do andar superior. Fachada, câmeras iniciais e portais acompanham essa mudança. A escada foi deslocada dentro do hall; seus vãos e percursos usam os mesmos parâmetros compartilhados.

Snapshots recebem `layoutRevision: 2`. Na recuperação de dados antigos, câmeras personalizadas dos cômodos movidos são transladadas pelo deslocamento do cômodo, uma única vez. Câmeras iniciais mantêm seus IDs e usam os novos enquadramentos. Configurações, falas, memória, eventos, minijogos e provedores não foram substituídos.

Arcos abertos recolhem a folha da porta para não bloquear a composição; clicar no batente permite fechá-la. A navegação abre as passagens necessárias e impede fechar uma porta utilizada pelo percurso ativo. O vão largo junto à escada continua podendo ser fechado pelo motor de ações.

Os cômodos adjacentes recebem estrutura suficiente para fechar as linhas de visão através dos arcos e do vão da escada. Sala e cozinha exibem o mobiliário uma da outra através da passagem. Pisos e tetos sobrepostos foram separados para evitar cintilação.

## Adaptações

A referência é uma ilustração com perspectiva e proporções próprias. O arco da sala fica na parede lateral esquerda, e a escada usa a profundidade do hall existente. Isso mantém a casa navegável; a composição aproxima a referência sem reproduzir cada pixel ou substituir o cenário por uma imagem. As artes são vetoriais, com acabamento diferente do render ilustrado fornecido.

## Verificação reproduzível

```bash
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/capture-reference.ts
CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/inspect-rooms.ts
```

A suíte contém 61 testes, incluindo circulação sem atravessar móveis, portais, suporte dos patamares, expressões distintas e migração de câmeras sem duplicar o deslocamento. O teste de navegador exercita 16 fluxos do painel/overlay. Os scripts usam servidor e banco temporários; não alteram o estado do operador.

As capturas focadas usam qualidade média e renderização por software. Isso verifica funcionamento e aparência, mas não é um benchmark de desempenho em GPU. Relatórios desta revisão são mantidos junto às capturas.
