// =============================================================
// TOURNAMENT DATA — Kerala Ecumenical Churches of Bay Area
// Badminton Tournament 2026 · Sat 9/5 · Elite Badminton Center, Union City
//
// FORMAT (per the official flyer):
//   MD  Men's Doubles   4 groups (A-D) x 6 teams   · games to 21 (max 30)
//   MS  Men's Singles   4 groups (A-D) x 4 players · games to 21 (max 30)
//   WD  Women's Doubles 2 groups: A x 5, B x 4     · games to 15 (max 21)
//   MXD Mixed Doubles   2 groups (A-B) x 5 teams   · games to 15 (max 21)
//   Round robin in groups; top 2 advance. Prelims & QF: ONE set.
//   Semis & Finals: THREE sets. Ties: 2-way -> head-to-head; 3-way -> diff.
//
// All names are placeholders — replace with real names in GROUPS below;
// the SCHEDULE regenerates from these lists automatically.
//
// PROVISIONAL timetable, 16 courts, 30-minute slots:
//   09:00-11:00  MD groups, courts 1-12 (3 per group, 5 rounds)
//   09:00-10:00  MS groups A,B courts 13-16 · 10:30-11:30 MS groups C,D
//   11:30-13:30  WD-A courts 1-2 (5 rounds) · WD-B courts 3-4 (3 rounds)
//                MXD-A courts 5-6 · MXD-B courts 7-8 (5 rounds each)
//   14:00        QF (one set): MD courts 1-4 · MS courts 5-8
//   14:45        Semifinals (best of 3): MD 1-2 · MS 3-4 · WD 5-6 · MXD 7-8
//   15:45        Finals (best of 3): MD ct 1 · MS ct 2 · WD ct 3 · MXD ct 4
//
// After editing, re-seed the database: node scripts/seed.mjs
// =============================================================

const range = (n) => [...Array(n).keys()];

export const GROUPS = {
  MD: Object.fromEntries(['A', 'B', 'C', 'D'].map(g => [`Group ${g}`, range(6).map(i => `Team ${g}${i + 1}`)])),
  MS: Object.fromEntries(['A', 'B', 'C', 'D'].map(g => [`Group ${g}`, range(4).map(i => `Player ${g}${i + 1}`)])),
  WD: {
    'Group A': range(5).map(i => `WD Team A${i + 1}`),
    'Group B': range(4).map(i => `WD Team B${i + 1}`),
  },
  MXD: Object.fromEntries(['A', 'B'].map(g => [`Group ${g}`, range(5).map(i => `XD Team ${g}${i + 1}`)])),
};

// Points to win per category (caps 30/21 are umpire-enforced at deuce)
const FORMAT = { MD: 21, MS: 21, WD: 15, MXD: 15 };

// Round-robin rounds (1-indexed seats), one match list per time slot.
const RR6 = [
  [[1, 6], [2, 5], [3, 4]],
  [[1, 5], [6, 4], [2, 3]],
  [[1, 4], [5, 3], [6, 2]],
  [[1, 3], [4, 2], [5, 6]],
  [[1, 2], [3, 6], [4, 5]],
];
const RR5 = [ // 5 entrants, one bye per round
  [[2, 5], [3, 4]],
  [[1, 5], [2, 3]],
  [[1, 4], [5, 3]],
  [[1, 3], [4, 2]],
  [[1, 2], [4, 5]],
];
const RR4 = [
  [[1, 2], [3, 4]],
  [[1, 3], [2, 4]],
  [[1, 4], [2, 3]],
];
const rrFor = (n) => (n === 6 ? RR6 : n === 5 ? RR5 : RR4);

export const SCHEDULE = [];
let matchNum = 0;
const addMatch = (time, court, cat, p1, p2, label) => {
  matchNum += 1;
  SCHEDULE.push({
    id: `m${matchNum}`, time, court, cat, p1, p2, umpire: 'TBD',
    isPlayoff: false, matchType: 'prelim', scoringFormat: FORMAT[cat], label,
  });
};
// Generate one group's round robin: `courts` are used per round, slots[i] is round i's time.
const addGroup = (cat, g, slots, courts) => {
  const entrants = GROUPS[cat][`Group ${g}`];
  rrFor(entrants.length).forEach((round, ri) => {
    round.forEach((pair, pi) => {
      addMatch(slots[ri], courts[pi], cat, entrants[pair[0] - 1], entrants[pair[1] - 1], `${cat} Group ${g}`);
    });
  });
};

// -- MD: courts 1-12, 09:00-11:00 --
const MD_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00'];
['A', 'B', 'C', 'D'].forEach((g, gi) => addGroup('MD', g, MD_SLOTS, [gi * 3 + 1, gi * 3 + 2, gi * 3 + 3]));

