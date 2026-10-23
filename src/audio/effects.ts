import type { Vec3 } from '../../shared/types';

/** Provisional synthesized sounds, without recordings or cloned voices. */
export const EFFECTS: Record<string,{notes:number[];spacing:number;length:number;wave:OscillatorType;slide:number;gain:number}> = {
 pacifier:{notes:[620,530,660],spacing:.23,length:.09,wave:'sine',slide:.25,gain:.18},
 giggle:{notes:[480,620,530,680],spacing:.16,length:.11,wave:'sine',slide:.75,gain:.16},
 babble:{notes:[370,490,410],spacing:.28,length:.2,wave:'triangle',slide:1.2,gain:.1},
 surprise:{notes:[450,800],spacing:.13,length:.16,wave:'sine',slide:1.35,gain:.16},
 yawn:{notes:[340],spacing:.2,length:.7,wave:'sine',slide:.4,gain:.12},
 sleep:{notes:[240,215],spacing:.45,length:.32,wave:'sine',slide:.7,gain:.08},
 bell:{notes:[660,523],spacing:.38,length:.6,wave:'sine',slide:1,gain:.26},
 telephone:{notes:[760,980,760,980],spacing:.13,length:.1,wave:'sine',slide:1,gain:.15},
 garage:{notes:[90,64],spacing:.16,length:.18,wave:'triangle',slide:.4,gain:.18},
 fridge:{notes:[180,240],spacing:.2,length:.16,wave:'triangle',slide:.5,gain:.11},
 clock:{notes:[880,660],spacing:.45,length:.32,wave:'sine',slide:1,gain:.15},
 lightning:{notes:[65,42,50],spacing:.1,length:.5,wave:'triangle',slide:.6,gain:.13},
 lights:{notes:[600],spacing:.1,length:.035,wave:'triangle',slide:.35,gain:.08},
 ambient:{notes:[220,277,330],spacing:.3,length:.45,wave:'sine',slide:1,gain:.06},
};
export interface SpatialSound {source:Vec3;listener:Vec3;target:Vec3}
export function playEffect(context:AudioContext,kind:string,volume:number,signal:AbortSignal|undefined,spatial:SpatialSound|undefined,onLevel:(value:number)=>void):Promise<void>{
 if(signal?.aborted)return Promise.resolve();
 return new Promise(resolve=>{
  const pattern=EFFECTS[kind]||EFFECTS.pacifier,now=context.currentTime;
  const bus=context.createGain(),analyser=context.createAnalyser();analyser.fftSize=256;bus.gain.value=Math.max(0,Math.min(1,volume));
  const panner=context.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=4;panner.maxDistance=60;panner.rolloffFactor=.8;
  if(spatial){const {source,listener,target}=spatial;[panner.positionX.value,panner.positionY.value,panner.positionZ.value]=source;const l=context.listener;
   [l.positionX.value,l.positionY.value,l.positionZ.value]=listener;const direction=target.map((v,i)=>v-listener[i]);const length=Math.hypot(...direction)||1;
   [l.forwardX.value,l.forwardY.value,l.forwardZ.value]=direction.map(v=>v/length);[l.upX.value,l.upY.value,l.upZ.value]=[0,1,0];
  }
  bus.connect(analyser);analyser.connect(panner);panner.connect(context.destination);
  const oscillators:OscillatorNode[]=[],gains:GainNode[]=[];const values=new Uint8Array(analyser.frequencyBinCount);
  let done=false;const finish=()=>{if(done)return;done=true;clearInterval(interval);clearTimeout(timeout);signal?.removeEventListener('abort',abort);for(const o of oscillators){try{o.stop()}catch{}o.disconnect()}for(const g of gains)g.disconnect();bus.disconnect();analyser.disconnect();panner.disconnect();onLevel(0);resolve()};
  const abort=()=>finish();
  for(const [index,frequency]of pattern.notes.entries()){
   const o=context.createOscillator(),g=context.createGain(),start=now+index*pattern.spacing;o.type=pattern.wave;const varied=frequency*(.98+Math.random()*.04);
   o.frequency.setValueAtTime(varied,start);o.frequency.exponentialRampToValueAtTime(varied*pattern.slide,start+pattern.length);
   g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(pattern.gain,start+.008);g.gain.exponentialRampToValueAtTime(.001,start+pattern.length);o.connect(g);g.connect(bus);o.start(start);o.stop(start+pattern.length+.02);oscillators.push(o);gains.push(g);
  }
  const interval=setInterval(()=>{analyser.getByteTimeDomainData(values);let energy=0;for(const value of values)energy+=((value-128)/128)**2;onLevel(Math.min(1,Math.sqrt(energy/values.length)*12))},35);
  const timeout=setTimeout(finish,((pattern.notes.length-1)*pattern.spacing+pattern.length+.1)*1000);signal?.addEventListener('abort',abort,{once:true});
 });
}
