create table workout_sessions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  date       date        not null default current_date,
  created_at timestamptz not null default now()
);

alter table workout_sessions enable row level security;

create policy "own sessions"
  on workout_sessions for all
  using (auth.uid() = user_id);
