'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  SCHEDULE, GROUPS, CAT_LABELS, NAME_ALIASES,
  PLAYOFF_STRUCTURE, FINALS_STRUCTURE,
} from '../lib/tournament-data';

// Light palette - bright gym, 10+ ft viewing
const CAT_COLORS = {
  MS:  { accent: '#1e40af', soft: '#dbeafe', text: '#1e3a8a' },
  MD:  { accent: '#6d28d9', soft: '#ede9fe', text: '#5b21b6' },
  MXD: { accent: '#c2410c', soft: '#ffedd5', text: '#9a3412' },
  WS:  { accent: '#be185d', soft: '#fce7f3', text: '#9d174d' },
  WD:  { accent: '#047857', soft: '#d1fae5', text: '#065f46' },
};

const timeToMinutes = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const fmtTimeShort = (t) => {
  const [h,m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')}`;
};

const getPlayoffOverride = (matches, parentId) => {
  for (let setNum = 1; setNum <= 3; setNum++) {
    const sibling = matches[`${parentId}_s${setNum}`];
    if (sibling && (sibling.override_p1 || sibling.override_p2)) {
      return { p1: sibling.override_p1 || null, p2: sibling.override_p2 || null };
    }
  }
  return null;
};

const normalizeName = (s) => s.replace(/\s+/g, '').toLowerCase();
const teamPrefix = (s) => normalizeName(s.split('-')[0].trim());
const namesMatch = (groupPlayer, schedulePlayer) => {
  const a = normalizeName(groupPlayer);
  const b = normalizeName(schedulePlayer);
  if (a === b) return true;
  if (teamPrefix(groupPlayer) === b) return true;
  if (a === teamPrefix(schedulePlayer)) return true;
  const aliased = NAME_ALIASES[schedulePlayer];
  if (aliased && normalizeName(aliased) === a) return true;
  return false;
};

const calculateStandings = (matches) => {
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
  Object.values(st).forEach(cat => Object.values(cat).forEach(g => g.sort((a,b) => {
    if (b.won !== a.won) return b.won - a.won;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  })));
  return st;
};

const resolveSemiSlot = (standings, slotInfo, cat) => {
  if (!slotInfo || !standings[cat]) return null;
  const g = standings[cat][slotInfo.group];
  if (!g || g.length < slotInfo.rank) return null;
  const entry = g[slotInfo.rank - 1];
  return entry && entry.played > 0 ? entry.name : null;
};
const resolveSemiSlotAll = (standings, slotInfo, cat) => {
  if (!slotInfo || !standings[cat]) return null;
  const groupStandings = standings[cat][slotInfo.group];
  if (!groupStandings || groupStandings.length < slotInfo.rank) return null;
  const target = groupStandings[slotInfo.rank - 1];
  if (!target || target.played === 0) return null;
  const targetWon = target.won;
  const targetDiff = target.pointsFor - target.pointsAgainst;
  const tied = groupStandings.filter(e => {
    if (e.played === 0) return false;
    return e.won === targetWon && (e.pointsFor - e.pointsAgainst) === targetDiff;
  });
  return { names: tied.map(e => e.name), tied: tied.length > 1 };
};



const getSemiWinner = (matches, semiId, standings) => {
  const structure = PLAYOFF_STRUCTURE[semiId];
  if (!structure) return null;
  const override = getPlayoffOverride(matches, semiId);
  let team1 = override ? override.p1 : null;
  let team2 = override ? override.p2 : null;
  if (!team1) team1 = resolveSemiSlot(standings, structure.slot1, structure.cat);
  if (!team2) team2 = resolveSemiSlot(standings, structure.slot2, structure.cat);
  if (!team1 || !team2) return null;
  let t1 = 0, t2 = 0;
  for (let s = 1; s <= 3; s++) {
    const row = matches[`${semiId}_s${s}`];
    if (row && row.is_final && row.score1 != null && row.score2 != null) {
      if (row.score1 > row.score2) t1++;
      else if (row.score2 > row.score1) t2++;
    }
  }
  if (t1 >= 2) return team1;
  if (t2 >= 2) return team2;
  return null;
};

const resolvePlayoffNames = (match, standings, matches) => {
  if (!match.isPlayoff) return { p1: match.p1, p2: match.p2, p1Tied: false, p2Tied: false };
  const parentId = match.parentMatchId || match.id;
  const override = getPlayoffOverride(matches, parentId);
  if (override) return { p1: override.p1 || match.p1, p2: override.p2 || match.p2, p1Tied: false, p2Tied: false };
  if (match.matchType === 'semi' && PLAYOFF_STRUCTURE[parentId]) {
    const s = PLAYOFF_STRUCTURE[parentId];
    const a1 = resolveSemiSlotAll(standings, s.slot1, s.cat);
    const a2 = resolveSemiSlotAll(standings, s.slot2, s.cat);
    return {
      p1: a1 ? a1.names.join(' / ') : match.p1,
      p2: a2 ? a2.names.join(' / ') : match.p2,
      p1Tied: !!(a1 && a1.tied),
      p2Tied: !!(a2 && a2.tied),
    };
  }
  if (match.matchType === 'final' && FINALS_STRUCTURE[parentId]) {
    const s = FINALS_STRUCTURE[parentId];
    return {
      p1: getSemiWinner(matches, s.semi1, standings) || match.p1,
      p2: getSemiWinner(matches, s.semi2, standings) || match.p2,
      p1Tied: false, p2Tied: false,
    };
  }
  return { p1: match.p1, p2: match.p2, p1Tied: false, p2Tied: false };
};


// How many teams advance from a given group (derived from PLAYOFF_STRUCTURE).
// 4-group categories (MS, MD) → 1 per group; 2-group categories → 2 per group.
const advanceCountForGroup = (cat, groupName) => {
  let count = 0;
  for (const v of Object.values(PLAYOFF_STRUCTURE)) {
    if (v.cat !== cat) continue;
    if (v.slot1?.group === groupName) count = Math.max(count, v.slot1.rank);
    if (v.slot2?.group === groupName) count = Math.max(count, v.slot2.rank);
  }
  return count || 1;
};

const isActive = (row, now) => {
  if (!row || !row.last_activity || !now) return false;
  const last = new Date(row.last_activity).getTime();
  return (now.getTime() - last) < 5 * 60 * 1000;
};

const parentIdOf = (match) => match.parentMatchId || match.id;

function useMatches() {
  const [matches, setMatches] = useState({});
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('matches_public').select('*');
      if (!mounted || !data) return;
      const m = {};
      for (const r of data) m[r.id] = r;
      setMatches(m);
    })();
    const ch = supabase.channel('tv-matches')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const { pin, ...safe } = payload.new;
          setMatches(prev => ({ ...prev, [safe.id]: { ...prev[safe.id], ...safe } }));
        })
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);
  return { matches, connected };
}

