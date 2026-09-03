# How to enter your players, teams, and schedule

All match data lives in one file: **[`lib/tournament-data.mjs`](lib/tournament-data.mjs)**.
It currently contains a full working example with dummy names — a real 1-day,
3-court, 5-event tournament. The easiest way to build yours is to edit that
example in place.

Event/branding settings (tournament name, date, venue, contact) are separate,
in **[`tournament.config.json`](tournament.config.json)**.

The file has five sections that must agree with each other. Fill them in this order.

## 1. `GROUPS` — who is playing, in round-robin groups

Per category — `MS` (Men's Singles), `MD` (Men's Doubles), `WS` (Women's
Singles), `WD` (Women's Doubles), `MXD` (Mixed Doubles) — list the groups and
their members. Singles categories use player names; doubles categories use
team names:

```js
export const GROUPS = {
  MS: {
    'Group A': ['Arun', 'Vivek', 'Sanjay', 'Ram'],
    'Group B': ['Kiran', 'Dev', 'Tom', 'Jose'],
  },
  MD: {
    'Group A': ['Smash Bros', 'Arun/Vivek'],   // named team, or a "P1/P2" pair
  },
  // ...
};
```

Top finishers of each group advance to the semi-finals (you decide how many
in section 4).

## 2. `TEAM_ROSTERS` — who is on each *named* doubles team

Only needed for teams with invented names, so the "My Matches" tab can find a
person's team games. Pair-style names like `'Arun/Vivek'` don't need an entry:

```js
export const TEAM_ROSTERS = {
  'Smash Bros': ['Kiran', 'Dev'],
};
```

## 3. `SCHEDULE` — one row per match

Time is 24-hour `"HH:MM"`. `scoringFormat` is points-to-win for that match:

```js
{ id: 'm1', time: '13:00', court: 1, cat: 'MS', p1: 'Arun', p2: 'Vivek',
  umpire: 'Kiran', isPlayoff: false, matchType: 'prelim', scoringFormat: 15, label: 'MS Prelim' },
```

How many prelim matches you need: a round-robin group of 4 is 6 matches
(everyone plays everyone), a group of 3 is 3 matches, a group of 2 is 1.

**Playoff matches (semis/finals) are three rows each** — one per set — sharing
a `parentMatchId`. Use placeholder names; the real names resolve automatically
from group standings once prelims finish:

```js
{ id: 'm40_s1', time: '18:00', court: 1, cat: 'MS',
  p1: 'MS Group A Winner', p2: 'MS Group B Winner', umpire: 'TBD',
  isPlayoff: true, matchType: 'semi', scoringFormat: 21,
  label: 'MS Semi 1 - Set 1', setNumber: 1, parentMatchId: 'm40' },
// ...repeat with id 'm40_s2' / setNumber: 2, and 'm40_s3' / setNumber: 3
```

Scheduling sanity checks: no player or team on two courts at the same time
slot, and umpires shouldn't be playing in the match they officiate.

## 4. `PLAYOFF_STRUCTURE` — which group ranks feed each semi-final

Keys are the semi-final's `parentMatchId` from the schedule:

```js
export const PLAYOFF_STRUCTURE = {
  m40: { cat: 'MS', label: 'MS Semi 1',
         slot1: { group: 'Group A', rank: 1 }, slot2: { group: 'Group B', rank: 2 } },
  m41: { cat: 'MS', label: 'MS Semi 2',
         slot1: { group: 'Group B', rank: 1 }, slot2: { group: 'Group A', rank: 2 } },
};
```

## 5. `FINALS_STRUCTURE` — which semi winners meet in each final

```js
export const FINALS_STRUCTURE = {
  m50: { cat: 'MS', label: 'MS Final', semi1: 'm40', semi2: 'm41' },
};
```

## The rules that matter

- Names must match **character-for-character** across `SCHEDULE`, `GROUPS`,
  and `TEAM_ROSTERS` — that's how standings and "My Matches" link up.
  (`NAME_ALIASES` can map alternate spellings if needed.)
- Every match `id` must be unique.
- Keep the category codes to `MS`, `MD`, `WS`, `WD`, `MXD` (display names are
  in `CAT_LABELS`).

## After editing

1. Commit and push to `main` — the site redeploys automatically.
2. If you're running with a real Supabase backend, re-seed the database:
   `npm run seed`. This reloads all matches and regenerates the printable
   umpire PIN sheet (`pin-sheet.html`) — reprint it, since PINs change.

## Tip

You don't have to write this by hand. Paste your entry list (a spreadsheet
export, or just "MS: these 12 players, MD: these 6 teams…"), the start time,
and the number of courts into an AI assistant along with the current
`lib/tournament-data.mjs`, and ask it to regenerate the file in the same
format with a conflict-free schedule. That's how the original was made.
