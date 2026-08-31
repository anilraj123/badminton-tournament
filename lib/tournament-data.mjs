// =============================================================
// TOURNAMENT DATA — TEMPLATE with dummy teams/players.
// Replace the dummy names below with your tournament's real
// players, teams, groups, schedule, and umpires.
//
// Structure (from a real 1-day, 3-court, 5-event tournament):
//   SCHEDULE          - every match: time, court, category, players, umpire
//   GROUPS            - round-robin groups per category (names must match SCHEDULE)
//   TEAM_ROSTERS      - who is on each named doubles team (powers "My Matches")
//   CAT_LABELS        - category codes -> display names
//   PLAYOFF_STRUCTURE - which group ranks feed each semi-final
//   FINALS_STRUCTURE  - which semi winners feed each final
// Playoff matches are 3 rows (one per set): id "mNN_s1/2/3" + parentMatchId "mNN".
// After editing, re-seed the database: node scripts/seed.mjs
// =============================================================

export const SCHEDULE = [
  { id: "m1", time: "13:00", court: 1, cat: "MS", p1: "Ira", p2: "Noel", umpire: "Logan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m2", time: "13:00", court: 2, cat: "MS", p1: "Sage", p2: "Uma", umpire: "Kai", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m3", time: "13:00", court: 3, cat: "MXD", p1: "Team Raptor", p2: "Team Meteor", umpire: "Gray", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m4", time: "13:12", court: 1, cat: "MS", p1: "Hollis", p2: "Emery", umpire: "Taylor", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m5", time: "13:12", court: 2, cat: "MD", p1: "Team Echo", p2: "Team Bravo", umpire: "Kit", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m6", time: "16:48", court: 1, cat: "MXD", p1: "Morgan/Sky", p2: "Finley/Vale", umpire: "Uma", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m7", time: "13:24", court: 1, cat: "MS", p1: "Ira", p2: "Alex", umpire: "Zion", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m8", time: "13:24", court: 2, cat: "MXD", p1: "Team Raptor", p2: "Team Quasar", umpire: "Casey", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m9", time: "13:24", court: 3, cat: "MXD", p1: "Team Meteor", p2: "Team Lunar", umpire: "Morgan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m10", time: "13:36", court: 1, cat: "MXD", p1: "Hollis/Perry", p2: "Team Gemini", umpire: "Logan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m11", time: "13:36", court: 2, cat: "WS", p1: "Finley", p2: "Cameron", umpire: "Kai", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "WS Prelim" },
  { id: "m12", time: "13:36", court: 3, cat: "MS", p1: "Vale", p2: "Lane", umpire: "Gray", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m13", time: "13:48", court: 1, cat: "MS", p1: "Casey", p2: "Ira", umpire: "Vale", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m14", time: "13:48", court: 2, cat: "MXD", p1: "Team Quasar", p2: "Team Lunar", umpire: "Kit", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m15", time: "13:48", court: 3, cat: "MXD", p1: "Team Kestrel", p2: "Team Meteor", umpire: "Yael", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m16", time: "14:00", court: 1, cat: "MD", p1: "Zion/Drew", p2: "Team Alpha", umpire: "Oakley", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m17", time: "14:00", court: 2, cat: "MXD", p1: "Team Orbit", p2: "Team Lunar", umpire: "Logan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m18", time: "14:00", court: 3, cat: "MS", p1: "Vale", p2: "Frankie", umpire: "Morgan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m19", time: "14:12", court: 1, cat: "MD", p1: "Team Pulsar", p2: "Team Echo", umpire: "Uma", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m20", time: "14:12", court: 2, cat: "MXD", p1: "Team Quasar", p2: "Team Meteor", umpire: "Toni", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m21", time: "14:12", court: 3, cat: "MXD", p1: "Team Raptor", p2: "Team Kestrel", umpire: "Zion", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m22", time: "14:24", court: 1, cat: "MD", p1: "Team Ion", p2: "Lane/Alex", umpire: "Taylor", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m23", time: "14:48", court: 1, cat: "MS", p1: "Wren", p2: "Uma", umpire: "Oakley", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m24", time: "14:24", court: 3, cat: "MS", p1: "Kai", p2: "Hollis", umpire: "Kit", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m25", time: "14:36", court: 1, cat: "MD", p1: "Lane/Alex", p2: "Team Horizon", umpire: "Nico", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m26", time: "14:36", court: 2, cat: "WS", p1: "Ellis", p2: "Cameron", umpire: "Micah", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "WS Prelim" },
  { id: "m27", time: "14:36", court: 3, cat: "MXD", p1: "Team Gemini", p2: "Casey/Dana", umpire: "Emery", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m28", time: "14:24", court: 2, cat: "MS", p1: "Wren", p2: "Sage", umpire: "Jordan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m29", time: "14:48", court: 2, cat: "MS", p1: "Casey", p2: "Noel", umpire: "Lane", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m30", time: "14:48", court: 3, cat: "MD", p1: "Zion/Drew", p2: "Kai/Yael", umpire: "Kit", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m31", time: "15:00", court: 1, cat: "MXD", p1: "Team Raptor", p2: "Team Lunar", umpire: "Taylor", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m32", time: "15:00", court: 2, cat: "MXD", p1: "Finley/Vale", p2: "Hollis/Perry", umpire: "Zion", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m33", time: "15:00", court: 3, cat: "MXD", p1: "Morgan/Sky", p2: "Team Gemini", umpire: "Yael", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m34", time: "15:12", court: 1, cat: "MXD", p1: "Team Kestrel", p2: "Team Quasar", umpire: "Nico", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m35", time: "15:12", court: 2, cat: "MD", p1: "Team Ion", p2: "Team Horizon", umpire: "Gray", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m36", time: "16:36", court: 1, cat: "MS", p1: "Glen", p2: "Emery", umpire: "Taylor", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m37", time: "15:24", court: 1, cat: "MD", p1: "Team Pulsar", p2: "Team Bravo", umpire: "Kit", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m38", time: "15:24", court: 2, cat: "MD", p1: "Hollis/Remy", p2: "Team Delta", umpire: "Jules", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m39", time: "15:24", court: 3, cat: "MXD", p1: "Finley/Vale", p2: "Casey/Dana", umpire: "Uma", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m40", time: "15:36", court: 1, cat: "MXD", p1: "Team Orbit", p2: "Team Kestrel", umpire: "Emery", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m41", time: "15:36", court: 2, cat: "MS", p1: "Glen", p2: "Kai", umpire: "Wren", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m42", time: "15:36", court: 3, cat: "MD", p1: "Parker/Beck", p2: "Team Nova", umpire: "Zion", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m43", time: "15:48", court: 1, cat: "MS", p1: "Wren", p2: "Jordan", umpire: "Uma", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m44", time: "15:48", court: 2, cat: "MS", p1: "Lane", p2: "Frankie", umpire: "Morgan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m45", time: "15:48", court: 3, cat: "WD", p1: "Finley/Onyx", p2: "Team Falcon", umpire: "Ash", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "WD Prelim" },
  { id: "m46", time: "16:00", court: 1, cat: "BREAK", p1: "BREAK (except for people playing at 4pm)-- SNACKS/ TEA", p2: "TBD", umpire: "TBD", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "BREAK Prelim" },
  { id: "m47", time: "16:00", court: 1, cat: "MXD", p1: "Hollis/Perry", p2: "Casey/Dana", umpire: "Kit", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m48", time: "16:00", court: 2, cat: "WS", p1: "Toni", p2: "Ray", umpire: "Glen", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "WS Prelim" },
  { id: "m49", time: "16:00", court: 3, cat: "MS", p1: "Kai", p2: "Emery", umpire: "Wren", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m50", time: "16:12", court: 1, cat: "MS", p1: "Noel", p2: "Alex", umpire: "Lane", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m51", time: "16:12", court: 2, cat: "MS", p1: "Nico", p2: "Frankie", umpire: "Emery", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m52", time: "16:12", court: 3, cat: "MD", p1: "Parker/Beck", p2: "Team Delta", umpire: "Logan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m53", time: "16:24", court: 1, cat: "MS", p1: "Uma", p2: "Jordan", umpire: "Gray", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m54", time: "16:24", court: 2, cat: "MXD", p1: "Morgan/Sky", p2: "Casey/Dana", umpire: "Glen", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m55", time: "16:24", court: 3, cat: "MXD", p1: "Team Orbit", p2: "Team Quasar", umpire: "Micah", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m56", time: "15:12", court: 3, cat: "MS", p1: "Lane", p2: "Nico", umpire: "Wren", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m57", time: "16:36", court: 2, cat: "MD", p1: "Team Nova", p2: "Team Delta", umpire: "Gray", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m58", time: "16:36", court: 3, cat: "MD", p1: "Parker/Beck", p2: "Hollis/Remy", umpire: "Vale", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m59", time: "13:12", court: 3, cat: "WS", p1: "Finley", p2: "Ellis", umpire: "Yael", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "WS Prelim" },
  { id: "m60", time: "16:48", court: 2, cat: "MS", p1: "Casey", p2: "Alex", umpire: "Glen", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m61", time: "16:48", court: 3, cat: "MS", p1: "Sage", p2: "Jordan", umpire: "Logan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m62", time: "17:00", court: 1, cat: "WD", p1: "Team Comet", p2: "Team Jetstream", umpire: "Ash", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "WD Prelim" },
  { id: "m63", time: "17:00", court: 2, cat: "MS", p1: "Vale", p2: "Nico", umpire: "Yael", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m64", time: "17:00", court: 3, cat: "MD", p1: "Hollis/Remy", p2: "Team Nova", umpire: "Oakley", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m65", time: "17:12", court: 1, cat: "MD", p1: "Kai/Yael", p2: "Team Alpha", umpire: "Morgan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MD Prelim" },
  { id: "m66", time: "17:12", court: 2, cat: "MXD", p1: "Team Orbit", p2: "Team Meteor", umpire: "Logan", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m67", time: "17:12", court: 3, cat: "MXD", p1: "Team Kestrel", p2: "Team Lunar", umpire: "Gray", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m68", time: "17:24", court: 1, cat: "MXD", p1: "Team Orbit", p2: "Team Raptor", umpire: "Micah", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m69", time: "17:24", court: 2, cat: "MS", p1: "Glen", p2: "Hollis", umpire: "Emery", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MS Prelim" },
  { id: "m71", time: "17:36", court: 1, cat: "MXD", p1: "Finley/Vale", p2: "Team Gemini", umpire: "Zion", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m72", time: "17:36", court: 2, cat: "MXD", p1: "Morgan/Sky", p2: "Hollis/Perry", umpire: "Micah", isPlayoff: false, matchType: "prelim", scoringFormat: 15, label: "MXD Prelim" },
  { id: "m70_s1", time: "17:24", court: 3, cat: "WS", p1: "WS Group A2", p2: "WS Group B1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WS Semi 1 - Set 1", setNumber: 1, parentMatchId: "m70" },
  { id: "m70_s2", time: "17:24", court: 3, cat: "WS", p1: "WS Group A2", p2: "WS Group B1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WS Semi 1 - Set 2", setNumber: 2, parentMatchId: "m70" },
  { id: "m70_s3", time: "17:24", court: 3, cat: "WS", p1: "WS Group A2", p2: "WS Group B1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WS Semi 1 - Set 3", setNumber: 3, parentMatchId: "m70" },
  { id: "m73_s1", time: "17:36", court: 3, cat: "WS", p1: "WS Group A1", p2: "WS Group B2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WS Semi 2 - Set 1", setNumber: 1, parentMatchId: "m73" },
  { id: "m73_s2", time: "17:36", court: 3, cat: "WS", p1: "WS Group A1", p2: "WS Group B2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WS Semi 2 - Set 2", setNumber: 2, parentMatchId: "m73" },
  { id: "m73_s3", time: "17:36", court: 3, cat: "WS", p1: "WS Group A1", p2: "WS Group B2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WS Semi 2 - Set 3", setNumber: 3, parentMatchId: "m73" },
  { id: "m74_s1", time: "18:00", court: 1, cat: "MS", p1: "MS Group A Winner", p2: "MS Group D Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MS Semi 1 - Set 1", setNumber: 1, parentMatchId: "m74" },
  { id: "m74_s2", time: "18:00", court: 1, cat: "MS", p1: "MS Group A Winner", p2: "MS Group D Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MS Semi 1 - Set 2", setNumber: 2, parentMatchId: "m74" },
  { id: "m74_s3", time: "18:00", court: 1, cat: "MS", p1: "MS Group A Winner", p2: "MS Group D Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MS Semi 1 - Set 3", setNumber: 3, parentMatchId: "m74" },
  { id: "m75_s1", time: "18:00", court: 2, cat: "MS", p1: "MS Group B Winner", p2: "MS Group C Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MS Semi 2 - Set 1", setNumber: 1, parentMatchId: "m75" },
  { id: "m75_s2", time: "18:00", court: 2, cat: "MS", p1: "MS Group B Winner", p2: "MS Group C Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MS Semi 2 - Set 2", setNumber: 2, parentMatchId: "m75" },
  { id: "m75_s3", time: "18:00", court: 2, cat: "MS", p1: "MS Group B Winner", p2: "MS Group C Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MS Semi 2 - Set 3", setNumber: 3, parentMatchId: "m75" },
  { id: "m76_s1", time: "18:00", court: 3, cat: "MD", p1: "MD Group A Winner", p2: "MD Group D Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MD Semi 1 - Set 1", setNumber: 1, parentMatchId: "m76" },
  { id: "m76_s2", time: "18:00", court: 3, cat: "MD", p1: "MD Group A Winner", p2: "MD Group D Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MD Semi 1 - Set 2", setNumber: 2, parentMatchId: "m76" },
  { id: "m76_s3", time: "18:00", court: 3, cat: "MD", p1: "MD Group A Winner", p2: "MD Group D Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MD Semi 1 - Set 3", setNumber: 3, parentMatchId: "m76" },
  { id: "m78_s1", time: "18:25", court: 2, cat: "MD", p1: "MD Group B Winner", p2: "MD Group C Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MD Semi 2 - Set 1", setNumber: 1, parentMatchId: "m78" },
  { id: "m78_s2", time: "18:25", court: 2, cat: "MD", p1: "MD Group B Winner", p2: "MD Group C Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MD Semi 2 - Set 2", setNumber: 2, parentMatchId: "m78" },
  { id: "m78_s3", time: "18:25", court: 2, cat: "MD", p1: "MD Group B Winner", p2: "MD Group C Winner", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MD Semi 2 - Set 3", setNumber: 3, parentMatchId: "m78" },
  { id: "m77_s1", time: "18:25", court: 1, cat: "WD", p1: "WD Group A2", p2: "WD Group B1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WD Semi 1 - Set 1", setNumber: 1, parentMatchId: "m77" },
  { id: "m77_s2", time: "18:25", court: 1, cat: "WD", p1: "WD Group A2", p2: "WD Group B1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WD Semi 1 - Set 2", setNumber: 2, parentMatchId: "m77" },
  { id: "m77_s3", time: "18:25", court: 1, cat: "WD", p1: "WD Group A2", p2: "WD Group B1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WD Semi 1 - Set 3", setNumber: 3, parentMatchId: "m77" },
  { id: "m82_s1", time: "18:50", court: 3, cat: "WD", p1: "WD Group A1", p2: "WD Group B2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WD Semi 2 - Set 1", setNumber: 1, parentMatchId: "m82" },
  { id: "m82_s2", time: "18:50", court: 3, cat: "WD", p1: "WD Group A1", p2: "WD Group B2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WD Semi 2 - Set 2", setNumber: 2, parentMatchId: "m82" },
  { id: "m82_s3", time: "18:50", court: 3, cat: "WD", p1: "WD Group A1", p2: "WD Group B2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "WD Semi 2 - Set 3", setNumber: 3, parentMatchId: "m82" },
  { id: "m79_s1", time: "18:25", court: 3, cat: "MXD", p1: "MXD Group AD2", p2: "MXD Group BC1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MXD Semi 1 - Set 1", setNumber: 1, parentMatchId: "m79" },
  { id: "m79_s2", time: "18:25", court: 3, cat: "MXD", p1: "MXD Group AD2", p2: "MXD Group BC1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MXD Semi 1 - Set 2", setNumber: 2, parentMatchId: "m79" },
  { id: "m79_s3", time: "18:25", court: 3, cat: "MXD", p1: "MXD Group AD2", p2: "MXD Group BC1", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MXD Semi 1 - Set 3", setNumber: 3, parentMatchId: "m79" },
  { id: "m81_s1", time: "18:50", court: 2, cat: "MXD", p1: "MXD Group AD1", p2: "MXD Group BC2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MXD Semi 2 - Set 1", setNumber: 1, parentMatchId: "m81" },
  { id: "m81_s2", time: "18:50", court: 2, cat: "MXD", p1: "MXD Group AD1", p2: "MXD Group BC2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MXD Semi 2 - Set 2", setNumber: 2, parentMatchId: "m81" },
  { id: "m81_s3", time: "18:50", court: 2, cat: "MXD", p1: "MXD Group AD1", p2: "MXD Group BC2", umpire: "TBD", isPlayoff: true, matchType: "semi", scoringFormat: 21, label: "MXD Semi 2 - Set 3", setNumber: 3, parentMatchId: "m81" },
  { id: "m80_s1", time: "18:50", court: 1, cat: "MS", p1: "MS Semi 1 Winner", p2: "MS Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MS Final - Set 1", setNumber: 1, parentMatchId: "m80" },
  { id: "m80_s2", time: "18:50", court: 1, cat: "MS", p1: "MS Semi 1 Winner", p2: "MS Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MS Final - Set 2", setNumber: 2, parentMatchId: "m80" },
  { id: "m80_s3", time: "18:50", court: 1, cat: "MS", p1: "MS Semi 1 Winner", p2: "MS Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MS Final - Set 3", setNumber: 3, parentMatchId: "m80" },
  { id: "m83_s1", time: "19:15", court: 1, cat: "MD", p1: "MD Semi 1 Winner", p2: "MD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MD Final - Set 1", setNumber: 1, parentMatchId: "m83" },
  { id: "m83_s2", time: "19:15", court: 1, cat: "MD", p1: "MD Semi 1 Winner", p2: "MD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MD Final - Set 2", setNumber: 2, parentMatchId: "m83" },
  { id: "m83_s3", time: "19:15", court: 1, cat: "MD", p1: "MD Semi 1 Winner", p2: "MD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MD Final - Set 3", setNumber: 3, parentMatchId: "m83" },
  { id: "m84_s1", time: "19:15", court: 2, cat: "WS", p1: "WS Semi 1 Winner", p2: "WS Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "WS Final - Set 1", setNumber: 1, parentMatchId: "m84" },
  { id: "m84_s2", time: "19:15", court: 2, cat: "WS", p1: "WS Semi 1 Winner", p2: "WS Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "WS Final - Set 2", setNumber: 2, parentMatchId: "m84" },
  { id: "m84_s3", time: "19:15", court: 2, cat: "WS", p1: "WS Semi 1 Winner", p2: "WS Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "WS Final - Set 3", setNumber: 3, parentMatchId: "m84" },
  { id: "m85_s1", time: "19:15", court: 3, cat: "WD", p1: "WD Semi 1 Winner", p2: "WD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "WD Final - Set 1", setNumber: 1, parentMatchId: "m85" },
  { id: "m85_s2", time: "19:15", court: 3, cat: "WD", p1: "WD Semi 1 Winner", p2: "WD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "WD Final - Set 2", setNumber: 2, parentMatchId: "m85" },
  { id: "m85_s3", time: "19:15", court: 3, cat: "WD", p1: "WD Semi 1 Winner", p2: "WD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "WD Final - Set 3", setNumber: 3, parentMatchId: "m85" },
  { id: "m86_s1", time: "19:30", court: 1, cat: "MXD", p1: "MXD Semi 1 Winner", p2: "MXD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MXD Final - Set 1", setNumber: 1, parentMatchId: "m86" },
  { id: "m86_s2", time: "19:30", court: 1, cat: "MXD", p1: "MXD Semi 1 Winner", p2: "MXD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MXD Final - Set 2", setNumber: 2, parentMatchId: "m86" },
  { id: "m86_s3", time: "19:30", court: 1, cat: "MXD", p1: "MXD Semi 1 Winner", p2: "MXD Semi 2 Winner", umpire: "TBD", isPlayoff: true, matchType: "final", scoringFormat: 21, label: "MXD Final - Set 3", setNumber: 3, parentMatchId: "m86" },
];

// GROUPS - names must exactly match SCHEDULE
export const GROUPS = {
  "MS": {
    "Group A": [
      "Vale",
      "Lane",
      "Nico",
      "Frankie"
    ],
    "Group B": [
      "Wren",
      "Sage",
      "Uma",
      "Jordan"
    ],
    "Group C": [
      "Casey",
      "Noel",
      "Ira",
      "Alex"
    ],
    "Group D": [
      "Glen",
      "Kai",
      "Hollis",
      "Emery"
    ]
  },
  "MD": {
    "Group A": [
      "Zion/Drew",
      "Kai/Yael",
      "Team Alpha"
    ],
    "Group B": [
      "Parker/Beck",
      "Hollis/Remy",
      "Team Nova",
      "Team Delta"
    ],
    "Group C": [
      "Team Pulsar",
      "Team Echo",
      "Team Bravo"
    ],
    "Group D": [
      "Team Ion",
      "Lane/Alex",
      "Team Horizon"
    ]
  },
  "MXD": {
    "Group AD": [
      "Morgan/Sky",
      "Finley/Vale",
      "Hollis/Perry",
      "Team Gemini",
      "Casey/Dana"
    ],
    "Group BC": [
      "Team Raptor",
      "Team Kestrel",
      "Team Quasar",
      "Team Meteor",
      "Team Lunar",
      "Team Orbit"
    ]
  },
  "WS": {
    "Group A": [
      "Toni",
      "Ray"
    ],
    "Group B": [
      "Finley",
      "Ellis",
      "Cameron"
    ]
  },
  "WD": {
    "Group A": [
      "Finley/Onyx",
      "Team Falcon"
    ],
    "Group B": [
      "Team Comet",
      "Team Jetstream"
    ]
  }
};

// TEAM_ROSTERS - members of each named doubles team
export const TEAM_ROSTERS = {
  "Team Raptor": [
    "Ellis",
    "Indie"
  ],
  "Team Quasar": [
    "Kai",
    "Harper"
  ],
  "Team Meteor": [
    "Blair",
    "Wren"
  ],
  "Team Lunar": [
    "Toni",
    "Nico"
  ],
  "Team Gemini": [
    "Ray",
    "Frankie"
  ],
  "Team Kestrel": [
    "Cameron",
    "Quinn"
  ],
  "Team Orbit": [
    "Onyx",
    "Alex"
  ],
  "Team Comet": [
    "Toni",
    "Cameron"
  ],
  "Team Jetstream": [
    "Blair",
    "Ray"
  ],
  "Team Falcon": [
    "Harper",
    "Sky"
  ],
  "Team Echo": [
    "Vale",
    "Nico"
  ],
  "Team Bravo": [
    "Frankie",
    "Jordan"
  ],
  "Team Pulsar": [
    "Noel",
    "Gray"
  ],
  "Team Alpha": [
    "Logan",
    "Micah"
  ],
  "Team Ion": [
    "Casey",
    "Uma"
  ],
  "Team Nova": [
    "Kit",
    "Reese"
  ],
  "Team Delta": [
    "Wren",
    "Taylor"
  ],
  "Team Horizon": [
    "Jules",
    "Glen"
  ]
};

// CAT_LABELS
export const CAT_LABELS = {
  "MS": "Men's Singles",
  "MD": "Men's Doubles",
  "WS": "Women's Singles",
  "WD": "Women's Doubles",
  "MXD": "Mixed Doubles"
};

// NAME_ALIASES - map alternate spellings to canonical names if needed
export const NAME_ALIASES = {};

// PLAYOFF_STRUCTURE - which group standings feed each semi-final
export const PLAYOFF_STRUCTURE = {
  "m70": {
    "cat": "WS",
    "label": "WS Semi 1",
    "slot1": {
      "group": "Group A",
      "rank": 2
    },
    "slot2": {
      "group": "Group B",
      "rank": 1
    }
  },
  "m73": {
    "cat": "WS",
    "label": "WS Semi 2",
    "slot1": {
      "group": "Group A",
      "rank": 1
    },
    "slot2": {
      "group": "Group B",
      "rank": 2
    }
  },
  "m74": {
    "cat": "MS",
    "label": "MS Semi 1",
    "slot1": {
      "group": "Group A",
      "rank": 1
    },
    "slot2": {
      "group": "Group D",
      "rank": 1
    }
  },
  "m75": {
    "cat": "MS",
    "label": "MS Semi 2",
    "slot1": {
      "group": "Group B",
      "rank": 1
    },
    "slot2": {
      "group": "Group C",
      "rank": 1
    }
  },
  "m76": {
    "cat": "MD",
    "label": "MD Semi 1",
    "slot1": {
      "group": "Group A",
      "rank": 1
    },
    "slot2": {
      "group": "Group D",
      "rank": 1
    }
  },
  "m78": {
    "cat": "MD",
    "label": "MD Semi 2",
    "slot1": {
      "group": "Group B",
      "rank": 1
    },
    "slot2": {
      "group": "Group C",
      "rank": 1
    }
  },
  "m77": {
    "cat": "WD",
    "label": "WD Semi 1",
    "slot1": {
      "group": "Group A",
      "rank": 2
    },
    "slot2": {
      "group": "Group B",
      "rank": 1
    }
  },
  "m82": {
    "cat": "WD",
    "label": "WD Semi 2",
    "slot1": {
      "group": "Group A",
      "rank": 1
    },
    "slot2": {
      "group": "Group B",
      "rank": 2
    }
  },
  "m79": {
    "cat": "MXD",
    "label": "MXD Semi 1",
    "slot1": {
      "group": "Group AD",
      "rank": 2
    },
    "slot2": {
      "group": "Group BC",
      "rank": 1
    }
  },
  "m81": {
    "cat": "MXD",
    "label": "MXD Semi 2",
    "slot1": {
      "group": "Group AD",
      "rank": 1
    },
    "slot2": {
      "group": "Group BC",
      "rank": 2
    }
  }
};

// FINALS_STRUCTURE - which semi-final winners feed each final
export const FINALS_STRUCTURE = {
  "m80": {
    "cat": "MS",
    "label": "MS Final",
    "semi1": "m74",
    "semi2": "m75"
  },
  "m83": {
    "cat": "MD",
    "label": "MD Final",
    "semi1": "m76",
    "semi2": "m78"
  },
  "m84": {
    "cat": "WS",
    "label": "WS Final",
    "semi1": "m70",
    "semi2": "m73"
  },
  "m85": {
    "cat": "WD",
    "label": "WD Final",
    "semi1": "m77",
    "semi2": "m82"
  },
  "m86": {
    "cat": "MXD",
    "label": "MXD Final",
    "semi1": "m79",
    "semi2": "m81"
  }
};
