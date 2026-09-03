# Badminton Tournament — Live Scores

A reusable one-day badminton tournament site. Next.js 14 + Supabase. Realtime score sync across all devices. Per-match umpire PINs + admin override.

This repo ships as a **template with dummy teams** — a full working schedule (3 courts, 5 events, group stage → semis → finals) populated with placeholder names. Swap in your own tournament's details and go.

## What you get

- **Public read-only site** anyone can visit — schedule, live scores, standings, brackets, per-player "My Matches" view
- **TV dashboard** at `/tv` — big-screen live view for the gym
- **Score entry** requires the 4-digit PIN printed on the umpire's slip
- **Admin PIN** works for any match, used if an umpire PIN fails or to fix mistakes
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

### 5. Seed the matches (generates PINs)
```bash
cp .env.example .env.local
# Edit .env.local and fill in the Supabase values above
# Also set ADMIN_PIN to a 4-digit PIN of your choosing (e.g., 9472)

npm run seed
```
This:
- Generates a unique 4-digit PIN per match (collision-free, avoids your admin PIN)
- Inserts every match into Supabase
- Writes `pin-sheet.html` — **open it in a browser, print it, cut into strips, hand each umpire their slip**

Re-run the seed any time you change `lib/tournament-data.mjs` (it upserts, but note re-seeding regenerates PINs — reprint the sheet).

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

## Tournament day

1. **Share the URL** with everyone (players, spectators, umpires); put `/tv` on the gym screen
2. **Hand umpires their PIN slips**
3. **Keep your admin PIN secret** until you need it
4. When an umpire taps "Score" on their match, they enter the scores and the PIN. Changes appear live on every other device.

## Fixing issues during tournament

- **Umpire lost their PIN?** → Give them the admin PIN for that match only
- **Wrong score entered?** → Anyone with the match PIN or admin PIN can tap "Edit" and correct it
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
  seed.mjs             Insert matches with PINs + print sheet
supabase/
  schema.sql           Tables, RLS, update_score RPC
```

## Security notes

- The `matches` table has RLS enabled with **no write policies** — no client can directly insert/update/delete
- All writes go through the `update_score` RPC which verifies the PIN server-side
- The PIN column is NOT exposed client-side — we read from `matches_public` view which excludes it
- Admin PIN is stored in `config` table which has no public read policy
- Service role key is only used locally during seeding; it's never in the deployed app

## Cost

- Supabase free tier: 500 MB DB, 2 GB bandwidth, 200 concurrent realtime connections → way more than a one-day tournament needs
- Vercel free (Hobby) tier: unlimited for this traffic
- **Total: $0**
