import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({base:mode==='pages'?'/homer-apo/':'/',plugins:[react()],server:{port:5173,proxy:{'/api':'http://127.0.0.1:3001','/ws':{target:'ws://127.0.0.1:3001',ws:true}}},build:{chunkSizeWarningLimit:1100}}));