function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(i);
  }, []);
  return now;
}

// Compact court card
const CourtCard = ({ courtNum, match, row, p1Name, p2Name, live, p1Tied, p2Tied }) => {
  if (!match) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-2 flex flex-col justify-center items-center h-[100px]">
        <div className="text-[10px] font-bold tracking-widest text-gray-400">COURT {courtNum}</div>
        <div className="text-lg font-bold text-gray-300 mt-1">IDLE</div>
      </div>
    );
  }
  const c = CAT_COLORS[match.cat] || CAT_COLORS.MS;
  const hasScore = row && row.score1 != null && row.score2 != null;
  const complete = !!row?.is_final;
  const winner = hasScore ? (row.score1 > row.score2 ? 1 : row.score2 > row.score1 ? 2 : 0) : 0;
  const borderColor = live ? c.accent : complete ? '#d1d5db' : c.soft;
  const borderWidth = live ? '3px' : '2px';
  return (
    <div className="rounded-lg p-2 h-[100px] flex flex-col bg-white"
         style={{ border: `${borderWidth} solid ${borderColor}` }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold tracking-widest text-gray-500">CT {courtNum}</span>
          <span className="px-1 py-0.5 text-[9px] font-bold tracking-widest rounded"
                style={{ backgroundColor: c.soft, color: c.text }}>{match.cat}</span>
          {match.matchType === 'semi' && (
            <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800">
              SEMI{match.setNumber ? ` S${match.setNumber}` : ''}
            </span>
          )}
          {match.matchType === 'final' && (
            <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-800">
              FINAL{match.setNumber ? ` S${match.setNumber}` : ''}
            </span>
          )}
        </div>
        {live ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest"
               style={{ backgroundColor: c.accent, color: '#fff' }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
            </span>
            LIVE
          </div>
        ) : complete ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest bg-gray-100 text-gray-500">DONE</span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 tracking-widest">{fmtTimeShort(match.time)}</span>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between">
          <div className={`text-sm font-bold truncate pr-2 flex items-center gap-1 ${winner === 1 ? 'text-gray-900' : winner === 2 ? 'text-gray-400' : 'text-gray-800'}`}>
            {winner === 1 && <span style={{ color: c.accent }}>▸</span>}
            <span className="truncate">{p1Name}</span>
            {p1Tied && (
              <span className="shrink-0 text-[8px] font-bold tracking-widest px-1 rounded bg-orange-100 text-orange-800 border border-orange-300">TIE</span>
            )}
          </div>
          <div className={`text-2xl font-bold tabular-nums leading-none ${winner === 1 ? 'text-gray-900' : winner === 2 ? 'text-gray-300' : 'text-gray-600'}`}>
            {hasScore ? row.score1 : '–'}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className={`text-sm font-bold truncate pr-2 flex items-center gap-1 ${winner === 2 ? 'text-gray-900' : winner === 1 ? 'text-gray-400' : 'text-gray-800'}`}>
            {winner === 2 && <span style={{ color: c.accent }}>▸</span>}
            <span className="truncate">{p2Name}</span>
            {p2Tied && (
              <span className="shrink-0 text-[8px] font-bold tracking-widest px-1 rounded bg-orange-100 text-orange-800 border border-orange-300">TIE</span>
            )}
          </div>
          <div className={`text-2xl font-bold tabular-nums leading-none ${winner === 2 ? 'text-gray-900' : winner === 1 ? 'text-gray-300' : 'text-gray-600'}`}>
            {hasScore ? row.score2 : '–'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category column - ALL teams in groups + playoff section
const CategoryColumn = ({ cat, standings, matches }) => {
  const c = CAT_COLORS[cat];
  const groups = standings[cat] || {};
  const semiEntries = Object.entries(PLAYOFF_STRUCTURE).filter(([_, v]) => v.cat === cat);
  const finalEntry = Object.entries(FINALS_STRUCTURE).find(([_, v]) => v.cat === cat);

  let champion = null;
  let finalScoresStr = null;
  if (finalEntry) {
    const [finalId, finalInfo] = finalEntry;
    let t1 = 0, t2 = 0;
    const override = getPlayoffOverride(matches, finalId);
    const p1 = override?.p1 || getSemiWinner(matches, finalInfo.semi1, standings);
    const p2 = override?.p2 || getSemiWinner(matches, finalInfo.semi2, standings);
    const sets = [];
    for (let s = 1; s <= 3; s++) {
      const row = matches[`${finalId}_s${s}`];
      if (row && row.is_final && row.score1 != null && row.score2 != null) {
        if (row.score1 > row.score2) t1++;
        else if (row.score2 > row.score1) t2++;
        sets.push(`${row.score1}-${row.score2}`);
      }
    }
    if (t1 >= 2) champion = p1;
    else if (t2 >= 2) champion = p2;
    if (sets.length > 0) finalScoresStr = sets.join(' ');
  }

  return (
    <div className="rounded-lg overflow-hidden flex flex-col bg-white min-h-0" style={{ border: `1.5px solid ${c.soft}` }}>
      <div className="px-2 py-1 flex items-center justify-between" style={{ backgroundColor: c.soft }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-widest rounded text-white shrink-0" style={{ backgroundColor: c.accent }}>{cat}</span>
          <span className="text-xs font-bold truncate" style={{ color: c.text }}>{CAT_LABELS[cat]}</span>
        </div>
        {champion && (
          <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-yellow-300 text-yellow-900 truncate ml-1 shrink-0">
            🏆 {champion}
          </span>
        )}
      </div>

      <div className="flex-1 divide-y divide-gray-100 overflow-hidden">
        {Object.entries(groups).map(([groupName, rows]) => (
          <div key={groupName} className="px-2 py-0.5">
            <div className="text-[9px] font-bold tracking-widest text-gray-400">{groupName.replace('Group ', 'GRP ')}</div>
            {rows.map((r, i) => {
              const diff = r.pointsFor - r.pointsAgainst;
              const advancing = i < advanceCountForGroup(cat, groupName) && r.played > 0;
              return (
                <div key={r.name} className="flex items-center justify-between py-0 text-[11px] leading-tight">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className={`font-mono w-3 text-[10px] ${advancing ? 'font-bold' : 'text-gray-300'}`}
                          style={{ color: advancing ? c.accent : undefined }}>
                      {i + 1}
                    </span>
                    <span className={`truncate ${advancing ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                      {r.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono tabular-nums text-[10px] shrink-0">
                    <span className={advancing ? 'text-gray-700' : 'text-gray-300'}>{r.won}-{r.lost}</span>
                    <span className={`w-7 text-right ${diff > 0 ? 'text-green-600 font-bold' : diff < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Playoffs strip - show full names with separate lines */}
      {semiEntries.length > 0 && (
        <div className="px-2 py-1 border-t border-gray-200 bg-gray-50">
          <div className="text-[9px] font-bold tracking-widest text-gray-400">PLAYOFFS</div>
          {semiEntries.map(([semiId, semiInfo]) => {
            const winner = getSemiWinner(matches, semiId, standings);
            const override = getPlayoffOverride(matches, semiId);
            let p1, p2, p1IsTied = false, p2IsTied = false;
            if (override?.p1) {
              p1 = override.p1;
            } else {
              const a1 = resolveSemiSlotAll(standings, semiInfo.slot1, cat);
              p1 = a1 ? a1.names.join(' / ') : null;
              p1IsTied = !!(a1 && a1.tied);
            }
            if (override?.p2) {
              p2 = override.p2;
            } else {
              const a2 = resolveSemiSlotAll(standings, semiInfo.slot2, cat);
              p2 = a2 ? a2.names.join(' / ') : null;
              p2IsTied = !!(a2 && a2.tied);
            }
            // Check if any sets played
            let setsPlayed = 0;
            for (let s = 1; s <= 3; s++) {
              const row = matches[`${semiId}_s${s}`];
              if (row && row.is_final) setsPlayed++;
            }
            return (
              <div key={semiId} className="text-[10px] py-0 leading-tight">
                <span className="text-gray-400 font-mono">S{semiInfo.label.match(/\d+/)?.[0] || ''}: </span>
                <span className={winner === p1 ? 'font-bold text-gray-900' : winner === p2 ? 'text-gray-400' : 'text-gray-700'}>
                  {p1 || '—'}
                </span>
                {p1IsTied && <span className="ml-0.5 text-[8px] font-bold px-1 rounded bg-orange-100 text-orange-800 border border-orange-300">TIE</span>}
                <span className="text-gray-300 mx-1">v</span>
                <span className={winner === p2 ? 'font-bold text-gray-900' : winner === p1 ? 'text-gray-400' : 'text-gray-700'}>
                  {p2 || '—'}
                </span>
                {p2IsTied && <span className="ml-0.5 text-[8px] font-bold px-1 rounded bg-orange-100 text-orange-800 border border-orange-300">TIE</span>}
                {winner && <span className="ml-1 text-green-600 font-bold">✓</span>}
              </div>
            );
          })}
          {finalEntry && (
            <div className="text-[10px] py-0 leading-tight border-t border-gray-200 mt-0.5 pt-0.5">
              <span className="text-amber-600 font-bold font-mono">F: </span>
              {finalScoresStr ? (
                <span className="text-gray-700">{finalScoresStr}</span>
              ) : (
                <span className="text-gray-400">pending</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact match row for recent/upcoming
const CompactRow = ({ match, row, p1Name, p2Name }) => {
  const c = CAT_COLORS[match.cat] || CAT_COLORS.MS;
  const hasScore = row && row.score1 != null && row.score2 != null;
  const winner = hasScore ? (row.score1 > row.score2 ? 1 : row.score2 > row.score1 ? 2 : 0) : 0;
  return (
    <div className="flex items-center gap-1.5 text-[11px] py-0.5 px-1.5 rounded bg-white border border-gray-100 min-w-0 leading-tight">
      <span className="font-mono text-[9px] text-gray-400 w-9 shrink-0">{fmtTimeShort(match.time)}</span>
      <span className="px-1 rounded text-[9px] font-bold tracking-wider shrink-0"
            style={{ backgroundColor: c.soft, color: c.text }}>{match.cat}</span>
      <span className={`truncate flex-1 min-w-0 ${winner === 1 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{p1Name}</span>
      {hasScore && (
        <span className="font-mono tabular-nums font-bold text-gray-900 shrink-0 text-[10px]">
          {row.score1}-{row.score2}
        </span>
      )}
      <span className={`truncate flex-1 min-w-0 text-right ${winner === 2 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{p2Name}</span>
    </div>
  );
};

// Main Dashboard
export default function TvDashboard() {
  const { matches, connected } = useMatches();
  const now = useClock();
  const standings = useMemo(() => calculateStandings(matches), [matches]);

  const allMatches = useMemo(() => {
    return SCHEDULE.map(m => {
      const row = matches[m.id] || null;
      const names = resolvePlayoffNames(m, standings, matches);
      return { ...m, row, p1Name: names.p1, p2Name: names.p2, p1Tied: names.p1Tied, p2Tied: names.p2Tied, active: isActive(row, now) };
    });
  }, [matches, standings, now]);

  const liveByCourt = useMemo(() => {
    const result = {};
    for (const c of [1, 2, 3]) {
      const actives = allMatches
        .filter(m => m.court === c && m.active && !m.row?.is_final)
        .sort((a, b) => new Date(b.row?.last_activity || 0) - new Date(a.row?.last_activity || 0));
      if (actives.length > 0) {
        result[c] = actives[0];
      } else {
        const upcoming = allMatches
          .filter(m => m.court === c && !m.row?.is_final)
          .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        if (upcoming.length > 0) {
          result[c] = upcoming[0];
        } else {
          const completed = allMatches
            .filter(m => m.court === c && m.row?.is_final)
            .sort((a, b) => timeToMinutes(b.time) - timeToMinutes(a.time));
          result[c] = completed[0] || null;
        }
      }
    }
    return result;
  }, [allMatches]);

  const recent = useMemo(() => {
    const seen = new Set();
    return allMatches
      .filter(m => m.row?.is_final)
      .sort((a, b) => new Date(b.row?.updated_at || 0) - new Date(a.row?.updated_at || 0))
      .filter(m => {
        const pid = parentIdOf(m);
        if (seen.has(pid)) return false;
        seen.add(pid);
        return true;
      })
      .slice(0, 8);
  }, [allMatches]);

  const upcoming = useMemo(() => {
    const seen = new Set();
    return allMatches
      .filter(m => !m.row?.is_final && !m.active)
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
      .filter(m => {
        const pid = parentIdOf(m);
        if (seen.has(pid)) return false;
        seen.add(pid);
        return true;
      })
      .slice(0, 8);
  }, [allMatches]);

  const completedCount = SCHEDULE.filter(m => !m.isPlayoff && matches[m.id]?.is_final).length;
  const totalCount = SCHEDULE.filter(m => !m.isPlayoff).length;

  return (
    <div className="h-screen w-screen bg-gray-50 text-gray-900 p-3 flex flex-col gap-2 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0 px-1">
        <div className="flex items-baseline gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <h1 className="text-2xl font-extrabold tracking-tight">MTCSV OPEN</h1>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {now ? now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[9px] font-bold tracking-widest text-gray-400">MATCHES</div>
            <div className="text-lg font-bold font-mono tabular-nums leading-none">
              {completedCount}<span className="text-gray-300">/{totalCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gray-200">
            <span className="relative flex h-1.5 w-1.5">
              {connected && <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-gray-600">{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-gray-900 leading-none">
            {now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—:—'}
          </div>
        </div>
      </header>

      {/* Live courts strip */}
      <section className="grid grid-cols-3 gap-2 shrink-0">
        {[1, 2, 3].map(cn => {
          const m = liveByCourt[cn];
          return (
            <CourtCard
              key={cn}
              courtNum={cn}
              match={m}
              row={m?.row}
              p1Name={m?.p1Name}
              p2Name={m?.p2Name}
              p1Tied={m?.p1Tied}
              p2Tied={m?.p2Tied}
              live={m?.active && !m?.row?.is_final}
            />
          );
        })}
      </section>

      {/* Standings grid - 5 categories, full team lists */}
      <section className="flex-1 grid grid-cols-5 gap-2 min-h-0">
        {Object.keys(GROUPS).map(cat => (
          <CategoryColumn key={cat} cat={cat} standings={standings} matches={matches} />
        ))}
      </section>

      {/* Recent + Upcoming */}
      <section className="grid grid-cols-2 gap-3 shrink-0">
        <div>
          <div className="text-[9px] font-bold tracking-widest text-gray-400 mb-0.5 flex items-center gap-1.5">
            <span>RECENT RESULTS</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <div className="space-y-0.5">
            {recent.length === 0 ? (
              <div className="text-xs text-gray-300 italic py-1">No matches completed yet</div>
            ) : (
              recent.map(m => (
                <CompactRow key={m.id} match={m} row={m.row} p1Name={m.p1Name} p2Name={m.p2Name} />
              ))
            )}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold tracking-widest text-gray-400 mb-0.5 flex items-center gap-1.5">
            <span>UP NEXT</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <div className="space-y-0.5">
            {upcoming.length === 0 ? (
              <div className="text-xs text-gray-300 italic py-1">No upcoming matches</div>
            ) : (
              upcoming.map(m => (
                <CompactRow key={m.id} match={m} row={m.row} p1Name={m.p1Name} p2Name={m.p2Name} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
