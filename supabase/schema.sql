create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  first_name text not null,
  last_name text not null,
  bio text not null default '',
  location text not null default '',
  birthday date,
  website text not null default '',
  interests text[] not null default '{}',
  avatar text not null default '',
  banner text not null default '',
  is_private boolean not null default false,
  allow_only_followers_to_message boolean not null default false,
  default_anonymous_posting boolean not null default false,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_username text not null,
  author_name text not null,
  author_avatar text not null default '',
  text text not null check (char_length(text) <= 300),
  topic text not null,
  hashtags text[] not null default '{}',
  likes_count integer not null default 0,
  replies_count integer not null default 0,
  reposts_count integer not null default 0,
  views_count integer not null default 0,
  is_anonymous boolean not null default false,
  group_handle text,
  media_label text,
  created_at timestamptz not null default now()
);

create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  post_id uuid not null references posts(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'repost', 'emoji')),
  emoji text,
  created_at timestamptz not null default now()
);

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_username text not null,
  following_username text not null,
  status text not null default 'approved' check (status in ('pending', 'approved')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists profile_actions (
  id uuid primary key default gen_random_uuid(),
  actor_username text not null,
  target_username text not null,
  action_type text not null check (action_type in ('block', 'hide', 'notify', 'report', 'tag')),
  action_value text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  author_username text not null,
  author_name text not null,
  text text not null check (char_length(text) <= 4000),
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text unique not null,
  intro text not null default '',
  topic text not null,
  privacy text not null check (privacy in ('Public', 'Private')),
  members_count integer not null default 0,
  char_limit integer not null default 1000,
  creator_username text not null,
  media_rule text not null default 'Text only',
  highlighted_posts text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  username text not null,
  role text not null default 'member' check (role in ('creator', 'admin', 'member')),
  status text not null default 'requested' check (status in ('requested', 'approved', 'banned')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  author_username text not null,
  author_name text not null,
  author_avatar text not null default '',
  text text not null check (char_length(text) <= 4000),
  topic text not null,
  created_at timestamptz not null default now()
);

create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_username text not null,
  host_name text not null,
  listeners_count integer not null default 0,
  speakers_count integer not null default 0,
  recorded boolean not null default false,
  incognito boolean not null default false,
  allow_anonymous boolean not null default false,
  group_handle text,
  created_at timestamptz not null default now()
);

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  name text not null,
  avatar text not null default '',
  anonymous_ready boolean not null default false,
  pinned boolean not null default false,
  unread_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  sender text not null check (sender in ('me', 'them')),
  text text not null check (char_length(text) <= 4000),
  created_at timestamptz not null default now()
);

create table if not exists direct_threads (
  id uuid primary key default gen_random_uuid(),
  participant_one_username text not null,
  participant_two_username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references direct_threads(id) on delete cascade,
  sender_username text not null,
  text text not null check (char_length(text) <= 4000),
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

create table if not exists direct_thread_reads (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references direct_threads(id) on delete cascade,
  username text not null,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  post_id uuid references posts(id) on delete cascade,
  profile_username text,
  created_at timestamptz not null default now()
);

create table if not exists random_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  age integer,
  topic text not null,
  bio text not null default '',
  signed_in_username text,
  max_chats_per_day integer not null default 100,
  min_seconds_before_skip integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists random_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references random_chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('me', 'them')),
  text text not null check (char_length(text) <= 4000),
  created_at timestamptz not null default now()
);

create table if not exists random_chat_queue (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  display_name text not null,
  age_confirmed boolean not null default false,
  bio text not null default '',
  interests text[] not null default '{}',
  signed_in_username text,
  state text not null default 'waiting' check (state in ('waiting', 'matched', 'ended')),
  conversation_id uuid,
  chats_started_today integer not null default 0,
  last_skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists random_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_queue_id uuid references random_chat_queue(id) on delete set null,
  participant_two_queue_id uuid references random_chat_queue(id) on delete set null,
  participant_one_name text not null,
  participant_two_name text not null,
  participant_one_signed_in_username text,
  participant_two_signed_in_username text,
  status text not null default 'active' check (status in ('active', 'ended')),
  ended_by_queue_id uuid,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists random_chat_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references random_chat_conversations(id) on delete cascade,
  sender_queue_id uuid,
  sender_label text not null,
  kind text not null default 'message' check (kind in ('message', 'system')),
  text text not null check (char_length(text) <= 4000),
  created_at timestamptz not null default now()
);

create table if not exists random_chat_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references random_chat_conversations(id) on delete cascade,
  reporter_queue_id uuid,
  reported_queue_id uuid,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table follows
  add column if not exists status text not null default 'approved';

alter table follows
  add column if not exists approved_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'random_chat_queue_conversation_fk'
  ) then
    alter table random_chat_queue
      add constraint random_chat_queue_conversation_fk
      foreign key (conversation_id) references random_chat_conversations(id) on delete set null;
  end if;
end
$$;

