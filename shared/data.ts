import type { Room, CameraPreset, Line, EventDefinition, CharacterId, Vec3 } from './types';

import {MIRRORED_ROOMS} from './referenceLayout';
// Coordinates are room centres. All interior doors lie at room-edge midpoints.
// Ground floor y=0; first floor y=3.6; basement y=-3.6; attic y=7.2.
export const ROOMS: Room[] = [
 {id:'living',name:'Sala de estar',floor:0,origin:[0,0,0],size:[10,8],color:'#c68c9b',kind:'living',neighbors:['kitchen','hall','garage','front']},
 {id:'kitchen',name:'Cozinha',floor:0,origin:[10,0,0],size:[10,8],color:'#d9bd72',kind:'kitchen',neighbors:['living','dining']},
 {id:'dining',name:'Sala de jantar',floor:0,origin:[10,0,-8],size:[10,8],color:'#c285a3',kind:'dining',neighbors:['kitchen','hall','yard']},
 {id:'hall',name:'Hall e escada',floor:0,origin:[0,0,-8],size:[10,8],color:'#d6a0a8',kind:'hall',neighbors:['living','dining','wc','upstairs','basement','yard']},
 {id:'wc',name:'Lavabo',floor:0,origin:[-10,0,-8],size:[10,8],color:'#b9cfb4',kind:'bathroom',neighbors:['hall','garage']},
 {id:'garage',name:'Garagem',floor:0,origin:[-10,0,0],size:[10,8],color:'#aab6b0',kind:'garage',neighbors:['living','wc','front']},
 {id:'front',name:'Fachada e rua',floor:0,origin:[0,0,8],size:[30,8],color:'#97b56d',kind:'exterior',neighbors:['living','garage']},
 {id:'yard',name:'Quintal',floor:0,origin:[0,0,-16],size:[30,8],color:'#7a995b',kind:'yard',neighbors:['hall','dining']},
 {id:'upstairs',name:'Corredor superior',floor:1,origin:[0,3.6,-8],size:[10,8],color:'#d9a2b1',kind:'hall',neighbors:['hall','parents','bart','lisa','bathroom','attic']},
 {id:'parents',name:'Quarto de Homer e Marge',floor:1,origin:[0,3.6,0],size:[10,8],color:'#b39bbf',kind:'bedroom',neighbors:['upstairs','maggie']},
 {id:'bart',name:'Quarto de Bart',floor:1,origin:[-10,3.6,-8],size:[10,8],color:'#8ab8c2',kind:'bart',neighbors:['upstairs']},
 {id:'lisa',name:'Quarto de Lisa',floor:1,origin:[10,3.6,-8],size:[10,8],color:'#c78b9e',kind:'lisa',neighbors:['upstairs','maggie']},
 {id:'maggie',name:'Quarto de Maggie',floor:1,origin:[10,3.6,0],size:[10,8],color:'#caaacb',kind:'nursery',neighbors:['parents','lisa']},
 {id:'bathroom',name:'Banheiro',floor:1,origin:[0,3.6,-16],size:[10,8],color:'#94beb9',kind:'bathroom',neighbors:['upstairs']},
 {id:'basement',name:'Porão',floor:-1,origin:[0,-3.6,-8],size:[10,8],color:'#888e8c',kind:'basement',neighbors:['hall']},
 {id:'attic',name:'Sótão',floor:2,origin:[0,7.2,-8],size:[10,8],color:'#b68f71',kind:'attic',neighbors:['upstairs']},
];

// Reference composition: kitchen left, garage right; mirror connected upper rooms.
for(const r of ROOMS)if(MIRRORED_ROOMS.includes(r.id))r.origin[0]*=-1;