// -- MS: courts 13-16; A,B 09:00-10:00; C,D 10:30-11:30 --
['A', 'B', 'C', 'D'].forEach((g, gi) => addGroup(
  'MS', g,
  gi < 2 ? ['09:00', '09:30', '10:00'] : ['10:30', '11:00', '11:30'],
  gi % 2 === 0 ? [13, 14] : [15, 16]
));

// -- WD: A (5 teams) courts 1-2 five rounds; B (4 teams) courts 3-4 three rounds --
const LATE5 = ['11:30', '12:00', '12:30', '13:00', '13:30'];
addGroup('WD', 'A', LATE5, [1, 2]);
addGroup('WD', 'B', ['11:30', '12:00', '12:30'], [3, 4]);

// -- MXD: A courts 5-6, B courts 7-8, five rounds each --
addGroup('MXD', 'A', LATE5, [5, 6]);
addGroup('MXD', 'B', LATE5, [7, 8]);

// -- KNOCKOUT --
// slots are {group, rank} or {winnerOf: id}. `sets: 3` matches get three
// SCHEDULE rows (id_s1..s3, parentMatchId) and are won by taking 2 sets.
export const KNOCKOUT = {};
const rankName = (g, r) => (r === 1 ? `Group ${g} Winner` : `Group ${g} Runner-up`);

const addKO = (time, court, cat, round, matchType, label, slot1, slot2, name1, name2, sets = 1) => {
  matchNum += 1;
  const id = `m${matchNum}`;
  if (sets === 1) {
    SCHEDULE.push({
      id, time, court, cat, p1: name1, p2: name2, umpire: 'TBD',
      isPlayoff: true, matchType, scoringFormat: FORMAT[cat], label: `${cat} ${label}`,
    });
  } else {
    for (let s = 1; s <= sets; s++) {
      SCHEDULE.push({
        id: `${id}_s${s}`, time, court, cat, p1: name1, p2: name2, umpire: 'TBD',
        isPlayoff: true, matchType, scoringFormat: FORMAT[cat],
        label: `${cat} ${label} - Set ${s}`, setNumber: s, parentMatchId: id,
      });
    }
  }
  KNOCKOUT[id] = { cat, round, label, slot1, slot2, sets };
  return id;
};
const gr = (g, r) => ({ group: `Group ${g}`, rank: r });
const wo = (id) => ({ winnerOf: id });

// 4-group categories: QF (one set) pairs A1vB2, C1vD2, B1vA2, D1vC2 so
// group-mates can only meet again in the final; SF & F best of 3.
const wireFourGroupKO = (cat, qfTime, qfCourts, sfTime, sfCourts, fTime, fCourt) => {
  const qf = [
    ['A', 'B'], ['C', 'D'], ['B', 'A'], ['D', 'C'],
  ].map(([w, ru], i) => addKO(
    qfTime, qfCourts[i], cat, 'quarter', 'quarter', `Quarterfinal ${i + 1}`,
    gr(w, 1), gr(ru, 2), rankName(w, 1), rankName(ru, 2)
  ));
  const sf1 = addKO(sfTime, sfCourts[0], cat, 'semi', 'semi', 'Semifinal 1', wo(qf[0]), wo(qf[1]), 'Winner QF1', 'Winner QF2', 3);
  const sf2 = addKO(sfTime, sfCourts[1], cat, 'semi', 'semi', 'Semifinal 2', wo(qf[2]), wo(qf[3]), 'Winner QF3', 'Winner QF4', 3);
  addKO(fTime, fCourt, cat, 'final', 'final', 'Final', wo(sf1), wo(sf2), 'Winner SF1', 'Winner SF2', 3);
};
// 2-group categories: SF (best of 3) A1vB2, B1vA2 -> Final (best of 3)
const wireTwoGroupKO = (cat, sfTime, sfCourts, fTime, fCourt) => {
  const sf1 = addKO(sfTime, sfCourts[0], cat, 'semi', 'semi', 'Semifinal 1', gr('A', 1), gr('B', 2), rankName('A', 1), rankName('B', 2), 3);
  const sf2 = addKO(sfTime, sfCourts[1], cat, 'semi', 'semi', 'Semifinal 2', gr('B', 1), gr('A', 2), rankName('B', 1), rankName('A', 2), 3);
  addKO(fTime, fCourt, cat, 'final', 'final', 'Final', wo(sf1), wo(sf2), 'Winner SF1', 'Winner SF2', 3);
};

wireFourGroupKO('MD', '14:00', [1, 2, 3, 4], '14:45', [1, 2], '15:45', 1);
wireFourGroupKO('MS', '14:00', [5, 6, 7, 8], '14:45', [3, 4], '15:45', 2);
wireTwoGroupKO('WD', '14:45', [5, 6], '15:45', 3);
wireTwoGroupKO('MXD', '14:45', [7, 8], '15:45', 4);

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
