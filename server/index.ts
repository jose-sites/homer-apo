import {TikTokBridge,GIFTS} from './tiktok';
import {loadEnvironment,configurationWarnings} from './config.ts';
import {ROOMS} from '../shared/data';
import {LAYOUT_REVISION,MIRRORED_ROOMS} from '../shared/referenceLayout';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createHttpServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { createInitialState, applyAction, tick } from '../shared/engine.ts';
import type { LiveState } from '../shared/types.ts';
import { StateDatabase } from './db.ts';
import { AudioProvider, shouldComment, generateActions, localReply, providerCapabilities, ProviderError, type ProviderEnvironment } from './providers.ts';

export interface ServerOptions {
  dataDir?: string;
  databasePath?: string;
  env?: ProviderEnvironment;
  tickInterval?: number;
  fetchImpl?: typeof fetch;
  log?: (record: Record<string, unknown>) => void;
}

const character = z.enum(['homer', 'marge', 'bart', 'lisa', 'maggie']);
const ttsBody = z.object({ text: z.string().trim().min(1).max(600), character }).strict();
const aiBody = z.object({ messageId: z.string().max(120).optional() }).strict();
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Recover only compatible snapshots; transient audiovisual activity never resumes. */
export function recoverState(saved: unknown, fresh: LiveState, now = Date.now()): LiveState {
  if (!record(saved) || !record(saved.settings) || !record(saved.characters) || !record(saved.homer)) return fresh;
  if (!['logs', 'cameras', 'lines', 'events', 'memory'].every(key => Array.isArray(saved[key]))) return fresh;
  if (!Object.keys(fresh.characters).every(id => record((saved.characters as Record<string, unknown>)[id]))) return fresh;
  const candidate = structuredClone(fresh);
  if (!applyAction(candidate, { type: 'SETTINGS', settings: saved.settings }, now).ok) return fresh;
  // Catalog entries pass the same validation used by the operator. Existing ids
  // retain fresh defaults unless a valid persisted definition can replace them.
  for (const entry of saved.cameras as unknown[]) {
    let camera=entry;
    if(saved.layoutRevision!==LAYOUT_REVISION&&entry&&typeof entry==='object'){
      const old=entry as {room:string;position:number[];target:number[]};
      if(MIRRORED_ROOMS.includes(old.room)&&Array.isArray(old.position)&&Array.isArray(old.target)){
        const room=ROOMS.find(r=>r.id===old.room)!;const delta=room.origin[0]*2;
        camera={...old,position:[old.position[0]+delta,...old.position.slice(1)],target:[old.target[0]+delta,...old.target.slice(1)]};
      }
    }
    applyAction(candidate, { type: 'ADD_CAMERA', camera }, now);
  }
  for (const line of saved.lines as unknown[]) applyAction(candidate, { type: 'ADD_LINE', line }, now);
  for (const event of saved.events as Array<Record<string, unknown>>) {
    if (!record(event)) continue;
    applyAction(candidate, { type: 'UPDATE_EVENT', eventId: event.id, patch: { enabled: event.enabled, probability: event.probability, cooldown: event.cooldown, duration: event.duration, priority: event.priority } }, now);
    const restoredEvent = candidate.events.find(entry => entry.id === event.id);
    if (restoredEvent && typeof event.lastRun === 'number' && Number.isFinite(event.lastRun) && event.lastRun >= 0) restoredEvent.lastRun = Math.min(event.lastRun, now);
  }
  for (const [id, value] of Object.entries(saved.characters)) {
    if (record(value)) applyAction(candidate, { type: 'CHARACTER', character: id, patch: { enabled: value.enabled, volume: value.volume, expression: value.expression } }, now);
  }
  const savedCamera = candidate.cameras.find(c => c.id === saved.cameraId);
  if (savedCamera) candidate.cameraId = savedCamera.id;
  if (typeof saved.room === 'string' && candidate.cameras.some(c => c.room === saved.room)) {
    candidate.room = saved.room; candidate.characters.homer.room = saved.room;
  }
  if (typeof saved.virtualHour === 'number') applyAction(candidate, { type: 'SET_TIME', hour: saved.virtualHour }, now);
  for (const key of ['mood', 'energy', 'hunger', 'sleep', 'attention', 'interest'] as const) {
    const value = saved.homer[key]; if (typeof value === 'number' && Number.isFinite(value)) candidate.homer[key] = Math.max(0, Math.min(100, value));
  }
  const cutoff = now - candidate.settings.retentionDays * 86_400_000;
  candidate.logs = (saved.logs as unknown[]).filter((e): e is LiveState['logs'][number] => record(e) && typeof e.id === 'string' && typeof e.at === 'number' && e.at >= cutoff && typeof e.message === 'string' && typeof e.type === 'string').slice(0,199);
  candidate.memory = (saved.memory as unknown[]).filter((s): s is string => typeof s === 'string').slice(-40).map(s => s.slice(0, 1000));
  candidate.startedAt = now;
  candidate.paused = true;
  candidate.speaking = null; candidate.speechQueue = []; candidate.movement = null; candidate.game = null; candidate.chat = []; candidate.proposals = [];
  candidate.logs.unshift({ id: randomUUID(), at: now, type: 'recovery', message: 'Estado recuperado do SQLite. Operação pausada; retome quando estiver pronto.' });
  return candidate;
}