export const CAMERAS: CameraPreset[] = ROOMS.flatMap((r) => {
 const [x,y,z]=r.origin;
 return [
  {id:`${r.id}-wide`,name:`${r.name} · geral`,room:r.id,position:[x+3.5,y+2.6,z+3.3] as Vec3,target:[x,y+1.25,z-1] as Vec3,fov:57,type:'wide' as const,transition:'fade' as const},
  {id:`${r.id}-front`,name:`${r.name} · frontal`,room:r.id,position:[x,y+1.8,z+3.3] as Vec3,target:[x,y+1.25,z-1.5] as Vec3,fov:53,type:'frontal' as const,transition:'smooth' as const},
  {id:`${r.id}-pov`,name:`${r.name} · primeira pessoa`,room:r.id,position:[x,y+1.68,z-.6] as Vec3,target:[x+1,y+1.3,z-3.6] as Vec3,fov:68,type:'first-person' as const,transition:'fade' as const},
 ];
});
CAMERAS.push(
 {id:'living-reaction',name:'Homer · reação',room:'living',position:[-1.6,1.8,2],target:[-1.6,1.55,-1.85],fov:32,type:'reaction',transition:'smooth'},
 {id:'living-family',name:'Família · sofá',room:'living',position:[0,1.7,3.6],target:[0,1.4,-2.3],fov:60,type:'frontal',transition:'smooth'},
 {id:'front-exterior',name:'742 Evergreen Terrace',room:'front',position:[17,10,23],target:[0,2,-4],fov:49,type:'environment',transition:'fade'},
 {id:'yard-panorama',name:'Quintal · panorâmica',room:'yard',position:[7,3,-13],target:[0,1,-17],fov:62,type:'environment',transition:'fade'},
);

for(const c of CAMERAS){if(['living-wide','living-front','living-family'].includes(c.id)){c.position=[0,2,3.75];c.target=[0,.65,-2.7];c.fov=70;}if(['kitchen-wide','kitchen-front'].includes(c.id)){c.position=[-13.6,2.1,3.6];c.target=[-9.9,1.45,-2.4];c.fov=66;}}

for(const c of CAMERAS){if(['hall','upstairs','basement','attic'].some(id=>c.id===id+'-wide')){const r=ROOMS.find(r=>r.id===c.room)!;c.position=[r.origin[0]-3.6,r.origin[1]+2.4,r.origin[2]+3.4];c.target=[r.origin[0]+1,r.origin[1]+1.35,r.origin[2]-.4];c.fov=60;}}

