// =============================================================
// SEED SCRIPT — run once after creating the Supabase schema
// Usage: node scripts/seed.mjs
//
// Requires env vars:
//   SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (from Supabase dashboard > API)
//   ADMIN_PIN=1234                     (your master PIN)
//
// This script:
//   1. Generates a unique 4-digit PIN for each match
//   2. Inserts all 82 matches into the `matches` table
//   3. Sets the admin PIN in the `config` table
//   4. Writes a printable pin-sheet.html you hand to umpires
// =============================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEDULE, GROUPS } from '../lib/tournament-data.mjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPin = process.env.ADMIN_PIN;

if (!url || !key || !adminPin) {
  console.error('Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PIN');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Generate a unique 4-digit PIN avoiding collisions with admin PIN & other matches
function uniquePin(used) {
  for (let i = 0; i < 1000; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (pin !== adminPin && !used.has(pin)) {
      used.add(pin);
      return pin;
    }
  }
  throw new Error('Could not generate unique PIN');
}

async function seed() {
  console.log('Seeding', SCHEDULE.length, 'matches…');

  const usedPins = new Set();
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
    pin: uniquePin(usedPins),
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

  // Write printable PIN sheet
  writePinSheet(rows, adminPin);
  console.log('\n✓ Seed complete.');
  console.log('✓ Wrote pin-sheet.html — open it, print it, hand slips to umpires.');
}

function writePinSheet(rows, adminPin) {
  const byUmpire = {};
  for (const r of rows) {
    if (r.is_playoff) continue; // playoffs don't have assigned umpires in the data
    const u = r.umpire || 'Unassigned';
    if (!byUmpire[u]) byUmpire[u] = [];
    byUmpire[u].push(r);
  }
  const umpires = Object.keys(byUmpire).sort();

  const fmtTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${p}`;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Umpire PINs</title>
<style>
@page { margin: 0.5in; }
body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #111; max-width: 8in; margin: 0 auto; padding: 0.5in; }
h1 { font-size: 24px; margin: 0 0 4px; }
.sub { color: #666; font-size: 12px; margin-bottom: 24px; }
.admin-box { background: #fff3cd; border: 2px solid #856404; padding: 12px 16px; margin-bottom: 24px; font-family: monospace; }
.umpire { page-break-inside: avoid; border: 1px solid #ddd; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px; }
.umpire h2 { font-size: 16px; margin: 0 0 8px; color: #222; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #eee; }
th { background: #f5f5f5; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
.pin { font-family: 'Courier New', monospace; font-weight: bold; font-size: 14px; color: #000; background: #ffeaa7; padding: 2px 6px; border-radius: 3px; }
.cat { font-family: monospace; font-size: 10px; color: #666; }
.cut-line { border-top: 1px dashed #aaa; margin: 16px 0; text-align: center; font-size: 10px; color: #999; }
</style></head><body>
<h1>Umpire PIN Sheet</h1>
<div class="sub">Each umpire uses these 4-digit PINs to enter scores. Cut on the dashed lines and hand each umpire their slip.</div>
<div class="admin-box"><strong>ADMIN PIN (do not share casually):</strong> <span class="pin">${adminPin}</span><br>
<small>Use this if an umpire's PIN doesn't work or to fix any match.</small></div>

${umpires.map(u => `
<div class="umpire">
  <h2>${u} <span style="font-weight: normal; color: #666; font-size: 12px;">— ${byUmpire[u].length} match${byUmpire[u].length > 1 ? 'es' : ''}</span></h2>
  <table>
    <thead><tr><th>Time</th><th>Court</th><th>Event</th><th>Match</th><th>PIN</th></tr></thead>
    <tbody>
    ${byUmpire[u].map(r => `
      <tr>
        <td>${fmtTime(r.time_slot)}</td>
        <td>${r.court}</td>
        <td class="cat">${r.category}</td>
        <td>${r.p1} vs ${r.p2 || '—'}</td>
        <td><span class="pin">${r.pin}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>
<div class="cut-line">— — — — — ✂ cut here — — — — —</div>
`).join('')}
</body></html>`;

  fs.writeFileSync(path.join(process.cwd(), 'pin-sheet.html'), html);
}

seed().catch(e => { console.error(e); process.exit(1); });
