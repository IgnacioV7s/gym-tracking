-- Rest days the user marks on purpose; they keep the training streak alive.
create table public.rest_days (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  note       text,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.rest_days enable row level security;

create policy rest_days_all_own on public.rest_days
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
