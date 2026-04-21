# Badminton Tournament — Live Scores

Next.js 14 + Supabase. Realtime score sync across all devices. Per-match umpire PINs + admin override.

## What you're deploying

- **Public read-only site** anyone can visit — schedule, live scores, standings, brackets, per-player view
- **Score entry** requires the 4-digit PIN printed on the umpire's slip
- **Admin PIN** works for any match, used if an umpire PIN fails or to fix mistakes
- **Realtime sync** via Supabase channels — score changes appear on every open tab within a second

## One-time setup (~15 minutes)

### 1. Create a Supabase project
- Go to https://supabase.com → New project
- Name it `badminton-tournament` (or whatever)
- Pick a strong DB password, save it
- Region: US West (Oregon) — closest to San Jose
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
  - `Project URL` → this is your `SUPABASE_URL`
  - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role secret` key → this is your `SUPABASE_SERVICE_ROLE_KEY` (used only for seeding — never commit, never deploy)

### 5. Seed the matches (generates PINs)
```bash
cp .env.example .env.local
# Edit .env.local and fill in the three Supabase values above
# Also set ADMIN_PIN to a 4-digit PIN of your choosing (e.g., 9472)

npm install
npm run seed
```
This:
- Generates a unique 4-digit PIN per match (collision-free, avoids your admin PIN)
- Inserts all 82 matches into Supabase
- Writes `pin-sheet.html` — **open it in a browser, print it, cut into strips, hand each umpire their slip**

### 6. Deploy to Vercel
```bash
git init
git add .
git commit -m "Initial tournament site"
# Create a new repo on GitHub (private is fine), then:
git remote add origin git@github.com:anilraj123/badminton-tournament.git
git push -u origin main
```

Then on [vercel.com](https://vercel.com):
1. **Add New Project** → Import your GitHub repo
2. Framework Preset: **Next.js** (auto-detected)
3. Environment Variables — add these two:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - ⚠️ Do **NOT** add the service role key — it's only for seeding
4. Click **Deploy**. Takes ~60 seconds.

You'll get a URL like `badminton-tournament-abc123.vercel.app`. That's your live site.

## Tournament day

1. **Share the URL** with everyone (players, spectators, umpires)
2. **Hand umpires their PIN slips**
3. **Keep your admin PIN secret** until you need it
4. When an umpire taps "Score" on their match, they enter the scores and the PIN. Changes appear live on every other device.

## Fixing issues during tournament

- **Umpire lost their PIN?** → Give them the admin PIN for that match only
- **Wrong score entered?** → Anyone with the match PIN or admin PIN can tap "Edit" and correct it
- **New match added?** → Edit `lib/tournament-data.mjs`, redeploy. Rare — avoid if possible.
- **Realtime stopped working?** → Check Supabase dashboard → Database → Replication; toggle off/on

## File map

```
app/
  layout.jsx         Root layout with fonts
  page.jsx           Entry — renders TournamentApp
  globals.css        Tailwind + reset
components/
  TournamentApp.jsx  Main component — tabs, scoring, realtime
lib/
  supabase.js        Client (anon key)
  tournament-data.js Re-exports .mjs for Next.js
  tournament-data.mjs Schedule, groups, team rosters
scripts/
  seed.mjs           One-time: insert matches with PINs
supabase/
  schema.sql         Tables, RLS, update_score RPC
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
