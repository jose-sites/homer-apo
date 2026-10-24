import type {CharacterId,Vec3} from '../../shared/types';
/** Seat contact heights are authored per anatomy, in the existing sofa's coordinates. */
export const CHARACTER_LAYOUT:Record<CharacterId,{position:Vec3;height:number;contact:number}>={
 homer:{position:[-2.65,-.11,-1.4],height:2.3,contact:.008},
 marge:{position:[-1.5,-.03,-2.1],height:2.6,contact:.73},
 bart:{position:[-.45,.18,-2.1],height:1.65,contact:.73},
 lisa:{position:[.45,.35,-2.1],height:1.55,contact:.73},
 maggie:{position:[1.2,.58,-2.05],height:.95,contact:.73},
};
