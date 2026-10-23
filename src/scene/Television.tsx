import { useEffect,useMemo,useRef } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Action, LiveState, Vec3 } from '../../shared/types';
import { Box,Cylinder } from './Furniture';
export function Television({state,onAction,p=[-3.5,.18,1.15],rotation=.42}:{state:LiveState;onAction:(a:Action)=>void;p?:Vec3;rotation?:number}){
 const {canvas,texture}=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return {canvas,texture};},[]);const last=useRef(-1);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(({clock})=>{if(Math.floor(clock.elapsedTime*3)===last.current)return;last.current=Math.floor(clock.elapsedTime*3);const c=canvas.getContext('2d')!;
 c.fillStyle=state.power?'#172e3b':'#101618';c.fillRect(0,0,640,400);if(!state.power){texture.needsUpdate=true;return;}
 c.fillStyle='#f4c747';c.font='bold 25px sans-serif';c.fillText('SPRINGFIELD TV',30,45);c.fillStyle='#78b7ac';c.font='15px monospace';c.fillText(`CANAL ${state.tvChannel+1} · AO VIVO`,30,72);
 if(state.game){c.fillStyle='#fff2cc';c.font='bold 29px sans-serif';c.fillText(state.game.title.slice(0,30),30,130);c.font='bold 39px monospace';c.fillStyle='#f4c747';c.fillText(state.game.masked.slice(0,24),30,205);c.font='19px sans-serif';c.fillStyle='#b9d5cf';wrap(c,state.game.hint,30,260,570,28);if(state.game.result){c.fillStyle='#fff2cc';c.fillText(state.game.result.slice(0,46),30,350);}}
 else if(state.tvChannel%3===1){c.fillStyle='#d4ebe2';c.font='bold 27px sans-serif';c.fillText('DIRETO DA NOSSA SALA',30,128);c.font='23px sans-serif';wrap(c,state.chat.at(-1)?.text||'O chat de teste aparece por aqui.',30,190,560,35);c.fillStyle='#f4c747';c.font='16px monospace';c.fillText(state.chat.at(-1)?.user||'742 EVERGREEN TERRACE',30,350);}
 else if(state.tvChannel%3===2){c.fillStyle='#d8b0c0';c.fillRect(30,105,580,230);for(let i=0;i<8;i++){c.fillStyle=['#f3cc4a','#73ad9a','#6d8eb8','#c96f6a'][i%4];c.beginPath();c.arc(70+i*75,210+Math.sin(clock.elapsedTime+i)*52,25,0,Math.PI*2);c.fill();}c.font='20px sans-serif';c.fillStyle='#fff5db';c.fillText('Intervalo animado · conteúdo original',30,370);}
 else{c.fillStyle='#80b8b9';c.fillRect(30,100,580,240);c.fillStyle='#d9c797';c.fillRect(30,285,580,55);c.fillStyle='#e1b68e';c.fillRect(210,172,225,115);c.fillStyle='#7d5146';c.beginPath();c.moveTo(180,175);c.lineTo(320,105);c.lineTo(460,175);c.fill();c.fillStyle='#79584c';c.fillRect(300,222,42,65);c.fillStyle='#f4dd8c';c.fillRect(235,205,42,34);c.fillRect(366,205,42,34);c.fillStyle='#fff0d4';c.font='18px monospace';c.fillText('A VIDA ACONTECE EM CASA',30,372);}
 texture.needsUpdate=true;});
 return <group position={p} rotation={[0,rotation,0]} onClick={e=>{e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:'tv'});}}><Box p={[0,.2,0]} s={[2,.4,.9]} c="#704a38"/><Box p={[0,1,.02]} s={[1.85,1.3,.68]} c="#56565d"/><Box p={[-.1,1,.38]} s={[1.58,1.06,.04]} c="#232d37"/><mesh position={[-.1,1,.41]}><planeGeometry args={[1.42,.91]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>{[.8,1.03].map(y=><Cylinder key={y} p={[.77,y,.4]} r={.06} h={.05} c="#c7bd97" rotation={[Math.PI/2,0,0]}/>)}<Box p={[.76,.64,.4]} s={[.09,.04,.025]} c="#b8cf85"/></group>
}
function wrap(c:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number){let line='';for(const word of text.split(' ')){const next=line+word+' ';if(c.measureText(next).width>width){c.fillText(line,x,y);line=word+' ';y+=lineHeight;}else line=next;}c.fillText(line,x,y);}
