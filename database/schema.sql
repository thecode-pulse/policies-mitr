-- ============================================
-- PolicyMitr SaaS - Supabase Database Schema
-- ============================================

-- Enable necessary extensions
create extension if not exists "vector";
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (linked to auth.users)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. POLICIES
-- ============================================
create table if not exists policies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  original_text text,
  summary text,
  simplified text,
  hindi_summary text,
  language text default 'en',
  category text,
  difficulty_score int default 0,
  ai_confidence float default 0,
  processing_time float default 0,
  privacy_mode boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- 3. CLAUSES (parsed segments of a policy)
-- ============================================
create table if not exists clauses (
  id uuid default gen_random_uuid() primary key,
  policy_id uuid references policies(id) on delete cascade not null,
  clause_number int not null,
  clause_text text not null,
  explanation text,
  is_bookmarked boolean default false,
  embedding vector(1536)
);

-- ============================================
-- 4. BOOKMARKS
-- ============================================
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  policy_id uuid references policies(id) on delete cascade,
  clause_id uuid references clauses(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, policy_id, clause_id)
);

-- ============================================
-- 5. ACTIVITY LOGS
-- ============================================
create table if not exists activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  policy_id uuid references policies(id) on delete set null,
  action_type text not null check (action_type in (
    'uploaded', 'summarized', 'translated', 'audio_played',
    'downloaded', 'compared', 'chatbot_used', 'bookmarked'
  )),
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- 6. CHAT HISTORY
-- ============================================
create table if not exists chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  policy_id uuid references policies(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Policies
alter table policies enable row level security;
create policy "Users can view own policies" on policies
  for select using (auth.uid() = user_id);
create policy "Users can insert own policies" on policies
  for insert with check (auth.uid() = user_id);
create policy "Users can update own policies" on policies
  for update using (auth.uid() = user_id);
create policy "Users can delete own policies" on policies
  for delete using (auth.uid() = user_id);

-- Clauses
alter table clauses enable row level security;
create policy "Users can view clauses of own policies" on clauses
  for select using (
    exists (select 1 from policies where policies.id = clauses.policy_id and policies.user_id = auth.uid())
  );

-- Bookmarks
alter table bookmarks enable row level security;
create policy "Users can manage own bookmarks" on bookmarks
  for all using (auth.uid() = user_id);

-- Activity Logs
alter table activity_logs enable row level security;
create policy "Users can view own logs" on activity_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on activity_logs
  for insert with check (auth.uid() = user_id);

-- Chat History
alter table chat_history enable row level security;
create policy "Users can manage own chat" on chat_history
  for all using (auth.uid() = user_id);

-- ============================================
-- ADMIN POLICIES (admin role can see all)
-- ============================================
create policy "Admins can view all profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can view all policies" on policies
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can view all logs" on activity_logs
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- VECTOR SEARCH FUNCTION (for RAG Chatbot)
-- ============================================
create or replace function match_clauses(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  p_policy_id uuid default null
)
returns table (
  id uuid,
  clause_text text,
  explanation text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    clauses.id,
    clauses.clause_text,
    clauses.explanation,
    1 - (clauses.embedding <=> query_embedding) as similarity
  from clauses
  where 1 - (clauses.embedding <=> query_embedding) > match_threshold
    and (p_policy_id is null or clauses.policy_id = p_policy_id)
  order by similarity desc
  limit match_count;
end;
$$;
