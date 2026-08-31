import { createClient } from '@supabase/supabase-js';
import { SCHEDULE } from './tournament-data.mjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// With no Supabase credentials the app runs in DEMO MODE: match data comes
// from lib/tournament-data.mjs, any 4-digit PIN is accepted, and scores live
// in this browser's localStorage (synced across tabs, not across devices).
export const DEMO_MODE = !url || !anon;

function createDemoClient() {
  const STORAGE_KEY = 'demo-scores-v1';
  const listeners = new Set();

  const baseRows = () => SCHEDULE.map(m => ({
    id: m.id,
    time_slot: m.time,
    court: m.court,
    category: m.cat,
    p1: m.p1,
    p2: m.p2 || null,
    umpire: m.umpire || null,
    score1: null,
    score2: null,
    is_playoff: !!m.isPlayoff,
    stage: m.stage || null,
    label: m.label || null,
    match_type: m.matchType || null,
    scoring_format: m.scoringFormat || null,
    is_final: false,
    last_activity: null,
    updated_at: null,
    updated_by: null,
  }));

  const loadOverrides = () => {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  };
  const saveOverrides = (o) => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); }
    catch {}
  };
  const rows = () => {
    const o = loadOverrides();
    return baseRows().map(r => (o[r.id] ? { ...r, ...o[r.id] } : r));
  };
  const emit = (row) => { for (const cb of listeners) cb({ new: row }); };

  // Cross-tab "realtime": another tab writing scores fires a storage event here
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      for (const r of rows()) if (r.updated_at) emit(r);
    });
  }

  return {
    from: () => ({
      select: async () => ({ data: rows(), error: null }),
    }),
    channel: () => ({
      _handlers: [],
      on(_event, _filter, cb) { this._handlers.push(cb); listeners.add(cb); return this; },
      subscribe(statusCb) { if (statusCb) statusCb('SUBSCRIBED'); return this; },
    }),
    removeChannel: (ch) => { for (const cb of ch?._handlers || []) listeners.delete(cb); },
    rpc: async (fn, args) => {
      if (fn !== 'update_score') return { data: { ok: false, error: `Unknown function ${fn}` }, error: null };
      const pin = String(args.p_pin ?? '');
      if (!/^\d{4}$/.test(pin)) return { data: { ok: false, error: 'Invalid PIN' }, error: null };
      const overrides = loadOverrides();
      overrides[args.p_match_id] = {
        score1: args.p_score1,
        score2: args.p_score2,
        is_final: !!args.p_is_final,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: pin === '0000' ? 'admin' : 'umpire',
      };
      saveOverrides(overrides);
      const updated = rows().find(r => r.id === args.p_match_id);
      if (updated) emit(updated);
      return { data: { ok: true, updated_by: overrides[args.p_match_id].updated_by }, error: null };
    },
  };
}

export const supabase = DEMO_MODE
  ? createDemoClient()
  : createClient(url, anon, { realtime: { params: { eventsPerSecond: 10 } } });
