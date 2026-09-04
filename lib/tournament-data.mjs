// =============================================================
// TOURNAMENT DATA — ECUM Badminton, Saturday 2026-09-05
//
// MEN'S DOUBLES: 8 groups (A–H) x 4 teams, round robin.
// Top 2 of each group advance to the next round; all games to 21.
// Team names are placeholders (Team A1..H4) — replace with real
// team names, keeping them identical here and in SCHEDULE.
//
// Group stage runs on 16 courts (2 per group), 3 rounds:
//   Round 1 09:00  ·  Round 2 09:30  ·  Round 3 10:00
// Adjust times/courts freely.
//
// PLAYOFF_STRUCTURE / FINALS_STRUCTURE are empty until the
// knockout + junior-league format is finalized.
// After editing, re-seed the database: node scripts/seed.mjs
// =============================================================

// Round-robin of 4 (per group): R1: 1v2, 3v4 · R2: 1v3, 2v4 · R3: 1v4, 2v3
const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROUNDS = [
  { time: '09:00', pairs: [[1, 2], [3, 4]] },
  { time: '09:30', pairs: [[1, 3], [2, 4]] },
  { time: '10:00', pairs: [[1, 4], [2, 3]] },
];

const team = (g, n) => `Team ${g}${n}`;

export const SCHEDULE = [];
let matchNum = 0;
GROUP_LETTERS.forEach((g, gi) => {
  const baseCourt = gi * 2 + 1; // Group A: courts 1-2, B: 3-4, ... H: 15-16
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

// ---- KNOCKOUT: single-game matches (to 21), 16 qualifiers ----
// R16 10:45 (courts 1-8) -> QF 11:30 (courts 1-4) -> SF 12:15 (courts 1-2) -> F 13:00 (court 1)
// Cross-pairing keeps group-mates on opposite R16 matches.
const R16_PAIRS = [
  ['A', 1, 'B', 2], ['B', 1, 'A', 2], ['C', 1, 'D', 2], ['D', 1, 'C', 2],
  ['E', 1, 'F', 2], ['F', 1, 'E', 2], ['G', 1, 'H', 2], ['H', 1, 'G', 2],
];
const rankName = (g, r) => (r === 1 ? `Group ${g} Winner` : `Group ${g} Runner-up`);

export const KNOCKOUT = {};

R16_PAIRS.forEach(([g1, r1, g2, r2], i) => {
  const id = `m${49 + i}`;
  SCHEDULE.push({
    id, time: '10:45', court: i + 1, cat: 'MD',
    p1: rankName(g1, r1), p2: rankName(g2, r2), umpire: 'TBD',
    isPlayoff: true, matchType: 'r16', scoringFormat: 21, label: `MD Round of 16 · ${i + 1}`,
  });
  KNOCKOUT[id] = {
    cat: 'MD', round: 'r16', label: `R16 · ${i + 1}`,
    slot1: { group: `Group ${g1}`, rank: r1 }, slot2: { group: `Group ${g2}`, rank: r2 },
  };
});

const addKnockout = (id, time, court, round, label, feed1, feed2, matchType) => {
  SCHEDULE.push({
    id, time, court, cat: 'MD',
    p1: `Winner ${KNOCKOUT[feed1].label}`, p2: `Winner ${KNOCKOUT[feed2].label}`, umpire: 'TBD',
    isPlayoff: true, matchType, scoringFormat: 21, label: `MD ${label}`,
  });
  KNOCKOUT[id] = {
    cat: 'MD', round, label,
    slot1: { winnerOf: feed1 }, slot2: { winnerOf: feed2 },
  };
};

addKnockout('m57', '11:30', 1, 'quarter', 'Quarterfinal 1', 'm49', 'm51', 'quarter');
addKnockout('m58', '11:30', 2, 'quarter', 'Quarterfinal 2', 'm50', 'm52', 'quarter');
addKnockout('m59', '11:30', 3, 'quarter', 'Quarterfinal 3', 'm53', 'm55', 'quarter');
addKnockout('m60', '11:30', 4, 'quarter', 'Quarterfinal 4', 'm54', 'm56', 'quarter');
addKnockout('m61', '12:15', 1, 'semi', 'Semifinal 1', 'm57', 'm58', 'semi');
addKnockout('m62', '12:15', 2, 'semi', 'Semifinal 2', 'm59', 'm60', 'semi');
addKnockout('m63', '13:00', 1, 'final', 'Final', 'm61', 'm62', 'final');

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

// PLAYOFF_STRUCTURE / FINALS_STRUCTURE - legacy 3-set semi/final system,
// unused for this tournament (the KNOCKOUT bracket above replaces it).
export const PLAYOFF_STRUCTURE = {};
export const FINALS_STRUCTURE = {};
