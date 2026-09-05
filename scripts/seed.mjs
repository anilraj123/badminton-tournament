// =============================================================
// SEED SCRIPT — run once after creating the Supabase schema
// Usage: node scripts/seed.mjs
//
// Requires env vars:
//   SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (from Supabase dashboard > API)
//   ADMIN_PIN=1234                     (your master PIN)
//   MATCH_PIN=1111                     (optional; the PIN for every match)
//
// Admin PIN and match PIN are both 1111 by default, so there is no privileged
// PIN to keep secret — anyone at the venue can correct any score.
//
// This script:
//   1. Stamps every match with the SAME PIN (MATCH_PIN, default 1111) — this
//      tournament deliberately does not use per-match PINs, so there are no
//      slips to print and re-seeding never invalidates anything already handed out
//   2. Inserts all matches into the `matches` table
//   3. Sets the admin PIN in the `config` table
// =============================================================

import { createClient } from '@supabase/supabase-js';
import { SCHEDULE, GROUPS } from '../lib/tournament-data.mjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPin = process.env.ADMIN_PIN;
// One shared PIN for every match. No per-match PINs, no PIN sheet.
const matchPin = process.env.MATCH_PIN || '1111';

if (!url || !key || !adminPin) {
  console.error('Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PIN');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

if (!/^\d{4}$/.test(matchPin)) {
  console.error(`MATCH_PIN must be exactly 4 digits, got ${JSON.stringify(matchPin)}`);
  process.exit(1);
}

async function seed() {
  console.log('Seeding', SCHEDULE.length, 'matches…');
  console.log(`Every match uses the shared PIN ${matchPin}.`);

  const rows = SCHEDULE.map(m => ({
    id: m.id,
    time_slot: m.time,
    court: m.court,
    category: m.cat,
    p1: m.p1,
    p2: m.p2 || null,
    umpire: m.umpire || null,
    is_playoff: !!m.isPlayoff,
    stage: m.stage || null,
    label: m.label || null,
    match_type: m.matchType || null,
    scoring_format: m.scoringFormat || null,
    pin: matchPin,
  }));

  // Upsert admin PIN first
  const { error: cfgErr } = await supabase
    .from('config')
    .upsert({ id: 1, admin_pin: adminPin }, { onConflict: 'id' });
  if (cfgErr) throw cfgErr;
  console.log('✓ Admin PIN set');

  // Insert matches in batches (Supabase has a row limit per request)
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('matches').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
    console.log(`✓ Inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log('\n✓ Seed complete.');
  console.log(`✓ Match PIN for every court: ${matchPin}   ·   Admin PIN: ${adminPin}`);
}

seed().catch(e => { console.error(e); process.exit(1); });
