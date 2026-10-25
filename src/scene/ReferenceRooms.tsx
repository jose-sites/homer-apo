import {DONUT_TIMES} from '../../shared/homerMotion';
import {useEffect,useMemo} from 'react';
import {Shape,ExtrudeGeometry} from 'three';
import type {LiveState,Action,Vec3} from '../../shared/types';
import {Box,Ball,Cylinder,Rounded,Plant,Table,Donut,Mug,Picture,Window,ContactShade} from './Furniture';
import {TextileRug,RoomDaylight,StairFinish,UpholsteredSofa,CraftedTable,CraftedChair,LeafPlant,DetailedLamp,CabinetDoor,Sink,KitchenDetails,LivingDetails} from './RoomCraft';
import {Television} from './Television';

/** Actual curved masonry above a navigable opening; never a painted doorway. */
export function ArchSpandrel({width,color}:{width:number;color:string}){
 const geometry=useMemo(()=>{const r=width/2,s=new Shape();s.moveTo(-r,0);s.lineTo(-r,r);s.lineTo(r,r);s.lineTo(r,0);s.absarc(0,0,r,0,Math.PI,false);s.closePath();return new ExtrudeGeometry(s,{depth:.16,bevelEnabled:false,curveSegments:24})},[width]);useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color}/></mesh>
}
function Sideboard({p}:{p:Vec3}){return <group position={p}><Rounded p={[0,.48,0]} s={[1.05,.75,.68]} c="#9839a5"/><Rounded p={[0,.9,0]} s={[1.2,.12,.8]} c="#b957ba"/>{[.3,.64].map(y=><group key={y}><Box p={[0,y,.36]} s={[.91,.25,.04]} c="#b14eaf"/><Ball p={[0,y,.41]} s={[.055,.055,.04]} c="#ffc747"/></group>)}</group>}
export function ReferenceLiving({state,onAction}:{state:LiveState;onAction:(a:Action)=>void}){
 const night=state.virtualHour<6||state.virtualHour>18;
 return <>
  <UpholsteredSofa/><LivingDetails/><StairFinish/><RoomDaylight on={!night&&state.power} shadows={state.settings.quality!=='low'}/>
  <TextileRug/>
  <CraftedTable p={[-.4,0,-.05]}/><ContactShade p={[-.4,.01,-.05]} size={[3.6,2.1]}/>
  <Cylinder p={[.3,.73,-.1]} r={.27} h={.03} c="#f9c2cd"/>{<group onClick={()=>onAction({type:'INTERACT_WITH_OBJECT',object:'donut'})}><Donut p={[.3,.81,-.1]} scale={.8}/></group>}<Mug p={[-1.1,.7,-.2]} color="#e9c434"/>
  <Box p={[-.1,.73,.25]} s={[.42,.025,.24]} c="#e785a3"/>
  <Picture p={[-.45,2.58,-3.87]} size={[1.75,1.2]}/><Picture p={[-1.95,2.5,-3.87]} size={[.4,.6]} kind="family"/><Picture p={[1.05,2.5,-3.87]} size={[.4,.6]} kind="family"/>
  <Sideboard p={[-3.15,0,-2.9]}/><group position={[-3.15,.98,-2.9]}><DetailedLamp on={state.power}/></group>
  <Window p={[-4.86,2.05,.1]} rotation={Math.PI/2} night={night}/>
  <group position={[-3.5,0,.6]} scale={.85}><Television state={state} onAction={onAction} p={[0,0,0]} rotation={Math.PI+.2}/></group>
  <LeafPlant p={[-4.55,0,2.8]} scale={1.4}/><LeafPlant p={[2.7,0,-2.8]} scale={1.55}/>
  <group position={[4.5,0,2.65]} rotation={[0,-Math.PI/2,0]}><Sideboard p={[0,0,0]}/><Rounded p={[-.25,1.08,0]} s={[.4,.23,.3]} c="#25a99b"/><Plant p={[.35,.96,0]} scale={.4}/></group>
  {state.power&&<pointLight position={[-2.5,2.7,-1.8]} color="#ffd29b" intensity={7} distance={8}/>}
 </>
}
function Cabinet({x,width=1.3,upper=false}:{x:number;width?:number;upper?:boolean}){const y=upper?2.75:.51,h=upper?1.05:1;return <group><Rounded p={[x,y,-3.49]} s={[width,h,upper?.65:1.02]} c="#854c9b"/><CabinetDoor p={[x,y,upper?-3.1:-2.92]} w={width-.06} h={h-.08}/><Box p={[x,y+h/2+.015,-3.48]} s={[width+.04,.045,upper?.7:1.05]} c="#dc9b4b"/>{!upper&&<><Rounded p={[x,1.06,-3.45]} s={[width+.04,.14,1.13]} c="#e8b95d"/><Box p={[x,.08,-2.98]} s={[width-.1,.12,.07]} c="#68416f"/></>}</group>}
function Bottle({p,c}:{p:Vec3;c:string}){return <group position={p}><Cylinder p={[0,.13,0]} r={.08} h={.26} c={c}/><Cylinder p={[0,.29,0]} r={.04} h={.08} c="#edcf87"/></group>}
function Fridge({state,onAction}:{state:LiveState;onAction:(a:Action)=>void}){return <group position={[2.8,0,-3.12]} onClick={e=>{e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:'fridge'})}}><Rounded p={[0,1.42,0]} s={[1.45,2.84,1.3]} c="#80ab26"/><Box p={[0,1.42,.67]} s={[1.23,2.58,.03]} c="#506d2b"/><group position={[-.72,0,.68]} rotation={[0,state.doors.fridge?-1.25:0,0]}><Rounded p={[.72,.99,0]} s={[1.43,1.82,.18]} c="#96bf35"/><Rounded p={[.72,2.37,0]} s={[1.43,.86,.18]} c="#a6cb42"/><Box p={[.72,1.93,.08]} s={[1.4,.045,.03]} c="#5c862b"/>{[1.55,2.25].map(y=><group key={y}><Rounded p={[.14,y,.15]} s={[.09,.42,.15]} c="#376c31"/><Rounded p={[.12,y,.235]} s={[.05,.32,.04]} c="#73a445"/></group>)}{[[.4,2.5],[.94,2.24],[.9,1.58],[.45,.75]].map(([x,y],i)=><group key={i}><Box p={[x,y,.086]} s={[.3,.3,.012]} c={i%2?'#ffe8a9':'#e7f6ef'} r={[0,0,i%2?.12:-.12]}/><Ball p={[x,y+.13,.112]} s={[.045,.045,.02]} c={i%2?'#e54f51':'#307fba'}/><Box p={[x,y,.105]} s={[.15,.06,.01]} c={i%2?'#69a344':'#ed8196'}/></group>)}</group>{state.doors.fridge&&[.5,1,1.6,2.2].map(y=><group key={y}><Box p={[0,y,.1]} s={[1.1,.04,.9]} c="#eff5d5"/><Bottle p={[.25,y+.03,.3]} c="#edbd39"/></group>)}<LeafPlant p={[.2,2.86,0]} scale={.65}/><Rounded p={[0,.09,.67]} s={[1.22,.13,.08]} c="#63872b"/>{Array.from({length:11},(_,i)=><Box key={i} p={[-.5+i*.1,.09,.72]} s={[.045,.055,.01]} c="#355c2d"/>)}</group>}
export function ReferenceKitchen({state,onAction}:{state:LiveState;onAction:(a:Action)=>void}){
 const night=state.virtualHour<6||state.virtualHour>18;
 return <>
  <Box p={[-4.47,.51,-1.8]} s={[1.02,1,2.8]} c="#a269c6"/><Box p={[-4.44,1.06,-1.8]} s={[1.12,.14,2.86]} c="#efb742"/>{[-2.7,-1.8,-.9].map(z=><group key={z}><group position={[-3.9,.52,z]} rotation={[0,Math.PI/2,0]}><CabinetDoor p={[0,0,0]} w={.82} h={.88}/></group></group>)}
  {[-4,-2.7,-1.4].map(x=><Cabinet key={x} x={x}/>)}<Cabinet x={1.45} width={1.1}/>
  <Cabinet x={-4} upper/><Cabinet x={-.5} width={1.05} upper/><Cabinet x={1.6} width={.9} upper/><Cabinet x={.55} width={1.02} upper/>
  <Window p={[-2.25,2.25,-3.85]} night={night}/>
  <Sink/><KitchenDetails/><RoomDaylight kitchen on={!night&&state.power} shadows={state.settings.quality!=='low'}/>
  <Box p={[.2,.53,-3.43]} s={[1.3,1.05,1.05]} c="#343b45"/><Box p={[.2,.48,-2.88]} s={[1.08,.68,.03]} c="#1b2932"/><Box p={[.2,.48,-2.85]} s={[.88,.48,.015]} c="#3d5662"/><Box p={[.2,1.09,-3.43]} s={[1.35,.11,1.12]} c="#ddd5af"/>{[-1,1].flatMap(x=>[-1,1].map(z=><Cylinder key={`${x}${z}`} p={[.2+x*.33,1.16,-3.43+z*.28]} r={.16} h={.025} c="#364448"/>))}
  {[-.25,.05,.35,.65].map(x=><Cylinder key={x} p={[x,.98,-2.84]} r={.04} h={.04} rotation={[Math.PI/2,0,0]} c="#e7d2ad"/>)}<Box p={[.2,.81,-2.8]} s={[.88,.06,.08]} c="#d1d6ca"/>
  <Box p={[.2,2.18,-3.42]} s={[1.4,.18,1.1]} c="#c5a280"/><Box p={[.2,2.42,-3.69]} s={[.8,.38,.48]} c="#c0a380"/>
  <Fridge state={state} onAction={onAction}/>
  <Cylinder p={[0,.94,.3]} r={.46} h={.025} c="#f9c2cd"/>
  {[[-.25,.02],[-.25,.65],[.15,.65]].map(([x,z],i)=><Donut key={i} p={[x,.99,z]} scale={.65}/>)}
  {(!state.interaction||Date.now()-state.interaction.startedAt<DONUT_TIMES.pickup)&&<Donut p={[.15,1.01,.3]} scale={.8}/>}
  <CraftedTable p={[-1,0,.3]} kitchen/>{[-1.9,-.1].map(x=><CraftedChair key={x} p={[x,0,1.65]} r={Math.PI}/>)}<CraftedChair p={[-1,0,-1.12]} r={0}/><CraftedChair p={[-2.9,0,.3]} r={Math.PI/2}/>
  <Rounded p={[-1.3,.99,.25]} s={[.65,.19,.45]} c="#d98e48"/><Box p={[-1.3,1.095,.25]} s={[.55,.025,.38]} c="#f3bd85"/><Mug p={[-.4,.94,.3]} color="#47b6c8"/>
  <Box p={[-4.15,1.35,-3.38]} s={[.7,.45,.5]} c="#378ea4"/><Box p={[-4.2,1.35,-3.11]} s={[.43,.3,.02]} c="#244753"/>
  <Bottle p={[-3.5,1.14,-3.4]} c="#47a690"/><Bottle p={[-1.3,1.14,-3.4]} c="#dc754b"/>
  <Plant p={[-3.2,1.15,-3.6]} scale={.35}/><Plant p={[1.45,1.15,-3.6]} scale={.35}/>
  <group position={[4.48,0,-.8]}><Table s={[.65,1.07,.65]} c="#aa7132"/><Cylinder p={[0,1.45,0]} r={.22} h={.64} c="#6dc5da"/><Box p={[0,1.18,.24]} s={[.12,.1,.08]} c="#3982a1"/></group>
  <ContactShade p={[-1,.008,.3]} size={[3.7,2.5]}/><mesh position={[0,3.25,0]}><sphereGeometry args={[.26,16,8]}/><meshStandardMaterial color="#ffe5a1" emissive={state.power?'#ffc46b':'#000'} emissiveIntensity={.4}/></mesh>
  {state.power&&<pointLight position={[0,2.95,0]} intensity={7} distance={9} color="#ffe3af"/>}
 </>
}
