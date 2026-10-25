# Homer 3D e apresentação vertical

A cena renderiza um único Homer em malha 3D com skin/esqueleto (119 bones) e caminhada exportada do Blender. A simetria e a subdivisão foram aplicadas antes da exportação para manter o corpo completo. Não há morph targets nem animação de boca. Créditos e licença CC BY 4.0 de Brenden Hyde estão em `public/models/homer/` e acessíveis na transmissão.

Marge, Bart, Lisa e Maggie foram removidos da renderização. O sofá fica vazio. A implementação do PNG da família foi cancelada; nenhum arquivo precisa ser fornecido. Os módulos antigos de sprites permanecem no histórico/código para recuperação, sem serem usados pela cena.

- `/overlay`: quadro 9:16, com barras externas quando a janela é horizontal.
- Rosquinha: clique no objeto da mesa; ação validada `INTERACT_WITH_OBJECT` com `object: "donut"`. A sequência percorre uma rota contínua, alcança o objeto, leva a mão à boca imóvel e retorna. Duração de 12 segundos, pausa suportada e deslocamentos concorrentes rejeitados.
- Deslocamentos entre cômodos continuam usando as rotas existentes e o ciclo de caminhada do rig.
- Comentários: a resposta carrega um snapshot da mensagem selecionada. A apresentação mostra @, texto e foto HTTPS quando fornecida; sem foto usa a inicial. Os eventos de reprodução controlam a duração durante áudio real, com fallback visual no modo silencioso. Chat local é identificado como demonstração.
- Casa, móveis, decoração, luzes, memória e provedores de voz foram preservados. Apenas os presets principais da sala receberam enquadramento vertical para incluir Homer, sofá e mesa.

## Coluna de presentes

Coluna lateral transparente, sem botões, caixas ou fundo: Rosa, Tiny Diny, Doughnut e Hand Heart (100 moedas, confirmado pelo print do usuário). PNGs reais obtidos do CDN TikTok; fontes em `public/gifts/SOURCES.md`. Visível por 10 segundos e oculta por 5 segundos, continuamente, via animação CSS. O ciclo não é reiniciado por snapshots da transmissão.

As frases são somente legendas. Não foi integrada nenhuma ação de presentes, priorização automática ou encerramento da live. O motor, IA e voz não recebem eventos do TikTok nesta etapa.

## Executar e validar

`npm ci`, `npm run dev`. Produção: `npm run build`, `npm start`.

`npm test` verifica motor, áudio, integrações com respostas HTTP simuladas, integridade GLB (skin, pesos, duas metades e ausência de morphs), continuidade da rosquinha e comentários.

`CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/capture-homer3d.ts` captura uma execução isolada do build em `test-results/homer3d`. Cada captura tem timeout limitado; não há tentativas automáticas. Capturas não são prova de integração externa real.

`npm run build:pages` produz a prévia estática. GitHub Pages não executa o servidor de IA/TTS. A configuração externa de publicação está documentada em `PUBLISHING.md`; não foram repetidas tentativas de alterar permissões do Pages nesta etapa.

Nenhuma credencial é necessária para o Homer 3D ou interações locais. IA e voz externas continuam dependendo das variáveis descritas em `API-SETUP.md`. Não foram realizadas chamadas de IA ou TTS pagas nesta etapa.

Checkpoint de recuperação anterior: tag `before-3d-homer-20261024`.

## Resultado desta entrega

82 testes passaram; build normal e Pages concluídos. Capturas reais em `docs/captures/homer3d/`. O navegador confirmou 9:16, comentário selecionado e o ciclo de visibilidade da coluna. A captura final do retorno excedeu o timeout e não foi repetida. Essa pendência foi resolvida na finalização documentada em `DONUT-INTERACTION.md`, com teste do rig real e novas capturas da coleta, alimentação e retorno.
