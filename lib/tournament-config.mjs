// =============================================================
// TOURNAMENT CONFIG — loaded from /tournament.config.json.
//
// To set up this app for your tournament:
//   1. Edit tournament.config.json at the repo root
//      (name, dates, venue, contact — editable right on GitHub)
//   2. Replace the dummy names in lib/tournament-data.mjs
//      (schedule, groups, rosters, playoff structure)
//   3. Review components/Rules.jsx (scoring/format/rules text)
//   4. Drop your poster into public/ and set "poster" in the JSON
//      (or leave it null to hide the poster block)
//   5. Create a Supabase project, run supabase/schema.sql, then
//      node scripts/seed.mjs (see README)
// =============================================================

import config from '../tournament.config.json';

export const TOURNAMENT = config;
