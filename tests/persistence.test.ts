import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateDatabase } from '../server/db.ts';
import { recoverState } from '../server/index.ts';
import { createInitialState, applyAction } from '../shared/engine.ts';
import type { LiveState } from '../shared/types.ts';

test('SQLite round-trip persists operator settings, custom cameras/lines; raw chat stays session-only', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'homer-db-'));
  const path = join(dir, 'state.sqlite'); const now = Date.now();
  let db = new StateDatabase(path);
  try {
    const state = createInitialState(now);
    applyAction(state, { type: 'SETTINGS', settings: { mode: 'auto', masterVolume: 0.35 } }, now);
    applyAction(state, { type: 'ADD_CAMERA', camera: { ...state.cameras[0], id: 'my-camera', name: 'Minha câmera' } }, now);
    applyAction(state, { type: 'ADD_LINE', line: { id: 'custom-line', character: 'homer', category: 'chat', text: 'Uma fala criada pelo operador.' } }, now);
    applyAction(state, { type: 'CHAT', user: 'viewer-handle', text: 'Olá, Homer!' }, now);
    applyAction(state, { type: 'TALK', character: 'homer', text: 'Esta fila não deve ser reproduzida.' }, now);
    state.memory.push('Chat comentou: texto privado do chat', 'Resumo: Homer visitou a cozinha.');
    state.room = 'kitchen'; state.characters.homer.room = 'kitchen';
    db.save(state, now); db.close(); db = new StateDatabase(path);
    const saved = db.load() as LiveState;
    assert.equal(saved.settings.masterVolume, 0.35); assert.deepEqual(saved.chat, []); assert.deepEqual(saved.speechQueue, []);
    assert.deepEqual(saved.memory, ['Resumo: Homer visitou a cozinha.']);
    const recovered = recoverState(saved, createInitialState(now + 1), now + 1);
    assert.equal(recovered.paused, true); assert.equal(recovered.settings.mode, 'auto'); assert.equal(recovered.speaking, null);
    assert.equal(recovered.room, 'kitchen'); assert.equal(recovered.cameraId, 'living-family');
    assert.ok(recovered.cameras.some(c => c.id === 'my-camera')); assert.ok(recovered.lines.some(l => l.id === 'custom-line'));
    assert.equal(recovered.logs[0].type, 'recovery');
  } finally { db.close(); await rm(dir, { recursive: true, force: true }); }
});

test('SQLite retention removes old events and clearHistory removes ledger entries', () => {
  const db = new StateDatabase(':memory:'); const now = Date.now(); const state = createInitialState(now);
  try {
    state.settings.retentionDays = 1;
    state.logs = [{ id: 'old', at: now - 2 * 86_400_000, type: 'event', message: 'Expired' }, { id: 'new', at: now, type: 'event', message: 'Current' }];
    db.save(state, now);
    assert.deepEqual(db.recentEvents().map(e => e.id), ['new']);
    assert.equal((db.load() as LiveState).logs.length, 1);
    db.clearHistory(); assert.equal(db.stats().events, 0);
  } finally { db.close(); }
});

test('Malformed or incompatible recovery data falls back to a valid fresh state', () => {
  const fresh = createInitialState();
  for (const value of [null, 'bad json', [], { settings: {} }, { ...fresh, settings: { ...fresh.settings, masterVolume: 10000 } }]) assert.equal(recoverState(value, fresh), fresh);
});
