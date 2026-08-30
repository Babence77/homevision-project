Sikerü-- HomeVision AI — felhő-mentés adatbázis (Supabase SQL Editor-ban futtatandó)
--
-- Egy tábla, felhasználónként EGY sor: a teljes "Házam" lista JSON-ként.
-- Ez a legegyszerűbb modell: pontosan az kerül a felhőbe, ami eddig a
-- localStorage-ban volt.

create table if not exists public.houses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Sor-szintű biztonság (RLS): e nélkül BÁRKI olvashatná bárki mentéseit!
-- Ezekkel a szabályokkal mindenki csak a SAJÁT sorát éri el.
alter table public.houses enable row level security;

create policy "sajat sor olvasasa"  on public.houses for select using (auth.uid() = user_id);
create policy "sajat sor beszurasa" on public.houses for insert with check (auth.uid() = user_id);
create policy "sajat sor frissitese" on public.houses for update using (auth.uid() = user_id);
