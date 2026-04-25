'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, BarChart3, User, X, Check, Edit3, MapPin, Lock, Wifi, WifiOff, Plus, Minus, RotateCcw, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SCHEDULE, GROUPS, TEAM_ROSTERS, CAT_LABELS, NAME_ALIASES, PLAYOFF_STRUCTURE, FINALS_STRUCTURE } from '../lib/tournament-data';
import Rules from './Rules';

const CAT_COLORS = {
  MS:  { bg: '#1e3a5f', text: '#a8d0ff', accent: '#4a9eff' },
  MD:  { bg: '#3d2d52', text: '#d4b3ff', accent: '#9d5cff' },
  MXD: { bg: '#4a2e1f', text: '#ffc5a8', accent: '#ff8a4a' },
  WS:  { bg: '#3d1f3d', text: '#ffb3e6', accent: '#ff4ab8' },
  WD:  { bg: '#1f3d2e', text: '#a8ffc5', accent: '#4aff8a' },
};

// ---------- helpers ----------
const timeToMinutes = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const formatTime12h = (t) => {
  const [h,m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  return `${h%12||12}:${String(m).padStart(2,'0')} ${p}`;
};

const ALL_PLAYERS = (() => {
  const s = new Set();
  Object.values(GROUPS).forEach(cat => Object.values(cat).forEach(g => g.forEach(e => {
    e.split('/').forEach(n => { const c = n.trim(); if (c && !c.startsWith('Group')) s.add(c); });
  })));
  Object.values(TEAM_ROSTERS).forEach(ms => ms.forEach(m => s.add(m)));
  Object.keys(TEAM_ROSTERS).forEach(t => s.add(t));
  return [...s].sort((a,b) => a.localeCompare(b));
})();

const matchInvolvesPlayer = (match, p) => {
  if (!p) return false;
  const fields = [match.p1, match.p2, match.umpire].filter(Boolean);
  for (const f of fields) {
    if (f.toLowerCase().includes(p.toLowerCase())) return true;
    for (const [team, members] of Object.entries(TEAM_ROSTERS)) {
      if (f.includes(team) && members.some(m => m.toLowerCase() === p.toLowerCase())) return true;
    }
  }
  return false;
};

// ---------- Override helper ----------
// Check if any of the 3 sets of a parent playoff match has an override set.
// Returns { p1, p2 } if override exists on any set, otherwise null.
const getPlayoffOverride = (matches, parentId) => {
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

// ---------- data hook ----------
function useMatches() {
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error: err } = await supabase.from('matches_public').select('*');
      if (!mounted) return;
      if (err) { setError(err.message); setLoading(false); return; }
      const map = {};
      for (const row of data) map[row.id] = row;
      setMatches(map);
      setLoading(false);
    })();

    const channel = supabase
      .channel('matches-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const { pin, ...safe } = payload.new;
          setMatches(prev => ({ ...prev, [safe.id]: { ...prev[safe.id], ...safe } }));
        })
      .subscribe((status) => { setConnected(status === 'SUBSCRIBED'); });

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const updateScore = async (matchId, s1, s2, pin, isFinal = false) => {
    const { data, error: err } = await supabase.rpc('update_score', {
      p_match_id: matchId, p_score1: s1, p_score2: s2, p_pin: pin, p_is_final: isFinal,
    });
    if (err) return { ok: false, error: err.message };
    return data;
  };

  return { matches, loading, connected, error, updateScore };
}

function useCurrentTime() {
  // Start with null on server to avoid hydration mismatch
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(i);
  }, []);
  return now;
}

// Check if a match is actively being scored (last activity within 5 minutes)
const isMatchLive = (row, now) => {
  if (!row || !row.last_activity || !now) return false;
  const lastActivity = new Date(row.last_activity);
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
  return lastActivity > fiveMinutesAgo;
};

// ---------- standings ----------
const normalizeName = (s) => s.replace(/\s+/g, '').toLowerCase();
const teamPrefix = (s) => {
  const m = s.split('-')[0].trim();
  return normalizeName(m);
};

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

// Resolve actual team name for a semifinal slot based on current standings
const resolveSemiSlot = (standings, slotInfo, cat) => {
  if (!slotInfo || !standings[cat]) return null;
  const groupStandings = standings[cat][slotInfo.group];
  if (!groupStandings || groupStandings.length < slotInfo.rank) return null;
  const entry = groupStandings[slotInfo.rank - 1];
  return entry && entry.played > 0 ? entry.name : null;
};
// Returns all names tied at a given slot's rank, based on (won, diff) equality
// with the entry currently at slotInfo.rank. Returns null if the slot has no
// played matches yet, or { names: [...], tied: bool } otherwise.
const resolveSemiSlotAll = (standings, slotInfo, cat) => {
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
  return {
    names: tied.map(e => e.name),
    tied: tied.length > 1,
  };
};




// How many teams advance from a given group (derived from PLAYOFF_STRUCTURE).
// MS/MD use 4-group brackets → 1 per group; WS/WD/MXD use 2-group brackets → 2 per group.
const advanceCountForGroup = (cat, groupName) => {
  let count = 0;
  for (const v of Object.values(PLAYOFF_STRUCTURE)) {
    if (v.cat !== cat) continue;
    if (v.slot1?.group === groupName) count = Math.max(count, v.slot1.rank);
    if (v.slot2?.group === groupName) count = Math.max(count, v.slot2.rank);
  }
  return count || 1;
};

