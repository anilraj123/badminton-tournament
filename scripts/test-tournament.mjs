// =============================================================
// TOURNAMENT SELF-TEST — node scripts/test-tournament.mjs
//
// Simulates the whole day against the REAL logic in lib/standings.mjs (the
// same module the site and the TV dashboard import), then asserts the things
// that would ruin tournament day if they were wrong:
//   * the schedule itself is playable (no court or player double-bookings)
//   * group toppers and runners-up reach the right knockout slots
//   * semis, finals and 3rd place are best of THREE, decided at 2 sets
//   * 3rd place is contested by the two beaten semifinalists
//   * a champion comes out of each of the four categories
//
// No network, no database — it builds a fake `matches` map in memory.
// =============================================================

import { SCHEDULE, GROUPS, KNOCKOUT, CAT_LABELS } from '../lib/tournament-data.mjs';
import { calculateStandings, resolveKnockoutSlot, getKnockoutWinner,
         getKnockoutLoser, arePrelimsComplete, knockoutSetWins } from '../lib/standings.mjs';

let passed = 0, failed = 0;
const fails = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; }
  else { failed++; fails.push(`${name}${detail ? ' — ' + detail : ''}`); }
}
function section(t) { console.log(`\n\x1b[1m${t}\x1b[0m`); }

const winTo = (cat) => (cat === 'MD' || cat === 'MS') ? 21 : 15;
const score = (matches, id, a, b) => { matches[id] = { id, score1: a, score2: b, is_final: true }; };

// ---------------------------------------------------------------
section('1. Schedule integrity');

const prelims = SCHEDULE.filter(m => !m.isPlayoff);
const koIds = Object.keys(KNOCKOUT);
check('144 distinct matches', prelims.length + koIds.length === 144,
      `got ${prelims.length} group + ${koIds.length} knockout`);
check('courts are 9-16 only',
      [...new Set(SCHEDULE.map(m => m.court))].sort((a,b)=>a-b).join(',') === '9,10,11,12,13,14,15,16');

// one match per court per slot (count a best-of-3 as one occupancy)
const occ = {};
for (const m of SCHEDULE) {
  const k = `${m.time}|${m.court}`;
  (occ[k] ||= new Set()).add(m.parentMatchId || m.id);
}
const courtClashes = Object.entries(occ).filter(([,s]) => s.size > 1);
check('no court double-bookings', courtClashes.length === 0,
      courtClashes.map(([k,s]) => `${k}: ${[...s].join(' & ')}`).join('; '));

// nobody is on two courts at once
const people = (m) => [m.p1, m.p2]
  .filter(s => s && !/^(Winner|Runner-up|Loser)/.test(s))
  .flatMap(s => s.split(' & ').map(x => x.trim()));
const slots = {};
for (const m of SCHEDULE) for (const p of people(m)) {
  ((slots[m.time] ||= {})[p] ||= new Set()).add(m.parentMatchId || m.id);
}
const playerClashes = [];
for (const [t, ps] of Object.entries(slots))
  for (const [p, ids] of Object.entries(ps)) if (ids.size > 1) playerClashes.push(`${t} ${p}: ${[...ids].join(',')}`);
check('no player double-bookings', playerClashes.length === 0, playerClashes.join('; '));

// ---------------------------------------------------------------
section('2. Set counts (prelims/QF one set · SF, Final, 3rd best of 3)');

for (const [id, k] of Object.entries(KNOCKOUT)) {
  const rows = SCHEDULE.filter(m => (m.parentMatchId || m.id) === id);
  const expect = (k.round === 'quarter') ? 1 : 3;
  check(`${k.cat} ${k.label} is ${expect === 3 ? 'best of 3' : 'one set'}`,
        rows.length === expect && k.sets === expect,
        `${rows.length} schedule rows, sets=${k.sets}`);
}
check('every prelim is a single set',
      prelims.every(m => !m.setNumber && !m.parentMatchId));
const threeSetRounds = [...new Set(Object.values(KNOCKOUT).filter(k => k.sets === 3).map(k => k.round))].sort();
check('exactly semi/final/third are best-of-3',
      threeSetRounds.join(',') === 'final,semi,third', threeSetRounds.join(','));

