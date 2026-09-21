-- Body weight log, one entry per day.
create table public.body_weights (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  weight_kg  numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 500),
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.body_weights enable row level security;

create policy body_weights_all_own on public.body_weights
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
