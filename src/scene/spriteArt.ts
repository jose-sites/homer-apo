import type { CharacterId } from '../../shared/types';

export const SPRITE_ART_STATUS = 'Artes vetoriais provisórias • substituíveis';
export interface SpriteAssetSet {front:string;left?:string;right?:string;profile?:string;back?:string}
/** Supply licensed artwork with the same transparent 300×420 registration frame. */
export const SPRITE_MANIFEST: Record<CharacterId, SpriteAssetSet> = {
  homer:{front:'/sprites/homer.svg'},marge:{front:'/sprites/marge.svg'},bart:{front:'/sprites/bart.svg'},lisa:{front:'/sprites/lisa.svg'},maggie:{front:'/sprites/maggie.svg'},
};
const outline = 'stroke="#352c24" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
export function spriteSvg(id:CharacterId,mouth=0,blink=false,expression='neutral'):string {
 const fill='#ffd629';
 const eye=(x:number,y:number,r=18)=>blink?`<path d="M${x-r},${y}q${r},8 ${r*2},0" fill="none"/>`:`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r+1}" fill="#fffdf1"/><ellipse cx="${x+3}" cy="${y+2}" rx="3.2" ry="4.5" fill="#302b24" stroke="none"/>`;
 const lips=(x:number,y:number,w=18)=>mouth?`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${mouth===1?7:15}" fill="#672b23"/><path d="M${x-w+4},${y-4}h${w*2-8}" stroke="#fff8df" stroke-width="5"/>`:`<path d="M${x-w},${y-2}q${w},${expression==='angry'?-9:12} ${w*2},0" fill="none"/>`;
 let body='';
 if(id==='homer')body=`
 <ellipse cx="151" cy="395" rx="78" ry="12" fill="#1b252d" opacity=".2" stroke="none"/>
 <path d="M92 306L88 374Q82 386 55 385L49 401H126L138 329L145 399H224Q227 383 199 377L207 301" fill="#3d78b2"/>
 <path d="M51 400H126M146 400H224" stroke="#282b35" stroke-width="9"/>
 <path d="M85 189Q52 197 45 250L39 285Q42 304 55 303Q70 300 73 278L81 250L90 293H205L217 252L230 292Q241 310 254 301Q262 294 253 277L240 225Q233 196 206 190" fill="${fill}"/>
 <path d="M91 183L126 171H180L210 187Q234 194 237 226L211 239L214 308Q158 332 83 309L87 238L62 229Q66 198 91 183" fill="#fffdf1"/>
 <path d="M121 182L145 210L157 186L178 210L192 182" fill="#fffdf1"/>
 <path d="M107 180Q89 157 96 133L91 106Q88 54 135 42Q189 30 203 77L204 131Q219 147 199 160L192 180Q154 201 107 180" fill="${fill}"/>
 <path d="M112 56Q106 24 130 37M145 41Q149 19 165 40" fill="none" stroke-width="3"/>
 <path d="M96 114l-9-7v24l12-4" fill="${fill}"/>
 ${eye(145,110,22)}${eye(183,110,21)}
 <path d="M167 125Q195 121 195 134Q191 141 172 138" fill="${fill}"/>
 <path d="M114 150Q111 131 137 133L165 140L195 140Q214 154 198 176Q171 197 134 180Q117 173 114 150" fill="#d5ad6f"/>
 ${lips(166,159,22)}<path d="M117 148l-9-6M115 158l-11-3" stroke-width="2"/>
 <path d="M74 266L65 282M224 271l12 15" stroke-width="3"/>
 `;
 if(id==='marge')body=`
 <ellipse cx="150" cy="398" rx="61" ry="9" fill="#1b252d" opacity=".2" stroke="none"/>
 <path d="M124 344L121 383Q96 388 101 398H146L150 355L157 393Q175 408 200 397Q199 388 178 383L174 344" fill="#e55c48"/>
 <path d="M112 225Q86 237 87 294L80 323Q79 338 94 338L112 305L119 261M186 228Q211 234 212 276L219 325Q217 344 203 335L190 279L180 261" fill="${fill}"/>
 <path d="M118 220Q150 234 182 220L183 286L198 367Q149 384 104 365L119 288Z" fill="#98c55a"/>
 <path d="M128 193L124 226Q153 244 178 224L172 190" fill="${fill}"/>
 <path d="M114 156Q84 147 90 129Q74 113 87 96Q78 78 92 68Q82 48 103 42Q102 22 125 25Q144 8 157 24Q179 17 186 36Q211 42 201 62Q219 78 205 94Q219 111 207 127Q218 151 189 164Z" fill="#2466aa"/>
 <path d="M119 139Q140 132 158 143Q176 130 187 150L185 194Q176 224 145 218Q115 210 111 188L105 166Q104 153 119 153" fill="${fill}"/>
 ${eye(139,165,18)}${eye(172,165,18)}
 <path d="M156 179Q185 176 186 187L160 190" fill="${fill}"/>
 ${lips(155,202,16)}<path d="M120 149l-7-8M124 146l-4-10M180 148l8-8" fill="none" stroke-width="2"/>
 ${Array.from({length:7},(_,i)=>`<circle cx="${119+i*10}" cy="${224+Math.sin(i/6*Math.PI)*7}" r="6.5" fill="#e9573d"/>`).join('')}`;
 if(id==='bart')body=`
 <ellipse cx="149" cy="397" rx="67" ry="10" fill="#1b252d" opacity=".2" stroke="none"/>
 <path d="M111 325L105 375L126 384L145 334M170 333L173 378L196 375L193 321" fill="${fill}"/>
 <path d="M104 369Q81 371 84 392L137 393L137 379Z M172 371L173 393H227Q227 374 195 370" fill="#387fb6"/>
 <path d="M84 394h54M174 394h53" stroke="#fffaf1" stroke-width="7"/>
 <path d="M105 276L102 337L146 341L151 314L163 341L200 336L193 276" fill="#4b88b6"/>
 <path d="M105 203Q80 212 75 238L58 278Q51 290 63 296Q77 302 88 280L103 254M196 208Q221 220 224 249L240 279Q251 298 236 301Q220 306 212 281L193 248" fill="${fill}"/>
 <path d="M105 199Q150 185 194 202L211 239L195 249L200 285Q154 301 100 284L104 247L85 239Z" fill="#ed6840"/>
 <path d="M112 201L106 103L121 112L128 91L142 104L153 86L165 103L180 88L188 107L204 97L200 160Q218 159 216 174Q212 185 198 181L195 206Q150 226 112 201" fill="${fill}"/>
 ${eye(144,157,21)}${eye(182,157,20)}<path d="M163 173Q192 167 194 178L166 184" fill="${fill}"/>${lips(155,199,20)}`;
 if(id==='lisa')body=`
 <ellipse cx="150" cy="398" rx="65" ry="9" fill="#1b252d" opacity=".2" stroke="none"/>
 <path d="M123 328L117 381L140 385L153 338L163 384L189 380L178 330" fill="${fill}"/>
 <path d="M116 377Q89 387 98 398H145L142 384M163 383L162 398H213Q216 386 188 377" fill="#e8583c"/>
 <path d="M114 219Q92 229 84 260L71 282Q62 296 74 304Q89 309 99 291L118 260M182 219Q209 231 212 259L227 285Q236 303 223 307Q207 309 198 282L180 261" fill="${fill}"/>
 <path d="M120 218Q148 231 180 219L186 276L207 340L186 333L173 345L153 334L137 345L119 333L98 342L117 278Z" fill="#ed6544"/>
 <path d="M111 192L82 183L99 165L78 146L104 140L96 112L121 119L131 93L149 113L170 92L179 119L206 110L200 139L226 148L208 169L220 190L192 195L177 221L151 210L125 222Z" fill="${fill}"/>
 ${eye(138,161,20)}${eye(174,161,20)}<path d="M154 178Q183 174 185 184L160 191" fill="${fill}"/>${lips(152,200,17)}
 ${Array.from({length:7},(_,i)=>`<circle cx="${118+i*10}" cy="${221+Math.sin(i/6*Math.PI)*9}" r="5.5" fill="#fff8df"/>`).join('')}`;
 if(id==='maggie')body=`
 <ellipse cx="150" cy="396" rx="67" ry="9" fill="#1b252d" opacity=".2" stroke="none"/>
 <path d="M123 277Q152 266 180 281L187 323Q220 335 219 367Q214 392 169 384Q146 402 119 386Q88 392 81 373Q66 355 94 332L112 318Z" fill="#75bad9"/>
 <path d="M114 288L92 326Q78 335 73 323L79 302L98 275M183 284L209 317Q221 331 230 318L223 302L202 272" fill="${fill}"/>
 <path d="M113 269L83 256L98 235L78 217L106 209L96 181L123 189L135 166L150 185L170 164L182 189L210 182L204 209L229 221L209 240L221 260L193 267L179 286L152 277L130 291Z" fill="${fill}"/>
 ${eye(139,231,21)}${eye(177,231,21)}<path d="M155 247Q178 241 181 250L161 255" fill="${fill}"/>
 <path d="M146 181L127 166L126 190L146 186L165 197L169 176Z" fill="#69b6da"/>
 <ellipse cx="158" cy="269" rx="${mouth?22:19}" ry="12" fill="#f28a45"/><ellipse cx="159" cy="272" rx="9" ry="9" fill="#fbd95b"/>
 <path d="M108 349Q140 359 157 379M183 345Q167 351 163 369" fill="none" stroke="#397991" stroke-width="3"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420"><g ${outline}>${body}</g></svg>`;
}
