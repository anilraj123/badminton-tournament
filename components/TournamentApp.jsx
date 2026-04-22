'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, BarChart3, User, X, Check, Edit3, MapPin, Lock, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SCHEDULE, GROUPS, TEAM_ROSTERS, CAT_LABELS, NAME_ALIASES } from '../lib/tournament-data';

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

  const updateScore = async (matchId, s1, s2, pin) => {
    const { data, error: err } = await supabase.rpc('update_score', {
      p_match_id: matchId, p_score1: s1, p_score2: s2, p_pin: pin,
    });
    if (err) return { ok: false, error: err.message };
    return data;
  };

  return { matches, loading, connected, error, updateScore };
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(i); }, []);
  return now;
}

const getLiveSlot = (now) => {
  const nm = now.getHours()*60 + now.getMinutes();
  const slots = [...new Set(SCHEDULE.map(m => m.time))].sort();
  for (const s of slots) { const start = timeToMinutes(s); if (nm >= start && nm < start+12) return s; }
  return null;
};

// ---------- standings ----------
// Normalize names so "Linesh/ Anil" (groups) matches "Linesh/Anil" (schedule),
// and team prefixes like "Ari Kombans- Satish/Shaji" match "Ari Kombans".
const normalizeName = (s) => s.replace(/\s+/g, '').toLowerCase();
const teamPrefix = (s) => {
  // "Ari Kombans- Satish/Shaji" → "Ari Kombans"
  const m = s.split('-')[0].trim();
  return normalizeName(m);
};

