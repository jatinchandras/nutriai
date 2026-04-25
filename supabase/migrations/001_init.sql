-- NutriAI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  -- Personal details for TDEE
  age integer,
  sex text check (sex in ('male', 'female')),
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  activity_level numeric(4,3) default 1.55,
  goal_adjustment integer default 0, -- kcal offset (+500, -500, etc)
  maintenance_calories integer default 2000,
  -- Macro targets (computed or manual)
  protein_goal_g integer default 150,
  carbs_goal_g integer default 200,
  fat_goal_g integer default 67,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- FOOD LOGS
-- ─────────────────────────────────────────
create table if not exists food_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  log_date date default current_date not null,
  name text not null,
  description text,            -- original user input
  calories integer not null,
  protein_g numeric(6,1) default 0,
  carbs_g numeric(6,1) default 0,
  fat_g numeric(6,1) default 0,
  confidence text check (confidence in ('high', 'medium', 'low')),
  ai_note text,
  created_at timestamptz default now()
);

create index if not exists food_logs_user_date on food_logs(user_id, log_date);

-- ─────────────────────────────────────────
-- WORKOUT LOGS
-- ─────────────────────────────────────────
create table if not exists workout_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  log_date date default current_date not null,
  name text not null,
  description text,            -- original user input
  calories_burned integer not null,
  duration_minutes integer,
  confidence text check (confidence in ('high', 'medium', 'low')),
  ai_note text,
  created_at timestamptz default now()
);

create index if not exists workout_logs_user_date on workout_logs(user_id, log_date);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table profiles enable row level security;
alter table food_logs enable row level security;
alter table workout_logs enable row level security;

-- Profiles: users can only read/write their own
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Food logs: users can only access their own
create policy "Users can view own food logs"
  on food_logs for select using (auth.uid() = user_id);
create policy "Users can insert own food logs"
  on food_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own food logs"
  on food_logs for delete using (auth.uid() = user_id);

-- Workout logs: users can only access their own
create policy "Users can view own workout logs"
  on workout_logs for select using (auth.uid() = user_id);
create policy "Users can insert own workout logs"
  on workout_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own workout logs"
  on workout_logs for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();
