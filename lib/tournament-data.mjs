// =============================================================
// TOURNAMENT DATA — ECUM Badminton, Saturday 2026-09-05
//
// MEN'S DOUBLES: 6 groups (A–F) x 4 teams, round robin.
// Top 2 of each group advance to the next round; all games to 21.
// Team names are placeholders (Team A1..F4) — replace with real
// team names, keeping them identical here and in SCHEDULE.
//
// Group stage runs on 12 courts (2 per group), 3 rounds:
//   Round 1 09:00  ·  Round 2 09:30  ·  Round 3 10:00
// Adjust times/courts freely.
//
// PLAYOFF_STRUCTURE / FINALS_STRUCTURE are empty until the
// knockout + junior-league format is finalized.
// After editing, re-seed the database: node scripts/seed.mjs
// =============================================================

// Round-robin of 4 (per group): R1: 1v2, 3v4 · R2: 1v3, 2v4 · R3: 1v4, 2v3
const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROUNDS = [
  { time: '09:00', pairs: [[1, 2], [3, 4]] },
  { time: '09:30', pairs: [[1, 3], [2, 4]] },
  { time: '10:00', pairs: [[1, 4], [2, 3]] },
];

const team = (g, n) => `Team ${g}${n}`;

export const SCHEDULE = [];
let matchNum = 0;
GROUP_LETTERS.forEach((g, gi) => {
  const baseCourt = gi * 2 + 1; // Group A: courts 1-2, B: 3-4, ... F: 11-12
  ROUNDS.forEach((round) => {
    round.pairs.forEach((pair, pi) => {
      matchNum += 1;
      SCHEDULE.push({
        id: `m${matchNum}`,
        time: round.time,
        court: baseCourt + pi,
        cat: 'MD',
        p1: team(g, pair[0]),
        p2: team(g, pair[1]),
        umpire: 'TBD',
        isPlayoff: false,
        matchType: 'prelim',
        scoringFormat: 21,
        label: `MD Group ${g}`,
      });
    });
  });
});

// GROUPS - names must exactly match SCHEDULE
export const GROUPS = {
  MD: Object.fromEntries(
    GROUP_LETTERS.map(g => [`Group ${g}`, [1, 2, 3, 4].map(n => team(g, n))])
  ),
};

// TEAM_ROSTERS - fill in player names per team to power "My Matches"
// e.g. 'Team A1': ['Player One', 'Player Two'],
export const TEAM_ROSTERS = {};

// CAT_LABELS
export const CAT_LABELS = {
  MD: "Men's Doubles",
};

// NAME_ALIASES - map alternate spellings to canonical names if needed
export const NAME_ALIASES = {};

// ADVANCE_PER_GROUP - how many advance from each group, per category
// (used for the standings highlight until PLAYOFF_STRUCTURE is filled in)
export const ADVANCE_PER_GROUP = { MD: 2 };

// PLAYOFF_STRUCTURE - top 2 of each of the 6 groups (12 qualifiers) advance;
// bracket wiring TBD until the knockout/junior-league format is final.
export const PLAYOFF_STRUCTURE = {};

// FINALS_STRUCTURE - TBD with the playoff format
export const FINALS_STRUCTURE = {};
