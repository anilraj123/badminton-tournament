# Badminton Tournament — Live Scores

A reusable one-day badminton tournament site. Next.js 14 + Supabase. Realtime score sync across all devices. Score entry is gated by a single shared PIN.

This repo ships as a **template with dummy teams** — a full working schedule (3 courts, 5 events, group stage → semis → finals) populated with placeholder names. Swap in your own tournament's details and go.

## What you get

- **Public read-only site** anyone can visit — schedule, live scores, standings, brackets, per-player "My Matches" view
- **TV dashboard** at `/tv` — big-screen live view for the gym
- **Score entry** requires a 4-digit PIN — this tournament uses **one shared PIN (`1111`) for every match**, so there are no slips to print or hand out
- **Admin PIN** works for any match; it is also `1111` by default, so anyone at the venue can correct any score
- **Realtime sync** via Supabase channels — score changes appear on every open tab within a second

## Try it immediately (no accounts needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase credentials configured, the site runs off the bundled schedule: **any 4-digit PIN** accepts score entry, and scores are stored in your browser (synced across tabs, not across devices). This is for previewing and editing — for a real tournament, set up Supabase below so all devices share live scores and PINs are enforced.

## Customize for your tournament

1. **`tournament.config.json`** (repo root) — tournament name, organizer, date, venue, contact, tagline, poster. Everything branded reads from this one file; it's plain JSON, so you can edit it directly in the GitHub web editor.
2. **`lib/tournament-data.mjs`** — replace the dummy names: `SCHEDULE` (every match: time, court, category, players, umpire), `GROUPS` (round-robin groups), `TEAM_ROSTERS` (doubles team members), `PLAYOFF_STRUCTURE` / `FINALS_STRUCTURE` (how group ranks feed semis and finals). Names must match exactly across all of these. **See [DATA-GUIDE.md](DATA-GUIDE.md) for a step-by-step walkthrough with examples.**
3. **`components/Rules.jsx`** — review the scoring format, tie-break, and general-rules text.
4. **Poster** (optional) — drop an image into `public/` and point `poster` in the config at it.

## One-time setup (~15 minutes)

### 1. Create a Supabase project
- Go to https://supabase.com → New project
- Name it after your tournament
- Pick a strong DB password, save it
- Region: whichever is closest to your venue
- Wait for project to spin up (~2 min)

### 2. Run the schema
- In Supabase, open **SQL Editor** → New query
- Paste the contents of `supabase/schema.sql`
- Click **Run**. Should see "Success. No rows returned."

### 3. Enable Realtime
- Go to **Database → Replication**
- Find the `matches` table and toggle replication **ON**
- (The schema also does this, but double-check)

### 4. Copy your Supabase credentials
- Go to **Project Settings → API**
- Copy these three values:
  - `Project URL` → this is your `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role secret` key → this is your `SUPABASE_SERVICE_ROLE_KEY` (used only for seeding — never commit, never deploy)

### 5. Seed the matches
```bash
cp .env.example .env.local
# Edit .env.local and fill in the Supabase values above
# ADMIN_PIN is the master PIN; MATCH_PIN (optional, default 1111) is the PIN
# every match shares. Set MATCH_PIN only if you want something other than 1111.

npm run seed
```
This:
- Stamps every match with the shared PIN and inserts them all into Supabase
- Sets the admin PIN in the `config` table

Re-run the seed any time you change `lib/tournament-data.mjs`. It upserts, and because
the PIN is fixed rather than generated, **re-seeding is safe** — it never invalidates a
PIN anyone is already using.

To go back to unique per-match PINs and a printable slip sheet, see git history for
`scripts/seed.mjs` before the fixed-PIN change.

### 6. Deploy to Vercel

Push the repo to GitHub, then on [vercel.com](https://vercel.com):
1. **Add New Project** → Import your GitHub repo
2. Framework Preset: **Next.js** (auto-detected)
3. Environment Variables — add these two:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - ⚠️ Do **NOT** add the service role key — it's only for seeding
4. Click **Deploy**. Takes ~60 seconds.

You'll get a URL like `your-tournament.vercel.app`. That's your live site. (Note: Supabase free-tier projects pause after ~1 week of inactivity — create/resume the project close to tournament day.)

## Clearing test scores

Anyone trying the site out will leave scores on the board. Wipe them all:

```bash
npm run reset-scores -- --dry-run   # list what would be cleared
npm run reset-scores                # actually clear them
```

Clears scores only — schedule, PINs and admin config are untouched, so there
is no need to re-seed afterwards. **Run this after any test session and once
more before the first serve.**

## Tournament day

0. **Clear any test scores** — `npm run reset-scores` (see above)
1. **Share the URL** with everyone (players, spectators, umpires); put `/tv` on the gym screen
2. **Tell umpires the PIN — it's `1111` for every match**
3. When an umpire taps "Score" on their match, they enter the scores and the PIN. Changes appear live on every other device.

Because the PIN is shared, anyone who knows it can edit any match. That's the intended
trade-off here: no slips to lose, no umpire locked out mid-match.

## Fixing issues during tournament

- **Umpire forgot the PIN?** → It's `1111`, same for every match
- **Wrong score entered?** → Anyone with the PIN can tap "Edit" and correct it
- **New match added?** → Edit `lib/tournament-data.mjs`, redeploy, re-seed. Rare — avoid if possible.
- **Realtime stopped working?** → Check Supabase dashboard → Database → Replication; toggle off/on

## File map

```
tournament.config.json   ← EDIT: name, dates, venue, contact
app/
  layout.jsx           Root layout with fonts
  page.jsx             Entry — renders TournamentApp
  tv/page.jsx          TV dashboard route
  globals.css          Tailwind + reset
components/
  TournamentApp.jsx    Main component — tabs, scoring, realtime
  TvDashboard.jsx      Big-screen live dashboard
  Rules.jsx            Rules tab content
lib/
  tournament-config.mjs  Loads /tournament.config.json
  tournament-data.mjs    ← EDIT: schedule, groups, rosters
  tournament-data.js     Re-exports .mjs for Next.js
  supabase.js            Client (falls back to in-browser data when unconfigured)
scripts/
  seed.mjs             Insert matches, all sharing one PIN
  reset-scores.mjs     Wipe all scores back to "not started"
supabase/
  schema.sql           Tables, RLS, update_score RPC
```

## Security notes

- The `matches` table has RLS enabled with **no write policies** — no client can directly insert/update/delete
- All writes go through the `update_score` RPC which verifies the PIN server-side
- The PIN column is NOT exposed client-side — we read from `matches_public` view which excludes it
- Admin PIN is stored in `config` table which has no public read policy
- ⚠️ With a single shared PIN, that PIN is the only thing standing between a visitor and
  the scores. It stops accidental edits, not determined ones — fine for a church
  tournament, not a model to copy somewhere stakes are higher
- Service role key is only used locally during seeding; it's never in the deployed app

## Cost

- Supabase free tier: 500 MB DB, 2 GB bandwidth, 200 concurrent realtime connections → way more than a one-day tournament needs
- Vercel free (Hobby) tier: unlimited for this traffic
- **Total: $0**
