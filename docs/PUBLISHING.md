# GitHub Pages e servidor completo

O Pages estava configurado em modo legado, publicando a raiz da branch main. O index.html do Vite referencia código TypeScript e não é uma publicação compilada; além disso, caminhos absolutos `/assets` não correspondem a `/homer-apo/`.

`npm run build:pages` agora gera a prévia com base `/homer-apo/`. O workflow `.github/workflows/pages.yml` executa testes, build, teste real de navegador sob esse subdiretório e publica somente `dist` via Pages Actions. Ele tenta selecionar `build_type=workflow` com o token do próprio GitHub Actions. Se a organização bloquear a operação, o proprietário precisa selecionar **Settings → Pages → Source → GitHub Actions** e executar novamente **Publish Pages visual preview**. A integração externa usada nesta sessão recebeu HTTP 403 ao tentar essa mudança diretamente.

A prévia publicada é uma cena 3D interativa com seletor de câmeras, identificada como **sem servidor, IA ou TTS externos**. Não tenta WebSocket ou APIs no domínio do Pages. Não é uma integração falsa com os provedores. Nenhuma chave ou arquivo `.env` é enviado ao artefato.

Para o estúdio completo: `npm install`, `npm run build`, `npm start`, e abra o endereço do servidor Node. Configure as chaves exclusivamente nesse servidor, conforme [API-SETUP.md](API-SETUP.md). GitHub Pages não executa Express, SQLite ou WebSocket. Uma implantação pública completa requer hospedagem Node/HTTPS; não foi inventado um endereço para ela.

Teste local do build estático: `npm run build:pages` e `npm run test:pages` (Chromium do Playwright ou CHROMIUM_PATH). O teste exige WebGL renderizando, assets sem 404, troca de câmera e zero requisições de backend. O build normal continua em `/` e mantém todas as rotas e funcionalidades existentes.
