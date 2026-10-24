import {chromium} from 'playwright';
import {mkdtemp,mkdir,rm,writeFile,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createServer} from '../server/index';
const out=resolve('test-results/animation');await mkdir(out,{recursive:true});const dir=await mkdtemp(join(tmpdir(),'animation-'));
const app=createServer({dataDir:dir,env:{},tickInterval:0,log:()=>{}});app.state.settings.cleanOverlay=true;app.state.settings.mode='manual';app.state.settings.quality='low';app.state.settings.adaptiveQuality=false;app.state.cameraId='living-reaction';app.state.paused=false;
const {url}=await app.start(0);const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});const errors:string[]=[];
try{const ctx=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir:out,size:{width:960,height:540}}});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/overlay');await page.locator('canvas').waitFor();await page.waitForTimeout(2200);
 await page.evaluate(()=>{const label=document.createElement('div');label.id='animation-demo-label';Object.assign(label.style,{position:'fixed',left:'16px',top:'16px',padding:'12px',color:'#fff',background:'#172334e6',font:'16px sans-serif',zIndex:'999'});label.textContent='Animações 2.5D · áudio sintético de teste';document.body.append(label)});
 const scenes=[['homer','Olha ali, pessoal.','Apontar',3200],['homer','Talvez eu tenha uma ideia?','Dúvida',3500],['homer','Viva, conseguimos!','Comemorar',3500],['homer','Sim, concordo com vocês.','Concordar',3500],['homer','Não acredito nessa surpresa.','Surpresa',3500],['homer','Chega, pare com isso.','Irritação',3500],['homer','Vou explicar minha teoria sobre o sofá e os intervalos do trabalho.','Fala longa · variação e pausas',11500],['marge','Homer, vamos conversar.','Família sentada',3000],['maggie','Chupeta','Maggie · chupeta',2800]] as const;
 let id=0;for(const [character,text,title,duration]of scenes){if(character!=='homer'){app.state.cameraId='living-family';app.broadcast();await page.waitForTimeout(1200)}
 await page.evaluate(async({character,text,title,duration,id})=>{
  document.getElementById('animation-demo-label')!.textContent=`${title} · áudio sintético de teste`;
  const speech={id:String(id),character,text,priority:2,createdAt:Date.now(),duration};
  const audio=new AudioContext();await audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),analyser=audio.createAnalyser();analyser.fftSize=256;osc.frequency.value=character==='maggie'?420:140;osc.connect(gain);gain.connect(analyser);analyser.connect(audio.destination);gain.gain.value=.08;osc.start();
  window.dispatchEvent(new CustomEvent('homer:playback',{detail:{speech,active:true}}));const samples=new Uint8Array(analyser.frequencyBinCount);const start=performance.now();
  const timer=setInterval(()=>{const t=(performance.now()-start)/1000;gain.gain.value=(Math.sin(t*7)>-.3?.10:.003);analyser.getByteTimeDomainData(samples);let sum=0;for(const v of samples)sum+=((v-128)/128)**2;window.dispatchEvent(new CustomEvent('homer:audio-level',{detail:{character,level:Math.min(1,Math.sqrt(sum/samples.length)*5)}}))},50);
  setTimeout(()=>{clearInterval(timer);osc.stop();void audio.close();window.dispatchEvent(new CustomEvent('homer:audio-level',{detail:{character,level:0}}));window.dispatchEvent(new CustomEvent('homer:playback',{detail:{speech,active:false}}))},duration);
 },{character,text,title,duration,id:++id});
 await page.waitForTimeout(Math.min(1700,duration/2));await page.screenshot({path:join(out,`${id}-${character}.png`)});await page.waitForTimeout(duration-Math.min(1700,duration/2)+700);
 }
 await page.waitForTimeout(1200);await page.screenshot({path:join(out,'rest.png')});const video=page.video()!;await page.close();await ctx.close();await rename(await video.path(),join(out,'animation.webm'));await writeFile(join(out,'report.json'),JSON.stringify({pageErrors:errors,quality:'low (software renderer recording)',scenes:scenes.map(s=>({character:s[0],gesture:s[2],duration:s[3]})),audio:'Web Audio synthetic oscillator, RMS → actual animation event bridge. Playwright video has no audio track.',at:new Date().toISOString()},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();await app.close();await rm(dir,{recursive:true,force:true})}
