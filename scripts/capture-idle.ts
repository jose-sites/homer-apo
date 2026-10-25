/** Isolated visual smoke check; no API calls or operator data. */
import {chromium} from 'playwright';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
import {createServer} from '../server/index';
const output='test-results/idle',dir=await mkdtemp(join(tmpdir(),'homer-idle-'));
const app=createServer({dataDir:dir,env:{},tickInterval:0,log:()=>{}});
Object.assign(app.state.settings,{mode:'manual',quality:'low',adaptiveQuality:false,autoCamera:false,ttsProvider:'silent'});
const {url}=await app.start(0),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:360,height:640}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir(output,{recursive:true});await page.goto(url+'/overlay');
 await page.waitForFunction(()=>Number(document.querySelector('.house-scene')?.getAttribute('data-draw-calls'))>0,{},{timeout:30000});
 await page.screenshot({path:join(output,'rest.png')});await page.waitForTimeout(12500);for(let i=0;i<3;i++){await page.screenshot({path:join(output,`gesture-${i}.png`)});await page.waitForTimeout(700);}
 assert.deepEqual(errors,[]);await writeFile(join(output,'report.json'),JSON.stringify({errors,realAPIs:false,check:'WebGL idle gesture'},null,2));console.log('Idle visual smoke completed.');
}finally{await browser.close();await app.close();await rm(dir,{recursive:true,force:true});}
