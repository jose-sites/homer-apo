import type { GameState } from './types';
export interface Word {answer:string;hint:string}
export const WORDS: Word[] = [
 ['HOMER','Pai da família e funcionário da usina'],['MARGE','Mãe da família, com cabelo azul'],['BART','Filho que adora travessuras'],['LISA','Filha que toca saxofone'],['MAGGIE','A caçula da família'],
 ['SPRINGFIELD','Cidade onde mora a família'],['ROSQUINHA','Doce favorito do Homer'],['SOFA','Lugar de reunião da família'],['TELEVISAO','Aparelho favorito da sala'],['USINA','Local de trabalho do Homer'],
 ['MOE','Dono de uma famosa taverna'],['FLANDERS','Vizinho muito educado'],['BURNS','Chefe do Homer'],['SMITHERS','Assistente do chefe'],['KRUSTY','Palhaço da televisão'],
 ['MILHOUSE','Melhor amigo do Bart'],['SKINNER','Diretor da escola'],['RALPH','Colega de escola do Bart'],['NELSON','Aluno conhecido por sua risada'],['APU','Antigo atendente do mercadinho'],
 ['SELMA','Uma das irmãs da Marge'],['PATTY','Irmã gêmea da Selma'],['ABRAHAM','Avô da família'],['EDNA','Professora da escola'],['WILLIE','Zelador escocês da escola'],
 ['OTTO','Motorista do ônibus escolar'],['LENNY','Colega do Homer na usina'],['CARL','Amigo de Lenny e Homer'],['BARNEY','Amigo do Homer na taverna'],['COMICHÃO','Rato do desenho fictício'],
 ['COÇADINHA','Gato do desenho fictício'],['SAXOFONE','Instrumento tocado por Lisa'],['SKATE','Bart anda sobre quatro pequenas rodas'],['CHUPETA','Objeto inseparável da Maggie'],['GELADEIRA','Guarda a comida da família'],
 ['COZINHA','Cômodo onde Marge prepara o jantar'],['GARAGEM','Lugar do carro da família'],['QUINTAL','Área aberta atrás da casa'],['ESCADA','Liga os dois andares'],['CONTROLE','Serve para mudar o canal'],
 ['ESCOLA','Lugar onde Bart e Lisa estudam'],['NUCLEAR','Tipo de energia produzida na usina'],['EVERGREEN','Nome da rua da família'],['TAVERNA','Estabelecimento do Moe'],['PIZZA','Comida redonda dividida em fatias'],
 ['BOLA','Brinquedo redondo'],['JARDIM','Área com flores da casa'],['CAMPainha','Anuncia visitas na porta'],['FAMILIA','Homer, Marge e seus filhos formam uma'],['SPRINGFIELD ELEMENTARY','Nome em inglês da escola das crianças'],
].map(([answer,hint])=>({answer:normalize(answer),hint}));
export const QUESTIONS = [
 {question:'Qual instrumento a Lisa toca?',options:['Violino','Saxofone','Bateria','Piano'],answer:1},
 {question:'Onde Homer trabalha?',options:['Escola','Hospital','Usina nuclear','Mercado'],answer:2},
 {question:'Qual é o nome do melhor amigo do Bart?',options:['Milhouse','Nelson','Ralph','Otto'],answer:0},
 {question:'Quem é o vizinho da família?',options:['Moe','Krusty','Barney','Ned Flanders'],answer:3},
 {question:'Qual objeto acompanha a Maggie?',options:['Skate','Saxofone','Chupeta','Controle'],answer:2},
 {question:'Quem é o diretor da escola?',options:['Skinner','Burns','Moe','Carl'],answer:0},
 {question:'Qual é a comida favorita do Homer?',options:['Salada','Rosquinha','Brócolis','Granola'],answer:1},
 {question:'Em que cidade vive a família?',options:['Shelbyville','Capital City','Springfield','Ogdenville'],answer:2},
 {question:'Qual é o nome do chefe do Homer?',options:['Burns','Otto','Lenny','Willie'],answer:0},
 {question:'Quem dirige o ônibus escolar?',options:['Moe','Otto','Smithers','Barney'],answer:1},
];
export function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();}
function indexFor(game:GameState){return Number(game.id.split(':')[1])||0;}
export function createGame(type:GameState['type'],now=Date.now(),random=Math.random):GameState {
 const length=type==='quiz'?QUESTIONS.length:WORDS.length;
 const index=Math.min(length-1,Math.floor(random()*length));
 const word=WORDS[index];const q=QUESTIONS[index%QUESTIONS.length];
 const game:GameState={id:`${type}:${index}:${now}`,type,title:'',hint:'',masked:'',options:[],guesses:[],attempts:0,maxAttempts:6,score:0,endsAt:now+(type==='challenge'?45000:120000),status:'playing',votes:{}};
 if(type==='hangman'){game.title='Forca de Springfield';game.hint=word.hint;game.masked=word.answer.replace(/[A-Z]/g,'_');}
 if(type==='quiz'){game.title=q.question;game.hint='Envie A, B, C ou D no chat.';game.options=q.options;game.maxAttempts=1;}
 if(type==='guess'){game.title='Quem sou eu?';game.hint=word.hint;game.masked=`${word.answer.length} letras`;game.maxAttempts=8;}
 if(type==='poll'){game.title='Qual é a próxima atividade do Homer?';game.hint='Um voto por nome de participante. Envie A, B ou C.';game.options=['Visitar a cozinha','Assistir televisão','Descansar no sofá'];game.maxAttempts=9999;}
 if(type==='challenge'){game.title='Desafio: nomes da família';game.hint='Envie os cinco nomes da família, um por vez. Vocês têm 45 segundos.';game.maxAttempts=15;game.masked='0 / 5';}
 return game;
}
function voterKey(gameId:string,user:string){let hash=2166136261;for(const char of `${gameId}:${normalize(user)}`){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return `vote:${(hash>>>0).toString(36)}`;}
export function submitGameInput(game:GameState,value:string,user='operador',now=Date.now()):{ok:boolean,error?:string} {
 if(game.status!=='playing')return {ok:false,error:'Este jogo já terminou.'};
 if(now>=game.endsAt){finishGame(game);return {ok:false,error:'O tempo acabou.'};}
 const input=normalize(value).slice(0,80);if(!input)return {ok:false,error:'Envie uma resposta.'};
 if(game.type==='poll'){
  const choice=optionIndex(input,game.options);if(choice<0)return {ok:false,error:'Escolha A, B ou C.'};
  const voter=voterKey(game.id,user);
  if(game.guesses.includes(voter))return {ok:false,error:'Você já votou nesta rodada.'};
  game.guesses.push(voter);game.votes[String(choice)]=(game.votes[String(choice)]||0)+1;game.score=game.guesses.length;
  return {ok:true};
 }
 if(game.guesses.includes(input))return {ok:false,error:'Essa resposta já foi tentada.'};
 if(game.type==='hangman'&&!/^[A-Z ]{1,50}$/.test(input))return {ok:false,error:'Envie uma letra de A a Z ou a palavra completa.'};
 if(game.type==='quiz'&&optionIndex(input,game.options)<0)return {ok:false,error:'Escolha A, B, C ou D.'};
 game.guesses.push(input);
 if(game.type==='hangman'){
  const answer=WORDS[indexFor(game)].answer;
  if(input===answer){game.masked=answer;game.status='won';}else{
   if(!answer.includes(input))game.attempts++;
   game.masked=answer.split('').map(letter=>letter===' '||game.guesses.includes(letter)?letter:'_').join('');
   if(!game.masked.includes('_'))game.status='won';
  }
  if(game.attempts>=game.maxAttempts){game.status='lost';game.result=`A palavra era ${answer}.`;}
 } else if(game.type==='quiz'){
  game.attempts++; const answer=QUESTIONS[indexFor(game)].answer;
  game.status=optionIndex(input,game.options)===answer?'won':'lost';
  game.result=`Resposta: ${game.options[answer]}.`;
 } else if(game.type==='guess'){
  const answer=WORDS[indexFor(game)].answer;
  if(input===answer){game.status='won';game.result=answer;}else{game.attempts++;if(game.attempts>=game.maxAttempts){game.status='lost';game.result=`Resposta: ${answer}.`;}}
 } else if(game.type==='challenge'){
  const family=['HOMER','MARGE','BART','LISA','MAGGIE'];
  if(family.includes(input)){game.score=game.guesses.filter(g=>family.includes(g)).length;game.masked=`${game.score} / 5`;if(game.score===5)game.status='won';}
  else {game.attempts++;if(game.attempts>=game.maxAttempts)game.status='lost';}
 }
 if(game.status==='won'){game.winner=user;game.score=game.type==='challenge'?500:Math.max(10,100-game.attempts*10);game.result=game.result||'Boa! O chat acertou.';}
 return {ok:true};
}
function optionIndex(input:string,options:string[]){const letter='ABCD'.indexOf(input);if(input.length===1&&letter>=0&&letter<options.length)return letter;return options.findIndex(o=>normalize(o)===input);}
export function finishGame(game:GameState){
 if(game.status!=='playing')return;
 if(game.type==='poll'){
  const ranked=Object.entries(game.votes).sort((a,b)=>b[1]-a[1]);
  game.result=ranked.length?`Mais votado: ${game.options[Number(ranked[0][0])]} (${ranked[0][1]} votos).`:'Votação encerrada sem votos.';game.status='ended';
 }else{game.status='lost';game.result=game.type==='hangman'||game.type==='guess'?`Tempo esgotado. Resposta: ${WORDS[indexFor(game)].answer}.`:'Tempo esgotado.';}

}
export function tickGame(game:GameState,now:number){if(game.status==='playing'&&now>=game.endsAt)finishGame(game);}