export function createServer(options: ServerOptions = {}) {
  const env = options.env || process.env;
  const dataDir = resolve(options.dataDir || env.DATA_DIR || 'data');
  const db = new StateDatabase(options.databasePath || join(dataDir, 'homer.sqlite'));
  const state = recoverState(db.load(), createInitialState());
  const shutdown = new AbortController();
  const audio = new AudioProvider(join(dataDir, 'audio-cache'), env, options.fetchImpl, shutdown.signal, message=>{ttsStatus=message;event('audio',message);broadcast();});
  const app = express();
  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  const boot = Date.now();
  const log = options.log || ((entry: Record<string, unknown>) => console.log(JSON.stringify({ at: new Date().toISOString(), ...entry })));
  const capabilities = providerCapabilities(env);
  const sessions = new Map<string, number>();
  const rateWindows = new Map<string, { at: number; count: number }>();
  const processedMessages = new Set<string>();
  let persistTimer: ReturnType<typeof setTimeout> | undefined;
  let ticker: ReturnType<typeof setInterval> | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let aiBusy = false;
  let aiGeneration = 0;
  let publicGame: { sourceId: string; id: string } | null = null;
  let lastAIAt = 0;
  let lastTick = Date.now();
  let persistenceError: string | null = null;
  let providerError: string | null = null;
  let ttsStatus: string | null = null;
  for(const warning of configurationWarnings(env))event('configuration',warning);

  function updateProviderStatus() {
    state.providers.ai = state.settings.provider === 'demo' ? 'Demonstração · regras locais' : capabilities.ai.configured ? 'API configurada · não verificada' : 'API não configurada';
    state.providers.tts = state.settings.ttsProvider === 'browser' ? 'Voz do navegador' : state.settings.ttsProvider === 'silent' ? 'Legendas · sem voz' : ttsStatus || (capabilities.tts.configured ? 'API configurada · não verificada' : 'API não configurada');
  }
  updateProviderStatus();
  function event(type: string, message: string) {
    state.logs.unshift({ id: randomUUID(), at: Date.now(), type, message }); state.logs = state.logs.slice(0,200);
    log({ level: type === 'error' ? 'error' : 'info', event: type, message });
  }
  function persist() {
    try { db.save(state); persistenceError = null; }
    catch { persistenceError = 'Não foi possível salvar o estado no SQLite.'; log({ level: 'error', event: 'persistence', message: persistenceError }); }
  }
  function schedulePersist() {
    if (!persistTimer && !closed) persistTimer = setTimeout(() => { persistTimer = undefined; persist(); }, 1500);
  }
  function broadcast() {
    updateProviderStatus();
    const packet = JSON.stringify({ type: 'state', state: publicState() });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        if (client.bufferedAmount > 2_000_000) client.close(1013, 'Cliente lento; reconecte para obter o estado atual.');
        else client.send(packet);
      }
    }
    schedulePersist();
  }
  function publicState(): LiveState {
    // Internal game ids encode the bank index for server-side recovery. Never
    // expose that answer selector (or voter hashes) through HTTP or WebSocket.
    if (!state.game) { publicGame = null; return state; }
    if (publicGame?.sourceId !== state.game.id) publicGame = { sourceId: state.game.id, id: randomUUID() };
    return { ...state, game: { ...state.game, id: publicGame.id, guesses: state.game.type === 'poll' ? [] : state.game.guesses } };
  }
  const token = env.ADMIN_TOKEN || '';
  const equal = (a: string, b: string) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
  function authorized(headers: { authorization?: string; cookie?: string }): boolean {
    if (!token) return true;
    const bearer = headers.authorization?.startsWith('Bearer ') ? headers.authorization.slice(7) : '';
    if (bearer && equal(bearer, token)) return true;
    const session = headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('homer_session='))?.slice('homer_session='.length);
    const expiry = session ? sessions.get(session) : undefined;
    return !!expiry && expiry > Date.now();
  }
  function originAllowed(origin: string | undefined, host: string | undefined): boolean {
    if (!host) return false;
    let hostUrl: URL; try { hostUrl = new URL(`http://${host}`); } catch { return false; }
    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
    let publicOrigin: URL | undefined;
    try { if (env.PUBLIC_ORIGIN) publicOrigin = new URL(env.PUBLIC_ORIGIN); } catch { return false; }
    if (!localHosts.has(hostUrl.hostname) && hostUrl.host !== publicOrigin?.host) return false;
    if (!origin) return true; // Native clients such as curl use token auth when configured.
    let parsed: URL; try { parsed = new URL(origin); } catch { return false; }
    if (publicOrigin && parsed.origin === publicOrigin.origin) return true;
    if (parsed.host === hostUrl.host && ['http:', 'https:'].includes(parsed.protocol)) return true;
    const address = httpServer.address();
    const allowedPorts = new Set(['5173', '3001', typeof address === 'object' && address ? String(address.port) : '']);
    return localHosts.has(parsed.hostname) && ['http:', 'https:'].includes(parsed.protocol) && allowedPorts.has(parsed.port);
  }
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin'); next(); });
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!originAllowed(req.headers.origin, req.headers.host)) { res.status(403).json({ ok: false, error: 'Origem não autorizada.' }); return; }
    const key = req.socket.remoteAddress || 'local';
    const now = Date.now(); const window = rateWindows.get(key);
    if (!window || now - window.at > 60_000) rateWindows.set(key, { at: now, count: 1 });
    else if (++window.count > 240) { res.status(429).json({ ok: false, error: 'Limite de requisições atingido. Aguarde um minuto.' }); return; }
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Homer AI Live 2.0', version: '0.1.0', authRequired: !!token, database: persistenceError ? 'error' : 'ready', providers: capabilities }));
  app.post('/api/session', (req, res) => {
    if (typeof req.body?.token !== 'string' || !equal(req.body.token, token)) { res.status(401).json({ ok: false, error: 'Token inválido.' }); return; }
    const id = randomBytes(32).toString('hex');
    for (const [session, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(session);
    if (sessions.size > 20) sessions.delete(sessions.keys().next().value!);
    sessions.set(id, Date.now() + 12 * 60 * 60 * 1000);
    res.cookie('homer_session', id, { httpOnly: true, sameSite: 'strict', secure: env.PUBLIC_ORIGIN?.startsWith('https://') || false, maxAge: 12 * 60 * 60 * 1000, path: '/' });
    res.json({ ok: true });
  });
  app.use('/api', (req, res, next) => { if (!authorized(req.headers)) res.status(401).json({ ok: false, error: 'Configure o token de operador para conectar.' }); else next(); });
  app.get('/api/state', (_req, res) => res.json(publicState()));
  app.get('/api/diagnostics', async (_req, res) => res.json({ uptimeSeconds: Math.floor((Date.now() - boot) / 1000), websocketClients: wss.clients.size, database: db.stats(), providers: capabilities, audioCache: await audio.stats(), aiBusy, lastProviderError: providerError, persistenceError, processMemoryMB: Math.round(process.memoryUsage().rss / 1_048_576) }));
  app.get('/api/history', (_req, res) => res.json({ events: db.recentEvents() }));
  const tiktok=new TikTokBridge(state,env,broadcast);
  app.get('/api/tiktok/status',(_req,res)=>res.json(tiktok.info()));
  app.post('/api/tiktok/connect',async(_req,res)=>{try{await tiktok.start();res.json(tiktok.info())}catch(e){res.status(503).json({error:(e as Error).message})}});
  app.post('/api/tiktok/disconnect',(_req,res)=>{tiktok.stop();res.json({ok:true})});
  app.post('/api/tiktok/confirm-end',(req,res)=>res.status(tiktok.confirm(req.body?.id)?200:409).json(tiktok.info()));
  app.post('/api/tiktok/demo',(req,res)=>{const b=req.body;if(env.TIKTOK_DEMO==='false')return res.status(403).json({error:'Demo desativada'});if(typeof b?.user!=='string'||!b.user.trim()||b.user.length>30)return res.status(400).json({error:'Usuário inválido'});if(b.kind==='chat'&&typeof b.text==='string'&&b.text.length<=280)tiktok.chat(randomUUID(),b.user,b.text,false);else if(b.kind==='gift'&&Object.hasOwn(GIFTS,b.gift))tiktok.gift(randomUUID(),b.user,b.gift);else return res.status(400).json({error:'Evento inválido'});res.json(tiktok.info())});
  app.post('/api/action', (req, res) => {
    const result = applyAction(state, req.body, Date.now());
    if (result.ok) {
      if (req.body?.type === 'PAUSE' || req.body?.type === 'SETTINGS' && ['mode', 'provider', 'aiEnabled'].some(key => key in (req.body.settings || {}))) aiGeneration++;
      if (req.body?.type === 'CLEAR_MEMORY') {
        state.logs = state.logs.filter(entry => entry.type === 'memory').slice(0, 1);
        db.clearHistory(); persist();
      }
      broadcast();
    }
    res.status(result.ok ? 200 : 400).json(result);
  });
  async function respond(messageId?: string, automatic = false) {
    if (aiBusy) throw new ProviderError('A IA já está preparando uma resposta.', 409);
    if (closed || automatic && state.settings.mode === 'manual') throw new ProviderError('Resposta automática cancelada pelo operador.', 409);
    if (state.paused) throw new ProviderError('Retome a operação antes de solicitar uma fala.', 409);
    if (!state.settings.aiEnabled) throw new ProviderError('Ative a IA no painel antes de solicitar uma resposta.', 409);
    const message = messageId ? state.chat.find(m => m.id === messageId) : [...state.chat].reverse().find(m=>m.selected);
    if (messageId && !message) throw new ProviderError('Mensagem não encontrada.', 404);
    if (Date.now() - lastAIAt < state.settings.responseCooldown * 1000) throw new ProviderError('Aguarde o intervalo configurado entre respostas.', 429);
    aiBusy = true;
    const generation = aiGeneration;
    const provider = state.settings.provider;
    lastAIAt = Date.now();
    try {
      const prompt = message?.text || 'O chat está quieto. Faça um comentário espontâneo breve sobre seu estado ou o que aconteceu recentemente, sem repetir a última fala.';
      const actions = provider === 'demo' ? [localReply(prompt)] : await generateActions(state, prompt, env, options.fetchImpl, shutdown.signal);
      if (closed || generation !== aiGeneration || state.paused || !state.settings.aiEnabled || automatic && state.settings.mode === 'manual') throw new ProviderError('Resposta descartada: a operação ou configuração da IA mudou durante a requisição.', 409);
      // Validate an entire response against a clone before any real mutations.
      const preview = structuredClone(state);
      for (const action of actions) {
        const result = applyAction(preview, action, Date.now());
        if (!result.ok) throw new ProviderError(`Ação da IA rejeitada pelo motor: ${result.error || 'ação inválida'}`);
      }
      if (state.paused || !state.settings.aiEnabled) throw new ProviderError('Resposta descartada: operação pausada ou IA desativada durante a requisição.', 409);
      for (const action of actions) {
        if (state.settings.mode === 'semi') state.proposals.push({ id: randomUUID(), action: action as LiveState['proposals'][number]['action'], reason: 'Sugestão da IA; aguarda aprovação do operador.',replyTo:message?{...message}:undefined });
        else { const previousIds=new Set(state.speechQueue.map(s=>s.id));const result = applyAction(state, action, Date.now()); if (!result.ok) throw new ProviderError(result.error || 'Ação indisponível.');if(message)for(const speech of state.speechQueue)if(speech.character==='homer'&&!previousIds.has(speech.id)){speech.replyTo={...message};speech.priority=Math.max(speech.priority,message.priority||0);}state.speechQueue.sort((a,b)=>b.priority-a.priority); }
      }
      state.proposals = state.proposals.slice(-20);
      const spoken = actions.filter((a:any)=>a.type==='TALK').map((a:any)=>String(a.text).slice(0,350));
      state.memory.push(`${message ? 'Chat: '+message.text.slice(0,140) : 'Comentário espontâneo'} · ${state.settings.mode === 'semi' ? 'Sugestão ainda não executada' : 'Homer'}: ${spoken.join(' ')}`);
      state.memory=state.memory.slice(-30);
      if (message) { message.selected = false; processedMessages.add(message.id); }
      providerError = null;
      event('ai', provider === 'demo' ? 'Resposta produzida pelo banco local de demonstração.' : 'Resposta recebida da API e validada pelo motor.');
      broadcast();
      return { ok: true, source: provider, actions: actions.length };
    } catch (error) {
      const message = error instanceof ProviderError ? error.message : 'Falha inesperada no provedor de IA.';
      providerError = message; event('error', message); broadcast(); throw error;
    } finally { aiBusy = false; }
  }
  app.post('/api/ai/respond', async (req, res, next) => {
    const parsed = aiBody.safeParse(req.body || {});
    if (!parsed.success) { res.status(400).json({ ok: false, error: 'Parâmetros inválidos para a IA.' }); return; }
    try { res.json(await respond(parsed.data.messageId)); } catch (error) { next(error); }
  });
  app.post('/api/tts', async (req, res, next) => {
    const parsed = ttsBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ ok: false, error: 'Informe personagem válido e texto de 1 a 600 caracteres.' }); return; }
    try { const buffer = await audio.synthesize(parsed.data.text, parsed.data.character); res.type('audio/mpeg').send(buffer); }
    catch (error) { next(error); }
  });
  app.delete('/api/audio-cache', async (_req, res, next) => { try { await audio.clear(); res.json({ ok: true }); } catch (error) { next(error); } });
  app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Rota não encontrada.' }));
  const dist = resolve('dist');
  if (existsSync(join(dist, 'index.html'))) {
    app.use(express.static(dist, { maxAge: '1h', index: false }));
    app.get(['/', '/overlay'], (_req, res) => res.sendFile(join(dist, 'index.html')));
  }
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = error instanceof ProviderError ? error.status : record(error) && error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    const message = error instanceof ProviderError ? error.message : status === 413 ? 'Requisição maior que o limite.' : status === 400 ? 'JSON inválido.' : 'Erro interno. Consulte os logs locais.';
    log({ level: 'error', event: 'http_error', status, message });
    if (!res.headersSent) res.status(status).json({ ok: false, error: message });
  });
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url !== '/ws' || !originAllowed(req.headers.origin, req.headers.host) || !authorized(req.headers)) { socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  const alive = new WeakSet<WebSocket>();
  wss.on('connection', ws => {
    alive.add(ws); ws.on('pong', () => alive.add(ws));
    ws.on('error', () => { /* Per-client disconnects cannot crash the engine. */ });
    ws.on('message', () => ws.close(1008, 'Socket somente para leitura. Envie ações pela API.'));
    ws.send(JSON.stringify({ type: 'state', state: publicState() }));
  });

  async function start(port = Number(env.PORT || 3001), host = env.HOST || '127.0.0.1') {
    await new Promise<void>((resolveStart, reject) => { httpServer.once('error', reject); httpServer.listen(port, host, () => { httpServer.off('error', reject); resolveStart(); }); });
    lastTick = Date.now();
    if (options.tickInterval !== 0) ticker = setInterval(() => {
      const now = Date.now(); const elapsed = Math.min(5000, now - lastTick); lastTick = now;
      try {
        tick(state, now, elapsed);
        if (!state.paused && state.settings.mode !== 'manual' && state.settings.aiEnabled && state.settings.provider === 'openai-compatible' && !aiBusy && now - lastAIAt >= state.settings.responseCooldown * 1000) {
          const selected = state.chat.filter(m => m.selected && !processedMessages.has(m.id)).sort((a,b)=>(b.priority||0)-(a.priority||0))[0];
          if (selected) { processedMessages.add(selected.id); void respond(selected.id, true).catch(() => undefined); }
          else if (shouldComment(state, now, lastAIAt, boot)) void respond(undefined, true).catch(() => undefined);
        }
        if (processedMessages.size > 200) { const current = new Set(state.chat.map(m => m.id)); for (const id of processedMessages) if (!current.has(id)) processedMessages.delete(id); }
        broadcast();
      } catch { state.paused = true; state.speaking = null; state.speechQueue = []; event('error', 'Falha no ciclo de execução. Operação pausada para recuperação manual.'); broadcast(); }
    }, options.tickInterval || 1000);
    pingTimer = setInterval(() => { for (const ws of wss.clients) { if (!alive.has(ws)) ws.terminate(); else { alive.delete(ws); ws.ping(); } } }, 30_000);
    ticker?.unref(); pingTimer.unref();
    const address = httpServer.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    log({ level: 'info', event: 'server_started', url: `http://${host}:${actualPort}`, ai: capabilities.ai.name, tts: capabilities.tts.name });
    return { port: actualPort, host, url: `http://${host}:${actualPort}` };
  }
  async function close() {
    if (closed) return;
    tiktok.stop(); closed = true; aiGeneration++; shutdown.abort(); if (ticker) clearInterval(ticker); if (pingTimer) clearInterval(pingTimer); if (persistTimer) clearTimeout(persistTimer);
    persist();
    for (const ws of wss.clients) ws.terminate();
    await new Promise<void>(done => wss.close(() => done()));
    if (httpServer.listening) await new Promise<void>((done, reject) => httpServer.close(error => error ? reject(error) : done()));
    db.close();
  }
  return { app, httpServer, wss, state, database: db, start, close, broadcast };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runtime = createServer({env:loadEnvironment()});
  runtime.start().catch(error => { console.error(JSON.stringify({ level: 'error', event: 'startup_failed', message: error instanceof Error ? error.message : 'Erro de inicialização.' })); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void runtime.close().then(() => process.exit(0)); });
}
