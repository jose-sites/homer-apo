import {lazy,Suspense,useState} from 'react';
import {createInitialState,applyAction} from '../shared/engine';
import type {Action} from '../shared/types';
const HouseScene=lazy(()=>import('./scene/HouseScene'));
/** Pages cannot host Express/SQLite or secrets. This is explicitly a local visual preview. */
export default function PagesPreview(){
 const [state,setState]=useState(()=>{const s=createInitialState();s.settings.mode='manual';s.settings.quality='medium';s.settings.adaptiveQuality=true;s.settings.cleanOverlay=true;s.settings.autoCamera=false;s.providers.ai='Prévia local · sem servidor';return s});
 const action=(a:Action)=>setState(previous=>{const next=structuredClone(previous);applyAction(next,a,Date.now());return next});
 return <main style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#192432',color:'#fff'}}><header style={{padding:'12px 20px',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}><strong>HOMER AI LIVE 2.0</strong><span>Prévia 3D local · sem servidor, IA ou TTS externos</span><select aria-label="Câmera da prévia" value={state.cameraId} onChange={e=>action({type:'CHANGE_CAMERA',cameraId:e.target.value})}>{state.cameras.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><a style={{color:'#ffd75b'}} href="https://github.com/jose-sites/homer-apo/blob/main/docs/PUBLISHING.md">Executar o sistema completo</a></header><div style={{flex:1,minHeight:0}}><Suspense fallback={<p>Carregando a casa 3D…</p>}><HouseScene state={state} onAction={action}/></Suspense></div></main>;
}
