import {LivePresentation} from './components/LivePresentation';
import {lazy,Suspense,useState,useEffect} from 'react';
import {createInitialState,applyAction,tick} from '../shared/engine';
import type {Action} from '../shared/types';
const HouseScene=lazy(()=>import('./scene/HouseScene'));
/** Pages cannot host Express/SQLite or secrets. This is explicitly a local visual preview. */
export default function PagesPreview(){
 const [state,setState]=useState(()=>{const s=createInitialState();s.settings.mode='manual';s.settings.quality='medium';s.settings.adaptiveQuality=true;s.settings.cleanOverlay=true;s.settings.autoCamera=false;s.settings.ttsProvider='silent';s.providers.ai='Prévia local · sem servidor';return s});
 useEffect(()=>{const id=setInterval(()=>setState(previous=>{const s=structuredClone(previous);tick(s,Date.now(),100);return s}),100);return()=>clearInterval(id)},[]);
 const demo=()=>setState(previous=>{const s=structuredClone(previous);applyAction(s,{type:'CHAT',user:'visitante_demo',text:'Homer, come uma rosquinha aí?',source:'test'},Date.now());applyAction(s,{type:'TALK',character:'homer',text:'Hmm… uma rosquinha? Essa é a melhor ideia que ouvi hoje!',priority:4},Date.now());const reply=s.speechQueue.find(v=>v.character==='homer');if(reply)reply.replyTo={...s.chat.at(-1)!,selected:true};return s});
 const action=(a:Action)=>setState(previous=>{const next=structuredClone(previous);applyAction(next,a,Date.now());return next});
 return <main style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#192432',color:'#fff'}}><header style={{padding:'12px 20px',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}><strong>HOMER AI LIVE 2.0</strong><span>Prévia 3D local · sem servidor, IA ou TTS externos</span><select aria-label="Câmera da prévia" value={state.cameraId} onChange={e=>action({type:'CHANGE_CAMERA',cameraId:e.target.value})}>{state.cameras.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button onClick={demo}>Demonstrar comentário</button><a style={{color:'#ffd75b'}} href="https://github.com/jose-sites/homer-apo/blob/main/docs/PUBLISHING.md">Executar o sistema completo</a></header><div className="vertical-stage"><div className="vertical-live"><Suspense fallback={<p>Carregando a casa 3D…</p>}><HouseScene state={state} onAction={action}/></Suspense><LivePresentation state={state} onAction={action}/></div></div></main>;
}
