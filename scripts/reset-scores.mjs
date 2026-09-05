// =============================================================
// RESET SCORES — wipe every score back to "not started"
// Usage: node --env-file=.env.local scripts/reset-scores.mjs
//        node --env-file=.env.local scripts/reset-scores.mjs --dry-run
//
// Run this after a test session and BEFORE the first serve, so nothing the
// committee typed while trying the site is still on the board. It clears
// scores only — the schedule, PINs and admin config are left alone, so there
// is no need to re-seed afterwards.
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// =============================================================

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!url || !key) {
  console.error('Missing env vars. Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Try: node --env-file=.env.local scripts/reset-scores.mjs');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from('matches')
  .select('id,p1,p2,score1,score2,is_final,updated_by');
if (error) { console.error(error.message); process.exit(1); }

const touched = data.filter(r => r.score1 != null || r.score2 != null || r.is_final);
if (touched.length === 0) {
  console.log(`No scores to clear — all ${data.length} matches are already blank.`);
  process.exit(0);
}

console.log(`${touched.length} match${touched.length > 1 ? 'es have' : ' has'} a score:`);
for (const r of touched) {
  console.log(`  ${r.id.padEnd(10)} ${r.p1} ${r.score1 ?? '-'} - ${r.score2 ?? '-'} ${r.p2}` +
              `${r.is_final ? '  [FINAL]' : ''}${r.updated_by ? `  (by ${r.updated_by})` : ''}`);
}

if (dryRun) {
  console.log('\n--dry-run: nothing changed.');
  process.exit(0);
}

const ids = touched.map(r => r.id);
for (let i = 0; i < ids.length; i += 50) {
  const { error: e } = await supabase
    .from('matches')
    .update({ score1: null, score2: null, is_final: false, updated_by: null, last_activity: null })
    .in('id', ids.slice(i, i + 50));
  if (e) { console.error('Update failed:', e.message); process.exit(1); }
}

const { data: after } = await supabase
  .from('matches')
  .select('id,score1,score2,is_final');
const left = after.filter(r => r.score1 != null || r.score2 != null || r.is_final);
console.log(`\n✓ Cleared ${ids.length} score${ids.length > 1 ? 's' : ''}. Scores remaining: ${left.length}.`);
if (left.length) { console.error('Some scores survived — check RLS policies.'); process.exit(1); }
