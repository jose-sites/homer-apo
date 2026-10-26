# Operação da live — seis melhorias

## Diagnóstico

Em **Configurações**, o diagnóstico mostra conexão TikTok, estado da IA, última falha, voz usada no servidor e no navegador, ID público da voz, humor e campos de configuração pendentes. Uma resposta da API registrada é distinguida de credenciais apenas preenchidas. A atualização ocorre a cada cinco segundos enquanto essa tela está aberta. Não faz chamadas pagas de teste.

## Reconexão TikTok

Depois de uma queda/erro, o conector tenta novamente em 5, 10, 20, 40 e depois 60 segundos, até oito novas tentativas. Uma conexão concluída reinicia essa contagem. O botão de desconectar e o encerramento confirmado cancelam os agendamentos. Callbacks de conexões antigas são ignorados; os últimos 2.000 identificadores de eventos são preservados durante reconexões do processo, evitando repetir presentes. Não há garantia de entrega de eventos ocorridos enquanto estava desconectado. O histórico de deduplicação não persiste após encerrar o programa.

O conector continua comunitário, sujeito ao acesso/serviço de assinatura. Se a primeira conexão falhar, a interface informa o erro; depois de conectar, use **Iniciar conversa ao vivo** para ativar IA e voz. Não é necessário refazer a configuração das chaves.

## Memória individual

- Usa `user.idStr`, confirmado nas definições do conector/protobuf instalado, convertido em hash SHA-256. Sem ID estável, mantém somente a memória de sessão já existente.
- Guarda identificador pseudonimizado, @ atual, número de visitas (intervalo de 30 minutos), última participação e até seis interesses de uma lista pequena: rosquinhas, pizza, futebol, matemática, música, videogames, cinema, ciência, Simpsons, livros, cozinha e saxofone.
- Só extrai interesses se a pessoa pedir explicitamente para lembrar, por exemplo: “lembre que gosto de futebol”. Não armazena texto completo, telefone, endereço, senha ou inferências pessoais nesse cadastro.
- Persistência SQLite, no máximo 500 participantes, retenção padrão de sete dias, ajustável entre 1 e 30. Expiração é aplicada ao consultar, receber mensagens e periodicamente enquanto o servidor está ativo.
- Pode desativar coleta/uso, apagar individualmente ou apagar tudo em Configurações. Apagar também limpa o contexto individual de sessão correspondente e invalida uma resposta de IA que estava sendo preparada. Limpar memória geral também remove os perfis.
- A IA recebe apenas a indicação de participante recorrente e interesses guardados, sem ID. Histórico de sessão usa o mesmo ID quando disponível, inclusive após mudança de @.
- Esta versão não cria biografias, resumos livres ou recordações arbitrárias. Preferências fora da lista não são armazenadas. O texto cru das conversas externas também foi excluído dos próximos snapshots persistidos.

## Humor

Derivado de fome, energia, sono, interação recente com comida e atividade do chat: curioso, animado, confuso, impaciente, sonolento ou satisfeito. A IA recebe esse estado no contexto. Expressões existentes são ajustadas no máximo a cada 30 segundos e somente em repouso, sem disputar com áudio, caminhada, IRL ou rosquinha. Não há novo modelo/rig, animação de boca, chamadas extras de IA ou clonagem de voz.

## Votação IRL

Ative o IRL e abra **Minijogos → Votar próximo cômodo IRL**. A votação dura 60 segundos e oferece três cômodos reais, alternados conforme o tour. O chat envia `!voto A`, `!voto B` ou `!voto C`. O overlay existente mostra as opções e o resultado. Um voto por identificador de participante usado pelo jogo; a identidade estável de perfis não altera o contador legado do minijogo.

O vencedor vira o próximo destino quando Homer retornar à sala, usando as rotas existentes. Não interrompe a câmera atual nem a rosquinha; presentes continuam tendo precedência. Empates usam a primeira opção na ordem A/B/C; sem votos ou encerramento manual não altera o destino. Desativar o IRL descarta a escolha. O catálogo de cômodos não foi ampliado.

## Consumo

Em **Configurações → Consumo desta live**:

- Limites padrão: 300 chamadas de IA e 600 chamadas de voz (Fish + OpenAI). Zero bloqueia novas chamadas daquele tipo.
- Reserva é registrada no SQLite **antes** de enviar uma requisição paga. Falhas e fallback contam como tentativas; resposta servida do cache de áudio não gera reserva. Requisições de voz idênticas simultâneas continuam agrupadas.
- Aviso ao atingir 80% de um limite. Ao exceder, novas requisições são bloqueadas e o diagnóstico informa a causa. O mecanismo existente de voz do navegador/legendas continua disponível.
- Orçamento em dólares é **estimativa**, não leitura da fatura. Para ativá-lo, informe um valor máximo e preços conservadores: custo máximo estimado por chamada de IA e por mil caracteres de cada provedor de voz. Não foram inventadas tarifas oficiais. Provedores sem preço configurado são bloqueados quando o teto monetário está ativo.
- A cobrança real pode diferir conforme tokens, duração, plano e preços do provedor; use também os controles de gastos das contas dos provedores. Limites por número de chamadas são exatos para as tentativas contabilizadas por este servidor.
- Reiniciar o programa não zera consumo. Para outra live, pause e clique **Iniciar nova contagem** após as requisições terminarem. O botão de conectar não zera automaticamente.

## Verificação

Testes simulam reconexão, esgotamento de tentativas, deduplicação, identidade, retenção, exclusão, persistência, limites, cache/fallback, humor e votação com retorno seguro. APIs HTTP de diagnóstico/limites e controles reais do navegador foram exercitados com SQLite isolado. Não houve acesso a live real nem geração paga de áudio. Capturas em `docs/captures/live-operations/` usam configuração vazia de teste, não representam as credenciais do operador.

Comandos: `npm test`, `npm run build`; teste de interface: `npx tsx scripts/test-live-operations.ts` (Playwright instalado; opcional `CHROMIUM_PATH` para navegador já instalado).

Acesso real ao TikTok, disponibilidade do ID de voz Fish, saldo, sotaque/timbre e qualidade conversacional precisam ser validados na conta do operador. Casa, modelo e coordenadas de câmera não foram modificados.
