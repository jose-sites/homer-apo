import { useEffect } from 'react';
import { AudioDirector } from './AudioDirector';
import { useLive } from '../store';
export const audioDirector=new AudioDirector();
export function useAudio(){const state=useLive(s=>s.state),enabled=useLive(s=>s.audioEnabled);useEffect(()=>{audioDirector.onStatus=message=>{if(/falh|indispon|não oferece/i.test(message))useLive.getState().setError(message)};if(enabled)void audioDirector.enable().catch(error=>useLive.getState().setError(String(error)));else audioDirector.disable();return()=>audioDirector.disable()},[enabled]);useEffect(()=>{if(state)audioDirector.update(state)},[state,enabled])}