const banks: Record<Exclude<CharacterId,'maggie'>, Record<string,string[]>> = {
 homer: {
  cumprimentos:['E aí, rapaziada! A casa está aberta e a geladeira também!','Bem-vindos à nossa sala! Não pisem nas migalhas.','Olá, chat! Espero que tenham trazido rosquinhas.'],
  comida:['Hmm… rosquinhas. A resposta para quase tudo.','A geladeira está me chamando pelo nome.','Eu não estou com fome. Estou com saudade do almoço.'],
  sono:['Só vou fechar os olhos por um segundo.','O sofá tem um poder hipnótico muito forte.','Acho que já trabalhei o suficiente pensando em trabalhar.'],
  televisão:['Vamos ver se a televisão tem alguma boa notícia.','Esse controle remoto sempre desaparece quando eu preciso dele.','A melhor parte do programa é quando chega a pizza.'],
  chat:['O chat fez uma pergunta difícil. Vou precisar de uma rosquinha.','Vocês estão mesmo aí dentro dessa telinha?','Essa conversa está mais animada que a reunião da usina.'],
  família:['Bart, por favor, não transforme a casa numa experiência.','Lisa, eu entendi quase metade do que você disse.','Marge, estou praticamente terminando!'],
  perguntas:['Qual é o melhor recheio de rosquinha?','Alguém sabe onde ficou o controle remoto?','Será que a geladeira sente saudade de mim?'],
  reações:['D’oh! Eu devia ter pensado nisso antes.','Isso parece uma excelente ideia… eu acho.','Eu tinha um plano, mas esqueci no caminho.'],
  atividades:['Uma pequena caminhada até a cozinha faz bem.','Vamos testar o conhecimento do chat!','Que tal conhecer outro canto da casa?'],
  especiais:['Se tocar a campainha, pode ser a pizza!','Esta casa nunca fica quieta por muito tempo.','O importante é que estamos todos juntos.'],
 },
 marge: {
  cumprimentos:['Olá, pessoal. Fiquem à vontade.','Que bom ver vocês por aqui.','Espero que estejam aproveitando a noite.'],
  comida:['Homer, você já jantou?','Deixe algumas rosquinhas para as crianças.','Não esqueça de arrumar a cozinha.'],
  sono:['As crianças estão tentando descansar.','Já está ficando tarde, Homer.','Amanhã também é dia de acordar cedo.'],
  televisão:['Homer, diminui esse volume!','Quem deixou a televisão ligada?','Podemos assistir a alguma coisa juntos?'],
  chat:['Você ainda está nessa transmissão?','As pessoas do chat parecem simpáticas.','Homer, agradeça a quem está assistindo.'],
  família:['Homer, venha me ajudar!','Bart, cuidado com isso.','Lisa, depois você me conta sobre o seu livro.'],
  perguntas:['Alguém viu minhas chaves?','Quem deixou a porta da geladeira aberta?','Homer, você lembrou de tirar o lixo?'],
  reações:['Hmmm… vou fingir que não ouvi.','Homer, isso precisa de um pouco de cuidado.','Talvez seja melhor pensar mais uma vez.'],
  atividades:['Precisamos organizar a sala.','Vamos abrir as janelas um pouquinho.','Uma pausa para o jantar seria boa.'],
  especiais:['A campainha está tocando!','Parece que vai chover.','Não acendam todas as luzes ao mesmo tempo.'],
 },
 bart: {
  cumprimentos:['E aí, rapaziada!','O melhor morador da casa chegou.','Salve, chat! Vocês viram o que meu pai fez?'],
  comida:['Pai, você só pensa em rosquinhas?','Se sobrar pizza, eu fico com ela.','Essa última rosquinha já tem dono.'],
  sono:['Pai, você está dormindo de olhos abertos?','Aposto que ele ronca antes do intervalo.','Cinco minutos no sofá e ele já apaga.'],
  televisão:['Vamos trocar de canal!','Esse programa precisa de mais explosões.','Quem está escondendo o controle?'],
  chat:['Ei, pai, tá falando sozinho de novo?','Meu pai tá ficando maluco.','Alguém tira ele desse computador!'],
  família:['Lisa, não precisa explicar tudo.','Mãe, eu não fiz nada… ainda.','Maggie é a única que entende minhas piadas.'],
  perguntas:['Pai, quanto tempo você aguenta sem comer?','Chat, qual foi a maior trapalhada do meu pai?','Será que a usina sabe que você está aqui?'],
  reações:['Essa live tá uma loucura!','Essa foi boa, até para você.','Eu devia ter gravado essa parte.'],
  atividades:['Bora jogar alguma coisa!','A garagem está muito quieta hoje.','Um desafio rápido não faz mal a ninguém.'],
  especiais:['Se tocou a campainha, eu não estou em casa.','Foi um barulho normal. Completamente normal.','Relâmpago! Isso deixou tudo mais interessante.'],
 },
 lisa: {
  cumprimentos:['Olá, pessoal. Bem-vindos à nossa casa.','É bom ter alguém interessado em conversar.','Espero que a conversa de hoje seja interessante.'],
  comida:['Pai, uma alimentação variada faz diferença.','Rosquinhas não são um grupo alimentar.','Você poderia experimentar uma fruta.'],
  sono:['Dormir bem ajuda a pensar melhor.','Pai, você parece estar precisando de descanso.','O cérebro também precisa de uma pausa.'],
  televisão:['Podemos escolher um documentário?','Esse programa não parece muito educativo.','A televisão não precisa ficar ligada o tempo todo.'],
  chat:['Tecnicamente, ele está falando com espectadores.','Vocês deveriam estudar um pouco.','É interessante como a conversa conecta as pessoas.'],
  família:['Bart, deixa o papai em paz.','Mãe, eu posso ajudar depois.','Maggie está tentando dizer alguma coisa.'],
  perguntas:['Pai, você já pensou nas consequências?','Qual foi a última coisa nova que vocês aprenderam?','Será que podemos olhar para isso de outro jeito?'],
  reações:['Pai, isso não faz nenhum sentido.','Isso é cientificamente improvável.','Acho que existe uma explicação mais simples.'],
  atividades:['Um quiz seria uma boa ideia.','Talvez a gente possa ler alguma coisa.','Uma caminhada no quintal pode ajudar.'],
  especiais:['O som chegou depois do relâmpago.','A chuva é importante para o jardim.','Podemos economizar energia enquanto conversamos.'],
 },
};
export const LINES: Line[] = Object.entries(banks).flatMap(([character,categories])=>Object.entries(categories).flatMap(([category,lines])=>lines.map((text,index)=>({id:`${character}-${category}-${index}`,character:character as CharacterId,category,text}))));
export const MAGGIE_EFFECTS = ['pacifier','giggle','babble','surprise','yawn','sleep'] as const;
export const EVENTS: EventDefinition[] = [
 ['doorbell','Campainha',.09,180,5,6],['telephone','Telefone',.08,240,4,8],['power','Queda de energia',.025,900,8,12],
 ['tv','Troca de canal',.13,120,2,4],['hunger','Vontade de rosquinhas',.12,300,3,8],['sleep','Cochilo no sofá',.06,600,3,20],
 ['bart','Provocação do Bart',.10,240,4,7],['lisa','Observação da Lisa',.08,300,4,7],['marge','Marge chama',.07,300,5,7],
 ['maggie','Chupeta da Maggie',.08,240,1,3],['rain','Chuva no jardim',.035,900,2,60],['lightning','Relâmpago',.03,120,3,2],
 ['garage','Barulho na garagem',.05,360,3,5],['fridge','Geladeira aberta',.06,240,2,6],['clock','Relógio da casa',.04,600,2,4],
 ['wake','Homer acorda',.05,300,4,5],['lights','Luzes da sala',.04,300,2,4],['ambient','Sons da casa',.07,240,1,6],
].map(([id,name,probability,cooldown,priority,duration])=>({id:String(id),name:String(name),probability:Number(probability),cooldown:Number(cooldown),priority:Number(priority),duration:Number(duration),enabled:true,lastRun:0}));

