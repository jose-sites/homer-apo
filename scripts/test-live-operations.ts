import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {createServer} from '../server/index';
const dir=await mkdtemp(join(tmpdir(),'homer-controls-'));
const runtime=createServer({dataDir:dir,env:{},log:()=>{},fetchImpl:async()=>{throw Error('Paid calls prohibited in this test')}});
const {url}=await runtime.start(0);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('nav').getByRole('button',{name:'Configurações',exact:true}).click();
 await page.getByRole('heading',{name:'Diagnóstico da live',exact:true}).waitFor();
 await page.getByText('TikTok:',{exact:false}).first().waitFor();
 const limit=page.getByLabel('Máximo de chamadas de IA (0 bloqueia)');await limit.fill('42');await limit.press('Tab');
 await page.waitForFunction(()=>document.querySelector('input[type=number]')!==null);
 await page.getByRole('switch',{name:'Memória dos espectadores',exact:true}).click();
 await page.waitForTimeout(500);assert.equal(runtime.state.settings.aiRequestLimit,42);assert.equal(runtime.state.settings.viewerMemory,false);
 const response=await fetch(`${url}/api/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'PAUSE',paused:true})});assert.equal(response.status,200);
 await page.getByRole('button',{name:'Iniciar nova contagem (operação pausada)',exact:true}).click();
 const out=resolve('docs/captures/live-operations');await mkdir(out,{recursive:true});
 await page.getByRole('heading',{name:'Diagnóstico da live',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(out,'diagnostico.png')});
 await page.getByRole('heading',{name:'Consumo desta live',exact:true}).evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:join(out,'consumo.png')});
 assert.deepEqual(errors,[]);console.log('Browser: diagnostics, limit update, memory toggle and paused reset passed; no page errors.');
}finally{await browser.close();await runtime.close();await rm(dir,{recursive:true,force:true});}
