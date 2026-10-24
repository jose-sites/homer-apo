import type {Vec3} from './types';
/** Shared by the renderer, navigation and snapshot migration. */
export const LAYOUT_REVISION=2;
export const STAIR_OFFSET:Vec3=[3.1,0,1.6];
export const STAIR_OPENING={left:1.85,right:4.35,back:-1.1,front:3.1};
export const STAIR_BOTTOM:Vec3=[3.1,0,-4.6];
export const STAIR_TOP:Vec3=[3.1,3.6,-9];
export const MIRRORED_ROOMS=['kitchen','dining','garage','wc','bart','lisa','maggie'];
export function portalStyle(key:string){return key==='hall-living'?{width:3.2,height:3.5,arch:false,leaf:false}:key==='kitchen-living'?{width:1.9,height:3.05,arch:true,leaf:true}:{width:1.9,height:2.59,arch:false,leaf:true};}
