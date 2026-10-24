import type {CharacterId} from '../../shared/types';
export const SPRITE_ART_STATUS='Sprites vetoriais 2.5D • expressões e boca animadas';
export interface SpriteAssetSet {front:string;left?:string;right?:string;profile?:string;back?:string}
export const SPRITE_MANIFEST:Record<CharacterId,SpriteAssetSet>={homer:{front:'/sprites/homer.svg'},marge:{front:'/sprites/marge.svg'},bart:{front:'/sprites/bart.svg'},lisa:{front:'/sprites/lisa.svg'},maggie:{front:'/sprites/maggie.svg'}};
/** All frames share a 300×420 registration. Expressions remain real runtime states. */
export function spriteSvg(id:CharacterId,mouth=0,blink=false,expression='neutral'):string{
 mouth=Math.max(0,Math.min(2,Math.floor(mouth)));expression=['neutral','happy','angry','confused','sleepy'].includes(expression)?expression:'neutral';
 const skin='url(#skin)',white='url(#shirt)',blue='url(#blue)',red='url(#red)';
 const defs=`<defs>
 <linearGradient id="skin" x1="0" x2="1" y1=".2" y2=".7"><stop stop-color="#ffe76c"/><stop offset=".45" stop-color="#ffd32a"/><stop offset="1" stop-color="#e7ac12"/></linearGradient>
 <linearGradient id="shirt" x1="0" x2="1" y1="0" y2=".5"><stop stop-color="#fffefa"/><stop offset=".65" stop-color="#f5f0df"/><stop offset="1" stop-color="#c6c4b7"/></linearGradient>
 <linearGradient id="blue"><stop stop-color="#4e91ce"/><stop offset=".6" stop-color="#3477b4"/><stop offset="1" stop-color="#205a94"/></linearGradient>
 <linearGradient id="hair"><stop stop-color="#347fdb"/><stop offset=".45" stop-color="#2268c5"/><stop offset="1" stop-color="#164791"/></linearGradient>
 <linearGradient id="green"><stop stop-color="#b8dc55"/><stop offset=".6" stop-color="#94c23d"/><stop offset="1" stop-color="#62952a"/></linearGradient>
 <linearGradient id="red"><stop stop-color="#ff8454"/><stop offset=".6" stop-color="#f15b32"/><stop offset="1" stop-color="#c73d23"/></linearGradient>
 <linearGradient id="baby"><stop stop-color="#91ddf5"/><stop offset=".6" stop-color="#60bee7"/><stop offset="1" stop-color="#3e8fc5"/></linearGradient>
 <linearGradient id="muzzle"><stop stop-color="#e8bc7e"/><stop offset="1" stop-color="#c59254"/></linearGradient>
 <radialGradient id="shoe"><stop stop-color="#62626a"/><stop offset="1" stop-color="#30343d"/></radialGradient>
 </defs>`;
 const eye=(x:number,y:number,r:number,side:number)=>{
  const pupil=expression==='confused'?-3:expression==='angry'?side*-1:2;
  const lid=expression==='sleepy'?r*.9:0;
  let out=blink?`<path d="M${x-r},${y}q${r},7 ${r*2},0" fill="none"/>`:`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*1.05}" fill="#fffef4"/><ellipse cx="${x+pupil}" cy="${y+2}" rx="3.2" ry="4.2" fill="#302e2a" stroke="none"/>`;
  if(lid&&!blink)out+=`<path d="M${x-r},${y-r*.2}Q${x},${y-r*2.1} ${x+r},${y-r*.2}L${x+r},${y-r+lid}H${x-r}Z" fill="${skin}"/><path d="M${x-r},${y-r+lid}H${x+r}" fill="none"/>`;
  const tilt=expression==='angry'?-side*9:expression==='confused'?(side<0?-8:3):0;
  if(expression!=='neutral')out+=`<path d="M${x-r*.75},${y-r-5-tilt}Q${x},${y-r-8} ${x+r*.75},${y-r-5+tilt}" fill="none" stroke-width="2.5"/>`;
  return out;
 };
 const lips=(x:number,y:number,w:number)=>mouth?`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${mouth===1?5:11}" fill="#552e29"/><path d="M${x-w*.75},${y-(mouth===1?2:6)}q${w*.75},3 ${w*1.5},0" stroke="#fff8e3" stroke-width="4" fill="none"/>${mouth===2?`<ellipse cx="${x+3}" cy="${y+6}" rx="${w*.45}" ry="3" fill="#ed8883" stroke="none"/>`:''}`:expression==='happy'?`<path d="M${x-w},${y-3}Q${x},${y+18} ${x+w},${y-3}Q${x},${y+2} ${x-w},${y-3}" fill="#fff9df"/>`:`<path d="M${x-w},${y}Q${x},${y+(expression==='angry'?-9:expression==='confused'?2:9)} ${x+w},${y-2}" fill="none"/>`;
 const hand=(x:number,y:number,mirror=1)=>`<g transform="translate(${x} ${y}) scale(${mirror} 1)"><path d="M0 0q-8 1-9 10l-3 17q0 6 5 4l3-10-1 16q1 6 5 1l2-16 1 17q3 5 6-1l-1-18 4 14q4 4 6-1l-3-23q-3-10-15-10" fill="${skin}"/></g>`;
 const shadow='<ellipse cx="150" cy="402" rx="64" ry="7" fill="#172536" opacity=".15" stroke="none"/>';
 let body='';
 if(id==='homer')body=`
 <path d="M91 292L88 375Q109 386 139 377L147 320L156 379Q181 388 206 375L205 291Z" fill="${blue}"/><path d="M147 320v-21M91 320q14 7 23 0M181 310l12 9" fill="none" stroke="#235685"/>
 <path d="M89 369q-19 4-23 18-1 12 20 13h54v-24q-25 2-32-8Z M158 375v23h64q16-9-1-20l-19-9q-13 10-44 6" fill="url(#shoe)"/>
 <path d="M76 192Q58 210 58 245l-5 30q12 8 24 3l9-42 7-32M217 193q20 16 22 45l8 35q-10 10-23 5l-14-46" fill="${skin}"/>${hand(57,265)}${hand(244,266,-1)}
 <path d="M103 169q-36 12-40 45l24 14q-12 28-8 64 64 35 137 0 7-38-4-64l25-14q-3-34-42-45Z" fill="${white}"/>
 <path d="M96 225q-15 28-8 60 16 9 29 10M198 231q9 33 7 54" fill="none" stroke="#d4d2c4" stroke-width="4"/>
 <path d="M116 166l-14 16 27 23 17-21 16 22 34-24-20-17" fill="${white}"/>
 <path d="M109 164q-16-18-14-44l-1-36q0-50 47-54 50-4 58 46l1 50q11 7 7 17l-12 8-3 17q-34 27-76 9Z" fill="${skin}"/>
 <path d="M113 38q-9-20 8-12M144 31q-5-21 12-14" fill="none" stroke-width="2"/>
 <path d="M100 105q-16-12-19 2-3 15 17 20M90 108l8 6" fill="${skin}"/>
 ${eye(141,95,21,-1)}${eye(178,97,20,1)}
 <path d="M160 113q31-4 34 9 1 9-29 6" fill="${skin}"/>
 <path d="M117 128q12-8 26-1l20 7 30-1q20 13 6 34-22 23-58 13-26-7-24-29Z" fill="url(#muzzle)"/>
 ${lips(164,153,23)}<path d="M120 144l-8-4m7 13-8-2m25 22 3-3" fill="none" stroke-width="1.4"/>
 `;
 if(id==='marge')body=`
 <path d="M126 345l-2 42 17 3 6-42M160 347l3 43 18-3-4-41" fill="${skin}"/>
 <path d="M124 381q-17 0-20 13 7 8 39 5l2-13M164 384l-1 14h37q7-9-20-16" fill="${red}"/>
 <path d="M118 229q-20 12-21 45l-8 43 12 5 15-52M181 230q19 10 20 40l12 46-13 6-19-51" fill="${skin}"/>${hand(91,308)}${hand(211,308,-1)}
 <path d="M119 224q28 13 59 0l-2 57 17 76q-43 16-82-1l12-75Z" fill="url(#green)"/><path d="M126 244l-3 84M178 284l7 62" stroke="#b6d65c" fill="none"/>
 <path d="M132 204l-4 23q22 13 42 0l-4-23" fill="${skin}"/>
 <path d="M111 176q-12-8-8-22-10-9-4-21-9-10-2-22-7-12 0-21-7-12 2-21-5-14 5-22-5-15 9-20 6-17 21-11 12-11 24-1 14-5 21 8 14 0 17 14 12 6 7 20 11 9 4 21 8 11 1 22 9 12 1 22 7 14-1 23 4 17-8 23Z" fill="url(#hair)"/>
 <path d="M114 45q8-21 20-21M113 59l-4 48m6-2v43" stroke="#4e8fe1" stroke-width="4" opacity=".55" fill="none"/>
 <path d="M116 170q8-9 18-3l12-3 12 6 14-4 12 10v29q-9 21-33 22-27-1-34-25l-8-14q-4-11 7-11Z" fill="${skin}"/>
 ${eye(135,185,16,-1)}${eye(164,185,16,1)}<path d="M148 199q30-4 30 7l-26 5" fill="${skin}"/>${lips(151,216,15)}
 <path d="M120 174l-5-7m10 3-2-8m51 12 5-7" fill="none"/>
 ${Array.from({length:8},(_,i)=>`<circle cx="${121+i*8}" cy="${230+Math.sin(i/7*Math.PI)*7}" r="5" fill="#f05e37"/>`).join('')}
 `;
 if(id==='bart')body=`
 <path d="M115 320l-3 52h23l8-49M167 323l3 49h24l-6-52" fill="${skin}"/>
 <path d="M109 364q-23 6-24 24 1 10 51 8l6-20-9-10M170 368l-4 26 60 1q8-17-32-29" fill="${blue}"/><path d="M88 390h49m32 0h55" stroke="#fff6db" stroke-width="6"/>
 <path d="M107 277l-4 51 41 4 8-23 10 23 40-5-7-50" fill="${blue}"/>
 <path d="M106 208q-17 7-23 34l-14 38 13 7 26-43M194 209q18 9 24 34l12 34-12 8-27-43" fill="${skin}"/>${hand(71,273)}${hand(230,273,-1)}
 <path d="M108 205q42-18 84 0l19 29-15 14 5 36q-48 19-100 0l4-36-20-13Z" fill="${red}"/>
 <path d="M111 201l-7-120 12 7 4-15 12 8 8-17 11 13 9-17 9 14 13-12 5 17 15-8-3 84q20-2 19 13-1 14-20 12l-2 25q-42 22-85-4Z" fill="${skin}"/>
 ${eye(141,145,21,-1)}${eye(179,146,20,1)}<path d="M160 162q30-3 32 8 0 9-25 9" fill="${skin}"/>${lips(158,193,22)}
 <path d="M106 282q38 11 86 0" fill="none" stroke="#d14324"/>
 `;
 const star=(cx:number,cy:number,r:number,inner:number,n=9)=>Array.from({length:n*2},(_,i)=>{const a=-Math.PI/2+i*Math.PI/n;return `${i?'L':'M'}${cx+Math.cos(a)*(i%2?inner:r)},${cy+Math.sin(a)*(i%2?inner:r)}`}).join('')+'Z';
 if(id==='lisa')body=`
 <path d="M125 319l-9 58 20 5 17-49M164 328l5 52 21-4-9-57" fill="${skin}"/>
 <path d="M116 371q-22 8-25 21 4 10 47 6l3-17M168 376l-3 21h45q12-11-20-25" fill="${red}"/>
 <path d="M117 216q-17 7-23 34l-16 30 12 8 25-36M181 216q19 8 23 33l17 31-13 9-27-37" fill="${skin}"/>${hand(79,274)}${hand(220,275,-1)}
 <path d="M121 218q29 13 57 0l6 55 21 61-20-7-16 11-17-10-17 11-15-11-20 7 17-62Z" fill="${red}"/>
 <path d="${star(151,149,79,58)}" fill="${skin}"/>
 ${eye(137,147,21,-1)}${eye(174,147,20,1)}<path d="M154 166q31-2 32 9l-24 8" fill="${skin}"/>${lips(151,198,18)}
 <path d="M118 132l-7-7m13 2-3-9m62 14 6-9m-4 16 10-4" fill="none"/>
 ${Array.from({length:8},(_,i)=>`<circle cx="${120+i*9}" cy="${218+Math.sin(i/7*Math.PI)*9}" r="5.2" fill="#fff8e4"/>`).join('')}
 `;
 if(id==='maggie')body=`
 <path d="M119 240q29-11 59 0l7 71q37 23 27 58-5 21-51 13-23 15-46 0-35 4-35-20-2-29 28-47Z" fill="url(#baby)"/>
 <path d="M115 250l-23 36-11-7 19-44M183 244l23 37-10 8-27-32" fill="${skin}"/>${hand(83,271)}${hand(205,274,-1)}
 <path d="${star(150,165,79,57)}" fill="${skin}"/>
 ${eye(136,163,22,-1)}${eye(176,163,21,1)}<path d="M156 182q25-3 28 6l-24 8" fill="${skin}"/>
 <path d="M130 101l-13-21-9 26 24 2 22 11 2-27Z" fill="url(#baby)"/><circle cx="132" cy="104" r="6" fill="#67bde1"/>
 <ellipse cx="156" cy="218" rx="${mouth?20:17}" ry="${mouth===2?12:9}" fill="#ee7844"/><ellipse cx="156" cy="223" rx="${mouth===2?8:6}" ry="8" fill="none" stroke="#fbd959" stroke-width="4"/>
 <path d="M106 335q20 3 40 40m38-38q-16 9-22 32" fill="none" stroke="#3b8ab7"/>
 `;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 300 420" data-character="${id}" data-expression="${expression}" data-mouth="${mouth}" data-blink="${blink}">${defs}<g stroke="#674b20" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shadow}${body}</g></svg>`;
}
