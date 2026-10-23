# Homer AI Live 2.0

Estúdio local executável com uma casa em Three.js, família em sprites 2.5D, diretor por regras, chat local, minijogos, painel administrativo e saída para OBS. Projeto independente inspirado em Os Simpsons, com arte vetorial provisória. Não é um produto oficial.

> Os fontes foram recuperados do histórico de desenvolvimento após a substituição do ambiente de execução. O commit/tag `recovered-baseline` preserva essa base antes das correções. Os limites da recuperação estão em [docs/recovery/README.md](docs/recovery/README.md).

## Executar

Requisito: Node.js **22.13 ou superior** (testado com Node 24), npm e navegador com WebGL 2/aceleração gráfica. O aviso experimental de `node:sqlite` em algumas versões do Node é esperado.

```bash
npm ci
npm run dev
```

- Painel: http://localhost:5173
- OBS: http://localhost:5173/overlay
- API: http://127.0.0.1:3001/api/health

Para usar a versão compilada, encerre o modo de desenvolvimento e execute:

```bash
npm run build
npm start
```

Painel e overlay passam a ser servidos em http://127.0.0.1:3001 e http://127.0.0.1:3001/overlay. O servidor é obrigatório; abrir `dist/index.html` diretamente não inicia a aplicação.

O projeto funciona sem chaves de API: conversa por regras locais, legenda, efeitos sintetizados e voz instalada no navegador quando disponível. Esse modo é identificado como demonstração. Não há conexão real com Twitch ou YouTube.

## Primeiro uso

1. Comece no modo Manual e selecione uma câmera.
2. Use o chat local para enviar uma mensagem e clique em **Homer responde**.
3. Ative o som no topo em somente uma janela. Vozes dependem do navegador/sistema; o Chromium de algumas instalações não fornece voz.
4. Escolha um destino e clique em **Ir até lá**. A câmera percorre os pontos de passagem da casa.
5. Inicie Forca, Quiz, Adivinhação, Votação ou Desafio no painel. O chat usa `!letra A`, `!resposta texto` ou `!voto opção`.
6. No modo Semiautomático, aprove ações em **Memória e ações**. No Automático, o motor executa decisões permitidas, respeitando intervalos e condições.
7. **Pausar tudo** congela decisões, navegação, eventos e temporizadores do motor. Após reinício, o servidor recupera configurações em pausa; atividades transitórias não são repetidas.

## O que está implementado

- React + Vite + TypeScript, Zustand, Express, WebSocket e SQLite nativo, com módulos separados.
- 16 ambientes com coordenadas comuns: sala, cozinha, jantar, hall/escada, lavabo, garagem, fachada/rua, quintal, corredor superior, quarto do casal, quartos de Bart/Lisa/Maggie, banheiro, porão e sótão.
- Geometria 3D, móveis procedurais, televisão com textura dinâmica, portas e geladeira interativas. Escadas e rotas predefinidas com pontos de passagem.
- 52 câmeras iniciais, cadastro de enquadramentos, exploração limitada ao cômodo, cortes/fade entre ambientes e movimento suave dentro do cômodo.
- Cinco sprites vetoriais substituíveis, expressões, piscadas, respiração e estados de boca. Os assets padrão são **provisórios e frontais**. Substituição e frames estão documentados em [public/sprites/README.md](public/sprites/README.md).
- 120 falas iniciais (30 para cada personagem falante), banco editável por adição, participação familiar com intervalos variáveis e prevenção de repetição recente.
- Estados internos de Homer, três modos operacionais, ações estruturadas com validação Zod, sugestões para aprovação, memória limitada e resumos locais periódicos.
- 18 eventos configuráveis, condições/cooldowns, tempo virtual real/acelerado/fixo, iluminação, chuva e televisão.
- Cinco tipos de jogo; 50 palavras de Forca e 10 perguntas de Quiz. Votos deduplicados e respostas validadas no servidor.
- Fila de áudio, prioridade de falas pendentes, TTS compatível com OpenAI no backend e cache limitado a 64 MB; fallback para voz do navegador. Boca por intensidade no áudio externo e aproximação na voz do navegador.
- Reconexão WebSocket, snapshots autoritativos, persistência, recuperação pausada, logs estruturados, limites de entrada, proteção de origem e autenticação administrativa opcional.
- Qualidade baixa/média/alta, resolução adaptativa, descarte por frustum do Three.js, carregamento seletivo de cômodos, LOD de árvores e limites de sombras.

## Provedores e credenciais

Copie `.env.example` para `.env` e configure apenas os serviços que deseja usar. Nunca use prefixo `VITE_` para segredos.

```bash
cp .env.example .env
```

