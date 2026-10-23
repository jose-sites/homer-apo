import { create } from 'zustand';
import type { Action, LiveState } from '../shared/types';

export type Tab = 'studio'|'cameras'|'characters'|'events'|'games'|'audio'|'memory'|'settings';
type Metrics = {fps:number;drawCalls:number;triangles:number;memory:number|null};
interface Store {state:LiveState|null;connected:boolean;connection:'connecting'|'online'|'offline';tab:Tab;error:string|null;metrics:Metrics;audioEnabled:boolean;explore:boolean;setTab:(tab:Tab)=>void;setMetrics:(metrics:Metrics)=>void;setError:(error:string|null)=>void;setAudio:(enabled:boolean)=>void;setExplore:(enabled:boolean)=>void}
export const useLive = create<Store>((set)=>({state:null,connected:false,connection:'connecting',tab:'studio',error:null,metrics:{fps:0,drawCalls:0,triangles:0,memory:null},audioEnabled:false,explore:false,setTab:tab=>set({tab}),setMetrics:metrics=>set({metrics}),setError:error=>set({error}),setAudio:audioEnabled=>set({audioEnabled}),setExplore:explore=>set({explore})}));
export function authHeaders():Record<string,string> {const token=sessionStorage.getItem('homer-admin-token');return token?{Authorization:`Bearer ${token}`}:{}}
export async function api<T>(path:string,body?:unknown):Promise<T> {
 const response=await fetch(path,{method:body===undefined?'GET':'POST',headers:{...authHeaders(),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!response.ok){let message=`Servidor respondeu ${response.status}`;try{message=(await response.json()).error||message}catch{}throw new Error(message)}
 return response.json();
}
export async function dispatch(action:Action):Promise<boolean>{
 try {const result=await api<{ok:boolean;error?:string}>('/api/action',action);if(!result.ok)throw new Error(result.error||'Ação recusada pelo motor');return true}
 catch(error){useLive.getState().setError(error instanceof Error?error.message:'Falha ao enviar ação');return false}
}
export function connectLive():()=>void {
 let socket:WebSocket|undefined,timer:ReturnType<typeof setTimeout>|undefined,stopped=false,attempt=0;
 const connect=()=>{
  if(stopped)return;
  socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);
  socket.onopen=()=>{attempt=0;useLive.setState({connected:true,connection:'online'})};
  socket.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.type==='state'&&message.state?.version!==undefined)useLive.setState({state:message.state})}catch{useLive.getState().setError('Snapshot inválido recebido; aguardando recuperação.')}};
  socket.onerror=()=>socket?.close();
  socket.onclose=()=>{useLive.setState({connected:false,connection:'offline'});if(!stopped)timer=setTimeout(connect,Math.min(15000,1000*2**attempt++)+Math.random()*300)};
 };
 connect();
 return ()=>{stopped=true;clearTimeout(timer);socket?.close()};
}