// ---------------------------------------------------------------
section('3. Group stage — toppers and runners-up');

// Deterministic: within a group the earlier-listed entrant always wins, so
// the expected topper is entrants[0] and runner-up entrants[1].
const matches = {};
check('knockout slots stay unresolved before the group stage finishes',
      resolveKnockoutSlot(KNOCKOUT[koIds[0]].slot1, KNOCKOUT[koIds[0]].cat, calculateStandings(matches), matches) === null);

for (const m of prelims) {
  const g = GROUPS[m.cat][m.stage];
  const i1 = g.indexOf(m.p1), i2 = g.indexOf(m.p2);
  const target = winTo(m.cat);
  if (i1 < i2) score(matches, m.id, target, 5); else score(matches, m.id, 5, target);
}
for (const cat of Object.keys(GROUPS))
  check(`${cat} group stage reads as complete`, arePrelimsComplete(cat, matches));

const standings = calculateStandings(matches);
for (const [cat, groups] of Object.entries(GROUPS)) {
  for (const [g, entrants] of Object.entries(groups)) {
    const table = standings[cat][g];
    check(`${cat} ${g} topper is ${entrants[0]}`, table[0].name === entrants[0], `got ${table[0].name}`);
    check(`${cat} ${g} runner-up is ${entrants[1]}`, table[1].name === entrants[1], `got ${table[1].name}`);
    check(`${cat} ${g} played counts correct`,
          table.every(e => e.played === entrants.length - 1));
    check(`${cat} ${g} topper won every match`, table[0].won === entrants.length - 1);
  }
}

// ---------------------------------------------------------------
section('4. Group toppers reach the knockout');

for (const [id, k] of Object.entries(KNOCKOUT)) {
  for (const slot of [k.slot1, k.slot2]) {
    if (!slot?.group) continue;
    const r = resolveKnockoutSlot(slot, k.cat, standings, matches);
    const expected = GROUPS[k.cat][slot.group][slot.rank - 1];
    check(`${k.cat} ${k.label}: ${slot.group} #${slot.rank} -> ${expected}`,
          r && !r.tied && r.names[0] === expected, r ? r.names.join('/') : 'unresolved');
  }
}

// ---------------------------------------------------------------
section('5. Knockout — best of 3 is decided at two sets');

const order = ['quarter', 'semi', 'final', 'third'];
const played = [];
for (const round of order) {
  for (const [id, k] of Object.entries(KNOCKOUT)) {
    if (k.round !== round) continue;
    const s1 = resolveKnockoutSlot(k.slot1, k.cat, standings, matches);
    const s2 = resolveKnockoutSlot(k.slot2, k.cat, standings, matches);
    check(`${k.cat} ${k.label} has both sides before it is played`,
          s1 && s2 && !s1.tied && !s2.tied,
          `${s1 ? s1.names : 'null'} vs ${s2 ? s2.names : 'null'}`);
    const target = winTo(k.cat);
    if (k.sets === 1) {
      score(matches, id, target, 9);
    } else {
      // side 1 takes sets 1 and 3, side 2 takes set 2 -> side 1 wins 2-1
      score(matches, `${id}_s1`, target, 9);
      check(`${k.cat} ${k.label} undecided after one set`,
            getKnockoutWinner(matches, id, standings) === null);
      score(matches, `${id}_s2`, 9, target);
      check(`${k.cat} ${k.label} undecided at one set all`,
            getKnockoutWinner(matches, id, standings) === null);
      score(matches, `${id}_s3`, target, 9);
      const [a, b] = knockoutSetWins(matches, id);
      check(`${k.cat} ${k.label} finishes 2-1 on sets`, a === 2 && b === 1, `${a}-${b}`);
    }
    const w = getKnockoutWinner(matches, id, standings);
    check(`${k.cat} ${k.label} winner is the leading side`, w === s1.names[0], `got ${w}`);
    played.push({ id, k, w, loser: s2.names[0] });
  }
}

// ---------------------------------------------------------------
section('6. 3rd place is contested by the two beaten semifinalists');