const namesMatch = (groupPlayer, schedulePlayer) => {
  const a = normalizeName(groupPlayer);
  const b = normalizeName(schedulePlayer);
  if (a === b) return true;
  // Team prefix match (group has "Ari Kombans- Satish/Shaji", schedule has "Ari Kombans")
  if (teamPrefix(groupPlayer) === b) return true;
  if (a === teamPrefix(schedulePlayer)) return true;
  // Alias map — handles schedule abbreviations (e.g. "George Thomas/Manoj" → "George Thomas/ Manoj Abraham")
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
    if (!row || row.score1 == null || row.score2 == null) return;
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

const PlayerRow = ({ name, score, isWinner, hasScore }) => (
  <div className="flex items-center justify-between gap-3">
    <div className={`text-sm ${isWinner ? 'font-bold text-white' : hasScore ? 'text-neutral-500' : 'text-neutral-300'} truncate`}>
      {isWinner && '▸ '}{name}
    </div>
    <div className={`font-mono font-bold tabular-nums ${isWinner ? 'text-white text-lg' : hasScore ? 'text-neutral-500 text-lg' : 'text-neutral-700 text-sm'}`}>
      {hasScore ? score : '—'}
    </div>
  </div>
);

const MatchCard = ({ match, row, isLive, onEdit, myPlayer }) => {
  const hasScore = row && row.score1 != null && row.score2 != null;
  const involvesMe = myPlayer && matchInvolvesPlayer(match, myPlayer);
  const c = CAT_COLORS[match.cat] || CAT_COLORS.MS;
  const winner = hasScore ? (row.score1 > row.score2 ? 1 : row.score2 > row.score1 ? 2 : 0) : 0;

  return (
    <div className="relative group transition-all duration-200"
      style={{
        backgroundColor: isLive ? '#1a1a1a' : '#131313',
        border: `1px solid ${isLive ? c.accent : involvesMe ? '#fbbf24' : '#2a2a2a'}`,
        boxShadow: isLive ? `0 0 24px ${c.accent}30, inset 0 1px 0 ${c.accent}20` : involvesMe ? '0 0 0 1px #fbbf2440' : 'none',
      }}>
      {isLive && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-bold tracking-widest flex items-center gap-1"
             style={{ backgroundColor: c.accent, color: '#000' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ backgroundColor: '#000', opacity: 0.5 }}></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-black"></span>
          </span>
          LIVE
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CategoryBadge cat={match.cat} small />
            {match.isPlayoff && <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-400">{match.stage}</span>}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
            <MapPin className="w-2.5 h-2.5" />COURT {match.court}
          </div>
        </div>

        {match.isPlayoff && match.label ? (
          <div className="py-2 text-center">
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{match.label}</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Winners advance · TBD</div>
            {hasScore && <div className="mt-2 font-mono font-bold text-lg" style={{ color: c.accent }}>{row.score1} — {row.score2}</div>}
          </div>
        ) : (
          <div className="space-y-1.5">
            <PlayerRow name={match.p1} score={row?.score1} isWinner={winner === 1} hasScore={hasScore} />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-neutral-800"></div>
              <span className="text-[10px] text-neutral-600 font-mono">VS</span>
              <div className="flex-1 h-px bg-neutral-800"></div>
            </div>
            <PlayerRow name={match.p2} score={row?.score2} isWinner={winner === 2} hasScore={hasScore} />
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/60">
          <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
            Umpire · {match.umpire || '—'}
          </div>
          {!match.isPlayoff && (
            <button onClick={() => onEdit(match)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-colors"
              style={{ color: hasScore ? '#737373' : c.accent, border: `1px solid ${hasScore ? '#404040' : c.accent}60` }}>
              <Edit3 className="w-2.5 h-2.5" />{hasScore ? 'Edit' : 'Score'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Score modal with PIN ----------
const ScoreModal = ({ match, row, onSave, onClose }) => {
  const [s1, setS1] = useState(row?.score1 ?? '');
  const [s2, setS2] = useState(row?.score2 ?? '');
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const c = CAT_COLORS[match.cat] || CAT_COLORS.MS;

  // Remember last-used PIN per match (so umpire doesn't retype every time)
  useEffect(() => {
    const saved = localStorage.getItem(`pin-${match.id}`);
    if (saved) setPin(saved);
  }, [match.id]);

  const save = async () => {
    setErr(null);
    if (pin.length !== 4) { setErr('Enter your 4-digit PIN'); return; }
    const n1 = s1 === '' ? null : Number(s1);
    const n2 = s2 === '' ? null : Number(s2);
    if (n1 == null || n2 == null || Number.isNaN(n1) || Number.isNaN(n2)) { setErr('Enter both scores'); return; }
    setSaving(true);
    const result = await onSave(n1, n2, pin);
    setSaving(false);
    if (result.ok) {
      localStorage.setItem(`pin-${match.id}`, pin);
      onClose();
    } else {
      setErr(result.error || 'Save failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="relative w-full max-w-md" style={{ backgroundColor: '#0a0a0a', border: `1px solid ${c.accent}` }}>
        <div className="absolute -top-px left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }}></div>

        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge cat={match.cat} small />
              <span className="text-[11px] text-neutral-500 font-mono">{formatTime12h(match.time)} · COURT {match.court}</span>
            </div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider">Enter Score</div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div>
              <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Player 1</div>
              <div className="text-sm font-bold mb-3 text-white">{match.p1}</div>
              <input type="number" min="0" inputMode="numeric" value={s1} onChange={(e) => setS1(e.target.value)}
                className="w-full text-center text-5xl font-bold font-mono tabular-nums bg-transparent py-3 outline-none text-white"
                style={{ border: `1px solid ${c.accent}60` }} placeholder="0" />
            </div>
            <div className="text-neutral-600 font-mono text-xs pt-8">VS</div>
            <div>
              <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Player 2</div>
              <div className="text-sm font-bold mb-3 text-white">{match.p2}</div>
              <input type="number" min="0" inputMode="numeric" value={s2} onChange={(e) => setS2(e.target.value)}
                className="w-full text-center text-5xl font-bold font-mono tabular-nums bg-transparent py-3 outline-none text-white"
                style={{ border: `1px solid ${c.accent}60` }} placeholder="0" />
            </div>
          </div>

          <div className="mt-5">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
              <Lock className="w-3 h-3" /> Umpire PIN
            </label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl font-mono tabular-nums bg-transparent py-3 outline-none text-white tracking-[0.5em]"
              style={{ border: '1px solid #3f3f3f' }} placeholder="••••" />
            <div className="text-[10px] text-neutral-600 text-center mt-1.5">
              Your match PIN — or the admin PIN if an umpire's doesn't work
            </div>
          </div>

          {err && <div className="mt-3 text-xs text-red-400 text-center">{err}</div>}

          <div className="flex gap-2 mt-5">
            <button onClick={save} disabled={saving}
              className="flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ backgroundColor: c.accent, color: '#000' }}>
              <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Score'}
            </button>
          </div>

          <div className="text-[10px] text-neutral-600 text-center mt-4 tracking-wider">
            Umpire: {match.umpire || '—'} · Scores sync live
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Tabs ----------
const ScheduleTab = ({ matches, liveSlot, onEdit, myPlayer }) => {
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
        const isLive = slot === liveSlot;
        return (
          <div key={slot} className="mb-8">
            <div className="flex items-baseline gap-3 mb-3 sticky top-14 py-2 z-10" style={{ backgroundColor: '#050505' }}>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">{formatTime12h(slot)}</div>
              {isLive && (
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
              {slotMatches.map(m => <MatchCard key={m.id} match={m} row={matches[m.id]} isLive={isLive} onEdit={onEdit} myPlayer={myPlayer} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StandingsTab = ({ matches }) => {
  const standings = useMemo(() => calculateStandings(matches), [matches]);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(standings[activeCat]).map(([groupName, rows]) => (
          <div key={groupName} style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}>
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
              <CategoryBadge cat={activeCat} small />
              <div className="text-sm font-bold uppercase tracking-wider text-white">Group {groupName}</div>
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
                  const q = i < 2 && r.played > 0;
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
              <span style={{ color: CAT_COLORS[activeCat].accent }}>●</span> Top 2 advance to semifinals
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BracketsTab = ({ matches }) => {
  const playoffs = SCHEDULE.filter(m => m.isPlayoff);
  const byCat = {};
  playoffs.forEach(m => {
    if (!byCat[m.cat]) byCat[m.cat] = { semis: [], finals: [] };
    if (m.stage === 'Semi') byCat[m.cat].semis.push(m); else byCat[m.cat].finals.push(m);
  });
  return (
    <div className="space-y-8">
      {Object.entries(byCat).map(([cat, { semis, finals }]) => {
        const c = CAT_COLORS[cat];
        return (
          <div key={cat} style={{ backgroundColor: '#0a0a0a', border: `1px solid ${c.accent}30` }}>
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center gap-3">
              <CategoryBadge cat={cat} />
              <div className="text-lg font-bold text-white">{CAT_LABELS[cat]}</div>
              <div className="flex-1"></div>
              <Trophy className="w-4 h-4" style={{ color: c.accent }} />
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Semifinals</div>
                  {semis.map(m => {
                    const row = matches[m.id];
                    return (
                      <div key={m.id} className="p-3" style={{ backgroundColor: '#131313', border: '1px solid #2a2a2a' }}>
                        <div className="text-[10px] text-neutral-500 font-mono mb-1.5">{formatTime12h(m.time)} · COURT {m.court}</div>
                        <div className="text-sm text-neutral-300">{m.label}</div>
                        {row?.score1 != null && row?.score2 != null && (
                          <div className="mt-1 font-mono font-bold" style={{ color: c.accent }}>{row.score1} — {row.score2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="hidden md:flex flex-col items-center">
                  <svg width="40" height="100" viewBox="0 0 40 100">
                    <path d="M 0 20 L 20 20 L 20 80 L 0 80" stroke={c.accent} strokeOpacity="0.5" fill="none" strokeWidth="1" />
                    <path d="M 20 50 L 40 50" stroke={c.accent} strokeOpacity="0.5" fill="none" strokeWidth="1" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Final</div>
                  {finals.map(m => {
                    const row = matches[m.id];
                    return (
                      <div key={m.id} className="p-4" style={{ backgroundColor: '#131313', border: `1px solid ${c.accent}60`, boxShadow: `0 0 20px ${c.accent}20` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-3 h-3" style={{ color: c.accent }} />
                          <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: c.accent }}>Championship</div>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mb-1.5">{formatTime12h(m.time)} · COURT {m.court}</div>
                        <div className="text-sm text-white font-bold">{m.label}</div>
                        {row?.score1 != null && row?.score2 != null && (
                          <div className="mt-2 font-mono font-bold text-xl" style={{ color: c.accent }}>{row.score1} — {row.score2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MyMatchesTab = ({ matches, liveSlot, onEdit, myPlayer, setMyPlayer }) => {
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
                {playing.map(m => (
                  <div key={m.id}>
                    <div className="text-[10px] font-mono text-neutral-500 mb-1">{formatTime12h(m.time)}</div>
                    <MatchCard match={m} row={matches[m.id]} isLive={m.time === liveSlot} onEdit={onEdit} myPlayer={myPlayer} />
                  </div>
                ))}
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
                {umpiring.map(m => (
                  <div key={m.id}>
                    <div className="text-[10px] font-mono text-neutral-500 mb-1">{formatTime12h(m.time)}</div>
                    <MatchCard match={m} row={matches[m.id]} isLive={m.time === liveSlot} onEdit={onEdit} myPlayer={myPlayer} />
                  </div>
                ))}
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
  const liveSlot = getLiveSlot(now);
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

  const handleSave = async (s1, s2, pin) => {
    if (!editing) return { ok: false, error: 'No match selected' };
    return await updateScore(editing.id, s1, s2, pin);
  };

  const completed = Object.values(matches).filter(r => r.score1 != null && r.score2 != null && !r.is_playoff).length;
  const totalNonPlayoff = SCHEDULE.filter(m => !m.isPlayoff).length;

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
                <span>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span className="text-neutral-700">·</span>
                <span className="tabular-nums">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-neutral-700">·</span>
                <span className="flex items-center gap-1" style={{ color: connected ? '#4ade80' : '#737373' }}>
                  {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {connected ? 'LIVE SYNC' : 'OFFLINE'}
                </span>
                {liveSlot && (
                  <>
                    <span className="text-neutral-700">·</span>
                    <span className="text-red-400 flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      SLOT {liveSlot} LIVE
                    </span>
                  </>
                )}
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
            { id: 'brackets', icon: Trophy, label: 'Brackets' },
            { id: 'my', icon: User, label: 'My Matches' },
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
            {activeTab === 'schedule' && <ScheduleTab matches={matches} liveSlot={liveSlot} onEdit={setEditing} myPlayer={myPlayer} />}
            {activeTab === 'standings' && <StandingsTab matches={matches} />}
            {activeTab === 'brackets' && <BracketsTab matches={matches} />}
            {activeTab === 'my' && <MyMatchesTab matches={matches} liveSlot={liveSlot} onEdit={setEditing} myPlayer={myPlayer} setMyPlayer={setMyPlayer} />}
          </>
        )}
      </main>

      <footer className="border-t border-neutral-900 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Tournament info block */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
            {/* Poster thumbnail */}
            <a href="/tournament-poster.jpg" target="_blank" rel="noopener noreferrer"
               className="block shrink-0 transition-opacity hover:opacity-80"
               title="View full poster">
              <img src="/tournament-poster.jpg" alt="MTCSV Yuvajana Sakhyam Badminton Tournament poster"
                   className="w-full md:w-48 h-auto rounded" style={{ border: '1px solid #2a2a2a' }} />
            </a>

            {/* Info text */}
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

          {/* Bottom strip */}
          <div className="mt-8 pt-4 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-600 uppercase tracking-widest">
            <span>Per-match umpire PINs · Admin override available</span>
            <span>Realtime · Supabase</span>
          </div>
        </div>
      </footer>

      {editing && <ScoreModal match={editing} row={matches[editing.id]} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}
