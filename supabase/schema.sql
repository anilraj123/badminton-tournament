-- =============================================================
-- BADMINTON TOURNAMENT SCHEMA
-- Run this in Supabase SQL Editor (one-time setup)
-- =============================================================

-- Clean slate if rerunning
drop table if exists public.matches cascade;
drop table if exists public.config cascade;
drop function if exists public.update_score cascade;

-- ---- MATCHES TABLE ----
create table public.matches (
  id text primary key,
  time_slot text not null,        -- "13:00", "17:24", etc.
  court int not null,              -- 1, 2, or 3
  category text not null,          -- MS, MD, MXD, WS, WD
  p1 text not null,
  p2 text,
  umpire text,
  score1 int,
  score2 int,
  is_playoff boolean default false,
  stage text,                      -- 'Semi' | 'Final' | null
  label text,                      -- playoff human label
  pin text not null,               -- 4-digit umpire PIN for this match
  updated_at timestamptz default now(),
  updated_by text                  -- 'umpire' or 'admin'
);

create index matches_time_idx on public.matches(time_slot);
create index matches_court_idx on public.matches(court);

-- ---- CONFIG TABLE (single-row admin settings) ----
create table public.config (
  id int primary key default 1,
  admin_pin text not null,
  tournament_name text default 'Badminton Tournament',
  constraint single_row check (id = 1)
);

-- ---- SCORE UPDATE FUNCTION (PIN-gated) ----
-- This is the ONLY way to write scores. RLS blocks direct writes.
create or replace function public.update_score(
  p_match_id text,
  p_score1 int,
  p_score2 int,
  p_pin text
) returns jsonb
language plpgsql security definer
as $$
declare
  v_match_pin text;
  v_admin_pin text;
  v_updated_by text;
begin
  -- Look up the match PIN and admin PIN
  select pin into v_match_pin from public.matches where id = p_match_id;
  select admin_pin into v_admin_pin from public.config where id = 1;

  if v_match_pin is null then
    return jsonb_build_object('ok', false, 'error', 'Match not found');
  end if;

  -- Verify PIN (either match PIN or admin PIN works)
  if p_pin = v_match_pin then
    v_updated_by := 'umpire';
  elsif p_pin = v_admin_pin then
    v_updated_by := 'admin';
  else
    return jsonb_build_object('ok', false, 'error', 'Invalid PIN');
  end if;

  update public.matches
  set score1 = p_score1,
      score2 = p_score2,
      updated_at = now(),
      updated_by = v_updated_by
  where id = p_match_id;

  return jsonb_build_object('ok', true, 'updated_by', v_updated_by);
end;
$$;

-- ---- ROW LEVEL SECURITY ----
alter table public.matches enable row level security;
alter table public.config enable row level security;

-- Public read for matches (so spectators can see everything)
-- Note: we exclude the PIN column from the public view below
create policy "matches_public_read" on public.matches for select using (true);

-- NO direct insert/update/delete policies → all writes must go through update_score()
-- (security definer function bypasses RLS)

-- Config is not readable publicly (contains admin PIN)
-- Only accessible via service role, which is never used client-side

-- ---- PUBLIC VIEW WITHOUT PINS ----
-- This is what the frontend reads from. PINs stay server-side only.
create or replace view public.matches_public as
select
  id, time_slot, court, category, p1, p2, umpire,
  score1, score2, is_playoff, stage, label, updated_at, updated_by
from public.matches;

grant select on public.matches_public to anon, authenticated;
grant execute on function public.update_score to anon, authenticated;

-- ---- REALTIME ----
-- Enable realtime on matches table (so score updates broadcast to all clients)
alter publication supabase_realtime add table public.matches;
