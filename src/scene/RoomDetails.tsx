import {useEffect,useMemo} from 'react';
import {CanvasTexture,SRGBColorSpace} from 'three';
import type {Room,Vec3} from '../../shared/types';
import {Ball,Box,Cylinder,Rounded,Plant,ContactShade,Window,Bookcase} from './Furniture';
import {roomLook} from './artDirection';

/** Small local canvas illustrations: reusable artwork, not backgrounds replacing the house. */
export function Graphic({p,size=[1,1],kind='poster',label='',color='#9b40b4',rotation=0}:{p:Vec3;size?:[number,number];kind?:string;label?:string;color?:string;rotation?:number}){
 const map=useMemo(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d')!;
 g.fillStyle=color;g.fillRect(0,0,256,256);
 if(kind==='tile'){g.strokeStyle='#ddf4ef';g.lineWidth=3;for(let i=0;i<=256;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.moveTo(0,i);g.lineTo(256,i);g.stroke();}g.fillStyle='#bceaf0';for(let i=0;i<8;i++){g.save();g.translate(i*32+16,112);g.rotate(Math.PI/4);g.fillRect(-5,-5,10,10);g.restore();}}
 else if(kind==='peg'){g.fillStyle='#62472d';for(let x=12;x<256;x+=16)for(let y=12;y<256;y+=16){g.beginPath();g.arc(x,y,2,0,7);g.fill();}}
 else {g.fillStyle='#ffffff12';for(let i=0;i<12;i++){g.beginPath();g.moveTo(128,128);g.lineTo(i*55-200,0);g.lineTo(i*55-175,0);g.fill();}g.fillStyle='#ffcb45';g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?36:84;g.lineTo(128+Math.cos(a)*r,112+Math.sin(a)*r)}g.closePath();g.fill();g.fillStyle='#fff6db';g.font='900 26px sans-serif';g.textAlign='center';g.fillText(label,128,218);g.strokeStyle='#fff5d5';g.lineWidth=5;g.strokeRect(8,8,240,240);}
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;},[kind,label,color]);useEffect(()=>()=>map.dispose(),[map]);
 return <mesh position={p} rotation={[0,rotation,0]}><planeGeometry args={size}/><meshStandardMaterial map={map} roughness={.9}/></mesh>
}
function Jar({p,c='#29b4bb',h=.35}:{p:Vec3;c?:string;h?:number}){return <group position={p}><Cylinder p={[0,h/2,0]} r={.11} h={h} c={c}/><Cylinder p={[0,h+.025,0]} r={.12} h={.05} c="#e9bb64"/><Box p={[0,h*.52,.112]} s={[.12,h*.4,.01]} c="#fff4ce"/></group>}
function Drawer({p,c='#ab63c7',height=1.2}:{p:Vec3;c?:string;height?:number}){return <group position={p} scale={[1,height/1.2,1]}><Box p={[0,.58,0]} s={[1.2,1.12,.8]} c={c}/><Rounded p={[0,1.18,0]} s={[1.34,.12,.92]} c={c}/>{[.25,.59,.93].map(y=><group key={y}><Box p={[0,y,.42]} s={[1.05,.27,.05]} c={c}/>{[-.32,.32].map(x=><Ball key={x} p={[x,y,.48]} s={[.045,.045,.045]} c="#ffc64d"/>)}</group>)}{[-.45,.45].map(x=><Box key={x} p={[x,.06,.22]} s={[.12,.12,.12]} c="#723c62"/>)}</group>}
function Teddy({p,scale=1}:{p:Vec3;scale?:number}){return <group position={p} scale={scale}><Ball p={[0,.35,0]} s={[.28,.34,.22]} c="#bc742d"/><Ball p={[0,.76,0]} s={[.27,.26,.22]} c="#d58c3e"/>{[-1,1].map(i=><group key={i}><Ball p={[i*.23,.96,0]} s={[.12,.13,.07]} c="#bc742d"/><Ball p={[i*.25,.12,.14]} s={[.15,.14,.2]} c="#d58c3e"/><Ball p={[i*.3,.46,0]} s={[.11,.23,.12]} c="#d58c3e"/><Ball p={[i*.09,.79,.205]} s={[.025,.03,.015]} c="#3e2c2f"/></group>)}<Ball p={[0,.66,.18]} s={[.14,.1,.08]} c="#f4c17a"/><Ball p={[0,.7,.25]} s={[.045,.035,.03]} c="#49332b"/><Box p={[0,.5,.23]} s={[.22,.09,.02]} c="#eb5c5a"/></group>}
function Pendant({power,industrial=false,hall=false}:{power:boolean;industrial?:boolean;hall?:boolean}){return <group position={[hall?3.3:industrial?2.7:0,3.48,industrial?-1:0]}><Cylinder p={[0,-.15,0]} r={.025} h={.3} c="#804b32"/>{industrial?<><Box p={[0,-.27,0]} s={[2.1,.1,.45]} c="#535761"/><Box p={[0,-.33,0]} s={[1.9,.04,.24]} c="#fff9d6" emissive={power?'#fff1ac':'#000'}/></>:<><mesh position={[0,-.33,0]}><cylinderGeometry args={[.22,.42,.25,16]}/><meshStandardMaterial color="#ffd063" emissive={power?'#ffbe48':'#000'} emissiveIntensity={.25}/></mesh><Ball p={[0,-.44,0]} s={[.3,.09,.3]} c="#ffebac"/></>}{power&&<pointLight position={[0,-.6,0]} color="#ffe1a8" intensity={industrial?14:11} distance={9} decay={2}/>}</group>}

