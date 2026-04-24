'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SCHEDULE, GROUPS, CAT_LABELS, NAME_ALIASES } from '../lib/tournament-data';

// ============================================================
// Light palette — designed for bright gyms, 10+ ft viewing
// ============================================================
const CAT_COLORS = {
  MS:  { accent: '#1e40af', soft: '#dbeafe', text: '#1e3a8a' },  // deep blue
  MD:  { accent: '#6d28d9', soft: '#ede9fe', text: '#5b21b6' },  // purple
  MXD: { accent: '#c2410c', soft: '#ffedd5', text: '#9a3412' },  // burnt orange
  WS:  { accent: '#be185d', soft: '#fce7f3', text: '#9d174d' },  // pink
  WD:  { accent: '#047857', soft: '#d1fae5', text: '#065f46' },  // green
};

const CYCLE_SECONDS = 20;

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
const timeToMinutes = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const fmtTime = (t) => {
  const [h,m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  return `${h%12||12}:${String(m).padStart(2,'0')} ${p}`;
};

const normalizeName = (s) => s.replace(/\s+/g, '').toLowerCase();
const teamPrefix = (s) => normalizeName(s.split('-')[0].trim());
const namesMatch = (gp, sp) => {
  const a = normalizeName(gp), b = normalizeName(sp);
  if (a === b) return true;
  if (teamPrefix(gp) === b) return true;
  if (a === teamPrefix(sp)) return true;
  if (NAME_ALIASES[sp] && normalizeName(NAME_ALIASES[sp]) === a) return true;
  return false;
};

// ------------------------------------------------------------
// Supabase realtime hook (same pattern as main app)
// ------------------------------------------------------------
function useMatches() {
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('matches_public').select('*');
      if (!mounted) return;
      if (error) { console.error(error); setLoading(false); return; }
      const m = {};
      for (const r of data) m[r.id] = r;
      setMatches(m);
      setLoading(false);
    })();

    const channel = supabase
      .channel('tv-matches')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const { pin, ...safe } = payload.new;
          setMatches(prev => ({ ...prev, [safe.id]: { ...prev[safe.id], ...safe } }));
        })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { matches, loading };
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(i); }, []);
  return now;
}

// Check if a match is actively being scored (last activity within 5 minutes)
const isMatchLive = (row, now) => {
  if (!row || !row.last_activity) return false;
  const lastActivity = new Date(row.last_activity);
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
  return lastActivity > fiveMinutesAgo;
};

const getNextSlot = (now) => {
  const nm = now.getHours()*60 + now.getMinutes();
  const slots = [...new Set(SCHEDULE.map(m => m.time))].sort();
  for (const s of slots) { if (timeToMinutes(s) > nm) return s; }
  return null;
};

// ------------------------------------------------------------
// Standings calc
// ------------------------------------------------------------
const calculateStandings = (matches) => {
  const st = {};
  Object.entries(GROUPS).forEach(([cat, groups]) => {
    st[cat] = {};
    Object.entries(groups).forEach(([g, players]) => {
      st[cat][g] = players.map(p => ({ name: p, played: 0, won: 0, lost: 0, pf: 0, pa: 0 }));
    });
  });
  SCHEDULE.forEach(match => {
    if (match.isPlayoff) return;
    const row = matches[match.id];
    // Only count matches officially marked as final
    if (!row || !row.is_final) return;
    const s1 = row.score1, s2 = row.score2;
    const groups = GROUPS[match.cat] || {};
    for (const [gName, players] of Object.entries(groups)) {
      const i1 = players.findIndex(p => namesMatch(p, match.p1));
      const i2 = players.findIndex(p => namesMatch(p, match.p2));
      if (i1 >= 0 && i2 >= 0) {
        const e1 = st[match.cat][gName][i1], e2 = st[match.cat][gName][i2];
        e1.played++; e2.played++;
        e1.pf += s1; e1.pa += s2;
        e2.pf += s2; e2.pa += s1;
        if (s1 > s2) { e1.won++; e2.lost++; } else if (s2 > s1) { e2.won++; e1.lost++; }
        break;
      }
    }
  });
  Object.values(st).forEach(cat => Object.values(cat).forEach(g => g.sort((a,b) => {
    if (b.won !== a.won) return b.won - a.won;
    return (b.pf - b.pa) - (a.pf - a.pa);
  })));
  return st;
};

