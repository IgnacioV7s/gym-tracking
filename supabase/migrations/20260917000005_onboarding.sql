-- When the user finished (or skipped) the first-run tutorial. Null = not yet.
alter table public.profiles add column onboarded_at timestamptz;
