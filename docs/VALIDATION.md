# Verificação da entrega — 23/10/2026

Versão local funcional, com escopo avançado ainda parcial. Fontes preservados na tag `recovered-baseline`; correções posteriores em commits separados. A recuperação não incluiu o banco/cache do executor anterior.

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm test` | 57 testes aprovados, 0 falhas |
| `npm run build` | TypeScript estrito e build Vite aprovados |
| `npm run test:browser` | 16 verificações aprovadas no Chromium, sem erros JavaScript capturados |
| `scripts/inspect-rooms.ts` | 16 ambientes renderizados, capturados e revisados visualmente; sem erros JavaScript |
| Overlay | Renderização real WebGL em 1920×1080, estado compartilhado, sem painel administrativo |
| Layout móvel | 390×844 sem rolagem horizontal |

Ambiente: Linux, Node.js 24.19.0, Chromium headless com SwiftShader, qualidade baixa e resolução adaptativa desativada durante a automação. Capturas: [estúdio](verification/studio.jpg) e [todos os ambientes](verification/rooms.jpg). São capturas da aplicação, não imagens de cenário usadas no lugar do 3D.

Os testes de regras cobrem câmeras, caminhos/escadas/portais, validação de ações, seleção de falas, modos, eventos, pausa, jogos e snapshots. Os testes de servidor cobrem SQLite, retenção, autenticação, origem, reconexão, falhas de provedores, cancelamento de IA e proteção dos dados públicos dos jogos. Os testes de áudio cobrem ordenação, prioridade, deduplicação, interrupção e retomada. Os testes de cena cobrem geometria das portas, pisos da escada, interpolação e sprites substituíveis.

A automação do navegador opera os controles reais do painel: troca/cadastro de câmera, expressão/fala, chat de demonstração, Forca/votação, intervalos numéricos, chuva, pausa, diagnóstico/efeito sonoro, configurações, overlay e reconexão após interrupção forçada do socket. A chegada ao segundo andar usa avanço explícito do relógio do motor; isso não é uma gravação visual de todas as rotas completas.

## Correções desta retomada

- Paredes compartilhadas e portas alinhadas aos caminhos, pisos/tetos com abertura da escada, desvio de móveis nos pontos de passagem.
- Família visível à frente do sofá, menos geometria e descarte de móveis de cômodos inativos; sombras estáticas atualizadas somente quando necessário.
- Manifesto de sprites locais com ângulos/frames opcionais e fallback identificado.
- Campos numéricos editáveis até a confirmação, contagem de votos correta, congelamento visual dos jogos durante pausa e chat limitado ao schema.
- Áudio sequencial recuperável, efeitos procedurais posicionais, limpeza de recursos e ausência de repetição de eventos antigos ao habilitar som.
- IDs públicos de jogos opacos, remoção dos identificadores de eleitores e cancelamento de respostas de IA após mudança de modo/provedor/pausa.
- Fontes locais, favicon e documentação de execução, preservação e limites.

## Limites da verificação

- Não foram usados serviços pagos/credenciais reais de IA ou TTS nem uma plataforma real de chat. Testes de provedores usam mocks explícitos.
- Efeito Web Audio foi acionado; a qualidade auditiva, microfone físico, voz do sistema e vozes externas precisam de avaliação no computador do operador.
- O overlay foi testado em Chromium, não dentro do aplicativo OBS instalado.
- SwiftShader mede renderização por CPU. As amostras iniciais ficaram entre 3 e 14 FPS; não são benchmark de GPU nem garantia de desempenho para live. É necessário ensaio prolongado no hardware alvo.
- Não há teste visual exaustivo de todas as 52 câmeras, todas as rotas, horários e combinações de eventos. Renderização e navegação funcionam, mas ainda requerem acabamento artístico e revisão cinematográfica.
- Assets atuais são vetores/objetos procedurais provisórios. A lista completa do que falta está em [IMPLEMENTATION.md](IMPLEMENTATION.md) e no [README](../README.md#limites-e-pendências).

## Reproduzir

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
npx tsx scripts/inspect-rooms.ts
```

Para Chromium já instalado, prefixe os dois últimos comandos com `CHROMIUM_PATH=/usr/bin/chromium`. Os scripts criam servidores e bancos temporários e não modificam os dados do operador. Capturas completas e relatórios JSON ficam em `test-results/`. O workflow de GitHub Actions executa a suíte, build e testes de navegador.