| Variável | Uso |
| --- | --- |
| `HOST`, `PORT` | Bind do servidor; padrão `127.0.0.1:3001` |
| `DATA_DIR` | Diretório SQLite/cache; padrão `./data` |
| `ADMIN_TOKEN` | Token opcional do operador; autenticação no painel gera cookie HttpOnly para o WebSocket |
| `PUBLIC_ORIGIN` | Origem exata autorizada ao usar proxy/acesso de rede |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | API de conversação compatível com OpenAI |
| `TTS_API_KEY`, `TTS_BASE_URL`, `TTS_MODEL`, `TTS_VOICE` | TTS compatível com OpenAI; áudio MP3 |
| `TTS_VOICE_HOMER` etc. | Voz licenciada/original por personagem |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL` | Alternativa comum para IA e TTS |

Depois selecione o provedor no painel. Credenciais presentes significam **configuração**, não integração verificada. As APIs externas não foram validadas com credenciais reais nesta entrega. Os testes de contratos usam respostas controladas identificadas como mocks. Detalhes em [docs/server.md](docs/server.md).

## OBS

Adicione uma **Browser Source** com a URL `/overlay`, largura 1920 e altura 1080. Use **Interagir** e clique na saída para habilitar áudio. `?audio=1` tenta ativá-lo ao abrir; políticas de autoplay podem exigir um clique. A opção **Overlay limpo** oculta elementos de transmissão; a interação por clique ainda permite ativar o áudio.

Painel e OBS compartilham o estado do servidor. O motor continua ativo com o painel fechado, enquanto o processo Node estiver em execução. A renderização/áudio dependem da fonte de navegador aberta. Evite áudio ativo simultaneamente no painel e no OBS.

O servidor usa loopback por padrão. Para outro computador, configure bind, `PUBLIC_ORIGIN`, token e rede. Não exponha diretamente uma instância administrativa sem autenticação. A integração no aplicativo OBS real ainda requer teste no computador de transmissão; a rota foi verificada em navegador 1920×1080.

## Testes

```bash
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

O teste de navegador usa SQLite e servidor temporários, sem alterar os dados do operador. Se o Chromium já estiver instalado:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Capturas e relatório ficam em `test-results/browser/` (não versionados). A CI executa testes, build e verificação no Chromium. Renderização por software em CI verifica funcionamento, não comprova FPS em computador intermediário. Veja [docs/VALIDATION.md](docs/VALIDATION.md) para os resultados desta entrega.

## Organização

```text
shared/       contratos, catálogos, regras, navegação e jogos
server/       API, WebSocket, SQLite, provedores IA/TTS
src/scene/    casa, móveis, sprites, televisão e diretor de câmera
src/audio/    reprodução e fila local
src/components/ painéis operacionais
src/store.ts  conexão, ações HTTP e estado do cliente
public/       sprites provisórios e assets locais
tests/        testes de motor, jogos, persistência, API, áudio e navegador
```

## Limites e pendências

Esta é uma base funcional em desenvolvimento; não representa a conclusão integral do escopo do mega projeto.

- Arte final e sprites em múltiplos ângulos, animações independentes de braços/cabeça e poses completas ainda precisam de assets e acabamento. Não há rotação 3D completa de uma imagem plana.
- Movimentos de câmera são cortes/fades/interpolação e percurso predefinido. Um editor visual completo de trajetórias/pan/tilt/dolly e colisão contra todo móvel ainda não existe.
- Navegação usa portais e desvios definidos, não um navmesh ou solver geral de colisões.
- Occlusion culling por GPU, LOD em todos os objetos e benchmark prolongado em hardware intermediário permanecem pendentes.
- A voz do navegador não oferece waveform/fonemas; lip-sync nesse modo é aproximado. O servidor estima duração das falas; ainda falta confirmação de término pelo cliente e sincronização audiovisual exata entre múltiplas fontes.
- Efeitos sonoros são síntese procedural provisória com posicionamento via Web Audio; vozes finais e efeitos naturais/licenciados não estão incluídos.
- Banco de perguntas pode ser alterado em `shared/games.ts`; ainda falta editor administrativo completo de perguntas/resultados acumulados.
- Integrações reais com plataformas de live, testes com credenciais IA/TTS e teste final no OBS/hardware do operador permanecem pendentes.

## Preservação e GitHub

O repositório preserva a base recuperada no tag `recovered-baseline` e as correções em commits posteriores. `.env`, banco de dados, cache, dependências e capturas temporárias não são enviados ao GitHub.

Para salvar todo o histórico Git em um arquivo:

```bash
git bundle create ../homer-ai-live.bundle --all
git archive --format=zip --output=../homer-ai-live-source.zip HEAD
```

Para preservar dados de execução locais, pare o servidor e faça também uma cópia privada de `data/` e `.env`. Eles não fazem parte do ZIP de fontes nem do bundle. Baixe uma cópia ou envie commits ao GitHub; arquivos no executor podem ficar indisponíveis quando o ambiente for substituído.