create or replace function match_random_chat(_queue_id uuid)
returns table (
  conversation_id uuid,
  partner_queue_id uuid,
  partner_name text,
  partner_signed_in boolean
)
language plpgsql
as $$
declare
  self_row random_chat_queue%rowtype;
  peer_row random_chat_queue%rowtype;
  new_conversation_id uuid;
begin
  select *
  into self_row
  from random_chat_queue
  where id = _queue_id
  for update;

  if not found or self_row.age_confirmed is false then
    return;
  end if;

  select *
  into peer_row
  from random_chat_queue
  where id <> _queue_id
    and state = 'waiting'
    and age_confirmed = true
    and (
      coalesce(array_length(self_row.interests, 1), 0) = 0
      or coalesce(array_length(interests, 1), 0) = 0
      or interests && self_row.interests
    )
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    update random_chat_queue
    set updated_at = now()
    where id = _queue_id;
    return;
  end if;

  insert into random_chat_conversations (
    participant_one_queue_id,
    participant_two_queue_id,
    participant_one_name,
    participant_two_name,
    participant_one_signed_in_username,
    participant_two_signed_in_username,
    status,
    created_at
  ) values (
    self_row.id,
    peer_row.id,
    self_row.display_name,
    peer_row.display_name,
    self_row.signed_in_username,
    peer_row.signed_in_username,
    'active',
    now()
  )
  returning id into new_conversation_id;

  update random_chat_queue
  set state = 'matched',
      conversation_id = new_conversation_id,
      chats_started_today = chats_started_today + 1,
      updated_at = now()
  where id in (_queue_id, peer_row.id);

  return query
  select
    new_conversation_id,
    peer_row.id,
    peer_row.display_name,
    peer_row.signed_in_username is not null;
end;
$$;

create or replace function end_random_chat(_conversation_id uuid, _queue_id uuid)
returns void
language plpgsql
as $$
begin
  update random_chat_conversations
  set status = 'ended',
      ended_by_queue_id = _queue_id,
      ended_at = now()
  where id = _conversation_id
    and status = 'active';

  update random_chat_queue
  set state = 'ended',
      conversation_id = null,
      last_skipped_at = now(),
      updated_at = now()
  where id in (
    select participant_one_queue_id from random_chat_conversations where id = _conversation_id
    union
    select participant_two_queue_id from random_chat_conversations where id = _conversation_id
  );
end;
$$;

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_username text not null,
  entity_type text not null,
  entity_id text not null,
  action_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_author_username on posts(author_username);
create index if not exists idx_post_reactions_post_id on post_reactions(post_id);
create index if not exists idx_groups_creator_username on groups(creator_username);
create index if not exists idx_group_memberships_group_id on group_memberships(group_id);
create index if not exists idx_group_memberships_username on group_memberships(username);
create index if not exists idx_group_posts_group_id on group_posts(group_id);
create index if not exists idx_spaces_host_username on spaces(host_username);
create index if not exists idx_thread_messages_thread_id on thread_messages(thread_id);
create index if not exists idx_direct_threads_participant_one on direct_threads(participant_one_username);
create index if not exists idx_direct_threads_participant_two on direct_threads(participant_two_username);
create index if not exists idx_direct_messages_thread_id on direct_messages(thread_id, created_at asc);
create index if not exists idx_direct_thread_reads_thread_id on direct_thread_reads(thread_id);
create index if not exists idx_notifications_created_at on notifications(created_at desc);
create index if not exists idx_bookmarks_username on bookmarks(username);
create index if not exists idx_activity_log_actor_username on activity_log(actor_username);
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_comments_parent_id on comments(parent_id);
create index if not exists idx_follows_follower_username on follows(follower_username);
create index if not exists idx_follows_following_username on follows(following_username);
create index if not exists idx_profile_actions_actor_username on profile_actions(actor_username);
create index if not exists idx_profile_actions_target_username on profile_actions(target_username);
create index if not exists idx_random_chat_queue_state on random_chat_queue(state, created_at asc);
create index if not exists idx_random_chat_messages_conversation_id on random_chat_conversation_messages(conversation_id, created_at asc);

create unique index if not exists bookmarks_unique_post_per_user
  on bookmarks(username, post_id)
  where post_id is not null;

create unique index if not exists bookmarks_unique_profile_per_user
  on bookmarks(username, profile_username)
  where profile_username is not null;

create unique index if not exists post_reactions_unique_non_emoji
  on post_reactions(username, post_id, reaction_type)
  where reaction_type in ('like', 'repost');

create unique index if not exists follows_unique_pair
  on follows(follower_username, following_username);

create unique index if not exists profile_actions_unique_non_tag
  on profile_actions(actor_username, target_username, action_type)
  where action_type <> 'tag';

create unique index if not exists profile_actions_unique_tag
  on profile_actions(actor_username, target_username, action_type, action_value)
  where action_type = 'tag';

create unique index if not exists group_memberships_unique_pair
  on group_memberships(group_id, username);

create unique index if not exists direct_threads_unique_pair
  on direct_threads(
    least(participant_one_username, participant_two_username),
    greatest(participant_one_username, participant_two_username)
  );

create unique index if not exists direct_thread_reads_unique_pair
  on direct_thread_reads(thread_id, username);
