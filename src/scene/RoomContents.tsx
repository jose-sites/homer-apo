import type {Action, LiveState, Room} from '../../shared/types';
import {Box,Ball,Cylinder,Rounded,Plant,Lamp,Table,Chair,Bookcase,Bed,Rug,Sofa,Donut,Mug,Picture,Window} from './Furniture';
import { Television } from './Television';
import { CharacterSprite } from './CharacterSprite';
import { Detailed } from '@react-three/drei';

export function RoomContents({room,state,onAction}:{room:Room;state:LiveState;onAction:(a:Action)=>void}){
 const night=state.virtualHour<6||state.virtualHour>18;
 const common=<><Window p={[-4.87,2,1.8]} rotation={Math.PI/2} night={night}/><Plant p={[-4.25,0,-3.2]} scale={1.1}/></>;
 return <group position={room.origin}>
  {room.kind==='living'&&<>
   <group position={[-.45,0,0]} scale={[.85,1,1]}><Sofa/></group>
   <Rug p={[-.3,.015,-.05]} s={[6.9,.035,4.1]}/>
   <Table p={[-.3,0,-.25]} s={[3.35,.57,1.25]}/>
   <Cylinder p={[-.4,.685,-.25]} r={.48} h={.025} c="#e8cfaa"/>
   <Donut p={[-.55,.76,-.23]}/><Donut p={[-.14,.77,-.22]} scale={.83}/><Mug p={[.7,.66,-.43]}/>
   <Box p={[-1.26,.674,.04]} s={[.62,.025,.44]} c="#c57064" r={[0,.2,0]}/><Box p={[-1.25,.69,.04]} s={[.4,.01,.24]} c="#e6bd6e" r={[0,.2,0]}/>
   <Box p={[.71,.69,.17]} s={[.18,.045,.43]} c="#3a4143" r={[0,-.1,0]}/>
   <Table p={[-4.15,0,-2.65]} s={[.85,.72,.85]}/><Lamp p={[-4.15,.79,-2.65]} on={state.power}/>
   <Picture p={[-.5,2.54,-3.86]} size={[1.8,1.2]}/><Picture p={[2.4,2.5,-3.85]} size={[.65,.86]} kind="family"/>
   <Window p={[-4.87,2,0]} rotation={Math.PI/2} night={night}/>
   <Plant p={[4.25,0,2.9]} scale={1.4}/><Television state={state} onAction={onAction}/>
   <Box p={[4.7,1.25,-1.3]} s={[.16,.9,.55]} c="#90593a"/>
  </>}
  {room.kind==='kitchen'&&<>
   {common}
   <group position={[-3.35,0,-3.25]} onClick={e=>{e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:'fridge'});}}>
    <Box p={[0,1.28,0]} s={[1.45,2.56,1.25]} c="#c1cfac"/><Box p={[0,1.25,.65]} s={[1.2,2.3,.03]} c="#5d6857"/>
    <group position={[-.73,0,.64]} rotation={[0,state.doors.fridge?-1.2:0,0]}><Box p={[.72,1.28,0]} s={[1.43,2.5,.13]} c="#c6d3b3"/><Box p={[.72,1.8,.09]} s={[1.43,.035,.02]} c="#71856b"/><Box p={[1.23,1.22,.13]} s={[.07,.55,.07]} c="#71856b"/><Box p={[.6,1.4,.1]} s={[.29,.32,.02]} c="#f1ce6f" r={[0,0,-.1]}/><Box p={[.88,1.54,.1]} s={[.2,.28,.03]} c="#f0e3b9" r={[0,0,.1]}/></group>
    {state.doors.fridge&&[.6,1.1,1.65,2.1].map(y=><group key={y}><Box p={[0,y,0]} s={[1.1,.05,.95]} c="#ece4d0"/><Cylinder p={[.3,y+.18,.15]} r={.12} h={.32} c="#d6ad70"/><Box p={[-.25,y+.2,.15]} s={[.25,.4,.2]} c="#f1ebe0"/></group>)}
   </group>
   {[-1.8,2,3.6].map((x,i)=><group key={x}><Box p={[x,.47,-3.25]} s={[1.52,.94,1.2]} c="#b597b6"/><Box p={[x,1,-3.25]} s={[1.58,.13,1.35]} c="#e0c59a"/><Box p={[x,.46,-2.62]} s={[1.3,.68,.05]} c="#aa87a8"/><Box p={[x,.7,-2.57]} s={[.25,.04,.04]} c="#e4c67c"/>{i!==1&&<><Box p={[x,2.45,-3.5]} s={[1.52,1.02,.68]} c="#b194b7"/><Box p={[x,2.45,-3.13]} s={[1.32,.8,.04]} c="#9d7d9c"/><Box p={[x,2.2,-3.08]} s={[.24,.04,.04]} c="#e1bf74"/></>}</group>)}
   <Box p={[-1.8,1.08,-3.2]} s={[1,.045,.78]} c="#657f7c"/><Box p={[-1.8,1.09,-3.2]} s={[.75,.03,.55]} c="#a9b8aa"/><Cylinder p={[-1.8,1.31,-3.61]} r={.04} h={.5} c="#b8c2ae"/>
   <Box p={[2,1.08,-3.2]} s={[1.35,.06,1.1]} c="#c2c5b4"/>{[-1,1].flatMap(x=>[-1,1].map(z=><Cylinder key={`${x}${z}`} p={[2+x*.33,1.13,-3.2+z*.25]} r={.18} h={.035} c="#424e4c"/>))}
   <Box p={[2,.55,-2.57]} s={[1.13,.65,.04]} c="#536061"/><Box p={[2,2.2,-3.35]} s={[1.5,.3,1.2]} c="#b9b9a0"/>
   <Table p={[.5,0,.6]} s={[2.5,.8,1.6]} c="#b0b27e"/><Chair p={[-1.3,0,.5]} r={Math.PI/2}/><Chair p={[2.3,0,.5]} r={-Math.PI/2}/><Mug p={[.8,.9,.55]}/><Donut p={[.3,.94,.55]}/>
   <Window p={[4.87,2,1.8]} rotation={-Math.PI/2} night={night}/>
  </>}
  {room.kind==='dining'&&<>{common}<Rug s={[6,.035,4.5]} c="#a78179"/><Table s={[4,.9,2.15]} c="#9d6947"/>{[-1.1,1.1].flatMap(x=>[-1,1].map(z=><Chair key={`${x}${z}`} p={[x,0,z*1.65]} r={z<0?0:Math.PI}/>))}<Chair p={[-2.55,0,0]} r={Math.PI/2}/><Chair p={[2.55,0,0]} r={-Math.PI/2}/><Cylinder p={[0,1.12,0]} r={.19} h={.35} c="#649c87"/><Plant p={[0,1.25,0]} scale={.45}/><Bookcase p={[-3,0,-3.45]}/><Bookcase p={[3,0,-3.45]}/><Picture p={[0,3.05,-3.85]} size={[1.3,.55]} kind="family"/></>}
  {room.kind==='hall'&&<><Stairs level={room.floor}/><Rug p={[3.5,.02,0]} s={[1.6,.035,5.7]} c="#b9927a"/>{[1,2,3].map((i)=><Picture key={i} p={[4.84,1.2+i*.45,-3+i*1.5]} size={[.65,.85]} rotation={-Math.PI/2} kind="family"/>)}<Table p={[-3.6,0,-2.9]} s={[1.6,.9,.7]}/><Lamp p={[-3.6,.98,-2.9]} on={state.power}/><Plant p={[-3.8,0,2.8]}/></>}
  {['bedroom','bart','lisa'].includes(room.kind)&&<>
   {common}<Bed p={[-1.3,0,-1.55]} color={room.kind==='bart'?'#659baf':room.kind==='lisa'?'#c2788c':'#8d80b1'} single={room.kind!=='bedroom'}/>
   <Rug p={[-.7,.015,.7]} s={[5.4,.035,3.8]} c={room.kind==='lisa'?'#ba7886':'#698b8a'}/>
   <Table p={[-3.2,0,-2.3]} s={[.9,.75,.8]}/><Lamp p={[-3.2,.83,-2.3]} on={state.power} scale={.75}/>
   <Table p={[3.2,0,-2.65]} s={[2.1,.83,1.15]}/><Chair p={[3.15,0,-1.45]} r={Math.PI}/>
   <Bookcase p={[4,0,2.2]} scale={.8}/><Picture p={[room.kind==='bedroom'?-1.5:0,2.45,-3.85]} size={[1.5,1.05]} kind={room.kind==='bedroom'?'boat':'family'}/>
   {room.kind==='bart'&&<><Box p={[2.6,.1,.7]} s={[.55,.14,1.3]} c="#b75c58" r={[0,.3,0]}/>{[-1,1].flatMap(x=>[-1,1].map(z=><Ball key={`${x}${z}`} p={[2.6+x*.24,.09,.7+z*.45]} s={[.09,.09,.09]} c="#3d4850"/>))}<Box p={[3.2,1,-2.6]} s={[.8,.18,.55]} c="#c7c4b1"/></>}
   {room.kind==='lisa'&&<><Box p={[3.2,1,-2.6]} s={[.7,.04,.5]} c="#e0bc73"/><Cylinder p={[2.2,.65,1.2]} r={.12} h={1.1} c="#d4a14d"/><Ball p={[2.37,.25,1.2]} s={[.24,.18,.18]} c="#d4a14d"/></>}
   {room.kind==='bedroom'&&<Box p={[3.1,.85,1.9]} s={[2.2,1.6,.8]} c="#a46c47"/>}
  </>}
  {room.kind==='nursery'&&<>{common}<Rug c="#b79ab0" s={[5,.035,4]}/><group position={[0,0,-1.8]}><Box p={[0,.6,0]} s={[2.4,.18,1.5]} c="#c69461"/><Box p={[0,.74,0]} s={[2.25,.18,1.35]} c="#d5c6b8"/>{[-1,1].flatMap(z=>Array.from({length:10},(_,i)=><Cylinder key={`${z}${i}`} p={[-1.1+i*.245,1.2,z*.76]} r={.035} h={1.15} c="#cba16a"/>))}{[-1,1].map(z=><Box key={z} p={[0,1.8,z*.76]} s={[2.5,.09,.1]} c="#bd8a54"/>)}{[-1,1].map(x=><Box key={x} p={[x*1.2,1.12,0]} s={[.12,1.6,1.7]} c="#c59b65"/>)}</group><Table p={[-3.6,0,-2.5]} s={[1.2,.8,.8]}/><Lamp p={[-3.6,.9,-2.5]} on={state.power}/>{Array.from({length:6},(_,i)=><Box key={i} p={[-1.4+i*.55,.18,1.4+Math.sin(i)]} s={[.33,.33,.33]} c={['#d5857e','#78a7b9','#d6b768'][i%3]} r={[0,i,0]}/>)}<Ball p={[1.9,.3,.9]} s={[.3,.3,.3]} c="#d7b061"/><Picture p={[0,2.6,-3.85]} size={[1.6,.8]} kind="family"/></>}
  {room.kind==='bathroom'&&<>{common}<Rounded p={[-2.5,.45,-2.1]} s={[3.3,.85,1.8]} c="#e6e7d0"/><Rounded p={[-2.5,.84,-2.1]} s={[2.8,.08,1.3]} c="#9fbbba"/><Box p={[2.4,.7,-3]} s={[1.8,1.4,1.1]} c="#afbc9c"/><Box p={[2.4,1.45,-3]} s={[1.9,.12,1.2]} c="#e5d9ba"/><Box p={[2.4,2.35,-3.82]} s={[1.6,1.1,.07]} c="#bfd2ce"/><Cylinder p={[2.4,1.64,-3.4]} r={.04} h={.4} c="#a0b1a3"/><Rounded p={[2.8,.4,.9]} s={[.85,.5,1.25]} c="#efebd7"/><Box p={[2.8,.86,.4]} s={[.85,.9,.36]} c="#efebd7"/><Rug s={[3,.035,1.8]} c="#94b8a7"/></>}
  {room.kind==='garage'&&<><Car/><Bookcase p={[-3.7,0,-3.4]} scale={.9}/><Table p={[3.2,0,-3.2]} s={[2.3,.95,1]}/><Box p={[3.2,2.1,-3.8]} s={[2.5,1.4,.12]} c="#9d855c"/>{Array.from({length:6},(_,i)=><Box key={i} p={[2.3+i*.36,2,-3.67]} s={[.06,.5,.06]} c="#6a7370" r={[0,0,.2]}/>)}<Cylinder p={[-3.6,.4,1.5]} r={.5} h={.8} c="#658581"/><Box p={[3.3,.45,2.4]} s={[1.3,.9,1.1]} c="#ac8863"/></>}
  {room.kind==='basement'&&<><Stairs level={-1}/><Bookcase p={[-3.6,0,-3.2]}/><Box p={[3,.8,-2.7]} s={[1.5,1.6,1.3]} c="#9caca4"/><Cylinder p={[3,2.35,-2.7]} r={.17} h={1.4} c="#6f7a78"/>{[-3,-1,2,3.5].map((x,i)=><Box key={x} p={[x,.35,2]} s={[1,.7,.8]} c={i%2?'#9c815e':'#b39b72'}/>)}</>}
  {room.kind==='attic'&&<><Box p={[-2,1,-1]} s={[2,1.8,.8]} c="#986b48"/>{[-3,0,2.5].map((x,i)=><Box key={x} p={[x,.45,1.5]} s={[1.3,.9,1]} c={i%2?'#9f855f':'#b1986c'}/>)}<Picture p={[0,2,-3.8]} kind="family"/><Cylinder p={[3.7,1.1,-2.6]} r={.07} h={2.2} c="#70583f"/><Box p={[3.7,1.85,-2.6]} s={[1,.08,.1]} c="#70583f"/></>}
  {room.kind==='yard'&&<Yard/>}
  {room.kind==='exterior'&&<Front/>}
  {(Object.values(state.characters)).map(character=>{
   if(character.id==='homer'&&state.movement)return null;if(character.room!==room.id)return null;
   const positions={homer:[-2.45,.12,-1.69],marge:[-.88,.12,-1.72],bart:[.55,.12,-1.68],lisa:[1.62,.12,-1.67],maggie:[2.5,.42,-1.65]} as const;
   const heights={homer:2.6,marge:3,bart:2.2,lisa:2.12,maggie:1.8};
   const p=room.kind==='living'?[...positions[character.id]]:[-1,0,-.7];
   return <CharacterSprite key={character.id} character={character} position={p as [number,number,number]} height={heights[character.id]} speech={state.speaking} paused={state.paused}/>;
  })}
 </group>
}
export function Stairs({level=0}:{level?:number}){return <group>{Array.from({length:18},(_,i)=><Box key={i} p={[0,(i+1)*.1,-(-1.5+(i+.5)*4/18)]} s={[2.3,(i+1)*.2,4/18+.015]} c={i%2?'#a46b44':'#b77c50'}/>)}{[-1.25,1.25].map(x=><group key={x}>{Array.from({length:9},(_,i)=><Cylinder key={i} p={[x,.95+i*.4,1.5-i*.5]} r={.035} h={1.2} c="#a16a40"/>)}<Cylinder p={[x,2.75,-.5]} r={.065} h={5.38} c="#7f5035" rotation={[-.838,0,0]}/></group>)}<Box p={[0,-.04,2]} s={[2.5,.08,1]} c="#bb9471"/></group>}
function Car(){return <group position={[0,0,-.3]}><Rounded p={[0,.72,0]} s={[2.35,.7,4.4]} c="#c67f9b"/><Rounded p={[0,1.3,-.3]} s={[2.05,.9,2.2]} c="#cb8caa"/><Box p={[0,1.42,.83]} s={[1.86,.68,.055]} c="#7897a0" r={[-.25,0,0]}/><Box p={[0,1.42,-1.42]} s={[1.86,.65,.06]} c="#7897a0" r={[.25,0,0]}/>{[-1,1].flatMap(x=>[-1,1].map(z=><Cylinder key={`${x}${z}`} p={[x*1.16,.48,z*1.37]} r={.43} h={.21} c="#39464a" rotation={[0,0,Math.PI/2]}/>))}<Box p={[0,.55,2.25]} s={[2.13,.13,.1]} c="#b9b3a0"/>{[-.76,.76].map(x=><Box key={x} p={[x,.83,2.24]} s={[.4,.21,.04]} c="#f3d894"/>)}<Box p={[0,.76,2.26]} s={[.55,.18,.025]} c="#dfdac4"/></group>}
function Tree({x,z}:{x:number;z:number}){return <Detailed distances={[0,28]}><group><Cylinder p={[x,1.6,z]} r={.28} h={3.2} c="#846448"/><Ball p={[x,3.7,z]} s={[1.8,1.8,1.65]} c="#618552"/><Ball p={[x-.9,3,z+.2]} s={[1.1,1.3,1.1]} c="#74925d"/></group><group><Cylinder p={[x,1.5,z]} r={.25} h={3} c="#846448"/><Ball p={[x,3.4,z]} s={[1.7,1.7,1.7]} c="#648451"/></group></Detailed>}
function Yard(){return <><Tree x={-8} z={-1}/><Tree x={10} z={-2}/><Table p={[0,0,0]} s={[3,.9,1.8]} c="#aa794f"/><Chair p={[-2,0,0]} r={Math.PI/2}/><Chair p={[2,0,0]} r={-Math.PI/2}/><group position={[5,0,-1]}><Cylinder p={[0,.85,0]} r={.63} h={.55} c="#6a7770"/>{[-1,1].map(x=><Box key={x} p={[x*.44,.38,0]} s={[.08,.76,.08]} c="#4b5c55"/>)}<Box p={[0,1.15,0]} s={[1.1,.04,.9]} c="#363f3c"/></group>{Array.from({length:28},(_,i)=><Box key={i} p={[-14+i,1,-3.8]} s={[.8,2,.12]} c={i%2?'#b4a981':'#bdae88'}/>)}<Box p={[0,.7,-3.75]} s={[29,.13,.15]} c="#8b876b"/><Box p={[0,1.5,-3.75]} s={[29,.13,.15]} c="#8b876b"/>{[-5,-4,-3,6,7,8].map(x=><Plant key={x} p={[x,0,2.6]} scale={.7}/>)}</>}
function Front(){return <><Box p={[0,.015,1.2]} s={[30,.07,1.4]} c="#c2bba5"/><Box p={[0,-.03,3]} s={[30,.07,2.4]} c="#687373"/>{Array.from({length:10},(_,i)=><Box key={i} p={[-14+i*3,.02,3.2]} s={[1.3,.015,.08]} c="#e0d9b9"/>)}<Box p={[0,.025,-1.3]} s={[2,.06,3.6]} c="#c7b296"/><Tree x={-12} z={-1}/><Tree x={12} z={-1}/><Cylinder p={[3.2,.7,-1.5]} r={.06} h={1.4} c="#796a50"/><Rounded p={[3.2,1.4,-1.5]} s={[.65,.4,.45]} c="#70959a"/>{[-4,-3,4,5].map(x=><Plant key={x} p={[x,0,-3]} scale={.7}/>)}</>}
