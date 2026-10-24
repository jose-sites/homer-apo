import {chromium} from 'playwright';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createServer} from '../server/index';
import {spriteSvg} from '../src/scene/spriteArt';
import type {CharacterId} from '../shared/types';
const output=resolve('test-results/reference');await mkdir(output,{recursive:true});
const dir=await mkdtemp(join(tmpdir(),'homer-reference-'));const app=createServer({dataDir:dir,env:{},log:()=>{}});
app.state.settings.cleanOverlay=true;app.state.settings.quality='medium';app.state.settings.adaptiveQuality=false;app.state.paused=true;
const {url}=await app.start(0);const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});const errors:string[]=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
 for(const c of Object.values(app.state.characters))c.enabled=false;
 await page.goto(`${url}/overlay`);await page.locator('canvas').waitFor();
 for(const room of ['living','kitchen']){app.state.cameraId=room+'-wide';app.broadcast();await page.waitForFunction(id=>document.querySelector('.viewport')?.getAttribute('data-camera-id')===id,app.state.cameraId);await page.waitForTimeout(2500);await page.screenshot({path:join(output,room+'.png')});}
 for(const c of Object.values(app.state.characters))c.enabled=true;app.state.cameraId='living-family';app.broadcast();await page.waitForTimeout(2500);await page.screenshot({path:join(output,'family.png')});await page.close();
 const sheet=await browser.newPage({viewport:{width:1500,height:1240}});sheet.on('pageerror',e=>errors.push(e.message));
 const names=['homer','marge','bart','lisa','maggie'] as CharacterId[],expressions=['neutral','happy','confused','angry','sleepy'];
 const crop:Record<CharacterId,string>={homer:'80 40 135 145',marge:'95 110 110 135',bart:'95 65 125 150',lisa:'70 70 160 170',maggie:'70 85 160 160'};
 const img=(id:CharacterId,exp:string,face=false,mouth=0,blink=false)=>`<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteSvg(id,mouth,blink,exp).replace('viewBox="0 0 300 420"',`viewBox="${face?crop[id]:'0 0 300 420'}"`))}"/>`;
 await sheet.setContent(`<html lang="pt"><style>*{box-sizing:border-box}body{margin:0;background:#10202f;color:#f6e9c7;font:16px system-ui;padding:30px}h1{font-size:26px;color:#ffd14e;margin:0 0 8px}p{color:#a8becb;margin:0 0 20px}.lineup{display:flex;height:370px;align-items:end;background:radial-gradient(ellipse at bottom,#324955,transparent 65%);border-bottom:1px solid #4a5b61;padding-bottom:18px}.figure{width:20%;text-align:center}.figure img{width:100%;display:block}.figure b{font-size:13px;letter-spacing:2px}.expressions{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;margin-top:26px}.card{background:#192d3e;border:1px solid #3c5060;border-radius:12px;padding:10px}.card b{color:#ffd14e;text-transform:uppercase}.faces{display:grid;grid-template-columns:repeat(2,1fr)}.face{text-align:center;font-size:11px;color:#aabfca}.face img{display:block;width:100%;height:132px}.caption{font-size:12px;margin-top:20px;color:#a8becb}</style><h1>HOMER AI LIVE · PERSONAGENS 2.5D</h1><p>Sprites reais do projeto · proporções, expressões, piscadas e boca</p><div class="lineup">${names.map((id,i)=>`<div class="figure">${img(id,'neutral').replace('<img',`<img style="height:${[310,350,235,215,150][i]}px"`)}<b>${id.toUpperCase()}</b></div>`).join('')}</div><div class="expressions">${names.map(id=>`<div class="card"><b>${id}</b><div class="faces">${expressions.map((e,i)=>`<div class="face">${img(id,e,true)}${['Neutro','Alegre','Confuso','Irritado','Sonolento'][i]}</div>`).join('')}<div class="face">${img(id,'happy',true,2)}Falando</div><div class="face">${img(id,'neutral',true,0,true)}Piscando</div></div></div>`).join('')}</div><p class="caption">Renderização dos mesmos SVGs usados no WebGL. A boca aberta de Maggie representa a variação sincronizada da chupeta.</p></html>`);
 await sheet.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));await sheet.screenshot({path:join(output,'characters.png'),fullPage:true});await sheet.close();
 await writeFile(join(output,'report.json'),JSON.stringify({captures:['living','kitchen','family','characters'],pageErrors:errors,at:new Date().toISOString()},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();await app.close();await rm(dir,{recursive:true,force:true})}
