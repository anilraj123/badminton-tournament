// =============================================================
// STANDINGS & BRACKET LOGIC
//
// The single source of truth for how group tables are computed and how
// knockout slots resolve into real names. Imported by BOTH the main app and
// the TV dashboard — they used to keep private copies of all of this, which
// had already drifted (the TV copy never learned about { loserOf }, so the
// 3rd place matches would have shown "Loser SF1" on the gym screen all day).
//
// Pure functions only: no React, no Supabase. `matches` is always the map of
// match id -> the row from the database. Exercised by scripts/test-tournament.mjs.
// =============================================================

import {
  SCHEDULE, GROUPS, NAME_ALIASES, ADVANCE_PER_GROUP, KNOCKOUT, PLAYOFF_STRUCTURE,
} from './tournament-data.mjs';

// Score overrides an organiser typed onto a knockout match's set rows.
export const getPlayoffOverride = (matches, parentId) => {
  for (let setNum = 1; setNum <= 3; setNum++) {
    const sibling = matches[`${parentId}_s${setNum}`];
    if (sibling && (sibling.override_p1 || sibling.override_p2)) {
      return {
        p1: sibling.override_p1 || null,
        p2: sibling.override_p2 || null,
      };
    }
  }
  return null;
};

// ---------- standings ----------
export const normalizeName = (s) => s.replace(/\s+/g, '').toLowerCase();
export const teamPrefix = (s) => {
  const m = s.split('-')[0].trim();
  return normalizeName(m);
};

export const namesMatch = (groupPlayer, schedulePlayer) => {
  const a = normalizeName(groupPlayer);
  const b = normalizeName(schedulePlayer);
  if (a === b) return true;
  if (teamPrefix(groupPlayer) === b) return true;
  if (a === teamPrefix(schedulePlayer)) return true;
  const aliased = NAME_ALIASES[schedulePlayer];
  if (aliased && normalizeName(aliased) === a) return true;
  return false;
};

// Returns true if every non-playoff (prelim) match in a category has been
// scored as final. Used to gate semi-final name resolution so the schedule
// stays as "Group A #1" placeholders until prelims for that category are
// fully done — otherwise mid-tournament rank shuffling makes the displayed
// semifinalist flip around as more matches come in.
export const arePrelimsComplete = (cat, matches) => {
  const prelims = SCHEDULE.filter(m => !m.isPlayoff && m.cat === cat);
  if (prelims.length === 0) return true;
  return prelims.every(m => !!matches[m.id]?.is_final);
};

// Head-to-head result between two entrants in a category's prelims.
// Returns 1 if A beat B, -1 if B beat A, 0 if not decided/found.
export const headToHead = (cat, nameA, nameB, matches) => {
  for (const m of SCHEDULE) {
    if (m.isPlayoff || m.cat !== cat) continue;
    const aIsP1 = namesMatch(nameA, m.p1), aIsP2 = namesMatch(nameA, m.p2);
    const bIsP1 = namesMatch(nameB, m.p1), bIsP2 = namesMatch(nameB, m.p2);
    if (!((aIsP1 && bIsP2) || (aIsP2 && bIsP1))) continue;
    const row = matches[m.id];
    if (!row?.is_final || row.score1 == null || row.score2 == null || row.score1 === row.score2) return 0;
    const aScore = aIsP1 ? row.score1 : row.score2;
    const bScore = aIsP1 ? row.score2 : row.score1;
    return aScore > bScore ? 1 : -1;
  }
  return 0;
};

