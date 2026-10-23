import type { CharacterId, LiveState, Speech } from '../../shared/types';
import { AudioQueue } from './queue';
import { authHeaders } from '../store';
export class AudioDirector {
 private context:AudioContext|null=null;private queue=new AudioQueue();private master=0.75;private effects=0.3;private enabled=false;private lastSpeech:string|null=null;private currentState:LiveState|null=null;
 onStatus:(message:string)=>void=()=>{};
 constructor(){this.queue.onError=error=>this.onStatus(`Áudio: ${error instanceof Error?error.message:'falha de reprodução'}`)}
 async enable(){this.context??=new AudioContext();await this.context.resume();this.enabled=true;this.lastSpeech=null;this.onStatus('Áudio ativado neste navegador')}
 disable(){this.enabled=false;this.queue.clear();window.speechSynthesis?.cancel();this.clearMouth()}
 update(state:LiveState){this.currentState=state;this.master=state.settings.masterVolume;this.effects=state.settings.effectsVolume;if(state.paused){this.queue.clear();window.speechSynthesis?.cancel();this.clearMouth();return}if(!this.enabled)return;const speech=state.speaking;if(speech&&speech.id!==this.lastSpeech){this.lastSpeech=speech.id;this.queue.enqueue({id:speech.id,priority:speech.priority,run:signal=>this.playSpeech(speech,state,signal)})}}
 private mouth(character:CharacterId,level:number){window.dispatchEvent(new CustomEvent('homer:audio-level',{detail:{character,level}}))}
 private clearMouth(){for(const character of ['homer','marge','bart','lisa','maggie'] as CharacterId[])this.mouth(character,0)}
 private async playSpeech(speech:Speech,state:LiveState,signal:AbortSignal){
  if(speech.character==='maggie'||speech.effect){await this.effect(speech.effect||'pacifier',speech.character,signal);return}
  if(state.settings.ttsProvider==='silent')return;
  if(state.settings.ttsProvider==='openai-compatible'){
   try{const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({text:speech.text,character:speech.character}),signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});if(!response.ok)throw new Error('TTS externo indisponível');const buffer=await this.context!.decodeAudioData(await response.arrayBuffer());if(signal.aborted)return;await this.playBuffer(buffer,speech.character,signal);return}catch(error){if(signal.aborted)return;this.onStatus('TTS externo falhou; usando a voz disponível no navegador.')}
  }
  await this.browserSpeech(speech,signal);
 }
 private browserSpeech(speech:Speech,signal:AbortSignal):Promise<void>{return new Promise((resolve,reject)=>{
  if(signal.aborted){resolve();return}if(!window.speechSynthesis){this.onStatus('Este navegador não oferece síntese de voz. Legendas continuam ativas.');resolve();return}
  const utterance=new SpeechSynthesisUtterance(speech.text);utterance.lang='pt-BR';utterance.voice=window.speechSynthesis.getVoices().find(v=>v.lang==='pt-BR')||null;utterance.volume=this.master*(this.currentState?.characters[speech.character].volume??1);utterance.rate=speech.character==='bart'?1.12:1;utterance.pitch=speech.character==='homer'?0.8:speech.character==='lisa'?1.2:1;
  let timer:ReturnType<typeof setInterval>|undefined;let watchdog:ReturnType<typeof setTimeout>;let done=false;
  const finish=()=>{if(done)return;done=true;clearInterval(timer);clearTimeout(watchdog);signal.removeEventListener('abort',abort);this.mouth(speech.character,0);resolve()};
  const abort=()=>{window.speechSynthesis.cancel();finish()};signal.addEventListener('abort',abort,{once:true});
  utterance.onstart=()=>{timer=setInterval(()=>this.mouth(speech.character,0.25+Math.random()*0.7),110)};
  utterance.onend=finish;utterance.onerror=event=>{finish();if(event.error!=='canceled'&&event.error!=='interrupted')this.onStatus(`Voz do navegador indisponível (${event.error}). Legendas ativas.`)};
  // Browser synthesis exposes no waveform. Mouth motion is an explicitly approximate fallback.
  watchdog=setTimeout(()=>{window.speechSynthesis.cancel();finish()},Math.max(12000,speech.text.length*170));window.speechSynthesis.speak(utterance);
 })}
 private playBuffer(buffer:AudioBuffer,character:CharacterId,signal:AbortSignal):Promise<void>{return new Promise(resolve=>{
  const ctx=this.context!;const source=ctx.createBufferSource(),gain=ctx.createGain(),analyser=ctx.createAnalyser();source.buffer=buffer;analyser.fftSize=256;gain.gain.value=this.master*(this.currentState?.characters[character].volume??1);source.connect(analyser);analyser.connect(gain);gain.connect(ctx.destination);const samples=new Uint8Array(analyser.frequencyBinCount);const interval=setInterval(()=>{analyser.getByteTimeDomainData(samples);let energy=0;for(const value of samples)energy+=((value-128)/128)**2;this.mouth(character,Math.min(1,Math.sqrt(energy/samples.length)*5))},50);
  const finish=()=>{clearInterval(interval);source.disconnect();gain.disconnect();analyser.disconnect();signal.removeEventListener('abort',abort);this.mouth(character,0);resolve()};const abort=()=>{try{source.stop()}catch{}finish()};source.onended=finish;signal.addEventListener('abort',abort,{once:true});source.start();
 })}
 async effect(kind='bell',character:CharacterId='maggie',signal?:AbortSignal):Promise<void>{
  if(!this.enabled||!this.context||signal?.aborted)return;const ctx=this.context;const count=kind==='pacifier'?3:2;const starts=ctx.currentTime;
  for(let i=0;i<count;i++){const oscillator=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();oscillator.type=kind==='pacifier'?'sine':'triangle';const base=kind==='pacifier'?440:660;oscillator.frequency.setValueAtTime(base+i*90,starts+i*0.2);oscillator.frequency.exponentialRampToValueAtTime(base*0.5,starts+i*0.2+0.09);gain.gain.setValueAtTime(0,starts+i*0.2);gain.gain.linearRampToValueAtTime(this.master*this.effects*0.18,starts+i*0.2+0.01);gain.gain.exponentialRampToValueAtTime(0.001,starts+i*0.2+0.16);pan.pan.value=character==='maggie'?0.5:-0.2;oscillator.connect(gain);gain.connect(pan);pan.connect(ctx.destination);oscillator.start(starts+i*0.2);oscillator.stop(starts+i*0.2+0.2);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();pan.disconnect()};signal?.addEventListener('abort',()=>{try{oscillator.stop()}catch{}},{once:true})}
  this.mouth(character,0.8);await new Promise(resolve=>setTimeout(resolve,count*200));this.mouth(character,0);
 }
 dispose(){this.disable();void this.context?.close()}
}
