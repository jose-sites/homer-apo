import { chromium } from 'playwright';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from '../server/index';
import { ROOMS } from '../shared/data';
const dataDir=await mkdtemp(join(tmpdir(),'homer-rooms-'));
const runtime=createServer({dataDir,env:{},log:()=>{}});runtime.state.settings.quality='low';runtime.state.settings.adaptiveQuality=false;runtime.state.settings.cleanOverlay=true;
const {url}=await runtime.start(0);const output=resolve('test-results/rooms');await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:960,height:540}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const metrics=[];
try{await page.goto(`${url}/overlay`,{waitUntil:'domcontentloaded'});await page.locator('canvas').waitFor();
 for(const room of ROOMS){runtime.state.cameraId=room.id==='front'?'front-exterior':room.id+'-wide';runtime.broadcast();await page.waitForFunction(id=>document.querySelector('.viewport')?.getAttribute('data-camera-id')===id,runtime.state.cameraId);await page.waitForTimeout(2300);await page.screenshot({path:join(output,room.id+'.png')});const stats=await page.locator('.house-scene').evaluate(el=>({fps:el.getAttribute('data-fps'),calls:el.getAttribute('data-draw-calls'),triangles:el.getAttribute('data-triangles')}));metrics.push({room:room.id,...stats});console.log(JSON.stringify(metrics.at(-1)))}
 await writeFile(join(output,'report.json'),JSON.stringify({metrics,errors,note:'Software WebGL; visual/functional review, not target hardware benchmark'},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();await runtime.close();await rm(dataDir,{recursive:true,force:true})}