export function RoomDetails({room,power,night}:{room:Room;power:boolean;night:boolean}){
 const look=roomLook(room.id);const industrial=['garage','basement','attic'].includes(room.kind);
 return <>
 {!['exterior','yard'].includes(room.kind)&&<Pendant power={power} industrial={industrial} hall={room.kind==='hall'}/>}
 {room.kind==='living'&&<><ContactShade p={[-.3,.009,-.25]} size={[4.2,2]}/><group position={[4.74,2.1,2]} rotation={[0,-Math.PI/2,0]}><Cylinder r={.34} h={.07} rotation={[Math.PI/2,0,0]} c="#8b41a4"/><Cylinder p={[0,0,.05]} r={.28} h={.02} rotation={[Math.PI/2,0,0]} c="#fff4c8"/><Box p={[.07,.06,.075]} s={[.17,.035,.02]} c="#553447"/><Box p={[0,.12,.075]} s={[.025,.24,.02]} c="#553447"/></group><Jar p={[-3.88,.8,-2.6]} c="#e94e79" h={.19}/></>}
 {room.kind==='kitchen'&&<>
  {[-2.4,-1.2,3.25,3.65,4].map((x,i)=><Jar key={x} p={[x,1.09,-3.55]} c={['#f17b37','#57aa52','#f0c642','#31a7b3','#e45d6c'][i]} h={.24+i%2*.12}/>)}
  <Box p={[2,.9,-2.53]} s={[.85,.07,.08]} c="#242e39"/>{[1.56,1.84,2.12,2.4].map(x=><Cylinder key={x} p={[x,.95,-2.5]} r={.045} h={.05} rotation={[Math.PI/2,0,0]} c="#f8e5b8"/>)}
  <group position={[1.2,.9,.9]}><Cylinder r={.19} h={.06} c="#f4b942"/><Ball p={[0,.1,0]} s={[.13,.12,.13]} c="#ed5340"/><Ball p={[.15,.1,.04]} s={[.13,.12,.13]} c="#8bbb36"/></group>
  <ContactShade p={[.5,.006,.6]} size={[3.4,2.5]}/>
 </>}
 {room.kind==='dining'&&<>{[-1.1,1.1].flatMap(x=>[-.65,.65].map(z=><group key={`${x}${z}`}><Cylinder p={[x,1,z]} r={.26} h={.025} c="#fff0c8"/><Cylinder p={[x,1.02,z]} r={.2} h={.008} c="#76c7c8"/><Box p={[x+.33,1.02,z]} s={[.025,.025,.35]} c="#d4dce1"/></group>))}<ContactShade size={[5.2,3.3]}/></>}
 {room.kind==='hall'&&<><group position={[-4.2,0,1.5]}><Cylinder p={[0,1.25,0]} r={.06} h={2.5} c="#853c25"/><Cylinder p={[0,.05,0]} r={.36} h={.1} c="#853c25"/>{[-1,1].map(x=><Cylinder key={x} p={[x*.22,2.1,0]} r={.04} h={.65} c="#853c25" rotation={[0,0,x*.75]}/>)}<Ball p={[0,2.6,0]} s={[.09,.09,.09]} c="#a85c29"/></group><Graphic p={[-2.5,2.3,-3.87]} size={[.65,.9]} label="HOME" color="#ae4c90"/></>}
 {['bedroom','bart','lisa'].includes(room.kind)&&<>
  <Drawer p={[-3.2,0,-2.3]} c={look.accent} height={.8}/>
  <group position={[3.65,.92,-2.75]}><Cylinder p={[0,.03,0]} r={.2} h={.06} c="#bd7032"/><Ball p={[0,.33,0]} s={[.24,.24,.24]} c="#30b3d0"/><Ball p={[.08,.39,.2]} s={[.12,.1,.05]} c="#8fca39"/><Cylinder p={[0,.14,0]} r={.025} h={.22} c="#e7b14b"/></group>
  {[0,1,2].map(i=><Box key={i} p={[2.65,1.01+i*.06,-2.7]} s={[.55,.05,.4]} c={['#e84e3e','#6b42af','#ffbd36'][i]}/>)}
  {room.kind==='bart'&&<><Graphic p={[2.8,2.2,-3.88]} size={[1,1.35]} label="EL BARTO" color="#342778"/><Graphic p={[-3.45,2.2,-3.88]} size={[.8,1.1]} label="SKATE!" color="#d54734"/></>}
  {room.kind==='lisa'&&<><Graphic p={[2.8,2.2,-3.88]} size={[1,1.2]} label="JAZZ CLUB" color="#d66d35"/><Cylinder p={[2.36,.39,1.2]} r={.17} h={.09} rotation={[.2,0,0]} c="#ffbf36"/></>}
 </>}
 {room.kind==='nursery'&&<><Drawer p={[-3.6,0,-2.5]} c="#f19968"/><Teddy p={[-3.9,1.25,-2.5]} scale={.65}/><Bookcase p={[4.2,0,-2.9]} scale={.8}/><group position={[0,.07,.5]}>{Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return <Ball key={i} p={[Math.sin(a)*.5,0,Math.cos(a)*.5]} s={[.42,.02,.42]} c="#f66ca4"/>})}<Cylinder r={.28} h={.05} c="#ffd039"/></group><group position={[0,2.8,-1.8]}><Cylinder r={.02} h={.7} c="#ffcf52"/><Box s={[1,.04,.04]} c="#f8ca56"/>{[-.4,0,.4].map((x,i)=><group key={x}><Cylinder p={[x,-.3,0]} r={.008} h={.6} c="#f8e9c5"/><Ball p={[x,-.58,0]} s={[.1,.08,.07]} c={['#f0669b','#ffcf3d','#58b8e2'][i]}/></group>)}</group></>}
 {room.kind==='bathroom'&&<>
  <Graphic p={[-2.4,1.6,-3.88]} size={[4.1,3.1]} kind="tile" color={room.id==='wc'?'#63bfb7':'#439db9'}/>
  <Cylinder p={[-2.5,2.95,-1.65]} r={.025} h={3.6} rotation={[0,0,Math.PI/2]} c="#e2e5de"/>{[-3.95,-3.78,-3.61,-3.44].map((x,i)=><Cylinder key={x} p={[x,1.93,-1.65]} r={.12} h={1.9} c={i%2?'#9164bf':'#b98cda'}/>)}
  <Rounded p={[2.4,1.5,-3]} s={[1.3,.1,.7]} c="#f5f3e3"/><Box p={[2.4,2.35,-3.79]} s={[1.7,1.2,.04]} c="#a278c4"/><Box p={[2.4,2.35,-3.75]} s={[1.5,1,.02]} c="#afdce8"/><Box p={[2.4,3.05,-3.7]} s={[1.4,.08,.15]} c="#fff4b5" emissive={power?'#fff3b2':'#000'}/>
  <Jar p={[1.8,1.52,-2.85]} c="#45bcac" h={.2}/><Jar p={[3,1.52,-2.85]} c="#ed91ae" h={.25}/><Box p={[2.4,.85,-2.43]} s={[1.4,.06,.035]} c="#804f9d"/>{[2,2.8].map(x=><Ball key={x} p={[x,.85,-2.38]} s={[.045,.045,.045]} c="#ffda69"/>)}
  <Cylinder p={[2.8,.68,1]} r={.34} h={.06} c="#faf8e9"/><Cylinder p={[2.8,.72,1]} r={.22} h={.015} c="#abc7cb"/>
 </>}
 {room.kind==='garage'&&<><Graphic p={[3.2,2.1,-3.72]} size={[2.5,1.4]} kind="peg" color="#ba8550"/>{[2.3,2.7,3.1,3.5,3.9].map((x,i)=><group key={x}><Box p={[x,2,-3.63]} s={[.06,.5,.05]} c={i%2?'#eb6c38':'#3b83ad'}/><Box p={[x,2.23,-3.6]} s={[.22,.08,.05]} c="#cad2cf"/></group>)}<Rounded p={[3.2,1.13,-3.2]} s={[.9,.28,.45]} c="#cf493a"/><Jar p={[4,1.03,-3.2]} c="#e6ba44"/><ContactShade size={[3.4,5.4]}/></>}
 {room.kind==='basement'&&<><group position={[-3.6,0,-.6]}><Box p={[0,.65,0]} s={[1.3,1.3,1.2]} c="#d9e7dd"/><Cylinder p={[0,.62,.62]} r={.43} h={.06} rotation={[Math.PI/2,0,0]} c="#6e8588"/><Cylinder p={[0,.62,.67]} r={.32} h={.03} rotation={[Math.PI/2,0,0]} c="#4c828f"/>{[-.35,.15,.4].map(x=><Ball key={x} p={[x,1.13,.62]} s={[.065,.065,.03]} c="#636d64"/>)}<Jar p={[.3,1.3,0]} c="#e9673b"/></group><Cylinder p={[4.6,1.6,-2]} r={.07} h={3.2} c="#a79b7d"/><Cylinder p={[2,3.15,-3.65]} r={.07} h={5} rotation={[0,0,Math.PI/2]} c="#9f977d"/><Box p={[3,1.2,-2.01]} s={[.7,.4,.03]} c="#516863"/></>}
 {room.kind==='attic'&&<>{[-3,-1,1,3].map(z=><group key={z}><Box p={[0,3.4,z]} s={[10,.22,.18]} c="#704127"/>{[-1,1].map(x=><Box key={x} p={[x*4.8,1.75,z]} s={[.16,3.5,.16]} c="#805031"/>)}</group>)}<Window p={[-4.85,2,-1]} rotation={Math.PI/2} night={night}/><Bookcase p={[3.5,0,-3.4]} scale={.9}/><Teddy p={[2.5,.9,1.5]} scale={.6}/>{[-3,0,2.5].map(x=><group key={x}><Box key={`${x}t`} p={[x,.91,1.5]} s={[.12,.025,1]} c="#ead09a"/><Box key={`${x}l`} p={[x,.48,2.01]} s={[.42,.22,.01]} c="#e8d2a5"/></group>)}</>}
 {['yard','exterior'].includes(room.kind)&&<OutdoorDetails yard={room.kind==='yard'}/>}
 </>
}
function OutdoorDetails({yard}:{yard:boolean}){return <>
 <Box p={[0,-.16,0]} s={[110,.1,110]} c="#75b644"/>
 {[-22,-17,18,24].map((x,i)=><Ball key={x} p={[x,2,-25-i%2*5]} s={[12,4,8]} c={i%2?'#4aa253':'#67b756'}/>)}
 {[-16,0,17].map((x,i)=><group key={x} position={[x,12+i%2*3,-22]}><Ball s={[3.2,.6,1]} c="#fff9e8"/><Ball p={[.7,.5,0]} s={[1.3,.9,.8]} c="#fffdf4"/></group>)}
 {yard?<>
  <group position={[-8,0,-1]}><Box p={[0,2.8,0]} s={[3.3,.2,2.5]} c="#b77032"/><Box p={[0,3.8,-.8]} s={[2.6,1.9,.12]} c="#d89843"/>{[-1.3,1.3].map(x=><Box key={x} p={[x,3.8,0]} s={[.12,1.9,1.8]} c="#b97c39"/>)}<Box p={[0,4.9,0]} s={[3.1,.15,2.3]} c="#93502c" r={[0,0,.08]}/><Box p={[.65,3.85,.94]} s={[1.2,1.9,.1]} c="#d89843"/><Box p={[.65,3.95,1.01]} s={[.65,.65,.04]} c="#553322"/>{[-.5,.3].map(x=><Box key={x} p={[x,1.6,1.4]} s={[.08,3.3,.08]} c="#a2642d" r={[-.23,0,0]}/>)}{Array.from({length:9},(_,i)=><Box key={i} p={[-.1,.25+i*.32,1.7-i*.075]} s={[.88,.065,.09]} c="#d39b51"/>)}</group>
  <group position={[5,1.22,-1]}>{Array.from({length:7},(_,i)=><Box key={i} p={[-.45+i*.15,0,0]} s={[.035,.03,.8]} c="#a3b1b8"/>)}</group>
  <Jar p={[.5,.98,0]} c="#e7b437" h={.2}/><Plant p={[-.3,1,0]} scale={.35}/>
 </>:<>{[-5,-3,5,7,9,11].map(x=><group key={x}><Ball p={[x,.45,-3.6]} s={[.9,.6,.6]} c={x%3?'#359144':'#63ad39'}/>{[-.3,.2].map(dx=><Ball key={dx} p={[x+dx,.8,-3.2]} s={[.12,.12,.1]} c={x%3?'#f395ab':'#ffd45a'}/>)}</group>)}<Box p={[3.53,1.66,-1.5]} s={[.05,.4,.04]} c="#e55542"/><Box p={[3.65,1.82,-1.5]} s={[.24,.14,.04]} c="#e55542"/></>}
 </>}
