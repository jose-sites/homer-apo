import {RigCharacter} from './RigCharacter';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, SRGBColorSpace, Texture, TextureLoader, Vector3 } from 'three';
import type { CharacterId, CharacterState, Speech, Vec3 } from '../../shared/types';
import { spriteSvg, SPRITE_MANIFEST } from './spriteArt';
import { loadSpriteOverrides, selectSpriteAngle, spriteFramePaths } from './spriteAssets';
import type { ExternalSprite, SpriteAngle } from './spriteAssets';

export function CharacterSprite({character,position,height,speech,paused}: {character:CharacterState;position:Vec3;height:number;speech:Speech|null;paused:boolean}) {
 const group=useRef<Group>(null);const mesh=useRef<Mesh>(null);const {camera}=useThree();
 const [asset,setAsset]=useState<ExternalSprite>();const replacements=useRef<Partial<Record<SpriteAngle,Texture[]>>>({});
 const worldPosition=useMemo(()=>new Vector3(),[]);
 const textures=useMemo(()=>{
  const loader=new TextureLoader();
  return Array.from({length:6},(_,index)=>{
   const texture=loader.load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteSvg(character.id,index%3,index>2,character.expression))}`);
   texture.colorSpace=SRGBColorSpace;return texture;
  });
 },[character.id,character.expression]);
 useEffect(()=>{let alive=true;void loadSpriteOverrides().then(manifest=>{if(alive)setAsset(manifest[character.id]);});return()=>{alive=false;};},[character.id]);
 useEffect(()=>{
  if(!asset)return;let alive=true;const loaded:Texture[]=[];const loader=new TextureLoader();
  const variants=(['front','left','right','profile','back'] as SpriteAngle[]).filter(angle=>asset[angle]);
  for(const angle of variants){const paths=spriteFramePaths(asset,angle);const unique=[...new Set(paths)];
   void Promise.all(unique.map(async path=>{const texture=await loader.loadAsync(path);texture.colorSpace=SRGBColorSpace;if(!alive){texture.dispose();return [path,texture] as const;}loaded.push(texture);return [path,texture] as const;})).then(entries=>{if(alive){const lookup=new Map(entries);replacements.current[angle]=paths.map(path=>lookup.get(path)!);}}).catch(()=>{window.dispatchEvent(new CustomEvent('homer:sprite-error',{detail:{character:character.id,angle,message:'Arte indisponível; mantendo sprite vetorial provisório.'}}));});
  }
  return()=>{alive=false;replacements.current={};loaded.forEach(t=>t.dispose());};
 },[asset,character.id]);
 const actualLevel=useRef<number|null>(null);const levelAt=useRef(0);
 useEffect(()=>{const handler=(event:Event)=>{const e=event as CustomEvent<{character:CharacterId;level:number}>;if(e.detail.character===character.id){actualLevel.current=e.detail.level;levelAt.current=performance.now();}};window.addEventListener('homer:audio-level',handler);return()=>window.removeEventListener('homer:audio-level',handler);},[character.id]);
 useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures]);
 useFrame(({clock})=>{
  if(!group.current||!mesh.current)return;
  const t=clock.elapsedTime;const offset=character.id.length*1.3;
  group.current.position.y=position[1]+(!paused?Math.sin(t*1.5+offset)*.012:0);
  const talking=!paused&&speech?.character===character.id;
  const level=performance.now()-levelAt.current<500?actualLevel.current:null;
  const mouth=talking?(level!==null?level>.22?2:level>.04?1:0:Math.floor((Math.sin(t*19)+1)*1.45)):0;
  const blink=(t+offset)%4.6<.16||character.activity==='sleeping';
  group.current.getWorldPosition(worldPosition);
  const yaw=Math.atan2(camera.position.x-worldPosition.x,camera.position.z-worldPosition.z);
  const angle=selectSpriteAngle(yaw,asset);group.current.visible=angle!==null;
  const usable=angle&&replacements.current[angle];const frames=usable||textures;
  const mat=mesh.current.material as MeshBasicMaterial;const chosen=frames[(blink?3:0)+mouth];
  if(mat.map!==chosen)mat.map=chosen;
  // Front-only fallback never pretends to be a full 3D turn. Unsafe rear views hide it.
  group.current.rotation.y=usable&&angle!=='front'?yaw:Math.max(-.43,Math.min(.43,yaw));
  group.current.rotation.z=character.activity==='reacting'&&!paused?Math.sin(t*5)*.035:0;
 });
 if(!character.enabled)return null;
 if(!asset)return <RigCharacter character={character} position={position} height={height} speech={speech} paused={paused}/>;
 return <group ref={group} position={position} userData={{spriteManifest:SPRITE_MANIFEST[character.id]}}>
  <mesh ref={mesh} position={[0,height/2,0]} renderOrder={2}>
   <planeGeometry args={[height*300/420,height]}/><meshBasicMaterial map={textures[0]} transparent alphaTest={.05} side={DoubleSide} depthWrite={true} toneMapped={false}/>
  </mesh>
 </group>;
}
