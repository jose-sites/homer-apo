import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, SRGBColorSpace, Texture, TextureLoader } from 'three';
import type { CharacterId, CharacterState, Speech, Vec3 } from '../../shared/types';
import { spriteSvg, SPRITE_MANIFEST } from './spriteArt';

export function CharacterSprite({character,position,height,speech,paused}: {character:CharacterState;position:Vec3;height:number;speech:Speech|null;paused:boolean}) {
 const group=useRef<Group>(null);const mesh=useRef<Mesh>(null);const {camera}=useThree();
 const textures=useMemo(()=>{
  const loader=new TextureLoader();
  return Array.from({length:6},(_,index)=>{
   const texture=loader.load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteSvg(character.id,index%3,index>2,character.expression))}`);
   texture.colorSpace=SRGBColorSpace;return texture;
  });
 },[character.id,character.expression]);
 const actualLevel=useRef<number|null>(null);
 useEffect(()=>{const handler=(event:Event)=>{const e=event as CustomEvent<{character:CharacterId;level:number}>;if(e.detail.character===character.id)actualLevel.current=e.detail.level;};window.addEventListener('homer:audio-level',handler);return()=>window.removeEventListener('homer:audio-level',handler);},[character.id]);
 useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures]);
 useFrame(({clock})=>{
  if(!group.current||!mesh.current)return;
  const t=clock.elapsedTime;const offset=character.id.length*1.3;
  group.current.position.y=position[1]+(!paused?Math.sin(t*1.5+offset)*.012:0);
  const talking=!paused&&speech?.character===character.id;
  const level=actualLevel.current;
  const mouth=talking?(level!==null?level>.22?2:level>.04?1:0:Math.floor((Math.sin(t*19)+1)*1.45)):0;
  const blink=(t+offset)%4.6<.16||character.activity==='sleeping';
  const mat=mesh.current.material as MeshBasicMaterial;
  const chosen=textures[(blink?3:0)+mouth];if(mat.map!==chosen){mat.map=chosen;mat.needsUpdate=true;}
  // The provisional set is front-only: limit facing compensation to a safe angle.
  const angle=Math.atan2(camera.position.x-position[0],camera.position.z-position[2]);
  group.current.rotation.y=Math.max(-.43,Math.min(.43,angle));
  group.current.rotation.z=character.activity==='reacting'&&!paused?Math.sin(t*5)*.035:0;
 });
 if(!character.enabled)return null;
 return <group ref={group} position={position} userData={{spriteManifest:SPRITE_MANIFEST[character.id]}}>
  <mesh ref={mesh} position={[0,height/2,0]} renderOrder={2}>
   <planeGeometry args={[height*300/420,height]}/><meshBasicMaterial map={textures[0]} transparent alphaTest={.05} side={DoubleSide} depthWrite={true} toneMapped={false}/>
  </mesh>
 </group>;
}
