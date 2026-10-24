import React from 'react';
import ReactDOM from 'react-dom/client';
const Root=React.lazy(()=>import.meta.env.MODE==='pages'?import('./PagesPreview'):import('./App'));
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><React.Suspense fallback={<p>Carregando Homer AI Live…</p>}><Root/></React.Suspense></React.StrictMode>);