export const calculateStandings = (matches) => {
  const st = {};
  Object.entries(GROUPS).forEach(([cat, groups]) => {
    st[cat] = {};
    Object.entries(groups).forEach(([g, players]) => {
      st[cat][g] = players.map(p => ({ name: p, played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0 }));
    });
  });
  SCHEDULE.forEach(match => {
    if (match.isPlayoff) return;
    const row = matches[match.id];
    if (!row || !row.is_final) return;
    const s1 = row.score1, s2 = row.score2;
    const groups = GROUPS[match.cat] || {};
    for (const [gName, players] of Object.entries(groups)) {
      const i1 = players.findIndex(p => namesMatch(p, match.p1));
      const i2 = players.findIndex(p => namesMatch(p, match.p2));
      if (i1 >= 0 && i2 >= 0) {
        const e1 = st[match.cat][gName][i1], e2 = st[match.cat][gName][i2];
        e1.played++; e2.played++;
        e1.pointsFor += s1; e1.pointsAgainst += s2;
        e2.pointsFor += s2; e2.pointsAgainst += s1;
        if (s1 > s2) { e1.won++; e2.lost++; } else if (s2 > s1) { e2.won++; e1.lost++; }
        break;
      }
    }
  });
  // Rank by wins; break ties per the flyer: a 2-way tie goes to the
  // head-to-head winner, a 3-way (or larger) tie is ordered by point
  // differential (head-to-head as a last resort when diffs are equal too).
  const byDiff = (a, b) => (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  Object.entries(st).forEach(([cat, groups]) => Object.entries(groups).forEach(([gName, g]) => {
    g.sort((a, b) => b.won - a.won);
    const ordered = [];
    let i = 0;
    while (i < g.length) {
      let j = i;
      while (j < g.length && g[j].won === g[i].won) j++;
      const tier = g.slice(i, j);
      if (tier.length === 2) {
        const h = headToHead(cat, tier[0].name, tier[1].name, matches);
        if (h < 0) tier.reverse();
        else if (h === 0) tier.sort(byDiff);
      } else if (tier.length > 2) {
        tier.sort((a, b) => byDiff(a, b) || -headToHead(cat, a.name, b.name, matches));
      }
      ordered.push(...tier);
      i = j;
    }
    groups[gName] = ordered;
  }));
  return st;
};

// Resolve actual team name for a semifinal slot based on current standings
export const resolveSemiSlot = (standings, slotInfo, cat) => {
  if (!slotInfo || !standings[cat]) return null;
  const groupStandings = standings[cat][slotInfo.group];
  if (!groupStandings || groupStandings.length < slotInfo.rank) return null;
  const entry = groupStandings[slotInfo.rank - 1];
  return entry && entry.played > 0 ? entry.name : null;
};
// Returns all names tied at a given slot's rank, based on (won, diff) equality
// with the entry currently at slotInfo.rank. Returns null if the slot has no
// played matches yet, or { names: [...], tied: bool } otherwise.
export const resolveSemiSlotAll = (standings, slotInfo, cat, matches) => {
  if (!slotInfo || !standings[cat]) return null;
  const groupStandings = standings[cat][slotInfo.group];
  if (!groupStandings || groupStandings.length < slotInfo.rank) return null;
  const target = groupStandings[slotInfo.rank - 1];
  if (!target || target.played === 0) return null;
  const targetWon = target.won;
  const targetDiff = target.pointsFor - target.pointsAgainst;
  // Collect all entries sharing the same (won, diff) within the group
  const tied = groupStandings.filter(e => {
    if (e.played === 0) return false;
    return e.won === targetWon && (e.pointsFor - e.pointsAgainst) === targetDiff;
  });
  // 2-way tie decided by head-to-head: the sort already ordered them, so the
  // slot resolves cleanly to whoever sits at the rank.
  if (tied.length === 2 && matches && headToHead(cat, tied[0].name, tied[1].name, matches) !== 0) {
    return { names: [target.name], tied: false };
  }
  return {
    names: tied.map(e => e.name),
    tied: tied.length > 1,
  };
};




// How many teams advance from a given group (derived from PLAYOFF_STRUCTURE).
// MS/MD use 4-group brackets → 1 per group; WS/WD/MXD use 2-group brackets → 2 per group.
export const advanceCountForGroup = (cat, groupName) => {
  let count = 0;
  for (const v of Object.values(PLAYOFF_STRUCTURE)) {
    if (v.cat !== cat) continue;
    if (v.slot1?.group === groupName) count = Math.max(count, v.slot1.rank);
    if (v.slot2?.group === groupName) count = Math.max(count, v.slot2.rank);
  }
  return count || ADVANCE_PER_GROUP[cat] || 1;
};

// Calculate the winner of a semi-final based on 3-set scores
// Returns the winning team name, or null if not yet determined
// Checks override first, then falls back to auto-resolution from group standings
export const getSemiWinner = (matches, semiId, standings) => {
  const structure = PLAYOFF_STRUCTURE[semiId];
  if (!structure) return null;

  // STEP 1: Check for manual override on any of the 3 sets
  const override = getPlayoffOverride(matches, semiId);
  let team1 = override ? override.p1 : null;
  let team2 = override ? override.p2 : null;

  // STEP 2: Fall back to auto-resolution from group standings — but only after
  // all prelims for this category are scored. Otherwise the standings are still
  // shifting and we'd report a fictitious semi winner that cascades into the
  // Final's auto-resolution.
  if ((!team1 || !team2) && !arePrelimsComplete(structure.cat, matches)) return null;
  if (!team1) team1 = resolveSemiSlot(standings, structure.slot1, structure.cat);
  if (!team2) team2 = resolveSemiSlot(standings, structure.slot2, structure.cat);
  if (!team1 || !team2) return null;

  // Count sets won by each team
  let team1Sets = 0, team2Sets = 0;
  for (let setNum = 1; setNum <= 3; setNum++) {
    const row = matches[`${semiId}_s${setNum}`];
    if (row && row.is_final && row.score1 != null && row.score2 != null) {
      if (row.score1 > row.score2) team1Sets++;
      else if (row.score2 > row.score1) team2Sets++;
    }
  }

  if (team1Sets >= 2) return team1;
  if (team2Sets >= 2) return team2;
  return null;
};

// ---------- knockout bracket (single-game matches, winner-of feeds) ----------
// A slot is { group, rank } (resolved from standings once prelims finish)
// or { winnerOf: matchId } / { loserOf: matchId } (from that match's final score).
// Returns { names: [...], tied } or null while unresolved.
export const resolveKnockoutSlot = (slot, cat, standings, matches) => {
  if (!slot) return null;
  if (slot.group) {
    if (!arePrelimsComplete(cat, matches)) return null;
    return resolveSemiSlotAll(standings, slot, cat, matches);
  }
  if (slot.winnerOf) {
    const w = getKnockoutWinner(matches, slot.winnerOf, standings);
    return w ? { names: [w], tied: false } : null;
  }
  if (slot.loserOf) {
    const l = getKnockoutLoser(matches, slot.loserOf, standings);
    return l ? { names: [l], tied: false } : null;
  }
  return null;
};

// Count decided sets for a best-of-3 knockout match. Returns [side1, side2].
export const knockoutSetWins = (matches, id) => {
  let t1 = 0, t2 = 0;
  for (let s = 1; s <= 3; s++) {
    const row = matches[`${id}_s${s}`];
    if (row?.is_final && row.score1 != null && row.score2 != null) {
      if (row.score1 > row.score2) t1++;
      else if (row.score2 > row.score1) t2++;
    }
  }
  return [t1, t2];
};

export const getKnockoutWinner = (matches, id, standings) => {
  const k = KNOCKOUT[id];
  if (!k) return null;
  const s1 = resolveKnockoutSlot(k.slot1, k.cat, standings, matches);
  const s2 = resolveKnockoutSlot(k.slot2, k.cat, standings, matches);
  if (!s1 || s1.tied || !s2 || s2.tied) return null;
  if (k.sets === 3) {
    const [t1, t2] = knockoutSetWins(matches, id);
    if (t1 >= 2) return s1.names[0];
    if (t2 >= 2) return s2.names[0];
    return null;
  }
  const row = matches[id];
  if (!row || !row.is_final || row.score1 == null || row.score2 == null || row.score1 === row.score2) return null;
  return row.score1 > row.score2 ? s1.names[0] : s2.names[0];
};

// The beaten side of a decided knockout match — feeds the 3rd place playoffs.
export const getKnockoutLoser = (matches, id, standings) => {
  const k = KNOCKOUT[id];
  if (!k) return null;
  const winner = getKnockoutWinner(matches, id, standings);
  if (!winner) return null;
  const s1 = resolveKnockoutSlot(k.slot1, k.cat, standings, matches);
  const s2 = resolveKnockoutSlot(k.slot2, k.cat, standings, matches);
  if (!s1 || !s2) return null;
  return s1.names[0] === winner ? s2.names[0] : s1.names[0];
};
