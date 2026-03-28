truncate table
  random_chat_reports,
  random_chat_conversation_messages,
  random_chat_conversations,
  random_chat_queue,
  random_chat_messages,
  random_chat_sessions,
  activity_log,
  profile_actions,
  bookmarks,
  notifications,
  direct_thread_reads,
  direct_messages,
  direct_threads,
  thread_messages,
  threads,
  group_posts,
  group_memberships,
  spaces,
  comments,
  post_reactions,
  follows,
  posts,
  groups,
  profiles
restart identity cascade;

insert into profiles (
  id,
  username,
  first_name,
  last_name,
  bio,
  location,
  birthday,
  website,
  interests,
  avatar,
  banner,
  is_private,
  allow_only_followers_to_message,
  default_anonymous_posting,
  followers_count,
  following_count,
  created_at
)
values
  ('00000000-0000-0000-0000-000000000001', 'amber.ray', 'Amber', 'Ray', 'Amber is part of the practical multi-user test group and already active around the app.', 'Delhi, India', '1990-01-10', '', array['Society', 'Education'], 'AR', 'yellow-gradient', false, false, false, 23, 12, '2025-01-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000002', 'nora.lane', 'Nora', 'Lane', 'Nora is part of the practical multi-user test group and already active around the app.', 'Berlin, Germany', '1991-02-11', '', array['Technology', 'Society'], 'NL', 'yellow-gradient', false, false, false, 26, 13, '2025-02-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000003', 'zuri.field', 'Zuri', 'Field', 'Zuri is part of the practical multi-user test group and already active around the app.', 'Nairobi, Kenya', '1992-03-12', '', array['Environment', 'Activism'], 'ZF', 'yellow-gradient', false, false, false, 29, 14, '2025-03-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000004', 'leo.cedar', 'Leo', 'Cedar', 'Leo is part of the practical multi-user test group and already active around the app.', 'Toronto, Canada', '1993-04-13', '', array['Technology', 'Education'], 'LC', 'yellow-gradient', false, false, false, 32, 15, '2025-04-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000005', 'maya.orbit', 'Maya', 'Orbit', 'Maya is part of the practical multi-user test group and already active around the app.', 'Bengaluru, India', '1994-05-14', '', array['Mental Health', 'Society'], 'MO', 'yellow-gradient', false, false, false, 35, 16, '2025-05-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000006', 'nolan.skye', 'Nolan', 'Skye', 'Nolan is part of the practical multi-user test group and already active around the app.', 'Melbourne, Australia', '1995-06-15', '', array['Environment', 'Technology'], 'NS', 'yellow-gradient', false, false, false, 38, 17, '2025-06-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000007', 'tara.bloom', 'Tara', 'Bloom', 'Tara is part of the practical multi-user test group and already active around the app.', 'Manchester, UK', '1996-07-16', '', array['Mental Health', 'Education'], 'TB', 'yellow-gradient', false, false, false, 41, 18, '2025-07-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000008', 'rafi.stone', 'Rafi', 'Stone', 'Rafi is part of the practical multi-user test group and already active around the app.', 'Cape Town, South Africa', '1997-08-17', '', array['Activism', 'Society'], 'RS', 'yellow-gradient', false, false, false, 44, 19, '2025-08-10T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000009', 'iris.dawn', 'Iris', 'Dawn', 'Iris is part of the practical multi-user test group and already active around the app.', 'Dublin, Ireland', '1998-01-18', '', array['Mental Health', 'Society'], 'ID', 'yellow-gradient', true, true, false, 47, 20, '2025-01-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000010', 'omar.wren', 'Omar', 'Wren', 'Omar is part of the practical multi-user test group and already active around the app.', 'Dubai, UAE', '1999-02-19', '', array['Technology', 'Activism'], 'OW', 'yellow-gradient', false, false, false, 50, 21, '2025-02-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000011', 'ella.shore', 'Ella', 'Shore', 'Ella is available for clean-device testing and has not posted yet.', 'Test City', '1990-01-05', '', array[]::text[], 'ES', 'blue-gradient', false, false, false, 0, 0, '2025-01-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000012', 'micah.vale', 'Micah', 'Vale', 'Micah is available for clean-device testing and has not posted yet.', 'Test City', '1991-02-05', '', array[]::text[], 'MV', 'blue-gradient', false, false, false, 0, 0, '2025-02-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000013', 'priya.frost', 'Priya', 'Frost', 'Priya is available for clean-device testing and has not posted yet.', 'Test City', '1992-03-05', '', array[]::text[], 'PF', 'blue-gradient', false, false, false, 0, 0, '2025-03-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000014', 'jonas.hart', 'Jonas', 'Hart', 'Jonas is available for clean-device testing and has not posted yet.', 'Test City', '1993-04-05', '', array[]::text[], 'JH', 'blue-gradient', false, false, false, 0, 0, '2025-04-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000015', 'lina.west', 'Lina', 'West', 'Lina is available for clean-device testing and has not posted yet.', 'Test City', '1994-05-05', '', array[]::text[], 'LW', 'blue-gradient', false, false, false, 0, 0, '2025-05-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000016', 'theo.park', 'Theo', 'Park', 'Theo is available for clean-device testing and has not posted yet.', 'Test City', '1995-06-05', '', array[]::text[], 'TP', 'blue-gradient', false, false, false, 0, 0, '2025-06-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000017', 'sara.moon', 'Sara', 'Moon', 'Sara is available for clean-device testing and has not posted yet.', 'Test City', '1996-07-05', '', array[]::text[], 'SM', 'blue-gradient', false, false, false, 0, 0, '2025-07-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000018', 'kian.brooks', 'Kian', 'Brooks', 'Kian is available for clean-device testing and has not posted yet.', 'Test City', '1997-08-05', '', array[]::text[], 'KB', 'blue-gradient', false, false, false, 0, 0, '2025-08-18T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000019', 'nina.wells', 'Nina', 'Wells', 'Nina is available for clean-device testing and has not posted yet.', 'Test City', '1998-01-05', '', array[]::text[], 'NW', 'blue-gradient', false, false, false, 0, 0, '2025-01-22T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000020', 'aria.knox', 'Aria', 'Knox', 'Aria is available for clean-device testing and has not posted yet.', 'Test City', '1999-02-05', '', array[]::text[], 'AK', 'blue-gradient', false, false, false, 0, 0, '2025-02-22T00:00:00.000Z');

