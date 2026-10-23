import type { ReactNode } from 'react';
import { Check, ChevronRight, X } from 'lucide-react';
import type { Settings } from '../../shared/types';
import { dispatch } from '../store';
export function Toggle({checked,onChange,label,disabled=false}:{checked:boolean;onChange:(checked:boolean)=>void;label:string;disabled?:boolean}){return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`toggle ${checked?'on':''}`} onClick={()=>onChange(!checked)}><span>{checked&&<Check size={10}/>}</span></button>}
export function SettingToggle({name,title,description,settings}:{name:keyof Settings;title:string;description?:string;settings:Settings}){return <div className="setting-row"><div><strong>{title}</strong>{description&&<p>{description}</p>}</div><Toggle checked={Boolean(settings[name])} label={title} onChange={value=>void dispatch({type:'SETTINGS',settings:{[name]:value}})}/></div>}
export function SectionHead({eyebrow,title,children}:{eyebrow:string;title:string;children?:ReactNode}){return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{children}</div>}
export function Empty({children}:{children:ReactNode}){return <div className="empty-state">{children}</div>}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){return <div className="modal-backdrop" onClick={onClose}><section role="dialog" aria-modal="true" aria-label={title} className="modal" onClick={event=>event.stopPropagation()}><header><h2>{title}</h2><button className="icon-btn" aria-label="Fechar" onClick={onClose}><X size={20}/></button></header>{children}</section></div>}
export function Progress({value,color='var(--yellow)'}:{value:number;color?:string}){return <div className="progress"><span style={{width:`${Math.max(0,Math.min(100,value))}%`,background:color}}/></div>}
export function LinkButton({children,onClick}:{children:ReactNode;onClick:()=>void}){return <button className="text-button" onClick={onClick}>{children}<ChevronRight size={14}/></button>}
export const time=(at:number)=>new Date(at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
export const roomNames:Record<string,string>={living:'Sala de estar',kitchen:'Cozinha',dining:'Sala de jantar',hall:'Hall de entrada',garage:'Garagem',yard:'Quintal',bedroom:'Quarto do casal',bart:'Quarto do Bart',lisa:'Quarto da Lisa',maggie:'Quarto da Maggie',bathroom:'Banheiro',attic:'Sótão',basement:'Porão',front:'Fachada',upstairs:'Corredor superior'};
