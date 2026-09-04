// =============================================================
// TOURNAMENT DATA — ECUM Badminton, Saturday 2026-09-05
//
// FORMAT (all games ONE game to 21, top 2 per group advance):
//   MD  Men's Doubles   4 groups (A-D) x 6 teams  -> QF, SF, Final
//   MS  Men's Singles   4 groups (A-D) x 4 players -> QF, SF, Final
//   WD  Women's Doubles 2 groups (A-B) x 4 teams  -> SF, Final
//   MXD Mixed Doubles   2 groups (A-B) x 4 teams  -> SF, Final
//
// All names are placeholders — replace with real names, keeping
// GROUPS and SCHEDULE identical (SCHEDULE is generated from GROUPS,
// so editing the name lists below is enough).
//
// PROVISIONAL timetable, 16 courts, 30-minute slots:
//   09:00-11:00  MD groups on courts 1-12 (3 courts per group, 5 rounds)
//   09:00-10:00  MS groups A,B on courts 13-16
//   10:30-11:30  MS groups C,D on courts 13-16
//   11:30-12:30  WD on courts 1-4 · MXD on courts 5-8
//   13:15        MD QF (cts 1-4) · MS QF (cts 5-8) · WD SF (9-10) · MXD SF (11-12)
//   14:00        MD SF (cts 1-2) · MS SF (cts 3-4)
//   14:45        Finals: MD ct 1 · MS ct 2 · WD ct 3 · MXD ct 4
//
// After editing, re-seed the database: node scripts/seed.mjs
// =============================================================

const range = (n) => [...Array(n).keys()];

// Placeholder name builders — swap for real names by editing GROUPS below.
const mdTeam = (g, n) => `Team ${g}${n}`;
const msPlayer = (g, n) => `Player ${g}${n}`;
const wdTeam = (g, n) => `WD Team ${g}${n}`;
const xdTeam = (g, n) => `XD Team ${g}${n}`;

export const GROUPS = {
  MD: Object.fromEntries(['A', 'B', 'C', 'D'].map(g => [`Group ${g}`, range(6).map(i => mdTeam(g, i + 1))])),
  MS: Object.fromEntries(['A', 'B', 'C', 'D'].map(g => [`Group ${g}`, range(4).map(i => msPlayer(g, i + 1))])),
  WD: Object.fromEntries(['A', 'B'].map(g => [`Group ${g}`, range(4).map(i => wdTeam(g, i + 1))])),
  MXD: Object.fromEntries(['A', 'B'].map(g => [`Group ${g}`, range(4).map(i => xdTeam(g, i + 1))])),
};

// Round-robin rounds (1-indexed seats): every entrant plays once per round.
const RR6 = [
  [[1, 6], [2, 5], [3, 4]],
  [[1, 5], [6, 4], [2, 3]],
  [[1, 4], [5, 3], [6, 2]],
  [[1, 3], [4, 2], [5, 6]],
  [[1, 2], [3, 6], [4, 5]],
];
const RR4 = [
  [[1, 2], [3, 4]],
  [[1, 3], [2, 4]],
  [[1, 4], [2, 3]],
];

export const SCHEDULE = [];
let matchNum = 0;
const addMatch = (time, court, cat, p1, p2, label) => {
  matchNum += 1;
  SCHEDULE.push({
    id: `m${matchNum}`, time, court, cat, p1, p2, umpire: 'TBD',
    isPlayoff: false, matchType: 'prelim', scoringFormat: 21, label,
  });
};

// -- MD group stage: group gi on courts gi*3+1..gi*3+3, slots 09:00-11:00 --
const MD_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00'];
['A', 'B', 'C', 'D'].forEach((g, gi) => {
  const teams = GROUPS.MD[`Group ${g}`];
  RR6.forEach((round, ri) => {
    round.forEach((pair, pi) => {
      addMatch(MD_SLOTS[ri], gi * 3 + 1 + pi, 'MD', teams[pair[0] - 1], teams[pair[1] - 1], `MD Group ${g}`);
    });
  });
});

// -- MS group stage: A,B 09:00-10:00 / C,D 10:30-11:30 on courts 13-16 --
const MS_SLOTS_AB = ['09:00', '09:30', '10:00'];
const MS_SLOTS_CD = ['10:30', '11:00', '11:30'];
['A', 'B', 'C', 'D'].forEach((g, gi) => {
  const players = GROUPS.MS[`Group ${g}`];
  const slots = gi < 2 ? MS_SLOTS_AB : MS_SLOTS_CD;
  const baseCourt = 13 + (gi % 2) * 2; // A/C: 13-14, B/D: 15-16
  RR4.forEach((round, ri) => {
    round.forEach((pair, pi) => {
      addMatch(slots[ri], baseCourt + pi, 'MS', players[pair[0] - 1], players[pair[1] - 1], `MS Group ${g}`);
    });
  });
});