for (const cat of Object.keys(GROUPS)) {
  const third = Object.entries(KNOCKOUT).find(([, k]) => k.cat === cat && k.round === 'third');
  const semis = Object.entries(KNOCKOUT).filter(([, k]) => k.cat === cat && k.round === 'semi');
  check(`${cat} has a 3rd place match`, !!third);
  if (!third) continue;
  const [, k] = third;
  const expected = semis.map(([sid]) => getKnockoutLoser(matches, sid, standings));
  const actual = [k.slot1, k.slot2].map(s => resolveKnockoutSlot(s, cat, standings, matches)?.names[0]);
  check(`${cat} 3rd place = the two semi losers`,
        JSON.stringify(actual) === JSON.stringify(expected),
        `${actual.join(' v ')} vs expected ${expected.join(' v ')}`);
  for (const [sid] of semis) {
    const w = getKnockoutWinner(matches, sid, standings), l = getKnockoutLoser(matches, sid, standings);
    check(`${cat} semi loser is not also the winner`, w && l && w !== l, `${w} / ${l}`);
  }
}

// ---------------------------------------------------------------
section('7. Champions');

for (const cat of Object.keys(GROUPS)) {
  const fin = Object.entries(KNOCKOUT).find(([, k]) => k.cat === cat && k.round === 'final');
  const champ = getKnockoutWinner(matches, fin[0], standings);
  const third = Object.entries(KNOCKOUT).find(([, k]) => k.cat === cat && k.round === 'third');
  const bronze = getKnockoutWinner(matches, third[0], standings);
  check(`${CAT_LABELS[cat]} has a champion`, !!champ);
  check(`${CAT_LABELS[cat]} has a 3rd place`, !!bronze);
  check(`${CAT_LABELS[cat]} champion != 3rd place`, champ !== bronze);
  console.log(`   ${CAT_LABELS[cat].padEnd(16)} champion: ${champ}`);
  console.log(`   ${''.padEnd(16)} 3rd:      ${bronze}`);
}

// ---------------------------------------------------------------
section('8. Two-way tie breaks on head-to-head');
{
  const m2 = {};
  const cat = 'MS', g = 'Group A', ents = GROUPS[cat][g];
  // Hand-built so #0 and #1 finish level on wins AND on point difference,
  // leaving head-to-head as the only thing that can separate them:
  //   1 beats 0 · 0 beats 2 · 0 beats 3 · 2 beats 1 · 1 beats 3 · 3 beats 2
  // -> 0 and 1 both win 2, both +6; 2 and 3 both win 1. #1 beat #0, so #1 tops.
  const winnerOf = { '0-1': 1, '0-2': 0, '0-3': 0, '1-2': 2, '1-3': 1, '2-3': 3 };
  for (const m of SCHEDULE.filter(x => !x.isPlayoff && x.cat === cat && x.stage === g)) {
    const i1 = ents.indexOf(m.p1), i2 = ents.indexOf(m.p2);
    const w = winnerOf[[i1, i2].sort((a, b) => a - b).join('-')];
    if (w === i1) score(m2, m.id, 21, 15); else score(m2, m.id, 15, 21);
  }
  const t = calculateStandings(m2)[cat][g];
  check('level on wins, head-to-head winner ranked first',
        t[0].name === ents[1] && t[1].name === ents[0],
        `${t[0].name} then ${t[1].name}`);
  check('both are genuinely level on wins', t[0].won === t[1].won, `${t[0].won} vs ${t[1].won}`);
  check('and level on point difference, so only head-to-head separates them',
        (t[0].pointsFor - t[0].pointsAgainst) === (t[1].pointsFor - t[1].pointsAgainst),
        `${t[0].pointsFor - t[0].pointsAgainst} vs ${t[1].pointsFor - t[1].pointsAgainst}`);
}

// ---------------------------------------------------------------
console.log(`\n${'='.repeat(60)}`);
if (failed === 0) console.log(`\x1b[32m✓ all ${passed} checks passed\x1b[0m`);
else {
  console.log(`\x1b[31m✗ ${failed} of ${passed + failed} checks FAILED\x1b[0m`);
  fails.forEach(f => console.log(`   ✗ ${f}`));
}
process.exit(failed === 0 ? 0 : 1);
