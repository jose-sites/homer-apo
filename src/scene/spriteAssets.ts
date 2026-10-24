import type { CharacterId } from '../../shared/types';
export type SpriteAngle='front'|'left'|'right'|'profile'|'back';
export interface SpriteFrames {closed:string;half?:string;open?:string;blink?:string}
export interface ExternalSprite {front:string;left?:string;right?:string;profile?:string;back?:string;frames?:Partial<Record<SpriteAngle,SpriteFrames>>}
export type SpriteOverrides=Partial<Record<CharacterId,ExternalSprite>>;
const ids:CharacterId[]=['homer','marge','bart','lisa','maggie'];
const angles:SpriteAngle[]=['front','left','right','profile','back'];
const localPath=(value:unknown):value is string=>typeof value==='string'&&/^\/(?!\/)[^\s]*$/.test(value)&&!value.includes('..');
/** Assets are same-origin static files; a manifest cannot introduce remote scripts or API keys. */
export function parseSpriteManifest(input:unknown):SpriteOverrides{
 if(!input||typeof input!=='object'||!('characters'in input))return {};
 const entries=(input as {characters:unknown}).characters;if(!entries||typeof entries!=='object')return {};
 const result:SpriteOverrides={};
 for(const id of ids){const raw=(entries as Record<string,unknown>)[id];if(!raw||typeof raw!=='object')continue;const candidate=raw as Record<string,unknown>;if(!localPath(candidate.front))continue;
  const asset:ExternalSprite={front:candidate.front};for(const angle of angles)if(localPath(candidate[angle]))asset[angle]=candidate[angle];
  if(candidate.frames&&typeof candidate.frames==='object'){asset.frames={};for(const angle of angles){const rawFrames=(candidate.frames as Record<string,unknown>)[angle];if(!rawFrames||typeof rawFrames!=='object')continue;const frames=rawFrames as Record<string,unknown>;if(!localPath(frames.closed))continue;const safe:SpriteFrames={closed:frames.closed};for(const frame of ['half','open','blink'] as const)if(localPath(frames[frame]))safe[frame]=frames[frame];asset.frames[angle]=safe;}}
  result[id]=asset;
 }return result;
}
export function selectSpriteAngle(yaw:number,asset?:ExternalSprite):SpriteAngle|null{
 const angle=Math.abs(yaw);
 if(angle<.45)return 'front';
 if(angle<1.05){const key=yaw<0?'left':'right';return asset?.[key]?key:'front';}
 if(angle<2.2)return asset?.profile?'profile':angle<1.2?'front':null;
 return asset?.back?'back':null;
}
export function spriteFramePaths(asset:ExternalSprite,angle:SpriteAngle):string[]{
 const base=asset[angle]||asset.front;const frames=asset.frames?.[angle];if(!frames)return Array(6).fill(base);
 return [frames.closed,frames.half||frames.closed,frames.open||frames.half||frames.closed,frames.blink||frames.closed,frames.blink||frames.half||frames.closed,frames.blink||frames.open||frames.closed];
}
let manifestPromise:Promise<SpriteOverrides>|null=null;
export function loadSpriteOverrides():Promise<SpriteOverrides>{return manifestPromise??=fetch(`${import.meta.env.BASE_URL}sprites/manifest.json`).then(r=>r.ok?r.json():{}).then(parseSpriteManifest).catch(()=>({}));}