// Calculate the winner of a semi-final based on 3-set scores
// Returns the winning team name, or null if not yet determined
// Checks override first, then falls back to auto-resolution from group standings
const getSemiWinner = (matches, semiId, standings) => {
  const structure = PLAYOFF_STRUCTURE[semiId];
  if (!structure) return null;

  // STEP 1: Check for manual override on any of the 3 sets
  const override = getPlayoffOverride(matches, semiId);
  let team1 = override ? override.p1 : null;
  let team2 = override ? override.p2 : null;

  // STEP 2: Fall back to auto-resolution from group standings
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

// ---------- small UI ----------
const CategoryBadge = ({ cat, small = false }) => {
  const c = CAT_COLORS[cat] || CAT_COLORS.MS;
  return (
    <span className={`inline-flex items-center font-bold tracking-wider uppercase ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.accent}40`, letterSpacing: '0.12em' }}>
      {cat}
    </span>
  );
};

const PlayerRow = ({ name, score, isWinner, hasScore, tied }) => (
  <div className="flex items-center justify-between gap-3">
    <div className={`text-sm ${isWinner ? 'font-bold text-white' : hasScore ? 'text-neutral-500' : 'text-neutral-300'} truncate flex items-center gap-1.5`}>
      {isWinner && <span className="shrink-0">▸ </span>}
      <span className="truncate">{name}</span>
      {tied && (
        <span className="shrink-0 text-[9px] font-bold tracking-widest px-1 py-0.5 rounded"
              style={{ backgroundColor: '#7c2d12', color: '#fed7aa', border: '1px solid #ea580c' }}>
          TIE
        </span>
      )}
    </div>
    <div className={`font-mono font-bold tabular-nums ${isWinner ? 'text-white text-lg' : hasScore ? 'text-neutral-500 text-lg' : 'text-neutral-700 text-sm'}`}>
      {hasScore ? score : '—'}
    </div>
  </div>
);