insert into follows (
  id,
  follower_username,
  following_username,
  status,
  approved_at,
  created_at
)
values
  ('60000000-0000-0000-0000-000000000001', 'amber.ray', 'nora.lane', 'approved', '2026-03-26T10:00:00.000Z', '2026-03-26T10:00:00.000Z'),
  ('60000000-0000-0000-0000-000000000002', 'nora.lane', 'amber.ray', 'approved', '2026-03-26T10:05:00.000Z', '2026-03-26T10:05:00.000Z'),
  ('60000000-0000-0000-0000-000000000003', 'maya.orbit', 'iris.dawn', 'pending', null, '2026-03-27T09:45:00.000Z'),
  ('60000000-0000-0000-0000-000000000004', 'rafi.stone', 'zuri.field', 'approved', '2026-03-25T08:00:00.000Z', '2026-03-25T08:00:00.000Z'),
  ('60000000-0000-0000-0000-000000000005', 'omar.wren', 'tara.bloom', 'approved', '2026-03-25T11:00:00.000Z', '2026-03-25T11:00:00.000Z');

insert into groups (
  id,
  name,
  handle,
  intro,
  topic,
  privacy,
  members_count,
  char_limit,
  creator_username,
  media_rule,
  highlighted_posts,
  created_at
)
values
  ('10000000-0000-0000-0000-000000000001', 'Green World Circle', 'green.world', 'Public test group for environment, local action, and open posting from multiple devices.', 'Environment', 'Public', 6, 1000, 'zuri.field', 'Text and images only', array['Daily check-in', 'Test your join flow', 'Public post thread'], '2026-03-26T09:00:00.000Z'),
  ('10000000-0000-0000-0000-000000000002', 'Quiet Room', 'quiet.room', 'Private support group for checking approval flow, private posting, and hidden identities before joining.', 'Mental Health', 'Private', 4, 2000, 'tara.bloom', 'Text only', array['Private entry rules', 'Approved members thread', 'Boundaries note'], '2026-03-26T10:00:00.000Z'),
  ('10000000-0000-0000-0000-000000000003', 'Build Bench', 'build.bench', 'Public maker group for long-form technical testing posts and practical app feedback.', 'Technology', 'Public', 5, 4000, 'nolan.skye', 'Text, images, video', array['Bug tracker thread', 'Device matrix', 'Build notes'], '2026-03-26T11:00:00.000Z'),
  ('10000000-0000-0000-0000-000000000004', 'Town Hall', 'town.hall', 'Public civic group for discussion and public welfare test conversations.', 'Activism', 'Public', 5, 1000, 'rafi.stone', 'Text and images only', array['Open forum', 'Roadmap', 'Moderation notice'], '2026-03-26T12:00:00.000Z');

