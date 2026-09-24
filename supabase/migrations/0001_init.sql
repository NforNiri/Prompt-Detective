-- Prompt Detective: initial schema. See docs/02-TECH-SPEC.md "Data model".

create table public.puzzles (
  id            integer primary key,              -- puzzle number (#1, #2 ...)
  publish_date  date not null unique,
  image_path    text not null,                    -- random uuid filename in bucket
  difficulty    smallint not null check (difficulty between 1 and 5),
  slots         jsonb not null,                   -- answers + tiers, server only
  prompt        text not null,                    -- full image prompt, shown by /api/reveal
  locale        text not null default 'en',
  created_at    timestamptz not null default now()
);

create table public.guess_log (
  id           bigint generated always as identity primary key,
  puzzle_id    integer not null references public.puzzles(id),
  device_id    uuid not null,
  slot         text not null check (slot in ('who','doing','where','style')),
  guess_norm   text not null check (char_length(guess_norm) <= 40),
  tier         text not null check (tier in ('solved','hot','warm','cold')),
  guess_index  smallint not null,
  ip_hash      text not null,
  created_at   timestamptz not null default now()
);
create index guess_log_rate_idx on public.guess_log (ip_hash, created_at desc);
create index guess_log_puzzle_idx on public.guess_log (puzzle_id, slot, tier);

alter table public.puzzles   enable row level security;
alter table public.guess_log enable row level security;
-- No policies on purpose: anon and authenticated roles get nothing.
-- Only the server (service role) reads and writes.

-- Public bucket for puzzle images. Filenames are random UUIDs.
insert into storage.buckets (id, name, public)
values ('puzzles', 'puzzles', true)
on conflict (id) do nothing;
