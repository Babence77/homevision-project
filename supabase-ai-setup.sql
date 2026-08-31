-- HomeVision AI — AI-render napi limit tábla (Supabase SQL Editor-ban futtatandó)
-- Számolja, ki hány képet generált aznap. A böngészőből SENKI nem éri el
-- (RLS bekapcsolva, szabályok nélkül) — csak a szerveroldali Edge Function írja.

create table if not exists public.ai_renders (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.ai_renders enable row level security;
-- Szándékosan nincs policy: kliensről se olvasni, se írni nem lehet.