insert into group_memberships (
  id,
  group_id,
  username,
  role,
  status,
  approved_at,
  created_at
)
values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'zuri.field', 'creator', 'approved', '2026-03-26T09:00:00.000Z', '2026-03-26T09:00:00.000Z'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'amber.ray', 'member', 'approved', '2026-03-26T09:05:00.000Z', '2026-03-26T09:05:00.000Z'),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'rafi.stone', 'member', 'approved', '2026-03-26T09:07:00.000Z', '2026-03-26T09:07:00.000Z'),
  ('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'tara.bloom', 'creator', 'approved', '2026-03-26T10:00:00.000Z', '2026-03-26T10:00:00.000Z'),
  ('70000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'maya.orbit', 'member', 'approved', '2026-03-26T10:15:00.000Z', '2026-03-26T10:15:00.000Z'),
  ('70000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'iris.dawn', 'member', 'approved', '2026-03-26T10:20:00.000Z', '2026-03-26T10:20:00.000Z'),
  ('70000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'ella.shore', 'member', 'requested', null, '2026-03-27T09:30:00.000Z'),
  ('70000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'nolan.skye', 'creator', 'approved', '2026-03-26T11:00:00.000Z', '2026-03-26T11:00:00.000Z'),
  ('70000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'leo.cedar', 'member', 'approved', '2026-03-26T11:05:00.000Z', '2026-03-26T11:05:00.000Z'),
  ('70000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'rafi.stone', 'creator', 'approved', '2026-03-26T12:00:00.000Z', '2026-03-26T12:00:00.000Z'),
  ('70000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'omar.wren', 'member', 'approved', '2026-03-26T12:05:00.000Z', '2026-03-26T12:05:00.000Z');

insert into posts (
  id,
  author_username,
  author_name,
  author_avatar,
  text,
  topic,
  hashtags,
  likes_count,
  replies_count,
  reposts_count,
  views_count,
  is_anonymous,
  group_handle,
  media_label,
  created_at
)
values
  ('20000000-0000-0000-0000-000000000001', 'amber.ray', 'Amber Ray', 'AR', 'Starting our real-device test today. If you see this from another phone, reply so we can verify feed sync.', 'Technology', array['#devicecheck', '#smp'], 12, 3, 1, 84, false, null, null, '2026-03-27T08:00:00.000Z'),
  ('20000000-0000-0000-0000-000000000002', 'nora.lane', 'Nora Lane', 'NL', 'Use the yellow accounts for active testing. The blue accounts are clean accounts with no activity.', 'Education', array['#testing', '#accounts'], 8, 2, 0, 51, false, null, null, '2026-03-27T08:20:00.000Z'),
  ('20000000-0000-0000-0000-000000000003', 'zuri.field', 'Zuri Field', 'ZF', 'Public group check-in: post here after you join Green World Circle so we can test shared posting.', 'Environment', array['#groupcheck', '#greenworld'], 15, 5, 3, 132, false, 'green.world', null, '2026-03-27T09:00:00.000Z'),
  ('20000000-0000-0000-0000-000000000004', 'leo.cedar', 'Leo Cedar', 'LC', 'Search, profile open, follow, and comments are all part of today''s cross-session test list.', 'Technology', array['#qa', '#crosssession'], 7, 1, 1, 39, false, null, null, '2026-03-27T09:15:00.000Z'),
  ('20000000-0000-0000-0000-000000000005', 'maya.orbit', 'Maya Orbit', 'MO', 'Testing private profile behavior next. If you request Iris, she should be able to approve from her session.', 'Mental Health', array['#privateprofile', '#followrequest'], 6, 2, 0, 41, false, null, null, '2026-03-27T09:40:00.000Z'),
  ('20000000-0000-0000-0000-000000000006', 'nolan.skye', 'Nolan Skye', 'NS', 'Join the Build Bench group and add a 4000-character post if you want to test longer community writing.', 'Technology', array['#buildbench', '#grouppost'], 11, 2, 1, 66, false, 'build.bench', null, '2026-03-27T10:10:00.000Z'),
  ('20000000-0000-0000-0000-000000000007', 'tara.bloom', 'Tara Bloom', 'TB', 'The random chat target is full real-time matching, not a local echo. We are testing that next.', 'Mental Health', array['#randomchat', '#realtime'], 9, 3, 1, 58, false, null, null, '2026-03-27T10:45:00.000Z'),
  ('20000000-0000-0000-0000-000000000008', 'rafi.stone', 'Rafi Stone', 'RS', 'Town Hall group is public now. Anyone should be able to open it, join instantly, and post from a second device.', 'Activism', array['#publicgroup', '#townhall'], 14, 4, 2, 95, false, 'town.hall', null, '2026-03-27T11:00:00.000Z'),
  ('20000000-0000-0000-0000-000000000009', 'iris.dawn', 'Anonymous', 'ID', 'Private accounts should still appear in the global feed while their profile details remain protected.', 'Society', array['#privacy', '#profile'], 17, 6, 2, 121, true, null, null, '2026-03-27T11:30:00.000Z'),
  ('20000000-0000-0000-0000-000000000010', 'omar.wren', 'Omar Wren', 'OW', 'Use one yellow account and one blue account on different devices to test follow, group join, and live chat.', 'Technology', array['#multidevice', '#launchtest'], 22, 7, 4, 160, false, null, null, '2026-03-27T12:00:00.000Z');

insert into comments (
  id,
  post_id,
  parent_id,
  author_username,
  author_name,
  text,
  created_at
)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', null, 'leo.cedar', 'Leo Cedar', 'I can see this on desktop and mobile.', '2026-03-27T08:10:00.000Z'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'nora.lane', 'Nora Lane', 'Confirmed from another session. The feed refreshed correctly.', '2026-03-27T08:12:00.000Z'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'amber.ray', 'Amber Ray', 'Perfect, that is the behavior we need.', '2026-03-27T08:14:00.000Z'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', null, 'omar.wren', 'Omar Wren', 'Joining Town Hall from a second session worked for me.', '2026-03-27T11:07:00.000Z');

insert into group_posts (
  id,
  group_id,
  author_username,
  author_name,
  author_avatar,
  text,
  topic,
  created_at
)
values
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'zuri.field', 'Zuri Field', 'ZF', 'Welcome to Green World Circle. Post from another device after joining so we can verify public group sync.', 'Environment', '2026-03-27T09:05:00.000Z'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'amber.ray', 'Amber Ray', 'Joined from my laptop and posting from my phone now.', 'Environment', '2026-03-27T09:20:00.000Z'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'tara.bloom', 'Tara Bloom', 'Quiet Room is for private approval-flow testing. Non-members should not see author identity here.', 'Mental Health', '2026-03-27T10:25:00.000Z'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'nolan.skye', 'Nolan Skye', 'Build Bench accepts long posts. Try drafting something much longer here than the public feed allows.', 'Technology', '2026-03-27T10:30:00.000Z'),
  ('80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'rafi.stone', 'Rafi Stone', 'Town Hall is open to everyone for practical moderation and posting tests.', 'Activism', '2026-03-27T11:10:00.000Z');

insert into spaces (
  id,
  title,
  host_username,
  host_name,
  listeners_count,
  speakers_count,
  recorded,
  incognito,
  allow_anonymous,
  group_handle,
  created_at
)
values
  ('40000000-0000-0000-0000-000000000001', 'Launch test room: random chat and profiles', 'amber.ray', 'Amber Ray', 18, 4, true, false, true, null, '2026-03-27T13:00:00.000Z'),
  ('40000000-0000-0000-0000-000000000002', 'Green World public device sync', 'zuri.field', 'Zuri Field', 12, 3, false, false, true, 'green.world', '2026-03-27T14:10:00.000Z');

insert into direct_threads (
  id,
  participant_one_username,
  participant_two_username,
  created_at,
  updated_at
)
values
  ('50000000-0000-0000-0000-000000000001', 'amber.ray', 'nora.lane', '2026-03-27T09:00:00.000Z', '2026-03-27T09:18:00.000Z'),
  ('50000000-0000-0000-0000-000000000002', 'zuri.field', 'omar.wren', '2026-03-27T09:10:00.000Z', '2026-03-27T11:00:00.000Z');

insert into direct_messages (
  id,
  thread_id,
  sender_username,
  text,
  media_url,
  media_type,
  created_at
)
values
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'nora.lane', 'I am on the second phone now. Can you see this message?', null, null, '2026-03-27T09:12:00.000Z'),
  ('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'amber.ray', 'Yes, I can see it on my side too.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', 'image', '2026-03-27T09:18:00.000Z'),
  ('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'omar.wren', 'Posting in Green World worked from my tablet.', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 'video', '2026-03-26T11:00:00.000Z');

insert into direct_thread_reads (
  id,
  thread_id,
  username,
  last_read_at,
  created_at
)
values
  ('52000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'amber.ray', '2026-03-27T09:18:00.000Z', '2026-03-27T09:18:00.000Z'),
  ('52000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'nora.lane', '2026-03-27T09:12:00.000Z', '2026-03-27T09:12:00.000Z'),
  ('52000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'zuri.field', '2026-03-26T10:00:00.000Z', '2026-03-26T10:00:00.000Z'),
  ('52000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'omar.wren', '2026-03-26T11:00:00.000Z', '2026-03-26T11:00:00.000Z');

insert into notifications (
  id,
  title,
  text,
  created_at
)
values
  ('90000000-0000-0000-0000-000000000001', 'Fresh test data', 'The old sample users were removed and replaced with a 20-account practical test set.', '2026-03-27T09:00:00.000Z'),
  ('90000000-0000-0000-0000-000000000002', 'Private profile test', 'Iris Dawn is private so you can test request and approval behavior.', '2026-03-27T10:15:00.000Z');