export const DEFAULT_SPRITE_POSITIONS: Record<CharacterId, Vec3> = {homer:[-1.7,0,-2.1],marge:[-.1,0,-2.1],bart:[1.25,0,-2.1],lisa:[2.3,0,-2.1],maggie:[3.1,0,-2.1]};

// Physical passage locations shared by geometry, navigation and object actions.
// Exterior parcels span several rooms; their centre must never define a diagonal exit.
export const doorId = (a:string,b:string) => [a,b].sort().join('-');
export const DOORWAYS: Record<string,Vec3> = {};
for(const room of ROOMS)for(const neighborId of room.neighbors){
 const neighbor=ROOMS.find(r=>r.id===neighborId)!;
 if(room.origin[1]!==neighbor.origin[1])continue;
 const key=doorId(room.id,neighbor.id);if(DOORWAYS[key])continue;
 const [x,y,z]=room.origin,[nx,,nz]=neighbor.origin;
 if(z!==nz){
  const narrow=room.size[0]<=neighbor.size[0]?room:neighbor;
  DOORWAYS[key]=[narrow.origin[0],y,narrow.origin[2]+Math.sign((narrow===room?nz:z)-narrow.origin[2])*narrow.size[1]/2];
 }else DOORWAYS[key]=[(x+nx)/2,y,z];
}
DOORWAYS[doorId('living','hall')]=[3.35,0,-4];
DOORWAYS[doorId('parents','upstairs')]=[1.2,3.6,-4];
DOORWAYS[doorId('lisa','maggie')]=[-12.8,3.6,-4];
DOORWAYS[doorId('living','kitchen')]=[-5,0,-2.4];
DOORWAYS[doorId('kitchen','dining')]=[-6.1,0,-4];
const localNavPoints:Record<string,[number,number]>={living:[3.7,1.8],kitchen:[2.8,2.7],dining:[3.5,2.6],garage:[2.2,0],parents:[1.2,1.2],bart:[1.2,1.5],lisa:[1.2,1.5],maggie:[-2,.5],yard:[3,1.5]};
export const ROOM_NAV_POINTS:Record<string,Vec3>=Object.fromEntries(ROOMS.map(room=>{
 const [x,z]=localNavPoints[room.id]??(['hall','basement','attic'].includes(room.kind)?[-1,0]:[0,0]);
 return [room.id,[room.origin[0]+x,room.origin[1],room.origin[2]+z] as Vec3];
}));