// -- WD + MXD group stage: 11:30-12:30 (WD courts 1-4, MXD courts 5-8) --
const LATE_SLOTS = ['11:30', '12:00', '12:30'];
[['WD', 0], ['MXD', 4]].forEach(([cat, courtOffset]) => {
  ['A', 'B'].forEach((g, gi) => {
    const teams = GROUPS[cat][`Group ${g}`];
    const baseCourt = 1 + courtOffset + gi * 2; // two courts per group
    RR4.forEach((round, ri) => {
      round.forEach((pair, pi) => {
        addMatch(LATE_SLOTS[ri], baseCourt + pi, cat, teams[pair[0] - 1], teams[pair[1] - 1], `${cat} Group ${g}`);
      });
    });
  });
});

// -- KNOCKOUT: single-game matches; slots are {group, rank} or {winnerOf: id} --
export const KNOCKOUT = {};
const rankName = (g, r) => (r === 1 ? `Group ${g} Winner` : `Group ${g} Runner-up`);

const addKO = (time, court, cat, round, matchType, label, slot1, slot2, name1, name2) => {
  matchNum += 1;
  const id = `m${matchNum}`;
  SCHEDULE.push({
    id, time, court, cat, p1: name1, p2: name2, umpire: 'TBD',
    isPlayoff: true, matchType, scoringFormat: 21, label: `${cat} ${label}`,
  });
  KNOCKOUT[id] = { cat, round, label, slot1, slot2 };
  return id;
};
const gr = (g, r) => ({ group: `Group ${g}`, rank: r });
const wo = (id) => ({ winnerOf: id });

// 4-group categories: QF pairs A1vB2, C1vD2, B1vA2, D1vC2 so group-mates
// can only meet again in the final.
const wireFourGroupKO = (cat, qfTime, qfCourts, sfTime, sfCourts, fTime, fCourt) => {
  const qf = [
    ['A', 'B'], ['C', 'D'], ['B', 'A'], ['D', 'C'],
  ].map(([w, ru], i) => addKO(
    qfTime, qfCourts[i], cat, 'quarter', 'quarter', `Quarterfinal ${i + 1}`,
    gr(w, 1), gr(ru, 2), rankName(w, 1), rankName(ru, 2)
  ));
  const sf1 = addKO(sfTime, sfCourts[0], cat, 'semi', 'semi', 'Semifinal 1', wo(qf[0]), wo(qf[1]), 'Winner QF1', 'Winner QF2');
  const sf2 = addKO(sfTime, sfCourts[1], cat, 'semi', 'semi', 'Semifinal 2', wo(qf[2]), wo(qf[3]), 'Winner QF3', 'Winner QF4');
  addKO(fTime, fCourt, cat, 'final', 'final', 'Final', wo(sf1), wo(sf2), 'Winner SF1', 'Winner SF2');
};

// 2-group categories: SF A1vB2, B1vA2 -> Final
const wireTwoGroupKO = (cat, sfTime, sfCourts, fTime, fCourt) => {
  const sf1 = addKO(sfTime, sfCourts[0], cat, 'semi', 'semi', 'Semifinal 1', gr('A', 1), gr('B', 2), rankName('A', 1), rankName('B', 2));
  const sf2 = addKO(sfTime, sfCourts[1], cat, 'semi', 'semi', 'Semifinal 2', gr('B', 1), gr('A', 2), rankName('B', 1), rankName('A', 2));
  addKO(fTime, fCourt, cat, 'final', 'final', 'Final', wo(sf1), wo(sf2), 'Winner SF1', 'Winner SF2');
};

wireFourGroupKO('MD', '13:15', [1, 2, 3, 4], '14:00', [1, 2], '14:45', 1);
wireFourGroupKO('MS', '13:15', [5, 6, 7, 8], '14:00', [3, 4], '14:45', 2);
wireTwoGroupKO('WD', '13:15', [9, 10], '14:45', 3);
wireTwoGroupKO('MXD', '13:15', [11, 12], '14:45', 4);

// TEAM_ROSTERS - fill in player names per doubles team for "My Matches"
// e.g. 'Team A1': ['Player One', 'Player Two'],
export const TEAM_ROSTERS = {};

// CAT_LABELS
export const CAT_LABELS = {
  MD: "Men's Doubles",
  MS: "Men's Singles",
  WD: "Women's Doubles",
  MXD: "Mixed Doubles",
};

// NAME_ALIASES - map alternate spellings to canonical names if needed
export const NAME_ALIASES = {};

// ADVANCE_PER_GROUP - how many advance from each group, per category
export const ADVANCE_PER_GROUP = { MD: 2, MS: 2, WD: 2, MXD: 2 };

// PLAYOFF_STRUCTURE / FINALS_STRUCTURE - legacy 3-set semi/final system,
// unused for this tournament (the KNOCKOUT bracket above replaces it).
export const PLAYOFF_STRUCTURE = {};
export const FINALS_STRUCTURE = {};