// ============================================================
// PANEL 1: Live matches across all 3 courts + next slot preview
// ============================================================
const LiveMatchesPanel = ({ matches, now, nextSlot }) => {
  // Find all matches with recent activity (live matches)
  const liveMatches = SCHEDULE.filter(m => isMatchLive(matches[m.id], now)).sort((a,b) => a.court - b.court);
  const hasLive = liveMatches.length > 0;
  const nextMatches = nextSlot ? SCHEDULE.filter(m => m.time === nextSlot).sort((a,b) => a.court - b.court) : [];

  return (
    <div className="h-full flex flex-col gap-6 px-10 pb-10">
      {/* Live section — takes ~2/3 of vertical */}
      <div className="flex-[2] flex flex-col min-h-0">
        <div className="flex items-baseline gap-4 mb-4">
          <div className="text-5xl font-black text-slate-900 tracking-tight">
            {hasLive ? 'NOW PLAYING' : 'UP NEXT'}
          </div>
          {hasLive && liveMatches.length > 0 && (
            <div className="text-3xl font-mono font-bold text-slate-600 tabular-nums">
              {fmtTime(liveMatches[0].time)}
            </div>
          )}
          {!hasLive && nextSlot && (
            <div className="text-3xl font-mono font-bold text-slate-600 tabular-nums">
              {fmtTime(nextSlot)}
            </div>
          )}
          {hasLive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white font-bold text-lg rounded">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              LIVE
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
          {[1,2,3].map(court => {
            const match = (hasLive ? liveMatches : nextMatches).find(m => m.court === court);
            return <CourtCard key={court} court={court} match={match} matches={matches} isLive={isMatchLive(matches[match?.id], now)} />;
          })}
        </div>
      </div>

      {/* Next preview — bottom 1/3 (only when something is live) */}
      {hasLive && nextSlot && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-baseline gap-4 mb-3">
            <div className="text-3xl font-black text-slate-500 tracking-tight">UP NEXT</div>
            <div className="text-2xl font-mono font-bold text-slate-400 tabular-nums">{fmtTime(nextSlot)}</div>
          </div>
          <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
            {[1,2,3].map(court => {
              const match = nextMatches.find(m => m.court === court);
              return <NextCard key={court} court={court} match={match} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const CourtCard = ({ court, match, matches, isLive }) => {
  if (!match) {
    return (
      <div className="rounded-2xl bg-white border-2 border-slate-200 flex flex-col items-center justify-center">
        <div className="text-xl text-slate-400 font-bold tracking-widest">COURT {court}</div>
        <div className="text-base text-slate-300 mt-2">No match</div>
      </div>
    );
  }

  const row = matches[match.id];
  const hasScore = row && row.score1 != null && row.score2 != null;
  const isFinal = !!row?.is_final;
  const winner = hasScore ? (row.score1 > row.score2 ? 1 : row.score2 > row.score1 ? 2 : 0) : 0;
  const winnerName = winner === 1 ? match.p1 : winner === 2 ? match.p2 : null;
  const c = CAT_COLORS[match.cat];

  return (
    <div className="rounded-2xl bg-white shadow-lg flex flex-col overflow-hidden"
         style={{ border: `3px solid ${isFinal ? '#15803d' : isLive ? c.accent : '#e2e8f0'}` }}>
      {/* Top strip */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: c.soft }}>
        <div className="flex items-center gap-3">
          <div className="text-xl font-black tracking-widest" style={{ color: c.text }}>COURT {court}</div>
          {row?.match_type && row.match_type !== 'prelim' && (
            <div className="text-sm font-bold tracking-wider px-2 py-0.5 rounded"
                 style={{ backgroundColor: row.match_type === 'semi' ? '#854d0e' : '#7c2d12', color: '#fff' }}>
              {row.match_type === 'semi' ? 'SEMI' : 'FINAL'}
            </div>
          )}
        </div>
        <div className="text-base font-bold tracking-widest px-2.5 py-0.5 rounded" style={{ backgroundColor: c.accent, color: '#fff' }}>
          {match.cat}
        </div>
      </div>

      {/* Players and scores */}
      <div className="flex-1 flex flex-col justify-center px-6 py-5 gap-4 min-h-0">
        <PlayerLine name={match.p1} score={row?.score1} isWinner={winner === 1} hasScore={hasScore} big />
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-sm text-slate-400 font-mono font-bold">VS</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>
        <PlayerLine name={match.p2 || '—'} score={row?.score2} isWinner={winner === 2} hasScore={hasScore} big />
      </div>

      {/* Umpire strip */}
      <div className="px-5 py-2 border-t border-slate-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
          Umpire · {match.umpire || '—'}
        </div>
        {isFinal && winnerName && (
          <div className="text-sm font-bold text-emerald-600 tracking-wider uppercase flex items-center gap-2">
            <span className="text-emerald-500">🏆</span> Complete · {winnerName} wins
          </div>
        )}
      </div>
    </div>
  );
};

const PlayerLine = ({ name, score, isWinner, hasScore, big }) => (
  <div className="flex items-center justify-between gap-4">
    <div className={`${big ? 'text-3xl' : 'text-xl'} font-black truncate ${isWinner ? 'text-slate-900' : hasScore ? 'text-slate-400' : 'text-slate-700'}`}>
      {isWinner && <span className="text-emerald-500 mr-2">▸</span>}{name}
    </div>
    <div className={`font-mono font-black tabular-nums ${isWinner ? 'text-slate-900' : hasScore ? 'text-slate-400' : 'text-slate-300'} ${big ? 'text-6xl' : 'text-4xl'}`}>
      {hasScore ? score : '—'}
    </div>
  </div>
);

const NextCard = ({ court, match }) => {
  if (!match) return (
    <div className="rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
      <div className="text-sm text-slate-400 tracking-widest">COURT {court} · NO MATCH</div>
    </div>
  );
  const c = CAT_COLORS[match.cat];
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 flex items-center gap-4">
      <div className="text-sm font-black text-slate-400 tracking-widest w-20 shrink-0">COURT {court}</div>
      <div className="text-sm font-bold tracking-widest px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: c.accent, color: '#fff' }}>{match.cat}</div>
      <div className="flex-1 min-w-0 flex items-center gap-3 text-xl font-bold text-slate-700">
        <span className="truncate">{match.p1}</span>
        <span className="text-slate-400 text-sm font-mono shrink-0">VS</span>
        <span className="truncate">{match.p2 || '—'}</span>
      </div>
    </div>
  );
};

// ============================================================
// PANEL 2: Standings — cycles through each category's groups
// ============================================================
const StandingsPanel = ({ matches, now, subIndex }) => {
  const standings = useMemo(() => calculateStandings(matches), [matches]);

  // Build all "category + group" panels to show
  const panels = useMemo(() => {
    const out = [];
    for (const cat of Object.keys(GROUPS)) {
      for (const groupName of Object.keys(GROUPS[cat])) {
        out.push({ cat, groupName });
      }
    }
    return out;
  }, []);

  if (panels.length === 0) return null;
  // Show 4 groups per screen (fits nicely in a 2x2 grid on 1080p)
  const perScreen = 4;
  const totalScreens = Math.ceil(panels.length / perScreen);
  const screen = subIndex % totalScreens;
  const visible = panels.slice(screen * perScreen, screen * perScreen + perScreen);

  return (
    <div className="h-full flex flex-col px-10 pb-10">
      <div className="flex items-baseline gap-4 mb-5">
        <div className="text-5xl font-black text-slate-900 tracking-tight">GROUP STANDINGS</div>
        <div className="text-2xl font-bold text-slate-400">
          {screen + 1}<span className="text-slate-300"> / {totalScreens}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
        {visible.map(({ cat, groupName }) => (
          <StandingsCard key={`${cat}-${groupName}`} cat={cat} groupName={groupName} rows={standings[cat][groupName]} />
        ))}
      </div>
    </div>
  );
};

const StandingsCard = ({ cat, groupName, rows }) => {
  const c = CAT_COLORS[cat];
  return (
    <div className="rounded-2xl bg-white shadow-md border-2 border-slate-200 flex flex-col overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: c.soft }}>
        <div className="text-xl font-black tracking-tight" style={{ color: c.text }}>
          {CAT_LABELS[cat]} · Group {groupName}
        </div>
        <div className="text-sm font-bold tracking-widest px-2.5 py-0.5 rounded" style={{ backgroundColor: c.accent, color: '#fff' }}>{cat}</div>
      </div>
      <table className="w-full flex-1 text-lg">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-100">
            <th className="text-left px-4 py-2 w-10">#</th>
            <th className="text-left px-2 py-2">Player</th>
            <th className="text-center px-2 py-2 w-10">P</th>
            <th className="text-center px-2 py-2 w-10">W</th>
            <th className="text-center px-2 py-2 w-14">+/-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const diff = r.pf - r.pa;
            const q = i < 2 && r.played > 0;
            return (
              <tr key={r.name} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-mono font-bold">
                  {q ? <span style={{ color: c.accent }}>{i+1}</span> : <span className="text-slate-400">{i+1}</span>}
                </td>
                <td className="px-2 py-2 font-bold text-slate-800 truncate">{r.name}</td>
                <td className="px-2 py-2 text-center font-mono text-slate-500">{r.played}</td>
                <td className="px-2 py-2 text-center font-mono font-black text-slate-900">{r.won}</td>
                <td className={`px-2 py-2 text-center font-mono font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {diff > 0 ? '+' : ''}{diff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// PANEL 3: Brackets — one category per sub-cycle
// ============================================================
const BracketsPanel = ({ matches, now, subIndex }) => {
  const categories = Object.keys(GROUPS);
  const cat = categories[subIndex % categories.length];
  const playoffs = SCHEDULE.filter(m => m.isPlayoff && m.cat === cat);
  const semis = playoffs.filter(m => m.stage === 'Semi');
  const finals = playoffs.filter(m => m.stage === 'Final');
  const c = CAT_COLORS[cat];

  return (
    <div className="h-full flex flex-col px-10 pb-10">
      <div className="flex items-baseline gap-4 mb-5">
        <div className="text-5xl font-black text-slate-900 tracking-tight">BRACKETS</div>
        <div className="text-3xl font-black tracking-tight" style={{ color: c.text }}>· {CAT_LABELS[cat]}</div>
        <div className="text-2xl font-bold text-slate-400 ml-auto">
          {(subIndex % categories.length) + 1}<span className="text-slate-300"> / {categories.length}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_80px_1fr] gap-8 items-center min-h-0">
        {/* Semis column */}
        <div className="flex flex-col gap-6 justify-center">
          <div className="text-xl font-black tracking-widest text-slate-500 uppercase">Semifinals</div>
          {semis.map(m => {
            const row = matches[m.id];
            const hasScore = row && row.score1 != null && row.score2 != null;
            return (
              <div key={m.id} className="rounded-xl bg-white shadow-md border-2 p-5" style={{ borderColor: c.soft }}>
                <div className="text-sm font-mono font-bold text-slate-400 mb-2 tracking-wider">
                  {fmtTime(m.time)} · COURT {m.court}
                </div>
                <div className="text-2xl font-bold text-slate-800 leading-tight">{m.label}</div>
                {hasScore && (
                  <div className="mt-3 text-4xl font-mono font-black" style={{ color: c.accent }}>
                    {row.score1} — {row.score2}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Connector */}
        <svg viewBox="0 0 80 200" className="h-full w-full" preserveAspectRatio="none">
          <path d="M 0 40 L 40 40 L 40 160 L 0 160" stroke={c.accent} strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M 40 100 L 80 100" stroke={c.accent} strokeWidth="2" fill="none" opacity="0.5" />
        </svg>

        {/* Final */}
        <div className="flex flex-col gap-4 justify-center">
          <div className="text-xl font-black tracking-widest uppercase" style={{ color: c.accent }}>Championship</div>
          {finals.map(m => {
            const row = matches[m.id];
            const hasScore = row && row.score1 != null && row.score2 != null;
            return (
              <div key={m.id} className="rounded-xl p-6 shadow-xl"
                   style={{ backgroundColor: c.soft, border: `3px solid ${c.accent}` }}>
                <div className="text-sm font-mono font-bold tracking-wider mb-2" style={{ color: c.text }}>
                  {fmtTime(m.time)} · COURT {m.court}
                </div>
                <div className="text-3xl font-black leading-tight" style={{ color: c.text }}>🏆 {m.label}</div>
                {hasScore && (
                  <div className="mt-4 text-5xl font-mono font-black" style={{ color: c.accent }}>
                    {row.score1} — {row.score2}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Cycle indicator (dots at the top)
// ============================================================
const CycleIndicator = ({ panels, activeIndex, elapsed }) => {
  const pct = Math.min(100, (elapsed / CYCLE_SECONDS) * 100);
  return (
    <div className="flex items-center gap-2">
      {panels.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`text-sm font-black tracking-widest uppercase transition-colors ${i === activeIndex ? 'text-slate-900' : 'text-slate-300'}`}>
            {p.label}
          </div>
          {i < panels.length - 1 && <div className="text-slate-200">·</div>}
        </div>
      ))}
      <div className="ml-4 w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-slate-900 transition-all duration-1000 ease-linear"
             style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN TV DASHBOARD
// ============================================================
export default function TvDashboard() {
  const { matches, loading } = useMatches();
  const now = useClock();
  const nextSlot = getNextSlot(now);

  // Panel cycling state
  const [panelIndex, setPanelIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Panels list — skip panels that have nothing to show
  const panels = [
    { label: 'Matches', component: LiveMatchesPanel },
    { label: 'Standings', component: StandingsPanel },
    { label: 'Brackets', component: BracketsPanel },
  ];

  // Tick every second for progress bar, advance panel every CYCLE_SECONDS
  useEffect(() => {
    const i = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= CYCLE_SECONDS) {
          // advance
          setPanelIndex(p => (p + 1) % panels.length);
          setSubIndex(s => s + 1);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [panels.length]);

  const ActiveComponent = panels[panelIndex].component;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-10 py-5 border-b-2 border-slate-200 bg-white">
        <div className="flex items-baseline gap-4">
          <div className="font-black text-4xl tracking-tight text-slate-900">🏸 MTCSV OPEN</div>
          <div className="text-lg font-semibold text-slate-500">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <CycleIndicator panels={panels} activeIndex={panelIndex} elapsed={elapsed} />
          <div className="text-3xl font-mono font-black text-slate-900 tabular-nums">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main panel area */}
      <main className="flex-1 pt-8 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-2xl text-slate-400">Loading tournament…</div>
        ) : (
          <ActiveComponent matches={matches} now={now} nextSlot={nextSlot} subIndex={subIndex} />
        )}
      </main>

      {/* Tournament info strip — always visible at bottom */}
      <footer className="shrink-0 border-t-2 border-slate-200 bg-white px-10 py-3 flex items-center gap-6">
        <img src="/tournament-poster.jpg" alt="Tournament poster"
             className="h-14 w-auto rounded shadow-sm" style={{ border: '1px solid #e2e8f0' }} />
        <div className="flex-1 flex items-baseline gap-6 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">MTCSV Yuvajana Sakhyam</div>
            <div className="text-lg font-black text-slate-900 leading-tight">
              Badminton Tournament <span className="text-amber-600 italic font-serif font-normal text-base">"Serve for His Glory!"</span>
            </div>
          </div>
          <div className="flex items-baseline gap-6 text-sm text-slate-600 ml-auto">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 mr-1">When</span>
              <span className="font-bold text-slate-900">Sat · 4/25/2026 · 1–7 PM</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 mr-1">Where</span>
              <span className="font-bold text-slate-900">Kerala House, Fremont</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 mr-1">Contact</span>
              <span className="font-bold text-slate-900">Nishant George · 267-530-9577</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
