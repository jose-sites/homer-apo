import {GiftColumn} from './GiftColumn';
import {useEffect,useRef,useState} from 'react';
import type {Action,LiveState,Speech} from '../../shared/types';
/** Uses the selected message snapshot attached to its reply, never an unrelated chat item. */
export function LivePresentation({state,onAction}:{state:LiveState;onAction:(a:Action)=>void}){
 const [speech,setSpeech]=useState<Speech|null>(null),[visible,setVisible]=useState(false);const active=useRef<string|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{const receive=(event:Event)=>{const d=(event as CustomEvent<{speech:Speech;active:boolean}>).detail;if(d.speech.character!=='homer')return;if(d.active&&d.speech.replyTo){clearTimeout(timer.current);active.current=d.speech.id;setSpeech(d.speech);setVisible(true)}else if(active.current===d.speech.id){setVisible(false);active.current=null;timer.current=setTimeout(()=>setSpeech(null),300)}};window.addEventListener('homer:playback',receive);return()=>{window.removeEventListener('homer:playback',receive);clearTimeout(timer.current)}},[]);
 useEffect(()=>{if(active.current)return;if(state.speaking?.replyTo){clearTimeout(timer.current);setSpeech(state.speaking);setVisible(true)}else{setVisible(false);timer.current=setTimeout(()=>setSpeech(null),300)}return()=>clearTimeout(timer.current)},[state.speaking?.id]);
 const message=speech?.replyTo;
 return <div className="live-presentation">
  {message&&<aside className={`selected-comment ${visible?'shown':''}`} aria-label="Comentário selecionado"><span className="comment-avatar">{message.avatarUrl?<img src={message.avatarUrl} alt="" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display='none'}}/>:message.user.slice(0,1).toUpperCase()}</span><div><small>@{message.user.replace(/^@/,'')} <em>{message.source==='tiktok'?'TikTok LIVE':'Demonstração local'}</em></small><p>{message.text}</p></div><span aria-hidden="true">🍩</span></aside>}
  <GiftColumn/>

  <a className="model-credit" href={`${import.meta.env.BASE_URL}models/homer/CREDITS.md`} target="_blank" rel="noreferrer">Homer 3D · Brenden Hyde · CC BY 4.0</a>
 </div>
}
