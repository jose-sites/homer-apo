import {preferences,type ViewerMemory} from './viewerMemory.ts';
import {emptyUsage,type Usage} from './usage.ts';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { EventLog, LiveState } from '../shared/types.ts';

/** One authoritative snapshot and a bounded append-only event ledger. */
export class StateDatabase {
  private db: DatabaseSync;
  readonly path: string;
  constructor(path: string) {
    this.path = path;
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY CHECK(id=1), schema_version INTEGER NOT NULL, body TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, at INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS events_at_idx ON events(at);
      CREATE TABLE IF NOT EXISTS viewers (key TEXT PRIMARY KEY, name TEXT NOT NULL, visits INTEGER NOT NULL, lastSeen INTEGER NOT NULL, preferences TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS live_usage (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);
      PRAGMA user_version=1;`);
  }
  load(): unknown | null {
    const row = this.db.prepare('SELECT body,schema_version FROM snapshots WHERE id=1').get();
    if (!row || row.schema_version !== 1 || typeof row.body !== 'string') return null;
    try { return JSON.parse(row.body); } catch { return null; }
  }
  save(state: LiveState, now = Date.now()): void {
    // Viewer handles and raw chat are intentionally session-only. Queued audio is
    // never replayed on a server restart.
    const keepDays = Math.min(90, Math.max(1, Number(state.settings.retentionDays) || 7));
    const cutoff = now - keepDays * 86_400_000;
    const snapshot = { ...state, conversations: [], chat: [], speaking: null, speechQueue: [], proposals: [], interaction: undefined,
      memory: state.memory.filter(text => !/^Chat(?::| comentou:)/.test(text)).slice(-30),
      logs: state.logs.filter(event => event.at >= cutoff).slice(0, 200) };
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`INSERT INTO snapshots(id,schema_version,body,updated_at) VALUES(1,1,?,?)
        ON CONFLICT(id) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at,schema_version=1`).run(JSON.stringify(snapshot), now);
      const insert = this.db.prepare('INSERT OR IGNORE INTO events(id,at,type,message) VALUES(?,?,?,?)');
      for (const event of snapshot.logs) insert.run(event.id, event.at, event.type, event.message.slice(0, 1200));
      this.db.prepare('DELETE FROM events WHERE at < ?').run(now - keepDays * 86_400_000);
      this.db.exec('DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY at DESC LIMIT 10000)');
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  pruneViewers(days=7,now=Date.now()) {this.db.prepare('DELETE FROM viewers WHERE lastSeen < ?').run(now-Math.max(1,Math.min(30,days))*86400000);this.db.exec('DELETE FROM viewers WHERE key NOT IN (SELECT key FROM viewers ORDER BY lastSeen DESC LIMIT 500)');}
  viewer(key:string):ViewerMemory|undefined {const row=this.db.prepare('SELECT * FROM viewers WHERE key=?').get(key);return row?{key:String(row.key),name:String(row.name),visits:Number(row.visits),lastSeen:Number(row.lastSeen),preferences:JSON.parse(String(row.preferences))}:undefined;}
  rememberViewer(key:string,name:string,text:string,days=7,now=Date.now()) {
    this.pruneViewers(days,now);const old=this.viewer(key);const topics=[...new Set([...(old?.preferences||[]),...preferences(text)])].slice(-6);
    const visits=(old?.visits||0)+(!old||now-old.lastSeen>1800000?1:0);
    this.db.prepare('INSERT INTO viewers(key,name,visits,lastSeen,preferences) VALUES(?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET name=excluded.name,visits=excluded.visits,lastSeen=excluded.lastSeen,preferences=excluded.preferences').run(key,name.slice(0,30),visits,now,JSON.stringify(topics));this.pruneViewers(days,now);
  }
  viewers():ViewerMemory[]{return this.db.prepare('SELECT key FROM viewers ORDER BY lastSeen DESC LIMIT 500').all().map(r=>this.viewer(String(r.key))!);}
  clearViewers(key?:string){if(key)this.db.prepare('DELETE FROM viewers WHERE key=?').run(key);else this.db.exec('DELETE FROM viewers');}
  loadUsage():Usage {const row=this.db.prepare('SELECT body FROM live_usage WHERE id=1').get();if(!row)return emptyUsage();try{const u=JSON.parse(String(row.body));if(['startedAt','ai','fish','openai','characters','estimatedUSD'].every(k=>typeof u[k]==='number'&&Number.isFinite(u[k])&&u[k]>=0))return u;}catch{}return emptyUsage();}
  saveUsage(u:Usage){this.db.prepare('INSERT INTO live_usage(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(JSON.stringify(u));}
  recentEvents(limit = 100): EventLog[] {
    return this.db.prepare('SELECT id,at,type,message FROM events ORDER BY at DESC LIMIT ?').all(Math.min(1000, Math.max(1, limit))) as unknown as EventLog[];
  }
  clearHistory(): void { this.db.exec('DELETE FROM events'); }
  stats(): { engine: 'SQLite'; events: number; savedAt: number | null } {
    const count = this.db.prepare('SELECT COUNT(*) AS n FROM events').get();
    const snapshot = this.db.prepare('SELECT updated_at FROM snapshots WHERE id=1').get();
    return { engine: 'SQLite', events: Number(count?.n ?? 0), savedAt: snapshot ? Number(snapshot.updated_at) : null };
  }
  close(): void { this.db.close(); }
}
