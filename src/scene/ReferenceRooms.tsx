import {useEffect,useMemo} from 'react';
import {Shape,ExtrudeGeometry} from 'three';
import type {LiveState,Action,Vec3} from '../../shared/types';
import {Box,Ball,Cylinder,Rounded,Plant,Lamp,Table,Chair,Sofa,Rug,Donut,Mug,Picture,Window,ContactShade} from './Furniture';
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
  <group position={[-.45,0,0]} scale={[.61,1.14,1]}><Sofa/></group>
  <Rug p={[-.25,.018,.05]} s={[5.3,.035,3.5]} c="#e8458a" oval/>
  <Table p={[-.4,0,-.05]} s={[2.9,.62,1.4]} c="#b86a28"/><ContactShade p={[-.4,.01,-.05]} size={[3.6,2.1]}/>
  <Cylinder p={[.3,.73,-.1]} r={.27} h={.03} c="#f9c2cd"/><Donut p={[.3,.81,-.1]} scale={.8}/><Mug p={[-1.1,.7,-.2]} color="#e9c434"/>
  <Box p={[-.1,.73,.25]} s={[.42,.025,.24]} c="#e785a3"/>
  <Picture p={[-.45,2.58,-3.87]} size={[1.75,1.2]}/><Picture p={[-1.95,2.5,-3.87]} size={[.4,.6]} kind="family"/><Picture p={[1.05,2.5,-3.87]} size={[.4,.6]} kind="family"/>
  <Sideboard p={[-3.15,0,-2.9]}/><group position={[-3.15,.98,-2.9]}><Lamp on={state.power} scale={.65}/><mesh position={[0,.73,0]}><cylinderGeometry args={[.19,.31,.37,20,1,true]}/><meshStandardMaterial color="#a445bc" side={2}/></mesh></group>
  <Window p={[-4.86,2.05,.1]} rotation={Math.PI/2} night={night}/>
  <group position={[-3.5,0,.6]} scale={.85}><Television state={state} onAction={onAction} p={[0,0,0]} rotation={Math.PI+.2}/></group>
  <Plant p={[-4.55,0,2.8]} scale={1.4}/><Plant p={[2.7,0,-2.8]} scale={1.55}/>
  <group position={[4.5,0,2.65]} rotation={[0,-Math.PI/2,0]}><Sideboard p={[0,0,0]}/><Rounded p={[-.25,1.08,0]} s={[.4,.23,.3]} c="#25a99b"/><Plant p={[.35,.96,0]} scale={.4}/></group>
  {state.power&&<pointLight position={[-2.5,2.7,-1.8]} color="#ffd29b" intensity={16} distance={8}/>}
 </>
}
function Cabinet({x,width=1.3,upper=false}:{x:number;width?:number;upper?:boolean}){const y=upper?2.75:.51,h=upper?1.05:1;return <group><Box p={[x,y,-3.49]} s={[width,h,upper?.65:1.02]} c="#b170d1"/><Box p={[x,y,upper?-3.13:-2.95]} s={[width-.07,h-.07,.07]} c="#9960bd"/><Box p={[x,y,upper?-3.08:-2.9]} s={[width-.2,h-.22,.025]} c="#af7acc"/><Cylinder p={[x+width*.3,y-.15,upper?-3.03:-2.85]} r={.035} h={.18} c="#eabb46"/>{!upper&&<Box p={[x,1.06,-3.45]} s={[width+.04,.14,1.13]} c="#efb742"/>}</group>}
function Bottle({p,c}:{p:Vec3;c:string}){return <group position={p}><Cylinder p={[0,.13,0]} r={.08} h={.26} c={c}/><Cylinder p={[0,.29,0]} r={.04} h={.08} c="#edcf87"/></group>}
function Fridge({state,onAction}:{state:LiveState;onAction:(a:Action)=>void}){return <group position={[2.8,0,-3.12]} onClick={e=>{e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:'fridge'})}}><Rounded p={[0,1.42,0]} s={[1.45,2.84,1.3]} c="#80ab26"/><Box p={[0,1.42,.67]} s={[1.23,2.58,.03]} c="#506d2b"/><group position={[-.72,0,.68]} rotation={[0,state.doors.fridge?-1.25:0,0]}><Rounded p={[.72,1.42,0]} s={[1.43,2.8,.13]} c="#9dca2e"/><Box p={[.72,1.93,.08]} s={[1.4,.045,.03]} c="#5c862b"/>{[1.55,2.25].map(y=><Rounded key={y} p={[.14,y,.15]} s={[.08,.42,.11]} c="#376c31"/>)}{[[.4,2.5],[.94,2.24],[.9,1.58],[.45,.75]].map(([x,y],i)=><group key={i}><Box p={[x,y,.086]} s={[.3,.3,.012]} c={i%2?'#ffe8a9':'#e7f6ef'} r={[0,0,i%2?.12:-.12]}/><Ball p={[x,y+.13,.112]} s={[.045,.045,.02]} c={i%2?'#e54f51':'#307fba'}/><Box p={[x,y,.105]} s={[.15,.06,.01]} c={i%2?'#69a344':'#ed8196'}/></group>)}</group>{state.doors.fridge&&[.5,1,1.6,2.2].map(y=><group key={y}><Box p={[0,y,.1]} s={[1.1,.04,.9]} c="#eff5d5"/><Bottle p={[.25,y+.03,.3]} c="#edbd39"/></group>)}<Plant p={[.2,2.86,0]} scale={.65}/></group>}
export function ReferenceKitchen({state,onAction}:{state:LiveState;onAction:(a:Action)=>void}){
 const night=state.virtualHour<6||state.virtualHour>18;
 return <>
  <Box p={[-4.47,.51,-1.8]} s={[1.02,1,2.8]} c="#a269c6"/><Box p={[-4.44,1.06,-1.8]} s={[1.12,.14,2.86]} c="#efb742"/>{[-2.7,-1.8,-.9].map(z=><group key={z}><Box p={[-3.93,.52,z]} s={[.06,.87,.81]} c="#ae7ad0"/><Cylinder p={[-3.87,.59,z+.2]} r={.035} h={.2} c="#edbe4c"/></group>)}
  {[-4,-2.7,-1.4].map(x=><Cabinet key={x} x={x}/>)}<Cabinet x={1.45} width={1.1}/>
  <Cabinet x={-4} upper/><Cabinet x={-.5} width={1.05} upper/><Cabinet x={1.6} width={.9} upper/>
  <Window p={[-2.25,2.25,-3.85]} night={night}/>
  <Rounded p={[-2.25,1.15,-3.35]} s={[1.05,.08,.68]} c="#6da5a7"/><Rounded p={[-2.25,1.18,-3.35]} s={[.86,.04,.52]} c="#88c3c6"/><Cylinder p={[-2.25,1.36,-3.65]} r={.035} h={.43} c="#c1d9d3"/><Cylinder p={[-2.25,1.56,-3.52]} r={.035} h={.25} rotation={[Math.PI/2,0,0]} c="#c1d9d3"/>
  <Box p={[.2,.53,-3.43]} s={[1.3,1.05,1.05]} c="#343b45"/><Box p={[.2,.48,-2.88]} s={[1.08,.68,.03]} c="#1b2932"/><Box p={[.2,.48,-2.85]} s={[.88,.48,.015]} c="#3d5662"/><Box p={[.2,1.09,-3.43]} s={[1.35,.11,1.12]} c="#ddd5af"/>{[-1,1].flatMap(x=>[-1,1].map(z=><Cylinder key={`${x}${z}`} p={[.2+x*.33,1.16,-3.43+z*.28]} r={.16} h={.025} c="#364448"/>))}
  {[-.25,.05,.35,.65].map(x=><Cylinder key={x} p={[x,.98,-2.84]} r={.04} h={.04} rotation={[Math.PI/2,0,0]} c="#e7d2ad"/>)}<Box p={[.2,.81,-2.8]} s={[.88,.06,.08]} c="#d1d6ca"/>
  <Box p={[.2,2.18,-3.42]} s={[1.4,.18,1.1]} c="#c5a280"/><Box p={[.2,2.42,-3.69]} s={[.8,.38,.48]} c="#c0a380"/>
  <Fridge state={state} onAction={onAction}/>
  <Table p={[-1,0,.3]} s={[2.9,.85,1.7]} c="#35a1db"/>{[-1.9,-.1].map(x=><Chair key={x} p={[x,0,1.65]} r={0} c="#c64c21"/>)}<Chair p={[-1,0,-1.12]} r={Math.PI} c="#c64c21"/><Chair p={[-2.9,0,.3]} r={Math.PI/2} c="#c64c21"/>
  <Rounded p={[-1.3,.99,.25]} s={[.65,.19,.45]} c="#d98e48"/><Box p={[-1.3,1.095,.25]} s={[.55,.025,.38]} c="#f3bd85"/><Mug p={[-.4,.94,.3]} color="#47b6c8"/>
  <Box p={[-4.15,1.35,-3.38]} s={[.7,.45,.5]} c="#378ea4"/><Box p={[-4.2,1.35,-3.11]} s={[.43,.3,.02]} c="#244753"/>
  <Bottle p={[-3.5,1.14,-3.4]} c="#47a690"/><Bottle p={[-1.3,1.14,-3.4]} c="#dc754b"/>
  <Plant p={[-3.2,1.15,-3.6]} scale={.35}/><Plant p={[1.45,1.15,-3.6]} scale={.35}/>
  <group position={[4.48,0,-.8]}><Table s={[.65,1.07,.65]} c="#aa7132"/><Cylinder p={[0,1.45,0]} r={.22} h={.64} c="#6dc5da"/><Box p={[0,1.18,.24]} s={[.12,.1,.08]} c="#3982a1"/></group>
  <ContactShade p={[-1,.008,.3]} size={[3.7,2.5]}/><mesh position={[0,3.25,0]}><sphereGeometry args={[.26,16,8]}/><meshStandardMaterial color="#ffe5a1" emissive={state.power?'#ffc46b':'#000'} emissiveIntensity={.4}/></mesh>
  {state.power&&<pointLight position={[0,2.95,0]} intensity={14} distance={9} color="#ffe3af"/>}
 </>
}
