create table exercises (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references workout_sessions(id) on delete cascade,
  name       text        not null,
  sets       int,
  reps       int,
  weight_kg  numeric,
  notes      text,
  created_at timestamptz not null default now()
);

alter table exercises enable row level security;

create policy "own exercises"
  on exercises for all
  using (
    session_id in (select id from workout_sessions where user_id = auth.uid())
  );
