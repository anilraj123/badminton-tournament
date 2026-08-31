// =============================================================
// TOURNAMENT CONFIG — the single place for event-specific branding.
//
// To set up this app for your tournament:
//   1. Edit everything in this file
//   2. Replace the dummy names in lib/tournament-data.mjs
//      (schedule, groups, rosters, playoff structure)
//   3. Review components/Rules.jsx (scoring/format/rules text)
//   4. Drop your poster into public/ and set `poster` below
//      (or leave it null to hide the poster block)
//   5. Create a Supabase project, run supabase/schema.sql, then
//      node scripts/seed.mjs (see README)
// =============================================================

export const TOURNAMENT = {
  // Big display name (site header + TV dashboard)
  name: 'SPRING OPEN',

  // Browser tab titles
  siteTitle: 'Spring Open — Live',
  tvTitle: 'Spring Open — Dashboard',

  // Long-form title + organizer (rules page header, footer)
  fullTitle: 'Spring Open Badminton Tournament',
  organizer: 'Your Club or Organization',
  presentedBy: 'Your Organization Presents',

  // Motto shown in footer and rules page; set to '' to hide
  tagline: '',

  // Event facts
  date: 'Saturday, June 1, 2026',
  timeRange: '1:00 PM – 7:00 PM',
  checkIn: 'Check-in: 12:30 PM',
  venue: {
    name: 'Community Sports Hall',
    address: '123 Main St, Your City, ST 00000',
  },
  contact: {
    name: 'Tournament Desk',
    phone: '555-0100',
    tel: '+15550100',
  },
  categoriesBlurb: "Men's/Women's Singles, Doubles, Mixed Doubles",

  // Path under public/; set to null to hide the poster block
  poster: null,
};