const MatchCard = ({ match, row, isLive, onEdit, myPlayer, resolvedP1, resolvedP2, p1Tied, p2Tied }) => {
  const hasScore = row && row.score1 != null && row.score2 != null;
  const isFinal = !!row?.is_final;
  const involvesMe = myPlayer && matchInvolvesPlayer(match, myPlayer);
  const c = CAT_COLORS[match.cat] || CAT_COLORS.MS;
  const winner = hasScore ? (row.score1 > row.score2 ? 1 : row.score2 > row.score1 ? 2 : 0) : 0;
  
  // Use resolved team names for playoffs if available, otherwise use schedule placeholders
  const displayP1 = resolvedP1 || match.p1;
  const displayP2 = resolvedP2 || match.p2;
  const winnerName = winner === 1 ? displayP1 : winner === 2 ? displayP2 : null;

  return (
    <div className="relative group transition-all duration-200"
      style={{
        backgroundColor: isLive ? '#1a1a1a' : '#131313',
        border: `1px solid ${isFinal ? '#15803d' : isLive ? c.accent : involvesMe ? '#fbbf24' : '#2a2a2a'}`,
        boxShadow: isLive ? `0 0 24px ${c.accent}30, inset 0 1px 0 ${c.accent}20` : isFinal ? '0 0 0 1px #15803d40' : involvesMe ? '0 0 0 1px #fbbf2440' : 'none',
      }}>
      {isLive && !isFinal && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-bold tracking-widest flex items-center gap-1"
             style={{ backgroundColor: c.accent, color: '#000' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ backgroundColor: '#000', opacity: 0.5 }}></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-black"></span>
          </span>
          LIVE
        </div>
      )}
      {isFinal && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-bold tracking-widest flex items-center gap-1"
             style={{ backgroundColor: '#15803d', color: '#fff' }}>
          <Check className="w-2.5 h-2.5" strokeWidth={3} /> COMPLETE
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CategoryBadge cat={match.cat} small />
            {match.matchType === 'semi' && (
              <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#854d0e', color: '#fff' }}>
                SEMI{match.setNumber ? ` SET ${match.setNumber}` : ''}
              </span>
            )}
            {match.matchType === 'final' && (
              <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#7c2d12', color: '#fff' }}>
                FINAL{match.setNumber ? ` SET ${match.setNumber}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
            <MapPin className="w-2.5 h-2.5" />COURT {match.court}
          </div>
        </div>

        <div className="space-y-1.5">
          <PlayerRow name={displayP1} score={row?.score1} isWinner={winner === 1} hasScore={hasScore} tied={p1Tied} />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-neutral-800"></div>
            <span className="text-[10px] text-neutral-600 font-mono">VS</span>
            <div className="flex-1 h-px bg-neutral-800"></div>
          </div>
          <PlayerRow name={displayP2} score={row?.score2} isWinner={winner === 2} hasScore={hasScore} tied={p2Tied} />
        </div>

        {isFinal && winnerName && (
          <div className="mt-3 px-3 py-2 rounded flex items-center gap-2"
               style={{ backgroundColor: '#0f1a0f', border: '1px solid #15803d' }}>
            <Trophy className="w-4 h-4 shrink-0 text-green-400" />
            <div className="text-[11px] uppercase tracking-widest font-bold text-green-400 truncate">
              Winner · {winnerName}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/60">
          <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
            Umpire · {match.umpire || '—'}
          </div>
          <button onClick={() => onEdit(match)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-colors"
            style={{
              color: isFinal ? '#737373' : c.accent,
              border: `1px solid ${isFinal ? '#404040' : c.accent}60`,
            }}>
            <Edit3 className="w-2.5 h-2.5" />{isFinal ? 'Edit' : 'Score'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Score modal with PIN ----------
const ScoreModal = ({ match, row, onSave, onClose, resolvedP1, resolvedP2 }) => {
  const [serverS1, setServerS1] = useState(row?.score1 ?? null);
  const [serverS2, setServerS2] = useState(row?.score2 ?? null);
  const [s1, setS1] = useState(row?.score1 ?? 0);
  const [s2, setS2] = useState(row?.score2 ?? 0);
  const [pin, setPin] = useState('');
  const [pinLocked, setPinLocked] = useState(false);
  const [mode, setMode] = useState('live');
  const [err, setErr] = useState(null);
  const [syncState, setSyncState] = useState('idle');
  const [finalS1, setFinalS1] = useState(row?.score1 ?? '');
  const [finalS2, setFinalS2] = useState(row?.score2 ?? '');

  const c = CAT_COLORS[match.cat] || CAT_COLORS.MS;
  const displayP1 = resolvedP1 || match.p1;
  const displayP2 = resolvedP2 || match.p2;

  useEffect(() => {
    const saved = localStorage.getItem(`pin-${match.id}`);
    if (saved && saved.length === 4) {
      setPin(saved);
      setPinLocked(true);
    }
  }, [match.id]);

  useEffect(() => {
    if (row?.score1 !== serverS1 || row?.score2 !== serverS2) {
      setServerS1(row?.score1 ?? null);
      setServerS2(row?.score2 ?? null);
    }
  }, [row?.score1, row?.score2]);

  const tryLockPin = async () => {
    setErr(null);
    if (pin.length !== 4) { setErr('Enter your 4-digit PIN'); return; }
    setSyncState('saving');
    const result = await onSave(s1, s2, pin, !!row?.is_final);
    setSyncState('idle');
    if (result.ok) {
      localStorage.setItem(`pin-${match.id}`, pin);
      setPinLocked(true);
      setServerS1(s1); setServerS2(s2);
    } else {
      setErr(result.error || 'Invalid PIN');
    }
  };

  const unlockPin = () => {
    setPinLocked(false);
    setPin('');
    localStorage.removeItem(`pin-${match.id}`);
  };

  const saveScore = async (newS1, newS2, isFinal = false) => {
    setErr(null);
    setSyncState('saving');
    const result = await onSave(newS1, newS2, pin, isFinal);
    if (result.ok) {
      setServerS1(newS1); setServerS2(newS2);
      setSyncState('saved');
      setTimeout(() => setSyncState(prev => prev === 'saved' ? 'idle' : prev), 1200);
      return true;
    } else {
      setErr(result.error || 'Save failed');
      setSyncState('error');
      setS1(serverS1 ?? 0); setS2(serverS2 ?? 0);
      if ((result.error || '').toLowerCase().includes('pin')) {
        setPinLocked(false);
      }
      return false;
    }
  };

  const bump = (which, delta) => {
    if (!pinLocked) return;
    const newS1 = which === 1 ? Math.max(0, s1 + delta) : s1;
    const newS2 = which === 2 ? Math.max(0, s2 + delta) : s2;
    if (newS1 === s1 && newS2 === s2) return;
    setS1(newS1); setS2(newS2);
    saveScore(newS1, newS2, !!row?.is_final);
  };

  const markAsFinal = async () => {
    if (!pinLocked) return;
    if (s1 === 0 && s2 === 0) { setErr('Score is 0-0 — enter some points first'); return; }
    const limit = row?.scoring_format || 21;
    const isPrelim = row?.match_type === 'prelim';
    if (isPrelim && (s1 > limit || s2 > limit)) {
      if (!confirm(`Score exceeds ${limit}-point prelim format. Mark complete anyway?`)) return;
    }
    const ok = await saveScore(s1, s2, true);
    if (ok) onClose();
  };

  const saveFinal = async () => {
    if (!pinLocked) { setErr('Enter your PIN first'); return; }
    const n1 = finalS1 === '' ? null : Number(finalS1);
    const n2 = finalS2 === '' ? null : Number(finalS2);
    if (n1 == null || n2 == null || Number.isNaN(n1) || Number.isNaN(n2)) { setErr('Enter both scores'); return; }
    if (n1 === n2) { setErr('Scores must differ to mark as final'); return; }
    setS1(n1); setS2(n2);
    const ok = await saveScore(n1, n2, true);
    if (ok) onClose();
  };

  const clearScore = async () => {
    if (!pinLocked) return;
    if (!confirm('Clear both scores back to 0?')) return;
    setS1(0); setS2(0); setFinalS1(''); setFinalS2('');
    await saveScore(0, 0, false);
  };

  const winnerAhead = s1 > s2 ? 1 : s2 > s1 ? 2 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="relative w-full max-w-lg my-auto" style={{ backgroundColor: '#0a0a0a', border: `1px solid ${c.accent}` }}>
        <div className="absolute -top-px left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }}></div>

        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge cat={match.cat} small />
              <span className="text-[11px] text-neutral-500 font-mono">{formatTime12h(match.time)} · COURT {match.court}</span>
            </div>
            {match.label && <div className="text-xs text-amber-300 font-bold mb-1">{match.label}</div>}
            <div className="text-xs text-neutral-400 uppercase tracking-wider">Umpire · {match.umpire || '—'}</div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {!pinLocked ? (
          <div className="p-5 border-b border-neutral-800">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
              <Lock className="w-3 h-3" /> Umpire PIN to start scoring
            </label>
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') tryLockPin(); }}
                autoFocus
                className="flex-1 text-center text-2xl font-mono tabular-nums bg-transparent py-3 outline-none text-white tracking-[0.5em]"
                style={{ border: '1px solid #3f3f3f' }} placeholder="••••" />
              <button onClick={tryLockPin}
                className="px-4 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{ backgroundColor: c.accent, color: '#000' }}
                disabled={pin.length !== 4 || syncState === 'saving'}>
                {syncState === 'saving' ? '…' : 'Unlock'}
              </button>
            </div>
            <div className="text-[10px] text-neutral-600 mt-1.5">
              Your match PIN — or the admin PIN if an umpire's doesn't work
            </div>
            {err && <div className="mt-3 text-xs text-red-400 text-center">{err}</div>}
          </div>
        ) : (
          <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-green-400 uppercase tracking-widest font-bold">PIN verified</span>
              <span className="text-neutral-600">—</span>
              <SyncBadge state={syncState} />
            </div>
            <button onClick={unlockPin} className="text-neutral-500 hover:text-white uppercase tracking-widest">Change PIN</button>
          </div>
        )}

        {pinLocked && (
          <>
            <div className="flex border-b border-neutral-800">
              <button onClick={() => setMode('live')}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{
                  backgroundColor: mode === 'live' ? '#131313' : 'transparent',
                  color: mode === 'live' ? c.accent : '#737373',
                  borderBottom: `2px solid ${mode === 'live' ? c.accent : 'transparent'}`,
                }}>
                Live Scoring
              </button>
              <button onClick={() => setMode('final')}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{
                  backgroundColor: mode === 'final' ? '#131313' : 'transparent',
                  color: mode === 'final' ? c.accent : '#737373',
                  borderBottom: `2px solid ${mode === 'final' ? c.accent : 'transparent'}`,
                }}>
                Final Score
              </button>
            </div>

            <div className="px-4 py-2 text-center text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-900">
              First to <span className="font-bold text-white">{row?.scoring_format || 21}</span> points
              {row?.match_type === 'prelim' && <span className="ml-2 text-neutral-600">· Prelim</span>}
              {row?.match_type === 'semi' && <span className="ml-2 text-yellow-600">· Semi-Final</span>}
              {row?.match_type === 'final' && <span className="ml-2 text-yellow-600">· Championship</span>}
            </div>
          </>
        )}

        {pinLocked && mode === 'live' && (
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <PlayerScorePanel name={displayP1} score={s1} isLeading={winnerAhead === 1}
                onPlus={() => bump(1, +1)} onMinus={() => bump(1, -1)} color={c} />
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-neutral-800"></div>
                <span className="text-[10px] text-neutral-600 font-mono tracking-widest">VS</span>
                <div className="flex-1 h-px bg-neutral-800"></div>
              </div>
              <PlayerScorePanel name={displayP2} score={s2} isLeading={winnerAhead === 2}
                onPlus={() => bump(2, +1)} onMinus={() => bump(2, -1)} color={c} />
            </div>

            {row?.match_type === 'prelim' && (s1 > 15 || s2 > 15) && !row?.is_final && (
              <div className="mt-5 p-3 rounded bg-orange-950/50 border border-orange-800/50 text-orange-300 text-xs">
                <div className="font-bold uppercase tracking-wider mb-1">⚠️ Score exceeds 15</div>
                <div className="text-orange-400/80">Prelims are first to 15 points. Consider marking complete if this is the final score.</div>
              </div>
            )}

            {!row?.is_final ? (
              <button onClick={markAsFinal} disabled={syncState === 'saving' || (s1 === 0 && s2 === 0)}
                className="w-full mt-5 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: c.accent, color: '#000' }}>
                <Trophy className="w-4 h-4" /> Mark Complete — {winnerAhead === 1 ? displayP1 : winnerAhead === 2 ? displayP2 : 'Winner TBD'} {winnerAhead > 0 && 'wins'}
              </button>
            ) : (
              <div className="mt-5 rounded p-3 flex items-center justify-between" style={{ backgroundColor: '#0f1a0f', border: '1px solid #1f5f1f' }}>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-green-400">
                  <Trophy className="w-4 h-4" /> Complete · {winnerAhead === 1 ? displayP1 : displayP2} wins
                </div>
                <button onClick={async () => { await saveScore(s1, s2, false); }}
                  className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                  Undo complete
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-900">
              <button onClick={clearScore}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset to 0-0
              </button>
              <div className="text-[10px] text-neutral-600 tracking-widest">
                Every tap syncs live
              </div>
            </div>

            {err && <div className="mt-3 text-xs text-red-400 text-center">{err}</div>}
          </div>
        )}

        {pinLocked && mode === 'final' && (
          <div className="p-6">
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 text-center">
              Type the final scores
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div>
                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Player 1</div>
                <div className="text-sm font-bold mb-3 text-white truncate">{displayP1}</div>
                <input type="number" min="0" inputMode="numeric" value={finalS1} onChange={(e) => setFinalS1(e.target.value)}
                  className="w-full text-center text-5xl font-bold font-mono tabular-nums bg-transparent py-3 outline-none text-white"
                  style={{ border: `1px solid ${c.accent}60` }} placeholder="0" />
              </div>
              <div className="text-neutral-600 font-mono text-xs pt-8">VS</div>
              <div>
                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Player 2</div>
                <div className="text-sm font-bold mb-3 text-white truncate">{displayP2}</div>
                <input type="number" min="0" inputMode="numeric" value={finalS2} onChange={(e) => setFinalS2(e.target.value)}
                  className="w-full text-center text-5xl font-bold font-mono tabular-nums bg-transparent py-3 outline-none text-white"
                  style={{ border: `1px solid ${c.accent}60` }} placeholder="0" />
              </div>
            </div>

            {err && <div className="mt-3 text-xs text-red-400 text-center">{err}</div>}

            <button onClick={saveFinal} disabled={syncState === 'saving'}
              className="w-full mt-5 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ backgroundColor: c.accent, color: '#000' }}>
              <Check className="w-4 h-4" /> {syncState === 'saving' ? 'Saving…' : 'Save Final Score'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SyncBadge = ({ state }) => {
  if (state === 'saving') return <span className="text-neutral-400 uppercase tracking-widest">Syncing…</span>;
  if (state === 'saved') return <span className="text-green-400 uppercase tracking-widest flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>;
  if (state === 'error') return <span className="text-red-400 uppercase tracking-widest">Error</span>;
  return <span className="text-neutral-600 uppercase tracking-widest">Ready</span>;
};

const PlayerScorePanel = ({ name, score, isLeading, onPlus, onMinus, color }) => {
  return (
    <div className="p-3 rounded" style={{
      backgroundColor: isLeading ? '#131313' : 'transparent',
      border: `1px solid ${isLeading ? color.accent + '80' : '#2a2a2a'}`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm font-bold truncate ${isLeading ? 'text-white' : 'text-neutral-300'}`}>
          {isLeading && <span style={{ color: color.accent }}>▸ </span>}{name}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onMinus} disabled={score === 0}
          className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #3f3f3f', color: '#a3a3a3' }}
          aria-label="Decrement">
          <Minus className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center font-mono font-black tabular-nums text-6xl sm:text-7xl py-2" style={{ color: isLeading ? '#fff' : '#a3a3a3' }}>
          {score}
        </div>
        <button onClick={onPlus}
          className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: color.accent, color: '#000' }}
          aria-label="Increment">
          <Plus className="w-7 h-7" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

// ---------- Helper: resolve player names for playoff matches ----------
// Order of precedence:
//   1. Manual override (override_p1 / override_p2 on any of the 3 sets)
//   2. Auto-resolution from group standings (semis) or semi winners (finals)
// Returns { p1, p2, p1Tied, p2Tied } where pX is a display string and pXTied
// is true if the slot is tied between multiple players (joined by " / ").
const resolvePlayoffNames = (match, standings, matches) => {
  if (!match.isPlayoff) return { p1: null, p2: null, p1Tied: false, p2Tied: false };

  const parentId = match.parentMatchId || match.id;

  // STEP 1: Check for manual override on any of the 3 sets — overrides clear ties
  const override = getPlayoffOverride(matches, parentId);
  if (override) {
    return { p1: override.p1, p2: override.p2, p1Tied: false, p2Tied: false };
  }

  // STEP 2: Auto-resolve from PLAYOFF_STRUCTURE (for semis) — surface ties
  if (match.matchType === 'semi' && PLAYOFF_STRUCTURE[parentId]) {
    const s = PLAYOFF_STRUCTURE[parentId];
    const a1 = resolveSemiSlotAll(standings, s.slot1, s.cat);
    const a2 = resolveSemiSlotAll(standings, s.slot2, s.cat);
    return {
      p1: a1 ? a1.names.join(' / ') : null,
      p2: a2 ? a2.names.join(' / ') : null,
      p1Tied: !!(a1 && a1.tied),
      p2Tied: !!(a2 && a2.tied),
    };
  }

  // STEP 3: Auto-resolve from semi-final winners (for finals)
  if (match.matchType === 'final' && FINALS_STRUCTURE[parentId]) {
    const s = FINALS_STRUCTURE[parentId];
    const p1 = getSemiWinner(matches, s.semi1, standings);
    const p2 = getSemiWinner(matches, s.semi2, standings);
    return { p1, p2, p1Tied: false, p2Tied: false };
  }

  return { p1: null, p2: null, p1Tied: false, p2Tied: false };
};

// ---------- Tabs ----------
const ScheduleTab = ({ matches, now, onEdit, myPlayer, standings }) => {
  const [catFilter, setCatFilter] = useState('ALL');
  const timeSlots = useMemo(() => [...new Set(SCHEDULE.map(m => m.time))].sort(), []);
  const filtered = catFilter === 'ALL' ? SCHEDULE : SCHEDULE.filter(m => m.cat === catFilter);

  return (
    <div>
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {['ALL', 'MS', 'MD', 'MXD', 'WS', 'WD'].map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: catFilter === cat ? (cat === 'ALL' ? '#fff' : CAT_COLORS[cat]?.accent) : 'transparent',
              color: catFilter === cat ? '#000' : '#a3a3a3',
              border: `1px solid ${catFilter === cat ? 'transparent' : '#3f3f3f'}`,
            }}>
            {cat === 'ALL' ? 'All' : cat}
          </button>
        ))}
      </div>

      {timeSlots.map(slot => {
        const slotMatches = filtered.filter(m => m.time === slot);
        if (slotMatches.length === 0) return null;
        const hasLiveMatch = slotMatches.some(m => isMatchLive(matches[m.id], now));
        return (
          <div key={slot} className="mb-8">
            <div className="flex items-baseline gap-3 mb-3 sticky top-14 py-2 z-10" style={{ backgroundColor: '#050505' }}>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">{formatTime12h(slot)}</div>
              {hasLiveMatch && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  NOW PLAYING
                </div>
              )}
              <div className="flex-1 h-px bg-neutral-800"></div>
              {slot === '16:00' && <div className="text-[10px] uppercase tracking-widest text-amber-400">Tea Break</div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {slotMatches.map(m => {
                const { p1, p2, p1Tied, p2Tied } = resolvePlayoffNames(m, standings, matches);
                return <MatchCard key={m.id} match={m} row={matches[m.id]} isLive={isMatchLive(matches[m.id], now)} onEdit={onEdit} myPlayer={myPlayer} resolvedP1={p1} resolvedP2={p2} p1Tied={p1Tied} p2Tied={p2Tied} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Playoffs table for Standings tab
const PlayoffsTable = ({ structures, matches, standings, isSemi, title }) => {
  // Group the structures by category
  const byCat = {};
  Object.entries(structures).forEach(([id, info]) => {
    if (!byCat[info.cat]) byCat[info.cat] = [];
    byCat[info.cat].push({ id, ...info });
  });

  return (
    <div className="mb-8">
      <div className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(byCat).map(([cat, items]) => {
          const c = CAT_COLORS[cat];
          return (
            <div key={cat} style={{ backgroundColor: '#0a0a0a', border: `1px solid ${c.accent}40` }}>
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <CategoryBadge cat={cat} small />
                <div className="text-sm font-bold uppercase tracking-wider text-white">{CAT_LABELS[cat]}</div>
              </div>
              <div className="divide-y divide-neutral-900">
                {items.map(item => {
                  let p1Name, p2Name, winner;

                  // Check for manual override first (applies to both semis and finals)
                  const override = getPlayoffOverride(matches, item.id);
                  const overrideP1 = override ? override.p1 : null;
                  const overrideP2 = override ? override.p2 : null;

                  let p1Tied = false, p2Tied = false;
                  if (isSemi) {
                    if (overrideP1) {
                      p1Name = overrideP1;
                    } else {
                      const a1 = resolveSemiSlotAll(standings, item.slot1, item.cat);
                      if (a1) {
                        p1Name = a1.names.join(' / ');
                        p1Tied = a1.tied;
                      } else {
                        p1Name = `${item.slot1.group}${item.slot1.rank > 1 ? ' #' + item.slot1.rank : ''}`;
                      }
                    }
                    if (overrideP2) {
                      p2Name = overrideP2;
                    } else {
                      const a2 = resolveSemiSlotAll(standings, item.slot2, item.cat);
                      if (a2) {
                        p2Name = a2.names.join(' / ');
                        p2Tied = a2.tied;
                      } else {
                        p2Name = `${item.slot2.group}${item.slot2.rank > 1 ? ' #' + item.slot2.rank : ''}`;
                      }
                    }
                    winner = getSemiWinner(matches, item.id, standings);
                  } else {
                    p1Name = overrideP1 || getSemiWinner(matches, item.semi1, standings) || `Winner of ${item.semi1}`;
                    p2Name = overrideP2 || getSemiWinner(matches, item.semi2, standings) || `Winner of ${item.semi2}`;
                    // Final winner
                    let team1Sets = 0, team2Sets = 0;
                    for (let setNum = 1; setNum <= 3; setNum++) {
                      const row = matches[`${item.id}_s${setNum}`];
                      if (row && row.is_final && row.score1 != null && row.score2 != null) {
                        if (row.score1 > row.score2) team1Sets++;
                        else if (row.score2 > row.score1) team2Sets++;
                      }
                    }
                    winner = team1Sets >= 2 ? p1Name : team2Sets >= 2 ? p2Name : null;
                  }

                  // Get the 3 sets
                  const sets = [1, 2, 3].map(setNum => {
                    const row = matches[`${item.id}_s${setNum}`];
                    return {
                      setNum,
                      score1: row?.score1 ?? null,
                      score2: row?.score2 ?? null,
                      isFinal: !!row?.is_final,
                    };
                  });

                  return (
                    <div key={item.id} className="p-3">
                      <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-2">
                        <span>{item.label}</span>
                        {override && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                                style={{ backgroundColor: '#7c2d12', color: '#fed7aa', border: '1px solid #ea580c' }}>
                            OVERRIDE
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {/* Team 1 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className={`text-sm ${winner === p1Name ? 'font-bold text-white' : 'text-neutral-300'} truncate flex-1 flex items-center gap-1.5`}>
                            <span className="truncate">{winner === p1Name && '▸ '}{p1Name}</span>
                            {p1Tied && (
                              <span className="shrink-0 text-[9px] font-bold tracking-widest px-1 py-0.5 rounded"
                                    style={{ backgroundColor: '#7c2d12', color: '#fed7aa', border: '1px solid #ea580c' }}>
                                TIE
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 font-mono font-bold tabular-nums">
                            {sets.map(s => (
                              <span key={s.setNum} className={`text-sm px-1.5 min-w-[24px] text-center ${s.score1 != null ? (s.score1 > s.score2 ? 'text-white bg-neutral-800' : 'text-neutral-500') : 'text-neutral-700'}`}>
                                {s.score1 ?? '—'}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Team 2 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className={`text-sm ${winner === p2Name ? 'font-bold text-white' : 'text-neutral-300'} truncate flex-1 flex items-center gap-1.5`}>
                            <span className="truncate">{winner === p2Name && '▸ '}{p2Name}</span>
                            {p2Tied && (
                              <span className="shrink-0 text-[9px] font-bold tracking-widest px-1 py-0.5 rounded"
                                    style={{ backgroundColor: '#7c2d12', color: '#fed7aa', border: '1px solid #ea580c' }}>
                                TIE
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 font-mono font-bold tabular-nums">
                            {sets.map(s => (
                              <span key={s.setNum} className={`text-sm px-1.5 min-w-[24px] text-center ${s.score2 != null ? (s.score2 > s.score1 ? 'text-white bg-neutral-800' : 'text-neutral-500') : 'text-neutral-700'}`}>
                                {s.score2 ?? '—'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {winner && (
                        <div className="mt-2 text-[10px] uppercase tracking-widest font-bold text-green-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Winner · {winner}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StandingsTab = ({ matches, standings }) => {
  const [activeCat, setActiveCat] = useState('MS');
  return (
    <div>
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {Object.keys(GROUPS).map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: activeCat === cat ? CAT_COLORS[cat].accent : 'transparent',
              color: activeCat === cat ? '#000' : '#a3a3a3',
              border: `1px solid ${activeCat === cat ? 'transparent' : '#3f3f3f'}`,
            }}>{CAT_LABELS[cat]}</button>
        ))}
      </div>
      
      {/* Group standings */}
      <div className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" style={{ color: CAT_COLORS[activeCat].accent }} />
        Group Stage
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Object.entries(standings[activeCat] || {}).map(([groupName, rows]) => (
          <div key={groupName} style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}>
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
              <CategoryBadge cat={activeCat} small />
              <div className="text-sm font-bold uppercase tracking-wider text-white">{groupName}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-800">
                  <th className="text-left p-2 pl-4 w-8">#</th>
                  <th className="text-left p-2">Player</th>
                  <th className="text-center p-2 w-8">P</th>
                  <th className="text-center p-2 w-8">W</th>
                  <th className="text-center p-2 w-8">L</th>
                  <th className="text-center p-2 w-12">+/-</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const diff = r.pointsFor - r.pointsAgainst;
                  const q = i < advanceCountForGroup(activeCat, groupName) && r.played > 0;
                  return (
                    <tr key={r.name} className="border-b border-neutral-900 last:border-0">
                      <td className="p-2 pl-4 font-mono text-neutral-500">{q ? <span style={{ color: CAT_COLORS[activeCat].accent }}>{i+1}</span> : (i+1)}</td>
                      <td className="p-2 text-white">{r.name}</td>
                      <td className="p-2 text-center font-mono tabular-nums text-neutral-400">{r.played}</td>
                      <td className="p-2 text-center font-mono tabular-nums font-bold text-white">{r.won}</td>
                      <td className="p-2 text-center font-mono tabular-nums text-neutral-500">{r.lost}</td>
                      <td className={`p-2 text-center font-mono tabular-nums ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-neutral-500'}`}>{diff > 0 ? '+' : ''}{diff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-600 tracking-wider">
              <span style={{ color: CAT_COLORS[activeCat].accent }}>●</span> Top {advanceCountForGroup(activeCat, groupName)} advance{advanceCountForGroup(activeCat, groupName) === 1 ? 's' : ''} to semifinals
            </div>
          </div>
        ))}
      </div>

      {/* Semi-Finals for active category */}
      <PlayoffsTable 
        structures={Object.fromEntries(Object.entries(PLAYOFF_STRUCTURE).filter(([_, v]) => v.cat === activeCat))}
        matches={matches}
        standings={standings}
        isSemi={true}
        title="Semi-Finals (Best of 3 Sets)"
      />
      
      {/* Finals for active category */}
      <PlayoffsTable 
        structures={Object.fromEntries(Object.entries(FINALS_STRUCTURE).filter(([_, v]) => v.cat === activeCat))}
        matches={matches}
        standings={standings}
        isSemi={false}
        title="Finals (Best of 3 Sets)"
      />
    </div>
  );
};

const MyMatchesTab = ({ matches, now, onEdit, myPlayer, setMyPlayer, standings }) => {
  const my = myPlayer ? SCHEDULE.filter(m => matchInvolvesPlayer(m, myPlayer)) : [];
  const playing = my.filter(m => {
    const check = (f) => f && (f.toLowerCase().includes(myPlayer.toLowerCase())
      || Object.entries(TEAM_ROSTERS).some(([t, mem]) => f.includes(t) && mem.some(x => x.toLowerCase() === myPlayer.toLowerCase())));
    return check(m.p1) || check(m.p2);
  });
  const umpiring = my.filter(m => m.umpire && m.umpire.toLowerCase() === myPlayer.toLowerCase());

  return (
    <div>
      <div className="mb-6" style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}>
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Select your name</div>
          <select value={myPlayer || ''} onChange={(e) => setMyPlayer(e.target.value)}
            className="w-full bg-black text-white p-3 font-mono text-sm outline-none"
            style={{ border: '1px solid #fbbf24' }}>
            <option value="">— Choose a player —</option>
            {ALL_PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      {myPlayer && (
        <>
          {playing.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-bold uppercase tracking-wider text-white">Playing</div>
                <div className="text-xs text-neutral-500 font-mono">· {playing.length} {playing.length === 1 ? 'match' : 'matches'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {playing.map(m => {
                  const { p1, p2, p1Tied, p2Tied } = resolvePlayoffNames(m, standings, matches);
                  return (
                    <div key={m.id}>
                      <div className="text-[10px] font-mono text-neutral-500 mb-1">{formatTime12h(m.time)}</div>
                      <MatchCard match={m} row={matches[m.id]} isLive={isMatchLive(matches[m.id], now)} onEdit={onEdit} myPlayer={myPlayer} resolvedP1={p1} resolvedP2={p2} p1Tied={p1Tied} p2Tied={p2Tied} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {umpiring.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-bold uppercase tracking-wider text-white">Umpiring</div>
                <div className="text-xs text-neutral-500 font-mono">· {umpiring.length} {umpiring.length === 1 ? 'match' : 'matches'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {umpiring.map(m => {
                  const { p1, p2, p1Tied, p2Tied } = resolvePlayoffNames(m, standings, matches);
                  return (
                    <div key={m.id}>
                      <div className="text-[10px] font-mono text-neutral-500 mb-1">{formatTime12h(m.time)}</div>
                      <MatchCard match={m} row={matches[m.id]} isLive={isMatchLive(matches[m.id], now)} onEdit={onEdit} myPlayer={myPlayer} resolvedP1={p1} resolvedP2={p2} p1Tied={p1Tied} p2Tied={p2Tied} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {my.length === 0 && <div className="text-center py-12 text-neutral-500">No matches found for <span className="text-white">{myPlayer}</span>.</div>}
        </>
      )}
    </div>
  );
};

// ---------- Main ----------
export default function TournamentApp() {
  const { matches, loading, connected, error, updateScore } = useMatches();
  const now = useCurrentTime();
  const [activeTab, setActiveTab] = useState('schedule');
  const [editing, setEditing] = useState(null);
  const [myPlayer, setMyPlayerState] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('my-player');
    if (saved) setMyPlayerState(saved);
  }, []);

  const setMyPlayer = (v) => {
    setMyPlayerState(v);
    if (v) localStorage.setItem('my-player', v); else localStorage.removeItem('my-player');
  };

  const standings = useMemo(() => calculateStandings(matches), [matches]);

  const handleSave = async (s1, s2, pin, isFinal = false) => {
    if (!editing) return { ok: false, error: 'No match selected' };
    return await updateScore(editing.id, s1, s2, pin, isFinal);
  };

  // Count completed prelim matches (non-playoff, marked as final)
  const completed = SCHEDULE.filter(m => !m.isPlayoff && matches[m.id]?.is_final).length;
  const totalNonPlayoff = SCHEDULE.filter(m => !m.isPlayoff).length;

  // Get resolved names for the currently editing match
  const editingResolved = editing ? resolvePlayoffNames(editing, standings, matches) : { p1: null, p2: null, p1Tied: false, p2Tied: false };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#050505' }}>
      <header className="relative border-b border-neutral-900 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)' }}></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-neutral-500 uppercase mb-2">
                <span className="inline-block w-6 h-px bg-neutral-700"></span>
                Badminton Tournament · Live
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-none text-white">MTCSV OPEN</h1>
              <div className="flex items-baseline gap-3 mt-2 font-mono text-xs text-neutral-500 flex-wrap">
                <span>{now ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '—'}</span>
                <span className="text-neutral-700">·</span>
                <span className="tabular-nums">{now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                <span className="text-neutral-700">·</span>
                <span className="flex items-center gap-1" style={{ color: connected ? '#4ade80' : '#737373' }}>
                  {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {connected ? 'LIVE SYNC' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <div className="flex gap-6 font-mono">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Matches</div>
                <div className="text-2xl font-bold tabular-nums text-white">{completed}<span className="text-neutral-600">/{totalNonPlayoff}</span></div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Courts</div>
                <div className="text-2xl font-bold tabular-nums text-white">3</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Events</div>
                <div className="text-2xl font-bold tabular-nums text-white">5</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-neutral-900" style={{ backgroundColor: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex overflow-x-auto">
          {[
            { id: 'schedule', icon: Calendar, label: 'Schedule' },
            { id: 'standings', icon: BarChart3, label: 'Standings' },
            { id: 'my', icon: User, label: 'My Matches' },
            { id: 'rules', icon: BookOpen, label: 'Rules' },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2 px-4 md:px-5 py-4 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                style={{ color: active ? '#fff' : '#737373' }}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
                {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"></div>}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {error && <div className="mb-4 p-3 text-sm text-red-400" style={{ backgroundColor: '#2a0a0a', border: '1px solid #7f1d1d' }}>Error: {error}</div>}
        {loading ? (
          <div className="text-center text-neutral-500 py-20">Loading tournament data…</div>
        ) : (
          <>
            {activeTab === 'schedule' && <ScheduleTab matches={matches} now={now} onEdit={setEditing} myPlayer={myPlayer} standings={standings} />}
            {activeTab === 'standings' && <StandingsTab matches={matches} standings={standings} />}
            {activeTab === 'my' && <MyMatchesTab matches={matches} now={now} onEdit={setEditing} myPlayer={myPlayer} setMyPlayer={setMyPlayer} standings={standings} />}
            {activeTab === 'rules' && <Rules />}
          </>
        )}
      </main>

      <footer className="border-t border-neutral-900 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
            <a href="/tournament-poster.jpg" target="_blank" rel="noopener noreferrer"
               className="block shrink-0 transition-opacity hover:opacity-80"
               title="View full poster">
              <img src="/tournament-poster.jpg" alt="MTCSV Yuvajana Sakhyam Badminton Tournament poster"
                   className="w-full md:w-48 h-auto rounded" style={{ border: '1px solid #2a2a2a' }} />
            </a>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                MTCSV Yuvajana Sakhyam Presents
              </div>
              <div className="text-xl md:text-2xl font-bold text-white mb-1">
                Badminton Tournament
              </div>
              <div className="text-sm text-amber-300/80 italic mb-4 font-serif">
                "Serve for His Glory!"
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-300">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">When</div>
                  <div>Saturday, April 25, 2026 · 1 PM – 7 PM</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Where</div>
                  <div>Kerala House · 40374 Fremont Blvd, Fremont, CA 94538</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Contact</div>
                  <div>Nishant George · <a href="tel:+12675309577" className="text-white hover:text-amber-300 transition-colors">267-530-9577</a></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Categories</div>
                  <div>Men's/Women's Singles, Doubles, Mixed Doubles · Age 13+</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-600 uppercase tracking-widest">
            <span>Per-match umpire PINs · Admin override available</span>
            <span>Realtime · Supabase</span>
          </div>
        </div>
      </footer>

      {editing && <ScoreModal match={editing} row={matches[editing.id]} onSave={handleSave} onClose={() => setEditing(null)} resolvedP1={editingResolved.p1} resolvedP2={editingResolved.p2} />}
    </div>
  );
}
