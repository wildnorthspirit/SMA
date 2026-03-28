import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Ellipsis,
  Flame,
  Eye,
  Hash,
  Heart,
  Home,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  MessagesSquare,
  MoonStar,
  Radio,
  Repeat2,
  Search,
  Send,
  Settings,
  SmilePlus,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import './App.css'
import {
  DEMO_COMMENTS,
  DEMO_GROUPS,
  DEMO_NOTIFICATIONS,
  DEMO_POSTS,
  DEMO_SPACES,
  DEMO_THREADS,
  DEMO_USERS,
  GUEST_CHAT_STARTER,
  TOPICS,
} from './data/seed'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import type {
  CommentNode,
  FollowRelation,
  Group,
  GroupMembership,
  GroupPost,
  GuestChatMessage,
  InfoPanel,
  Message,
  NotificationItem,
  Page,
  Post,
  ProfileAction,
  ProfileMenuTarget,
  Space,
  Thread,
  UserProfile,
} from './types'

const LOCAL_KEYS = {
  viewer: 'smapp-viewer',
  bookmarks: 'smapp-bookmarks',
  profileBookmarks: 'smapp-profile-bookmarks',
  randomChatSession: 'smapp-random-chat-session',
  randomChatClient: 'smapp-random-chat-client',
} as const

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString()
}

function joinedWeeksAgo(dateValue: string) {
  const diff = Date.now() - new Date(dateValue).getTime()
  const weeks = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)))
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`
}

function normalizeUsername(value: string) {
  return value.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 15)
}

function buildSuggestions(firstName: string, lastName: string) {
  const first = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const last = lastName.toLowerCase().replace(/[^a-z]/g, '')

  if (!first && !last) {
    return ['kind.person', 'new.member', 'open_mind']
  }

  return [
    `${first}.${last}`.slice(0, 15),
    `${first}_${last}`.slice(0, 15),
    `${first}${last}01`.slice(0, 15),
  ].filter(Boolean)
}

function bannerClass(value: string) {
  if (value === 'yellow-gradient') return 'yellow'
  if (value === 'green-gradient') return 'green'
  if (value === 'purple-gradient') return 'purple'
  return 'blue'
}

function readLocal<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function buildDirectThreads(
  directThreads: Array<{
    id: string
    participant_one_username: string
    participant_two_username: string
    updated_at?: string
  }>,
  directMessages: Array<{
    id: string
    thread_id: string
    sender_username: string
    text: string
    media_url?: string | null
    media_type?: 'image' | 'video' | null
    created_at: string
  }>,
  directReads: Array<{
    thread_id: string
    username: string
    last_read_at: string
  }>,
  profiles: UserProfile[],
  viewerUsername: string,
): Thread[] {
  const messagesByThread = directMessages.reduce<Record<string, Message[]>>((accumulator, item) => {
    const nextMessage: Message = {
      id: item.id,
      sender: item.sender_username === viewerUsername ? 'me' : 'them',
      senderUsername: item.sender_username,
      text: item.text,
      mediaUrl: item.media_url ?? undefined,
      mediaType: item.media_type ?? undefined,
      createdAt: item.created_at,
    }

    accumulator[item.thread_id] = [...(accumulator[item.thread_id] ?? []), nextMessage]
    return accumulator
  }, {})

  return directThreads
    .map((item) => {
      const partnerUsername =
        item.participant_one_username === viewerUsername
          ? item.participant_two_username
          : item.participant_one_username
      const partnerProfile = profiles.find((profile) => profile.username === partnerUsername)
      const threadRead = directReads.find(
        (read) => read.thread_id === item.id && read.username === viewerUsername,
      )
      const unreadCount = (messagesByThread[item.id] ?? []).filter((message) => {
        if (message.senderUsername === viewerUsername) return false
        if (!threadRead?.last_read_at) return true
        return new Date(message.createdAt).getTime() > new Date(threadRead.last_read_at).getTime()
      }).length

      return {
        id: item.id,
        username: partnerUsername,
        name: partnerProfile ? `${partnerProfile.firstName} ${partnerProfile.lastName}` : partnerUsername,
        avatar: partnerProfile?.avatar ?? partnerUsername.slice(0, 2).toUpperCase(),
        anonymousReady: false,
        pinned: false,
        unreadCount,
        updatedAt: item.updated_at,
        messages: messagesByThread[item.id] ?? [],
      }
    })
    .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
}

function App() {
  const [viewer, setViewer] = useState<UserProfile | null>(() =>
    readLocal<UserProfile | null>(LOCAL_KEYS.viewer, null),
  )
  const [guestPage, setGuestPage] = useState<'launch' | 'randomChat'>('launch')
  const [profiles, setProfiles] = useState<UserProfile[]>(DEMO_USERS)
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS)
  const [groups, setGroups] = useState<Group[]>(DEMO_GROUPS)
  const [groupMemberships, setGroupMemberships] = useState<GroupMembership[]>([])
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([])
  const [spaces, setSpaces] = useState<Space[]>(DEMO_SPACES)
  const [threads, setThreads] = useState<Thread[]>(DEMO_THREADS)
  const [comments, setComments] = useState<CommentNode[]>(DEMO_COMMENTS)
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS)
  const [follows, setFollows] = useState<FollowRelation[]>([])
  const [profileActions, setProfileActions] = useState<ProfileAction[]>([])
  const [page, setPage] = useState<Page>('home')
  const [postBookmarks, setPostBookmarks] = useState<string[]>(() =>
    readLocal<string[]>(LOCAL_KEYS.bookmarks, ['post-1']),
  )
  const [profileBookmarks, setProfileBookmarks] = useState<string[]>(() =>
    readLocal<string[]>(LOCAL_KEYS.profileBookmarks, ['amina.p']),
  )
  const [likedPosts, setLikedPosts] = useState<string[]>([])
  const [repostedPosts, setRepostedPosts] = useState<string[]>([])
  const [viewedPosts, setViewedPosts] = useState<string[]>([])
  const [emojiPickerPostId, setEmojiPickerPostId] = useState<string | null>(null)
  const [emojiSelections, setEmojiSelections] = useState<Record<string, string>>({})
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string>('amina.p')
  const [selectedThreadId, setSelectedThreadId] = useState<string>('thread-1')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('group-1')
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('space-1')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [feedTopic, setFeedTopic] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSort, setSearchSort] = useState<'trending' | 'latest'>('trending')
  const [guestMessages, setGuestMessages] = useState<GuestChatMessage[]>(GUEST_CHAT_STARTER)
  const [guestTopic, setGuestTopic] = useState<string>('')
  const [randomChatSessionId, setRandomChatSessionId] = useState<string | null>(() =>
    readLocal<string | null>(LOCAL_KEYS.randomChatSession, null),
  )
  const [randomChatDraft, setRandomChatDraft] = useState('')
  const [randomChatStatus, setRandomChatStatus] = useState<'idle' | 'connecting' | 'connected'>(
    'idle',
  )
  const [messageDraft, setMessageDraft] = useState('')
  const [messageMediaUrl, setMessageMediaUrl] = useState('')
  const [messageMediaType, setMessageMediaType] = useState<'image' | 'video'>('image')
  const [postDraft, setPostDraft] = useState('')
  const [postHashtags, setPostHashtags] = useState('#kindness #community')
  const [postAnonymous, setPostAnonymous] = useState(false)
  const [groupPostDraft, setGroupPostDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupHandle, setGroupHandle] = useState('')
  const [groupIntro, setGroupIntro] = useState('')
  const [groupTopic, setGroupTopic] = useState<string>('Mental Health')
  const [groupPrivacy, setGroupPrivacy] = useState<'Public' | 'Private'>('Public')
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [profilePostSort, setProfilePostSort] = useState<'popular' | 'latest' | 'oldest'>('latest')
  const [randomChatName, setRandomChatName] = useState('')
  const [randomChatBio, setRandomChatBio] = useState('')
  const [randomChatAdult, setRandomChatAdult] = useState(false)
  const [randomChatQueueId, setRandomChatQueueId] = useState<string | null>(null)
  const [randomChatPartnerName, setRandomChatPartnerName] = useState<string | null>(null)
  const [randomChatPartnerSignedIn, setRandomChatPartnerSignedIn] = useState<boolean>(false)
  const [randomChatEnded, setRandomChatEnded] = useState(false)
  const [randomChatClientId] = useState<string>(() => {
    const existing = readLocal<string | null>(LOCAL_KEYS.randomChatClient, null)
    if (existing) return existing
    const next = crypto.randomUUID()
    writeLocal(LOCAL_KEYS.randomChatClient, next)
    return next
  })
  const [infoPanel, setInfoPanel] = useState<InfoPanel>(null)
  const [profileSaveState, setProfileSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [profileActionModalUsername, setProfileActionModalUsername] = useState<string | null>(null)
  const [profileTagDraft, setProfileTagDraft] = useState('')
  const [authModal, setAuthModal] = useState<'join' | 'signin' | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [signInDraft, setSignInDraft] = useState({
    identifier: '',
    password: '',
  })
  const [signup, setSignup] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    location: '',
    birthday: '',
    username: '',
    bio: '',
    website: '',
    interests: [] as string[],
  })

  useEffect(() => {
    writeLocal(LOCAL_KEYS.viewer, viewer)
  }, [viewer])

  useEffect(() => {
    writeLocal(LOCAL_KEYS.bookmarks, postBookmarks)
  }, [postBookmarks])

  useEffect(() => {
    writeLocal(LOCAL_KEYS.profileBookmarks, profileBookmarks)
  }, [profileBookmarks])

  useEffect(() => {
    writeLocal(LOCAL_KEYS.randomChatSession, randomChatSessionId)
  }, [randomChatSessionId])

  useEffect(() => {
    async function loadRemote() {
      if (!supabase) return

      const [
        profilesRes,
        postsRes,
        groupsRes,
        groupMembershipsRes,
        groupPostsRes,
        spacesRes,
        notificationsRes,
        commentsRes,
        followsRes,
        profileActionsRes,
      ] =
        await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('groups').select('*').order('created_at', { ascending: false }),
        supabase.from('group_memberships').select('*').order('created_at', { ascending: true }),
        supabase.from('group_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('spaces').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('follows').select('*').order('created_at', { ascending: true }),
        supabase.from('profile_actions').select('*').order('created_at', { ascending: false }),
      ])

      if (!profilesRes.error && profilesRes.data && profilesRes.data.length > 0) {
        setProfiles(
          profilesRes.data.map((item) => ({
            id: item.id,
            username: item.username,
            firstName: item.first_name,
            lastName: item.last_name,
            bio: item.bio,
            location: item.location,
            birthday: item.birthday ?? '',
            website: item.website,
            interests: item.interests ?? [],
            avatar: item.avatar,
            banner: item.banner,
            isPrivate: item.is_private,
            allowOnlyFollowersToMessage: item.allow_only_followers_to_message,
            defaultAnonymousPosting: item.default_anonymous_posting,
            followersCount: item.followers_count,
            followingCount: item.following_count,
            createdAt: item.created_at,
          })),
        )
      }

      if (!postsRes.error && postsRes.data && postsRes.data.length > 0) {
        setPosts(
          postsRes.data.map((item) => ({
            id: item.id,
            authorUsername: item.author_username,
            authorName: item.author_name,
            authorAvatar: item.author_avatar,
            text: item.text,
            topic: item.topic,
            hashtags: item.hashtags ?? [],
            createdAt: item.created_at,
            likesCount: item.likes_count,
            repliesCount: item.replies_count,
            repostsCount: item.reposts_count,
            viewsCount: item.views_count,
            isAnonymous: item.is_anonymous,
            groupHandle: item.group_handle ?? undefined,
            mediaLabel: item.media_label ?? undefined,
          })),
        )
      }

      if (!groupsRes.error && groupsRes.data && groupsRes.data.length > 0) {
        setGroups(
          groupsRes.data.map((item) => ({
            id: item.id,
            name: item.name,
            handle: item.handle,
            intro: item.intro,
            topic: item.topic,
            privacy: item.privacy,
            membersCount: item.members_count,
            charLimit: item.char_limit,
            creatorUsername: item.creator_username,
            mediaRule: item.media_rule,
            highlightedPosts: item.highlighted_posts ?? [],
          })),
        )
      }

      if (!groupMembershipsRes.error && groupMembershipsRes.data) {
        setGroupMemberships(
          groupMembershipsRes.data.map((item) => ({
            id: item.id,
            groupId: item.group_id,
            username: item.username,
            role: item.role,
            status: item.status,
            createdAt: item.created_at,
            approvedAt: item.approved_at,
          })),
        )
      }

      if (!groupPostsRes.error && groupPostsRes.data) {
        setGroupPosts(
          groupPostsRes.data.map((item) => ({
            id: item.id,
            groupId: item.group_id,
            authorUsername: item.author_username,
            authorName: item.author_name,
            authorAvatar: item.author_avatar,
            text: item.text,
            topic: item.topic,
            createdAt: item.created_at,
          })),
        )
      }

      if (!spacesRes.error && spacesRes.data && spacesRes.data.length > 0) {
        setSpaces(
          spacesRes.data.map((item) => ({
            id: item.id,
            title: item.title,
            hostUsername: item.host_username,
            hostName: item.host_name,
            listenersCount: item.listeners_count,
            speakersCount: item.speakers_count,
            recorded: item.recorded,
            incognito: item.incognito,
            allowAnonymous: item.allow_anonymous,
            groupHandle: item.group_handle ?? undefined,
            createdAt: item.created_at,
          })),
        )
      }

      if (!notificationsRes.error && notificationsRes.data && notificationsRes.data.length > 0) {
        setNotifications(
          notificationsRes.data.map((item) => ({
            id: item.id,
            title: item.title,
            text: item.text,
            createdAt: item.created_at,
          })),
        )
      }

      if (!commentsRes.error && commentsRes.data && commentsRes.data.length > 0) {
        const nodeMap = new Map<string, CommentNode>()
        const roots: CommentNode[] = []

        commentsRes.data.forEach((item) => {
          nodeMap.set(item.id, {
            id: item.id,
            postId: item.post_id,
            parentId: item.parent_id,
            authorName: item.author_name,
            authorUsername: item.author_username,
            text: item.text,
            createdAt: item.created_at,
            replies: [],
          })
        })

        nodeMap.forEach((node) => {
          if (node.parentId && nodeMap.has(node.parentId)) {
            nodeMap.get(node.parentId)?.replies.push(node)
          } else {
            roots.push(node)
          }
        })

        setComments(roots)
      }

      if (!followsRes.error && followsRes.data) {
        setFollows(
          followsRes.data.map((item) => ({
            id: item.id,
            followerUsername: item.follower_username,
            followingUsername: item.following_username,
            status: item.status,
            createdAt: item.created_at,
            approvedAt: item.approved_at,
          })),
        )
      }

      if (!profileActionsRes.error && profileActionsRes.data) {
        setProfileActions(
          profileActionsRes.data.map((item) => ({
            id: item.id,
            actorUsername: item.actor_username,
            targetUsername: item.target_username,
            actionType: item.action_type,
            actionValue: item.action_value,
            createdAt: item.created_at,
          })),
        )
      }
    }

    void loadRemote()
  }, [])

  useEffect(() => {
    async function loadViewerBookmarks() {
      if (!supabase || !viewer?.username) return

      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id, profile_username')
        .eq('username', viewer.username)

      if (error || !data) return

      setPostBookmarks(data.map((item) => item.post_id).filter(Boolean))
      setProfileBookmarks(data.map((item) => item.profile_username).filter(Boolean))
    }

    void loadViewerBookmarks()
  }, [viewer?.username])

  useEffect(() => {
    if (!supabase || !viewer?.username) return

    const client = supabase
    const viewerUsername = viewer.username

    async function loadDirectThreads() {
      const [threadsRes, messagesRes, readsRes] = await Promise.all([
        client
          .from('direct_threads')
          .select('*')
          .or(
            `participant_one_username.eq.${viewerUsername},participant_two_username.eq.${viewerUsername}`,
          )
          .order('updated_at', { ascending: false }),
        client.from('direct_messages').select('*').order('created_at', { ascending: true }),
        client.from('direct_thread_reads').select('*').eq('username', viewerUsername),
      ])

      if (
        threadsRes.error ||
        messagesRes.error ||
        readsRes.error ||
        !threadsRes.data ||
        !messagesRes.data ||
        !readsRes.data
      ) return

      const builtThreads = buildDirectThreads(
        threadsRes.data,
        messagesRes.data.filter((message) =>
          threadsRes.data.some((thread) => thread.id === message.thread_id),
        ),
        readsRes.data,
        profiles,
        viewerUsername,
      )

      setThreads(builtThreads)
      if (builtThreads.length > 0 && !builtThreads.some((thread) => thread.id === selectedThreadId)) {
        setSelectedThreadId(builtThreads[0].id)
      }
    }

    void loadDirectThreads()

    const messagesChannel = client
      .channel(`direct-messages-${viewer.username}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        () => {
          void loadDirectThreads()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_threads' },
        () => {
          void loadDirectThreads()
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(messagesChannel)
    }
  }, [profiles, selectedThreadId, viewer?.username])

  useEffect(() => {
    if (!supabase || !randomChatQueueId || randomChatStatus !== 'connecting') return

    const client = supabase

    let stopped = false

    async function tryMatch() {
      const rpcResult = await client.rpc('match_random_chat', { _queue_id: randomChatQueueId })

      if (stopped) return

      if (!rpcResult.error && rpcResult.data && rpcResult.data[0]?.conversation_id) {
        setRandomChatSessionId(rpcResult.data[0].conversation_id)
        setRandomChatPartnerName(rpcResult.data[0].partner_name ?? null)
        setRandomChatPartnerSignedIn(Boolean(rpcResult.data[0].partner_signed_in))
        setRandomChatStatus('connected')
        return
      }

      const queueResult = await client
        .from('random_chat_queue')
        .select('conversation_id')
        .eq('id', randomChatQueueId)
        .maybeSingle()

      if (stopped || queueResult.error || !queueResult.data?.conversation_id) return

      setRandomChatSessionId(queueResult.data.conversation_id)
      setRandomChatStatus('connected')
    }

    void tryMatch()
    const interval = window.setInterval(() => void tryMatch(), 2500)

    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [randomChatQueueId, randomChatStatus, randomChatSessionId])

  useEffect(() => {
    if (!viewer || !selectedThreadId) return

    setThreads((current) =>
      current.map((thread) =>
        thread.id === selectedThreadId ? { ...thread, unreadCount: 0 } : thread,
      ),
    )
    void maybeMarkThreadRead(selectedThreadId)
  }, [selectedThreadId, viewer?.username])

  useEffect(() => {
    if (!supabase || !randomChatSessionId || !randomChatQueueId) return

    const client = supabase

    async function loadConversation() {
      const [conversationRes, messagesRes] = await Promise.all([
        client
          .from('random_chat_conversations')
          .select('*')
          .eq('id', randomChatSessionId)
          .maybeSingle(),
        client
          .from('random_chat_conversation_messages')
          .select('*')
          .eq('conversation_id', randomChatSessionId)
          .order('created_at', { ascending: true }),
      ])

      if (!conversationRes.error && conversationRes.data) {
        const conversation = conversationRes.data
        const iAmFirst = conversation.participant_one_queue_id === randomChatQueueId
        setRandomChatPartnerName(
          iAmFirst ? conversation.participant_two_name : conversation.participant_one_name,
        )
        if (viewer) {
          setRandomChatPartnerSignedIn(
            Boolean(
              iAmFirst
                ? conversation.participant_two_signed_in_username
                : conversation.participant_one_signed_in_username,
            ),
          )
        } else {
          setRandomChatPartnerSignedIn(false)
        }
        setRandomChatEnded(conversation.status === 'ended')
      }

      if (!messagesRes.error && messagesRes.data) {
        setGuestMessages(
          messagesRes.data.map((item) => ({
            id: item.id,
            sender:
              item.kind === 'system'
                ? 'system'
                : item.sender_queue_id === randomChatQueueId
                  ? 'me'
                  : 'them',
            text: item.text,
          })),
        )
      }
    }

    void loadConversation()

    const channel = client
      .channel(`random-chat-${randomChatSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'random_chat_conversation_messages',
          filter: `conversation_id=eq.${randomChatSessionId}`,
        },
        () => {
          void loadConversation()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'random_chat_conversations',
          filter: `id=eq.${randomChatSessionId}`,
        },
        () => {
          void loadConversation()
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [randomChatQueueId, randomChatSessionId, viewer])

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0]
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? spaces[0]
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null
  const selectedProfile =
    selectedProfileUsername === viewer?.username
      ? viewer
      : profiles.find((profile) => profile.username === selectedProfileUsername) ?? viewer ?? profiles[0]
  const usernameIdeas = useMemo(
    () => buildSuggestions(signup.firstName, signup.lastName),
    [signup.firstName, signup.lastName],
  )
  const viewerActions = profileActions.filter((action) => action.actorUsername === viewer?.username)
  const blockedUsernames = viewerActions
    .filter((action) => action.actionType === 'block')
    .map((action) => action.targetUsername)
  const hiddenUsernames = viewerActions
    .filter((action) => action.actionType === 'hide')
    .map((action) => action.targetUsername)
  const notifiedUsernames = viewerActions
    .filter((action) => action.actionType === 'notify')
    .map((action) => action.targetUsername)
  const selectedProfileTags = viewerActions
    .filter(
      (action) =>
        action.actionType === 'tag' && action.targetUsername === profileActionModalUsername,
    )
    .map((action) => action.actionValue)

  function hasApprovedFollow(followerUsername?: string | null, followingUsername?: string | null) {
    return follows.some(
      (item) =>
        item.followerUsername === followerUsername &&
        item.followingUsername === followingUsername &&
        item.status === 'approved',
    )
  }

  function isMutualWithViewer(username: string) {
    if (!viewer?.username) return false
    return hasApprovedFollow(viewer.username, username) && hasApprovedFollow(username, viewer.username)
  }

  const followingUsernames = useMemo(
    () =>
      viewer?.username
        ? follows
            .filter(
              (item) =>
                item.followerUsername === viewer.username && item.status === 'approved',
            )
            .map((item) => item.followingUsername)
        : [],
    [follows, viewer?.username],
  )

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter(
      (post) =>
        !blockedUsernames.includes(post.authorUsername) &&
        !hiddenUsernames.includes(post.authorUsername),
    )
    if (feedTopic === 'All') return filtered
    return filtered.filter((post) => post.topic === feedTopic)
  }, [blockedUsernames, feedTopic, hiddenUsernames, posts])

  const bookmarkedPosts = posts.filter((post) => postBookmarks.includes(post.id))
  const bookmarkedProfiles = profiles.filter((profile) => profileBookmarks.includes(profile.username))
  const normalizedSearch = searchQuery.trim().toLowerCase()

  const searchResults = useMemo(() => {
    if (!normalizedSearch) {
      return {
        profiles: profiles
          .filter(
            (profile) =>
              !blockedUsernames.includes(profile.username) &&
              !hiddenUsernames.includes(profile.username),
          )
          .slice(0, 3),
        posts: [...posts]
          .filter(
            (post) =>
              !blockedUsernames.includes(post.authorUsername) &&
              !hiddenUsernames.includes(post.authorUsername),
          )
          .sort((a, b) =>
            searchSort === 'latest'
              ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              : b.likesCount + b.repostsCount - (a.likesCount + a.repostsCount),
          )
          .slice(0, 5),
        hashtags: Array.from(new Set(posts.flatMap((post) => post.hashtags))).slice(0, 8),
      }
    }

    const matchingProfiles = profiles.filter((profile) => {
      if (
        blockedUsernames.includes(profile.username) ||
        hiddenUsernames.includes(profile.username)
      ) {
        return false
      }
      const name = `${profile.firstName} ${profile.lastName}`.toLowerCase()
      return (
        name.includes(normalizedSearch) || profile.username.toLowerCase().includes(normalizedSearch)
      )
    })

    const matchingPosts = posts.filter((post) => {
      if (
        blockedUsernames.includes(post.authorUsername) ||
        hiddenUsernames.includes(post.authorUsername)
      ) {
        return false
      }
      const haystack = `${post.text} ${post.authorName} ${post.authorUsername} ${post.hashtags.join(' ')}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })

    const matchingHashtags = Array.from(
      new Set(
        posts
          .flatMap((post) => post.hashtags)
          .filter((tag) => tag.toLowerCase().includes(normalizedSearch.replace('#', ''))),
      ),
    )

    return {
      profiles: matchingProfiles,
      posts: [...matchingPosts].sort((a, b) =>
        searchSort === 'latest'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : b.likesCount + b.repostsCount - (a.likesCount + a.repostsCount),
      ),
      hashtags: matchingHashtags,
    }
  }, [blockedUsernames, hiddenUsernames, normalizedSearch, posts, profiles, searchSort])

  const trendingTopics = useMemo(() => {
    const counts = visiblePosts.reduce<Record<string, number>>((acc, post) => {
      acc[post.topic] = (acc[post.topic] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [visiblePosts])

  const hotPosts = useMemo(
    () =>
      [...visiblePosts]
        .sort(
          (a, b) =>
            b.likesCount + b.repostsCount + b.repliesCount - (a.likesCount + a.repostsCount + a.repliesCount),
        )
        .slice(0, 3),
    [visiblePosts],
  )

  const selectedGroupMemberships = useMemo(
    () => groupMemberships.filter((item) => item.groupId === selectedGroup?.id),
    [groupMemberships, selectedGroup?.id],
  )

  const viewerGroupMembership = selectedGroupMemberships.find(
    (item) => item.username === viewer?.username,
  )

  const canViewSelectedProfile =
    !selectedProfile?.isPrivate ||
    selectedProfile?.username === viewer?.username ||
    hasApprovedFollow(viewer?.username, selectedProfile?.username)

  const canMessageSelectedProfile = Boolean(
    selectedProfile &&
      viewer &&
      selectedProfile.username !== viewer.username &&
      !blockedUsernames.includes(selectedProfile.username) &&
      canViewSelectedProfile &&
      (!selectedProfile.allowOnlyFollowersToMessage ||
        hasApprovedFollow(viewer.username, selectedProfile.username)),
  )

  const selectedProfileFollowers = follows
    .filter(
      (item) => item.followingUsername === selectedProfile?.username && item.status === 'approved',
    )
    .sort((a, b) => {
      const mutualDiff =
        Number(isMutualWithViewer(b.followerUsername)) - Number(isMutualWithViewer(a.followerUsername))
      if (mutualDiff !== 0) return mutualDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .map((item) => profiles.find((profile) => profile.username === item.followerUsername))
    .filter(Boolean) as UserProfile[]

  const selectedProfileFollowing = follows
    .filter(
      (item) => item.followerUsername === selectedProfile?.username && item.status === 'approved',
    )
    .sort((a, b) => {
      const mutualDiff =
        Number(isMutualWithViewer(b.followingUsername)) - Number(isMutualWithViewer(a.followingUsername))
      if (mutualDiff !== 0) return mutualDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .map((item) => profiles.find((profile) => profile.username === item.followingUsername))
    .filter(Boolean) as UserProfile[]

  const selectedProfilePosts = [...posts]
    .filter((post) => post.authorUsername === selectedProfile?.username)
    .sort((a, b) =>
      profilePostSort === 'latest'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : profilePostSort === 'oldest'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : b.likesCount + b.repostsCount + b.repliesCount - (a.likesCount + a.repostsCount + a.repliesCount),
    )

  const selectedGroupPosts = groupPosts.filter((post) => post.groupId === selectedGroup?.id)
  const flattenComments = (nodes: CommentNode[]): CommentNode[] =>
    nodes.flatMap((node) => [node, ...flattenComments(node.replies)])
  const selectedProfileReplies = flattenComments(comments).filter(
    (comment) => comment.authorUsername === selectedProfile?.username,
  )
  const selectedProfilePublicGroups = groups.filter(
    (group) =>
      group.privacy === 'Public' &&
      groupMemberships.some(
        (membership) =>
          membership.groupId === group.id &&
          membership.username === selectedProfile?.username &&
          membership.status === 'approved',
      ),
  )
  const selectedProfileHostedSpaces = spaces.filter(
    (space) => space.hostUsername === selectedProfile?.username,
  )
  const pendingGroupRequests = selectedGroupMemberships.filter((item) => item.status === 'requested')
  const pendingFollowRequests = follows.filter(
    (item) => item.followingUsername === viewer?.username && item.status === 'pending',
  )
  const approvedGroupMembers = selectedGroupMemberships.filter((item) => item.status === 'approved')
  const viewerCanModerateGroup =
    viewer?.username === selectedGroup?.creatorUsername ||
    approvedGroupMembers.some(
      (item) =>
        item.username === viewer?.username && (item.role === 'creator' || item.role === 'admin'),
    )

  function openInfo(title: string, lines: string[]) {
    setInfoPanel({ title, lines })
  }

  function closeProfileActionModal() {
    setProfileActionModalUsername(null)
    setProfileTagDraft('')
  }

  function openProfile(username: string) {
    if (blockedUsernames.includes(username)) {
      openInfo('Profile hidden', ['Unblock this profile first to open it again.'])
      return
    }
    setSelectedProfileUsername(username)
    setPage('profile')
    setProfileMenuOpen(false)
  }

  function routeFromProfileMenu(target: ProfileMenuTarget) {
    if (target === 'profile') {
      setSelectedProfileUsername(viewer?.username ?? profiles[0]?.username ?? '')
      setPage('profile')
    }
    if (target === 'bookmarks') setPage('bookmarks')
    if (target === 'notifications') setPage('notifications')
    if (target === 'settings') setPage('settings')
    setProfileMenuOpen(false)
  }

  async function openDirectMessageWithUser(username: string) {
    if (!viewer || viewer.username === username) return

    const partnerProfile = profiles.find((profile) => profile.username === username)
    if (!partnerProfile) return

    if (blockedUsernames.includes(username)) {
      openInfo('Messaging unavailable', ['Unblock this profile before starting a conversation.'])
      return
    }

    if (partnerProfile.isPrivate && !hasApprovedFollow(viewer.username, username)) {
      openInfo('Private profile', ['Follow and get approved before sending a direct message.'])
      return
    }

    if (
      partnerProfile.allowOnlyFollowersToMessage &&
      !hasApprovedFollow(viewer.username, username)
    ) {
      openInfo('Follower-only messages', ['This user only accepts messages from approved followers.'])
      return
    }

    const existing = threads.find((thread) => thread.username === username)
    if (existing) {
      setSelectedThreadId(existing.id)
      setPage('messages')
      return
    }

    const threadId = await maybeEnsureDirectThread(username)
    if (!threadId) return

    const nextThread: Thread = {
      id: threadId,
      username,
      name: partnerProfile ? `${partnerProfile.firstName} ${partnerProfile.lastName}` : username,
      avatar: partnerProfile?.avatar ?? username.slice(0, 2).toUpperCase(),
      anonymousReady: false,
      pinned: false,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      messages: [],
    }

    setThreads((current) => [nextThread, ...current])
    setSelectedThreadId(threadId)
    setPage('messages')
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    if (!supabase) {
      setAuthMessage(`Connect Supabase first to use ${provider} sign in.`)
      return
    }

    await supabase.auth.signInWithOAuth({ provider })
  }

  function handleLogout() {
    if (supabase) {
      void supabase.auth.signOut()
    }

    setViewer(null)
    setProfileMenuOpen(false)
    setAuthModal(null)
    setAuthMessage('')
    writeLocal(LOCAL_KEYS.viewer, null)
  }

  function openPostThread(postId: string) {
    setSelectedPostId(postId)
    setCommentModalOpen(true)
    if (!viewedPosts.includes(postId)) {
      setViewedPosts((current) => [...current, postId])
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, viewsCount: post.viewsCount + 1 } : post,
        ),
      )
    }
  }

  function closeCommentModal() {
    setCommentModalOpen(false)
    setReplyingToCommentId(null)
    setReplyDraft('')
    setCommentDraft('')
  }

  function addNotification(title: string, text: string) {
    const next = {
      id: crypto.randomUUID(),
      title,
      text,
      createdAt: new Date().toISOString(),
    }
    setNotifications((current) => [next, ...current])
  }

  async function maybeUpsertProfile(profile: UserProfile) {
    if (!supabase) return

    await supabase.from('profiles').upsert({
      id: profile.id,
      username: profile.username,
      first_name: profile.firstName,
      last_name: profile.lastName,
      bio: profile.bio,
      location: profile.location,
      birthday: profile.birthday,
      website: profile.website,
      interests: profile.interests,
      avatar: profile.avatar,
      banner: profile.banner,
      is_private: profile.isPrivate,
      allow_only_followers_to_message: profile.allowOnlyFollowersToMessage,
      default_anonymous_posting: profile.defaultAnonymousPosting,
      followers_count: profile.followersCount,
      following_count: profile.followingCount,
      created_at: profile.createdAt,
    }, { onConflict: 'username' })
  }

  async function maybeInsertPost(post: Post) {
    if (!supabase) return

    await supabase.from('posts').insert({
      id: post.id,
      author_username: post.authorUsername,
      author_name: post.authorName,
      author_avatar: post.authorAvatar,
      text: post.text,
      topic: post.topic,
      hashtags: post.hashtags,
      likes_count: post.likesCount,
      replies_count: post.repliesCount,
      reposts_count: post.repostsCount,
      views_count: post.viewsCount,
      is_anonymous: post.isAnonymous,
      group_handle: post.groupHandle ?? null,
      media_label: post.mediaLabel ?? null,
      created_at: post.createdAt,
    })
  }

  async function maybeInsertGroup(group: Group) {
    if (!supabase) return

    await supabase.from('groups').insert({
      id: group.id,
      name: group.name,
      handle: group.handle,
      intro: group.intro,
      topic: group.topic,
      privacy: group.privacy,
      members_count: group.membersCount,
      char_limit: group.charLimit,
      creator_username: group.creatorUsername,
      media_rule: group.mediaRule,
      highlighted_posts: group.highlightedPosts,
    })
  }

  async function maybeEnsureDirectThread(partnerUsername: string) {
    if (!supabase || !viewer) return null

    const participantOne = [viewer.username, partnerUsername].sort()[0]
    const participantTwo = [viewer.username, partnerUsername].sort()[1]

    const existing = await supabase
      .from('direct_threads')
      .select('*')
      .eq('participant_one_username', participantOne)
      .eq('participant_two_username', participantTwo)
      .maybeSingle()

    if (existing.data?.id) return existing.data.id

    const threadId = crypto.randomUUID()
    await supabase.from('direct_threads').insert({
      id: threadId,
      participant_one_username: participantOne,
      participant_two_username: participantTwo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return threadId
  }

  async function maybeInsertThreadMessage(threadId: string, message: Message) {
    if (!supabase || !viewer) return

    await supabase.from('direct_messages').insert({
      id: message.id,
      thread_id: threadId,
      sender_username: viewer.username,
      text: message.text,
      media_url: message.mediaUrl ?? null,
      media_type: message.mediaType ?? null,
      created_at: new Date().toISOString(),
    })

    await supabase
      .from('direct_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)
  }

  async function maybeMarkThreadRead(threadId: string) {
    if (!supabase || !viewer) return

    await supabase.from('direct_thread_reads').upsert(
      {
        id: crypto.randomUUID(),
        thread_id: threadId,
        username: viewer.username,
        last_read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: 'thread_id,username' },
    )
  }

  async function maybeTogglePostBookmark(username: string, postId: string, alreadySaved: boolean) {
    if (!supabase) return

    if (alreadySaved) {
      await supabase.from('bookmarks').delete().eq('username', username).eq('post_id', postId)
      return
    }

    await supabase.from('bookmarks').insert({
      id: crypto.randomUUID(),
      username,
      post_id: postId,
      profile_username: null,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeToggleProfileBookmark(
    username: string,
    profileUsername: string,
    alreadySaved: boolean,
  ) {
    if (!supabase) return

    if (alreadySaved) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('username', username)
        .eq('profile_username', profileUsername)
      return
    }

    await supabase.from('bookmarks').insert({
      id: crypto.randomUUID(),
      username,
      post_id: null,
      profile_username: profileUsername,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeLogActivity(
    actorUsername: string,
    entityType: string,
    entityId: string,
    actionType: string,
    details: Record<string, unknown>,
  ) {
    if (!supabase) return

    await supabase.from('activity_log').insert({
      id: crypto.randomUUID(),
      actor_username: actorUsername,
      entity_type: entityType,
      entity_id: entityId,
      action_type: actionType,
      details,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeInsertComment(comment: CommentNode) {
    if (!supabase) return

    await supabase.from('comments').insert({
      id: comment.id,
      post_id: comment.postId,
      parent_id: comment.parentId,
      author_username: comment.authorUsername,
      author_name: comment.authorName,
      text: comment.text,
      created_at: comment.createdAt,
    })
  }

  async function maybeToggleFollow(targetUsername: string, alreadyFollowing: boolean, status: 'approved' | 'pending') {
    if (!supabase || !viewer) return

    if (alreadyFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_username', viewer.username)
        .eq('following_username', targetUsername)
      return
    }

    await supabase.from('follows').insert({
      id: crypto.randomUUID(),
      follower_username: viewer.username,
      following_username: targetUsername,
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeSaveEmojiReaction(postId: string, emoji: string) {
    if (!supabase || !viewer) return

    await supabase.from('post_reactions').insert({
      id: crypto.randomUUID(),
      username: viewer.username,
      post_id: postId,
      reaction_type: 'emoji',
      emoji,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeQueueRandomChat() {
    if (!supabase) return null

    if (!viewer) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { data: existingQueueEntries } = await supabase
        .from('random_chat_queue')
        .select('id, last_skipped_at, created_at')
        .eq('client_id', randomChatClientId)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false })

      if ((existingQueueEntries?.length ?? 0) >= 100) {
        setAuthMessage('Guest users can start up to 100 random chats per day.')
        return null
      }

      const lastSkippedAt = existingQueueEntries?.[0]?.last_skipped_at
      if (lastSkippedAt && Date.now() - new Date(lastSkippedAt).getTime() < 30_000) {
        setAuthMessage('Guests need to wait 30 seconds before skipping into another chat.')
        return null
      }
    }

    const queueId = crypto.randomUUID()
    const displayName =
      randomChatName.trim() || viewer?.username || `guest_${randomChatClientId.slice(0, 6)}`

    const { error } = await supabase.from('random_chat_queue').insert({
      id: queueId,
      client_id: randomChatClientId,
      display_name: displayName,
      age_confirmed: randomChatAdult,
      bio: viewer ? randomChatBio.trim().slice(0, 60) : '',
      interests: guestTopic ? [guestTopic] : [],
      signed_in_username: viewer?.username ?? null,
      state: 'waiting',
      chats_started_today: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) return null
    return queueId
  }

  async function maybeInsertRandomConversationMessage(text: string, kind: 'message' | 'system' = 'message') {
    if (!supabase || !randomChatSessionId) return

    await supabase.from('random_chat_conversation_messages').insert({
      id: crypto.randomUUID(),
      conversation_id: randomChatSessionId,
      sender_queue_id: kind === 'system' ? null : randomChatQueueId,
      sender_label: kind === 'system' ? 'System' : randomChatName.trim() || viewer?.username || 'You',
      kind,
      text,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeInsertGroupMembership(
    groupId: string,
    status: 'approved' | 'requested',
    role: 'creator' | 'admin' | 'member' = 'member',
  ) {
    if (!supabase || !viewer) return

    await supabase.from('group_memberships').insert({
      id: crypto.randomUUID(),
      group_id: groupId,
      username: viewer.username,
      role,
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    })
  }

  async function maybeApproveGroupMembership(membershipId: string) {
    if (!supabase) return

    await supabase
      .from('group_memberships')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', membershipId)
  }

  async function maybeUpdateGroupMembershipRole(membershipId: string, role: 'admin' | 'member') {
    if (!supabase) return

    await supabase.from('group_memberships').update({ role }).eq('id', membershipId)
  }

  async function maybeBanGroupMembership(membershipId: string) {
    if (!supabase) return

    await supabase.from('group_memberships').update({ status: 'banned' }).eq('id', membershipId)
  }

  async function maybeDeleteGroupPost(groupPostId: string) {
    if (!supabase) return

    await supabase.from('group_posts').delete().eq('id', groupPostId)
  }

  async function maybeUpdateGroupHighlights(groupId: string, nextHighlights: string[]) {
    if (!supabase) return

    await supabase.from('groups').update({ highlighted_posts: nextHighlights }).eq('id', groupId)
  }

  async function maybeApproveFollowRequest(followId: string) {
    if (!supabase) return

    await supabase
      .from('follows')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', followId)
  }

  async function maybeInsertProfileAction(
    targetUsername: string,
    actionType: ProfileAction['actionType'],
    actionValue = '',
  ) {
    if (!supabase || !viewer) return null

    const nextAction: ProfileAction = {
      id: crypto.randomUUID(),
      actorUsername: viewer.username,
      targetUsername,
      actionType,
      actionValue,
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.from('profile_actions').insert({
      id: nextAction.id,
      actor_username: nextAction.actorUsername,
      target_username: nextAction.targetUsername,
      action_type: nextAction.actionType,
      action_value: nextAction.actionValue,
      created_at: nextAction.createdAt,
    })

    if (error) return null
    return nextAction
  }

  async function maybeDeleteProfileAction(
    targetUsername: string,
    actionType: ProfileAction['actionType'],
    actionValue = '',
  ) {
    if (!supabase || !viewer) return

    let query = supabase
      .from('profile_actions')
      .delete()
      .eq('actor_username', viewer.username)
      .eq('target_username', targetUsername)
      .eq('action_type', actionType)

    if (actionType === 'tag') {
      query = query.eq('action_value', actionValue)
    }

    await query
  }

  async function maybeInsertGroupPost(groupId: string, text: string, topic: string) {
    if (!supabase || !viewer) return

    await supabase.from('group_posts').insert({
      id: crypto.randomUUID(),
      group_id: groupId,
      author_username: viewer.username,
      author_name: `${viewer.firstName} ${viewer.lastName}`,
      author_avatar: viewer.avatar,
      text,
      topic,
      created_at: new Date().toISOString(),
    })
  }

  function insertReplyTree(nodes: CommentNode[], targetId: string, reply: CommentNode): CommentNode[] {
    return nodes.map((node) => {
      if (node.id === targetId) {
        return { ...node, replies: [...node.replies, reply] }
      }

      return { ...node, replies: insertReplyTree(node.replies, targetId, reply) }
    })
  }

  function replaceViewerEverywhere(nextViewer: UserProfile) {
    setViewer(nextViewer)
    setProfiles((current) => {
      const exists = current.some((item) => item.username === nextViewer.username)
      if (!exists) return [nextViewer, ...current]

      return current.map((item) => (item.username === nextViewer.username ? nextViewer : item))
    })
  }

  function toggleInterest(interest: string) {
    setSignup((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  function sendMockVerification() {
    if (!signup.email.trim()) {
      setAuthMessage('Enter email first.')
      return
    }

    setEmailVerified(true)
    setAuthMessage('Email verified for this launch MVP flow.')
  }

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const username = normalizeUsername(signup.username)

    if (
      !signup.firstName.trim() ||
      !signup.lastName.trim() ||
      !signup.email.trim() ||
      !signup.password.trim() ||
      !signup.location.trim() ||
      !signup.birthday ||
      !username
    ) {
      window.alert('Please fill all required fields first.')
      return
    }

    if (signup.password !== signup.confirmPassword) {
      window.alert('Passwords do not match.')
      return
    }

    if (!emailVerified) {
      window.alert('Please verify email first.')
      return
    }

    const nextViewer: UserProfile = {
      id: crypto.randomUUID(),
      username,
      firstName: signup.firstName.trim(),
      lastName: signup.lastName.trim(),
      bio: signup.bio.slice(0, 175),
      location: signup.location.trim(),
      birthday: signup.birthday,
      website: signup.website.trim(),
      interests: signup.interests,
      avatar: `${signup.firstName[0] ?? 'U'}${signup.lastName[0] ?? 'S'}`.toUpperCase(),
      banner: 'blue-gradient',
      isPrivate: false,
      allowOnlyFollowersToMessage: false,
      defaultAnonymousPosting: false,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString(),
    }

    if (supabase) {
      const authResponse = await supabase.auth.signUp({
        email: signup.email.trim(),
        password: signup.password,
      })

      if (authResponse.error) {
        setAuthMessage(authResponse.error.message)
        return
      }

      if (authResponse.data.user?.id) {
        nextViewer.id = authResponse.data.user.id
      }
    }

    replaceViewerEverywhere(nextViewer)
    setSelectedProfileUsername(nextViewer.username)
    setPage('home')
    setAuthModal(null)
    addNotification('Account created', `Welcome @${nextViewer.username}.`)
    await maybeUpsertProfile(nextViewer)
    await maybeLogActivity(nextViewer.username, 'profile', nextViewer.id, 'create', {
      location: nextViewer.location,
    })
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const identifier = signInDraft.identifier.trim().toLowerCase()
    if (!identifier) return

    if (supabase && identifier.includes('@') && signInDraft.password) {
      const authResponse = await supabase.auth.signInWithPassword({
        email: identifier,
        password: signInDraft.password,
      })

      if (authResponse.error) {
        setAuthMessage(authResponse.error.message)
        return
      }
    }

    const matchedProfile =
      profiles.find((profile) => profile.username.toLowerCase() === identifier) ??
      profiles.find(
        (profile) =>
          `${profile.firstName} ${profile.lastName}`.toLowerCase() === identifier,
      )

    if (!matchedProfile) {
      setAuthMessage('No matching profile found. Use one of the test usernames or create an account.')
      return
    }

    replaceViewerEverywhere(matchedProfile)
    setSelectedProfileUsername(matchedProfile.username)
    setAuthModal(null)
    setPage('home')
    setAuthMessage('')
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!viewer || !postDraft.trim()) return

    const hashtags = postHashtags
      .split(' ')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5)

    const nextPost: Post = {
      id: crypto.randomUUID(),
      authorUsername: viewer.username,
      authorName: postAnonymous ? 'Anonymous' : `${viewer.firstName} ${viewer.lastName}`,
      authorAvatar: viewer.avatar,
      text: postDraft.trim().slice(0, 300),
      topic: viewer.interests[0] ?? 'Society',
      hashtags,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      viewsCount: 1,
      isAnonymous: postAnonymous,
    }

    setPosts((current) => [nextPost, ...current])
    setPostDraft('')
    addNotification('Post published', 'Your post is now live in the feed.')
    await maybeInsertPost(nextPost)
    await maybeLogActivity(viewer.username, 'post', nextPost.id, 'create', {
      topic: nextPost.topic,
      hashtags: nextPost.hashtags,
    })
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!viewer || !groupName.trim() || !groupHandle.trim() || !groupIntro.trim()) return

    const nextGroup: Group = {
      id: crypto.randomUUID(),
      name: groupName.trim(),
      handle: normalizeUsername(groupHandle),
      intro: groupIntro.trim().slice(0, 175),
      topic: groupTopic,
      privacy: groupPrivacy,
      membersCount: 1,
      charLimit: groupPrivacy === 'Private' ? 2000 : 1000,
      creatorUsername: viewer.username,
      mediaRule: groupPrivacy === 'Private' ? 'Text and images only' : 'Text, images, video',
      highlightedPosts: ['Welcome post', 'Rules', 'Pinned intro'],
    }

    setGroups((current) => [nextGroup, ...current])
    setGroupMemberships((current) => [
      {
        id: crypto.randomUUID(),
        groupId: nextGroup.id,
        username: viewer.username,
        role: 'creator',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      },
      ...current,
    ])
    setSelectedGroupId(nextGroup.id)
    setGroupName('')
    setGroupHandle('')
    setGroupIntro('')
    addNotification('Group created', `${nextGroup.name} is ready.`)
    await maybeInsertGroup(nextGroup)
    await maybeLogActivity(viewer.username, 'group', nextGroup.id, 'create', {
      privacy: nextGroup.privacy,
      topic: nextGroup.topic,
    })
    await maybeInsertGroupMembership(nextGroup.id, 'approved', 'creator')
  }

  async function handleJoinSelectedGroup() {
    if (!viewer || !selectedGroup || viewerGroupMembership) return

    const nextMembership: GroupMembership = {
      id: crypto.randomUUID(),
      groupId: selectedGroup.id,
      username: viewer.username,
      role: 'member',
      status: selectedGroup.privacy === 'Private' ? 'requested' : 'approved',
      createdAt: new Date().toISOString(),
      approvedAt: selectedGroup.privacy === 'Public' ? new Date().toISOString() : null,
    }

    setGroupMemberships((current) => [...current, nextMembership])
    setGroups((current) =>
      current.map((group) =>
        group.id === selectedGroup.id && selectedGroup.privacy === 'Public'
          ? { ...group, membersCount: group.membersCount + 1 }
          : group,
      ),
    )

    if (selectedGroup.privacy === 'Public') {
      await maybeInsertGroupMembership(selectedGroup.id, 'approved')
      addNotification('Joined group', `You joined ${selectedGroup.name}.`)
    } else {
      await maybeInsertGroupMembership(selectedGroup.id, 'requested')
      addNotification('Request sent', `Your request to join ${selectedGroup.name} is pending.`)
    }
  }

  async function handleApproveGroupRequest(membershipId: string) {
    const request = groupMemberships.find((item) => item.id === membershipId)
    if (!request) return

    setGroupMemberships((current) =>
      current.map((item) =>
        item.id === membershipId
          ? { ...item, status: 'approved', approvedAt: new Date().toISOString() }
          : item,
      ),
    )
    setGroups((current) =>
      current.map((group) =>
        group.id === request.groupId ? { ...group, membersCount: group.membersCount + 1 } : group,
      ),
    )
    await maybeApproveGroupMembership(membershipId)
  }

  async function handleApproveFollowRequest(followId: string) {
    const request = follows.find((item) => item.id === followId)
    if (!request) return

    setFollows((current) =>
      current.map((item) =>
        item.id === followId
          ? { ...item, status: 'approved', approvedAt: new Date().toISOString() }
          : item,
      ),
    )
    setProfiles((current) =>
      current.map((profile) =>
        profile.username === viewer?.username
          ? { ...profile, followersCount: profile.followersCount + 1 }
          : profile,
      ),
    )
    if (viewer) {
      setViewer({ ...viewer, followersCount: viewer.followersCount + 1 })
    }
    await maybeApproveFollowRequest(followId)
    await maybeLogActivity(request.followingUsername, 'profile', request.followerUsername, 'approve_follow', {})
  }

  async function handleToggleProfileAction(
    targetUsername: string,
    actionType: 'block' | 'hide' | 'notify',
  ) {
    if (!viewer || targetUsername === viewer.username) return

    const existing = profileActions.find(
      (action) =>
        action.actorUsername === viewer.username &&
        action.targetUsername === targetUsername &&
        action.actionType === actionType,
    )

    if (existing) {
      setProfileActions((current) => current.filter((action) => action.id !== existing.id))
      await maybeDeleteProfileAction(targetUsername, actionType)
      return
    }

    const nextAction = await maybeInsertProfileAction(targetUsername, actionType)
    if (!nextAction) return

    setProfileActions((current) => [nextAction, ...current])
    if (actionType === 'block') {
      setThreads((current) => current.filter((thread) => thread.username !== targetUsername))
    }
  }

  async function handleAddProfileTag() {
    if (!viewer || !profileActionModalUsername) return

    const nextTag = profileTagDraft.trim().slice(0, 24)
    if (!nextTag) return

    const alreadyExists = profileActions.some(
      (action) =>
        action.actorUsername === viewer.username &&
        action.targetUsername === profileActionModalUsername &&
        action.actionType === 'tag' &&
        action.actionValue.toLowerCase() === nextTag.toLowerCase(),
    )

    if (alreadyExists) {
      setProfileTagDraft('')
      return
    }

    const nextAction = await maybeInsertProfileAction(profileActionModalUsername, 'tag', nextTag)
    if (!nextAction) return

    setProfileActions((current) => [nextAction, ...current])
    setProfileTagDraft('')
  }

  async function handleRemoveProfileTag(tag: string) {
    if (!viewer || !profileActionModalUsername) return

    setProfileActions((current) =>
      current.filter(
        (action) =>
          !(
            action.actorUsername === viewer.username &&
            action.targetUsername === profileActionModalUsername &&
            action.actionType === 'tag' &&
            action.actionValue === tag
          ),
      ),
    )
    await maybeDeleteProfileAction(profileActionModalUsername, 'tag', tag)
  }

  async function handleReportProfile(targetUsername: string) {
    if (!viewer || targetUsername === viewer.username) return

    const nextAction = await maybeInsertProfileAction(targetUsername, 'report')
    if (!nextAction) return

    setProfileActions((current) => [nextAction, ...current])
    openInfo('Profile reported', [`@${targetUsername} has been flagged for moderator review.`])
  }

  async function handlePromoteGroupMember(membershipId: string, role: 'admin' | 'member') {
    setGroupMemberships((current) =>
      current.map((item) => (item.id === membershipId ? { ...item, role } : item)),
    )
    await maybeUpdateGroupMembershipRole(membershipId, role)
  }

  async function handleBanGroupMember(membershipId: string) {
    const target = groupMemberships.find((item) => item.id === membershipId)
    if (!target) return

    setGroupMemberships((current) =>
      current.map((item) =>
        item.id === membershipId ? { ...item, status: 'banned' } : item,
      ),
    )
    setGroups((current) =>
      current.map((group) =>
        group.id === target.groupId ? { ...group, membersCount: Math.max(0, group.membersCount - 1) } : group,
      ),
    )
    await maybeBanGroupMembership(membershipId)
  }

  async function handleDeleteGroupPost(groupPostId: string) {
    setGroupPosts((current) => current.filter((item) => item.id !== groupPostId))
    await maybeDeleteGroupPost(groupPostId)
  }

  async function handleHighlightGroupPost(postText: string) {
    if (!selectedGroup) return

    const nextHighlights = [postText, ...selectedGroup.highlightedPosts.filter((item) => item !== postText)].slice(0, 3)
    setGroups((current) =>
      current.map((group) =>
        group.id === selectedGroup.id ? { ...group, highlightedPosts: nextHighlights } : group,
      ),
    )
    await maybeUpdateGroupHighlights(selectedGroup.id, nextHighlights)
  }

  async function handleUpdateGroupRules(charLimit: number, mediaRule: string) {
    if (!selectedGroup || !viewerCanModerateGroup || !supabase) return

    setGroups((current) =>
      current.map((group) =>
        group.id === selectedGroup.id ? { ...group, charLimit, mediaRule } : group,
      ),
    )

    await supabase
      .from('groups')
      .update({ char_limit: charLimit, media_rule: mediaRule })
      .eq('id', selectedGroup.id)
  }

  async function handleCreateGroupPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!viewer || !selectedGroup || !groupPostDraft.trim()) return
    if (selectedGroup.privacy === 'Private' && viewerGroupMembership?.status !== 'approved') return

    const nextText = groupPostDraft.trim().slice(0, selectedGroup.charLimit)
    const nextPost: GroupPost = {
      id: crypto.randomUUID(),
      groupId: selectedGroup.id,
      authorUsername: viewer.username,
      authorName: `${viewer.firstName} ${viewer.lastName}`,
      authorAvatar: viewer.avatar,
      text: nextText,
      topic: selectedGroup.topic,
      createdAt: new Date().toISOString(),
    }

    setGroupPosts((current) => [nextPost, ...current])
    setGroupPostDraft('')
    await maybeInsertGroupPost(selectedGroup.id, nextText, selectedGroup.topic)
  }

  async function handleNewGuestChat() {
    if (!randomChatAdult) {
      setAuthMessage('Random chat requires confirming you are 18+ first.')
      return
    }

    if (!viewer && !randomChatName.trim()) {
      setAuthMessage('Choose a random username first.')
      return
    }

    setAuthMessage('')
    setGuestMessages([])
    setRandomChatEnded(false)
    setRandomChatPartnerName(null)
    setRandomChatPartnerSignedIn(false)
    setRandomChatSessionId(null)
    setRandomChatStatus('connecting')

    const queueId = await maybeQueueRandomChat()
    if (!queueId) {
      setRandomChatStatus('idle')
      setAuthMessage((current) => current || 'Could not start random chat right now.')
      return
    }

    setRandomChatQueueId(queueId)
  }

  async function handleSendRandomChatMessage() {
    const trimmed = randomChatDraft.trim()
    if (!trimmed || !randomChatSessionId || !randomChatQueueId || randomChatEnded) return

    const nextMessage: GuestChatMessage = {
      id: crypto.randomUUID(),
      sender: 'me',
      text: trimmed,
    }

    setGuestMessages((current) => [...current, nextMessage])
    setRandomChatDraft('')
    await maybeInsertRandomConversationMessage(trimmed)
  }

  async function handleEndRandomChat() {
    if (!supabase || !randomChatSessionId || !randomChatQueueId) return

    await supabase.rpc('end_random_chat', {
      _conversation_id: randomChatSessionId,
      _queue_id: randomChatQueueId,
    })
    setRandomChatEnded(true)
    setRandomChatStatus('idle')
    setGuestMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sender: 'system',
        text: 'Chat ended.',
      },
    ])
  }

  async function handleReportRandomChat() {
    if (!supabase || !randomChatSessionId || !randomChatQueueId) return

    await supabase.from('random_chat_reports').insert({
      id: crypto.randomUUID(),
      conversation_id: randomChatSessionId,
      reporter_queue_id: randomChatQueueId,
      reported_queue_id: null,
      reason: 'Reported from client test flow',
      created_at: new Date().toISOString(),
    })
    openInfo('Random chat', ['Report sent for review.'])
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = messageDraft.trim()
    const trimmedMedia = messageMediaUrl.trim()
    if ((!trimmed && !trimmedMedia) || !selectedThread || !viewer) return

    const nextMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'me',
      senderUsername: viewer.username,
      text: trimmed.slice(0, 4000),
      mediaUrl: trimmedMedia || undefined,
      mediaType: trimmedMedia ? messageMediaType : undefined,
      createdAt: new Date().toISOString(),
    }

    setThreads((current) =>
      [...current]
        .map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                unreadCount: 0,
                updatedAt: new Date().toISOString(),
                messages: [...thread.messages, nextMessage],
              }
            : thread,
        )
        .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()),
    )
    setMessageDraft('')
    setMessageMediaUrl('')
    await maybeInsertThreadMessage(selectedThread.id, nextMessage)
    await maybeMarkThreadRead(selectedThread.id)
    await maybeLogActivity(viewer.username, 'thread', selectedThread.id, 'message_send', {
      to: selectedThread.username,
    })
  }

  async function reactToPost(
    postId: string,
    kind: 'like' | 'comment' | 'repost' | 'bookmark' | 'views',
  ) {
    const currentPost = posts.find((post) => post.id === postId)
    if (!currentPost) return

    if (kind === 'comment') {
      openPostThread(postId)
      openInfo('Comments', ['Open the popup thread to write comments and nested replies.'])
      return
    }

    if (kind === 'bookmark') {
      const alreadySaved = postBookmarks.includes(postId)
      setPostBookmarks((current) =>
        current.includes(postId) ? current.filter((item) => item !== postId) : [...current, postId],
      )
      openInfo('Bookmark', [
        `${currentPost.authorName} post`,
        alreadySaved ? 'Removed from bookmarks.' : 'Saved to bookmarks.',
      ])
      if (viewer) {
        await maybeTogglePostBookmark(viewer.username, postId, alreadySaved)
        await maybeLogActivity(viewer.username, 'post', postId, alreadySaved ? 'bookmark_remove' : 'bookmark_add', {})
      }
      return
    }

    if (kind === 'like') {
      const alreadyLiked = likedPosts.includes(postId)
      setLikedPosts((current) =>
        alreadyLiked ? current.filter((item) => item !== postId) : [...current, postId],
      )
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likesCount: Math.max(0, post.likesCount + (alreadyLiked ? -1 : 1)) }
            : post,
        ),
      )
      if (viewer) {
        await maybeLogActivity(viewer.username, 'post', postId, alreadyLiked ? 'unlike' : 'like', {})
      }
      return
    }

    if (kind === 'repost') {
      const alreadyReposted = repostedPosts.includes(postId)
      setRepostedPosts((current) =>
        alreadyReposted ? current.filter((item) => item !== postId) : [...current, postId],
      )
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, repostsCount: Math.max(0, post.repostsCount + (alreadyReposted ? -1 : 1)) }
            : post,
        ),
      )
      if (viewer) {
        await maybeLogActivity(
          viewer.username,
          'post',
          postId,
          alreadyReposted ? 'repost_remove' : 'repost_add',
          {},
        )
      }
      return
    }

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              viewsCount: kind === 'views' ? post.viewsCount + 1 : post.viewsCount,
            }
          : post,
      ),
    )

    openInfo(currentPost.authorName, [
      `Topic: ${currentPost.topic}`,
      `Hashtags: ${currentPost.hashtags.join(' ') || 'None'}`,
      `Likes: ${currentPost.likesCount}`,
      `Replies: ${currentPost.repliesCount}`,
      `Reposts: ${currentPost.repostsCount}`,
      `Views: ${currentPost.viewsCount}`,
    ])

    if (viewer) {
      await maybeLogActivity(viewer.username, 'post', postId, kind, {})
    }
  }

  async function toggleProfileBookmark(username: string) {
    const alreadySaved = profileBookmarks.includes(username)
    setProfileBookmarks((current) =>
      current.includes(username)
        ? current.filter((item) => item !== username)
        : [...current, username],
    )

    if (viewer) {
      await maybeToggleProfileBookmark(viewer.username, username, alreadySaved)
      await maybeLogActivity(
        viewer.username,
        'profile',
        username,
        alreadySaved ? 'profile_bookmark_remove' : 'profile_bookmark_add',
        {},
      )
    }
  }

  async function toggleFollow(username: string) {
    if (!viewer || viewer.username === username) return

    const targetProfile = profiles.find((profile) => profile.username === username)
    const existingRelation = follows.find(
      (item) => item.followerUsername === viewer.username && item.followingUsername === username,
    )
    const alreadyFollowing = Boolean(existingRelation)
    const nextStatus: 'approved' | 'pending' = targetProfile?.isPrivate ? 'pending' : 'approved'

    if (existingRelation) {
      setFollows((current) =>
        current.filter(
          (item) =>
            !(
              item.followerUsername === viewer.username && item.followingUsername === username
            ),
        ),
      )
    } else {
      setFollows((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          followerUsername: viewer.username,
          followingUsername: username,
          status: nextStatus,
          createdAt: new Date().toISOString(),
          approvedAt: nextStatus === 'approved' ? new Date().toISOString() : null,
        },
      ])
    }

    setProfiles((current) =>
      current.map((profile) => {
        if (profile.username === viewer.username) {
          return {
            ...profile,
            followingCount: Math.max(0, profile.followingCount + (alreadyFollowing ? -1 : 1)),
          }
        }

        if (profile.username === username && nextStatus === 'approved') {
          return {
            ...profile,
            followersCount: Math.max(0, profile.followersCount + (alreadyFollowing ? -1 : 1)),
          }
        }

        return profile
      }),
    )

    setViewer((current) =>
      current
        ? {
            ...current,
            followingCount: Math.max(0, current.followingCount + (alreadyFollowing ? -1 : 1)),
          }
        : current,
    )

    await maybeToggleFollow(username, alreadyFollowing, nextStatus)
    await maybeLogActivity(
      viewer.username,
      'profile',
      username,
      alreadyFollowing ? 'unfollow' : nextStatus === 'pending' ? 'follow_request' : 'follow',
      { status: nextStatus },
    )
  }

  async function handleEmojiReaction(postId: string, emoji: string) {
    setEmojiSelections((current) => ({ ...current, [postId]: emoji }))
    setEmojiPickerPostId(null)

    if (viewer) {
      await maybeSaveEmojiReaction(postId, emoji)
      await maybeLogActivity(viewer.username, 'post', postId, 'emoji', { emoji })
    }
  }

  async function handleSaveProfileChanges() {
    if (!viewer) return

    setProfileSaveState('saving')

    try {
      await maybeUpsertProfile(viewer)
      await maybeLogActivity(viewer.username, 'profile', viewer.id, 'update', {
        isPrivate: viewer.isPrivate,
        allowOnlyFollowersToMessage: viewer.allowOnlyFollowersToMessage,
      })
      replaceViewerEverywhere(viewer)
      setProfileSaveState('saved')
      addNotification('Profile updated', 'Your profile changes were saved.')
    } catch {
      setProfileSaveState('error')
    }
  }

  function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!viewer || !selectedPost || !commentDraft.trim()) return

    const nextComment: CommentNode = {
      id: crypto.randomUUID(),
      postId: selectedPost.id,
      parentId: null,
      authorName: `${viewer.firstName} ${viewer.lastName}`,
      authorUsername: viewer.username,
      text: commentDraft.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    }

    setComments((current) => [nextComment, ...current])
    setPosts((current) =>
      current.map((post) =>
        post.id === selectedPost.id ? { ...post, repliesCount: post.repliesCount + 1 } : post,
      ),
    )
    setCommentDraft('')
    void maybeInsertComment(nextComment)
  }

  function handleAddReply(parentId: string) {
    if (!viewer || !replyDraft.trim()) return

    if (!selectedPost) return

    const nextReply: CommentNode = {
      id: crypto.randomUUID(),
      postId: selectedPost.id,
      parentId,
      authorName: `${viewer.firstName} ${viewer.lastName}`,
      authorUsername: viewer.username,
      text: replyDraft.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    }

    setComments((current) => insertReplyTree(current, parentId, nextReply))
    setPosts((current) =>
      current.map((post) =>
        post.id === selectedPost.id ? { ...post, repliesCount: post.repliesCount + 1 } : post,
      ),
    )
    setReplyDraft('')
    setReplyingToCommentId(null)
    void maybeInsertComment(nextReply)
  }

  function renderCommentNode(comment: CommentNode, depth = 0) {
    return (
      <article key={comment.id} className={`comment-card ${depth > 0 ? 'nested-comment' : ''}`}>
        <strong>
          {comment.authorName} <span className="meta-copy">@{comment.authorUsername}</span>
        </strong>
        <p>{comment.text}</p>
        <button
          type="button"
          className="secondary-button small-pill"
          onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
        >
          Reply
        </button>

        {replyingToCommentId === comment.id && (
          <div className="reply-form">
            <textarea
              rows={2}
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value.slice(0, 300))}
              placeholder="Write a reply..."
            />
            <button type="button" className="primary-button" onClick={() => handleAddReply(comment.id)}>
              Send reply
            </button>
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="reply-stack">
            {comment.replies.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </article>
    )
  }

  if (!viewer) {
    return (
      <main className="landing-shell">
        {guestPage === 'launch' ? (
          <>
            <section className="launch-shell gradient-card">
              <div className="launch-logo">SMP</div>
              <h1>FORCE THAT SHAPES CIVILIZATION</h1>
              <div className="launch-actions">
                <button type="button" className="join-button" onClick={() => setAuthModal('join')}>
                  <Sparkles size={16} />
                  Join Now
                </button>
                <div className="oauth-joined">
                  <button type="button" className="oauth-button oauth-joined-button" onClick={() => void handleOAuth('google')}>
                    G
                    Google
                  </button>
                  <div className="oauth-divider" />
                  <button type="button" className="oauth-button oauth-joined-button" onClick={() => void handleOAuth('apple')}>
                    A
                    Apple
                  </button>
                </div>
                <div className="thin-divider" />
                <button type="button" className="secondary-button launch-signin" onClick={() => setAuthModal('signin')}>
                  <LogIn size={16} />
                  Sign in
                </button>
                <button type="button" className="secondary-button" onClick={() => setGuestPage('randomChat')}>
                  <MessagesSquare size={16} />
                  Random chat
                </button>
              </div>
            </section>

            <section className="surface-card">
              <div className="card-title-row">
                <h2>Test Accounts</h2>
                <span className="badge subtle">Yellow = active, Blue = clean</span>
              </div>
              <div className="tester-strip">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className="tester-avatar-button"
                    onClick={() => {
                      setSignInDraft({ identifier: profile.username, password: '' })
                      setAuthModal('signin')
                    }}
                  >
                    <div className={`avatar avatar-${bannerClass(profile.banner)}`}>{profile.avatar}</div>
                    <span className="meta-copy">@{profile.username}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="surface-card random-chat-page">
            <div className="card-title-row">
              <div className="button-row compact">
                <button type="button" className="icon-button" onClick={() => setGuestPage('launch')}>
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2>Random chat</h2>
                  <p className="meta-copy">Guest mode with optional interests</p>
                </div>
              </div>
              <span className="badge subtle">{randomChatStatus === 'connected' ? 'Connected' : 'Guest'}</span>
            </div>
            <div className="form-grid">
              <label>
                Random username
                <input
                  value={randomChatName}
                  onChange={(event) => setRandomChatName(normalizeUsername(event.target.value))}
                  placeholder="choose a name"
                />
              </label>
              <label>
                Interest
                <select value={guestTopic} onChange={(event) => setGuestTopic(event.target.value)}>
                  <option value="">No preference</option>
                  {TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="switch-row">
              <span>I confirm I am 18+</span>
              <button
                type="button"
                className={`switch ${randomChatAdult ? 'on' : ''}`}
                onClick={() => setRandomChatAdult((current) => !current)}
              >
                <span className="switch-thumb" />
              </button>
            </div>
            <div className="chat-box large">
              {guestMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble ${
                    message.sender === 'system' ? 'system' : message.sender === 'me' ? 'mine' : 'theirs'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            {randomChatStatus === 'connecting' && (
              <p className="meta-copy">Searching for another person now. If nobody is online, chat will not start yet.</p>
            )}
            {randomChatEnded && <p className="danger-copy">Chat ended.</p>}
            <div className="button-row">
              <input
                className="chat-input"
                value={randomChatDraft}
                onChange={(event) => setRandomChatDraft(event.target.value.slice(0, 4000))}
                placeholder={randomChatStatus === 'connected' ? 'Say hello...' : 'Start chat first'}
              />
              <button type="button" className="primary-button" onClick={() => void handleSendRandomChatMessage()}>
                <Send size={16} />
                Send
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleNewGuestChat()}>
                <ArrowRight size={16} />
                Start chat
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleEndRandomChat()}>
                End
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleReportRandomChat()}>
                Report
              </button>
            </div>
            {authMessage && <p className="meta-copy">{authMessage}</p>}
          </section>
        )}

        {authModal && (
          <div className="modal-backdrop" onClick={() => setAuthModal(null)}>
            <div className="auth-modal surface-card" onClick={(event) => event.stopPropagation()}>
              <div className="card-title-row">
                <h2>{authModal === 'join' ? 'Create account' : 'Sign in'}</h2>
                <button type="button" className="icon-button" onClick={() => setAuthModal(null)}>
                  <X size={16} />
                </button>
              </div>

              {authModal === 'join' ? (
                <form onSubmit={handleCreateAccount} className="stack">
                  <div className="form-grid">
                    <label>
                      Email
                      <input
                        value={signup.email}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Username
                      <input
                        value={signup.username}
                        onChange={(event) =>
                          setSignup((current) => ({
                            ...current,
                            username: normalizeUsername(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={signup.password}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, password: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Confirm password
                      <input
                        type="password"
                        value={signup.confirmPassword}
                        onChange={(event) =>
                          setSignup((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      First name
                      <input
                        value={signup.firstName}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, firstName: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Last name
                      <input
                        value={signup.lastName}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, lastName: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Location
                      <input
                        value={signup.location}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, location: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Birthday
                      <input
                        type="date"
                        value={signup.birthday}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, birthday: event.target.value }))
                        }
                      />
                    </label>
                    <label className="full-span">
                      Bio
                      <textarea
                        rows={3}
                        value={signup.bio}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, bio: event.target.value.slice(0, 175) }))
                        }
                      />
                    </label>
                    <label className="full-span">
                      Website
                      <input
                        value={signup.website}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, website: event.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <div className="chip-row">
                    {usernameIdeas.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        className="chip"
                        onClick={() => setSignup((current) => ({ ...current, username: idea }))}
                      >
                        {idea}
                      </button>
                    ))}
                  </div>

                  <div className="chip-row">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={`chip ${signup.interests.includes(topic) ? 'selected' : ''}`}
                        onClick={() => toggleInterest(topic)}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <div className="button-row">
                    <button type="button" className="secondary-button" onClick={sendMockVerification}>
                      <Mail size={16} />
                      Verify email
                    </button>
                    <span className="meta-copy">{emailVerified ? 'Email verified.' : 'Verify before join.'}</span>
                  </div>

                  <button type="submit" className="primary-button">
                    <Sparkles size={16} />
                    Create account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="stack">
                  <label>
                    Email or username
                    <input
                      value={signInDraft.identifier}
                      onChange={(event) =>
                        setSignInDraft((current) => ({ ...current, identifier: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={signInDraft.password}
                      onChange={(event) =>
                        setSignInDraft((current) => ({ ...current, password: event.target.value }))
                      }
                    />
                  </label>
                  <button type="submit" className="primary-button">
                    <LogIn size={16} />
                    Sign in
                  </button>
                </form>
              )}

              {authMessage && <p className="meta-copy">{authMessage}</p>}
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="top-bar-brand">
          <div className="launch-logo compact">SMP</div>
          <p className="muted-copy">FORCE THAT SHAPES CIVILIZATION</p>
        </div>

        <div className="top-bar-actions">
          <button type="button" className="icon-button" onClick={() => setPage('explore')} aria-label="Search">
            <Search size={18} />
          </button>
          <button type="button" className="icon-button" onClick={() => setPage('randomChat')} aria-label="Random chat">
            <MessagesSquare size={18} />
          </button>
          <button type="button" className="icon-button" onClick={() => openInfo('Dark mode', ['Dark mode follows your device preference.', 'The contrast has been improved in this update.'])} aria-label="Dark mode info">
            <MoonStar size={18} />
          </button>
          <button
            type="button"
            className="avatar-button"
            onClick={() => setProfileMenuOpen((current) => !current)}
            aria-label="Open profile menu"
          >
            <div className={`avatar avatar-${bannerClass(viewer.banner)}`}>{viewer.avatar}</div>
          </button>
        </div>

        {profileMenuOpen && (
          <div className="profile-menu">
            <button type="button" onClick={() => routeFromProfileMenu('profile')}>
              <UserRound size={16} />
              Profile
            </button>
            <button type="button" onClick={() => routeFromProfileMenu('bookmarks')}>
              <Bookmark size={16} />
              Bookmarks
            </button>
            <button type="button" onClick={() => routeFromProfileMenu('notifications')}>
              <Bell size={16} />
              Activity
            </button>
            <button type="button" onClick={() => routeFromProfileMenu('settings')}>
              <Settings size={16} />
              Settings
            </button>
            <button type="button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav className="nav-list">
            {[
              { id: 'home' as const, label: 'Home', icon: Home },
              { id: 'explore' as const, label: 'Search', icon: Search },
              { id: 'randomChat' as const, label: 'Random Chat', icon: MessagesSquare },
              { id: 'messages' as const, label: 'Messages', icon: MessagesSquare },
              { id: 'groups' as const, label: 'Groups', icon: Users },
              { id: 'spaces' as const, label: 'Spaces', icon: Radio },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-button ${page === item.id ? 'active' : ''}`}
                  onClick={() => setPage(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="surface-card mini-panel">
            <strong>
              {viewer.firstName} {viewer.lastName}
            </strong>
            <div className="meta-copy">@{viewer.username}</div>
            <div className="meta-copy">
              {viewer.followersCount} followers . {viewer.followingCount} following
            </div>
          </div>
        </aside>

        <section className="content">
          {page === 'home' && (
            <div className="stack">
              <section className="composer gradient-card">
                <div className="card-title-row">
                  <h2>Post to home</h2>
                  <span className="badge subtle">{postDraft.length}/300</span>
                </div>
                <form onSubmit={handleCreatePost} className="stack">
                  <textarea
                    rows={4}
                    value={postDraft}
                    onChange={(event) => setPostDraft(event.target.value.slice(0, 300))}
                    placeholder="What do you want to say?"
                  />
                  <div className="form-grid">
                    <label className="full-span">
                      Hashtags
                      <input
                        value={postHashtags}
                        onChange={(event) => setPostHashtags(event.target.value)}
                        placeholder="#community #hope"
                      />
                    </label>
                    <div className="switch-row">
                      <span>Post anonymously</span>
                      <button
                        type="button"
                        className={`switch ${postAnonymous ? 'on' : ''}`}
                        onClick={() => setPostAnonymous((current) => !current)}
                        aria-pressed={postAnonymous}
                      >
                        <span className="switch-thumb" />
                      </button>
                    </div>
                    <button type="submit" className="primary-button">
                      <Send size={16} />
                      Publish
                    </button>
                  </div>
                </form>
              </section>

              <section className="surface-card">
                <div className="card-title-row">
                  <h2>Home</h2>
                  <select value={feedTopic} onChange={(event) => setFeedTopic(event.target.value)}>
                    <option value="All">All topics</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="stack">
                  {visiblePosts.map((post) => {
                    return (
                      <article key={post.id} className="post-card clickable-card" onClick={() => openPostThread(post.id)}>
                        <div className="post-head">
                          <button type="button" className="profile-inline" onClick={(event) => {
                            event.stopPropagation()
                            openProfile(post.authorUsername)
                          }}>
                            <div className={`avatar avatar-${bannerClass(profiles.find((item) => item.username === post.authorUsername)?.banner ?? 'blue-gradient')}`}>
                              {post.authorAvatar}
                            </div>
                            <div>
                              <strong>{post.authorName}</strong>
                              <div className="meta-copy">
                                @{post.authorUsername} . {formatDate(post.createdAt)}
                              </div>
                            </div>
                          </button>
                          <span className="badge subtle">{post.topic}</span>
                        </div>

                        <p className="post-text">{post.text}</p>

                        <div className="hash-row">
                          {post.hashtags.map((tag) => (
                            <span key={tag} className="hash-tag">
                              <Hash size={12} />
                              {tag.replace('#', '')}
                            </span>
                          ))}
                        </div>

                        {post.mediaLabel && <div className="media-box">{post.mediaLabel}</div>}

                        <div className="icon-row">
                          <button type="button" className="icon-stat" onClick={(event) => {
                            event.stopPropagation()
                            void reactToPost(post.id, 'comment')
                          }}>
                            <MessageCircle size={18} />
                            <span>{post.repliesCount}</span>
                          </button>
                          <button type="button" className="icon-stat" onClick={(event) => {
                            event.stopPropagation()
                            void reactToPost(post.id, 'repost')
                          }}>
                            <Repeat2 size={18} />
                            <span>{post.repostsCount}</span>
                          </button>
                          <button type="button" className="icon-stat" onClick={(event) => {
                            event.stopPropagation()
                            void reactToPost(post.id, 'like')
                          }}>
                            <Heart size={18} />
                            <span>{post.likesCount}</span>
                          </button>
                          <div className="emoji-picker-wrap">
                            <button
                              type="button"
                              className="icon-stat"
                              onClick={(event) => {
                                event.stopPropagation()
                                setEmojiPickerPostId((current) => (current === post.id ? null : post.id))
                              }}
                            >
                              <SmilePlus size={18} />
                              <span>{emojiSelections[post.id] ?? 'React'}</span>
                            </button>
                            {emojiPickerPostId === post.id && (
                              <div className="emoji-popover" onClick={(event) => event.stopPropagation()}>
                                {['🙂', '❤️', '🔥', '👏', '💡'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="emoji-button"
                                    onClick={() => void handleEmojiReaction(post.id, emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="icon-stat static">
                            <Eye size={18} />
                            <span>{post.viewsCount}</span>
                          </div>
                          <button type="button" className="icon-stat" onClick={(event) => {
                            event.stopPropagation()
                            void reactToPost(post.id, 'bookmark')
                          }}>
                            <Bookmark size={18} />
                            <span>{postBookmarks.includes(post.id) ? 'saved' : 'save'}</span>
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>
          )}

          {page === 'explore' && (
            <div className="stack">
              <section className="surface-card">
                <div className="card-title-row">
                  <h2>Search and explore</h2>
                  <div className="button-row compact">
                    <button
                      type="button"
                      className={`chip ${searchSort === 'trending' ? 'selected' : ''}`}
                      onClick={() => setSearchSort('trending')}
                    >
                      Trending
                    </button>
                    <button
                      type="button"
                      className={`chip ${searchSort === 'latest' ? 'selected' : ''}`}
                      onClick={() => setSearchSort('latest')}
                    >
                      Latest
                    </button>
                  </div>
                </div>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search users, posts, or hashtags..."
                />
              </section>

              <section className="surface-card">
                <h2>Users</h2>
                <div className="stack">
                  {searchResults.profiles.map((profile) => (
                    <div key={profile.id} className="thread-item">
                      <button
                        type="button"
                        className="profile-list-item button-reset"
                        onClick={() => openProfile(profile.username)}
                      >
                        <div className={`avatar avatar-${bannerClass(profile.banner)}`}>{profile.avatar}</div>
                        <div>
                          <strong>
                            {profile.firstName} {profile.lastName}
                          </strong>
                          <div className="meta-copy">@{profile.username}</div>
                        </div>
                      </button>
                      {viewer && viewer.username !== profile.username && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void openDirectMessageWithUser(profile.username)}
                        >
                          <MessagesSquare size={16} />
                          Message
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="surface-card">
                <h2>Posts</h2>
                <div className="stack">
                  {searchResults.posts.map((post) => (
                    <article key={post.id} className="notice-item clickable-card" onClick={() => {
                      setPage('home')
                      openPostThread(post.id)
                    }}>
                      <strong>{post.authorName}</strong>
                      <p>{post.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="surface-card">
                <h2>Hashtags</h2>
                <div className="chip-row">
                  {searchResults.hashtags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="chip"
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {page === 'randomChat' && (
            <section className="surface-card random-chat-page">
              <div className="card-title-row">
                <div>
                  <h2>Random chat</h2>
                  <p className="meta-copy">Signed-in mode with lighter limits and optional profile sharing later</p>
                </div>
                <span className="badge subtle">
                  {randomChatStatus === 'connected' ? 'Connected' : randomChatStatus === 'connecting' ? 'Searching' : 'Ready'}
                </span>
              </div>
              <div className="form-grid">
                <label>
                  Random username
                  <input
                    value={randomChatName}
                    onChange={(event) => setRandomChatName(normalizeUsername(event.target.value))}
                    placeholder={viewer.username}
                  />
                </label>
                <label>
                  Interest
                  <select value={guestTopic} onChange={(event) => setGuestTopic(event.target.value)}>
                    <option value="">No preference</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-span">
                  Bio
                  <input
                    value={randomChatBio}
                    onChange={(event) => setRandomChatBio(event.target.value.slice(0, 60))}
                    placeholder="what do you want to talk about?"
                  />
                </label>
              </div>
              <div className="switch-row">
                <span>I confirm I am 18+</span>
                <button
                  type="button"
                  className={`switch ${randomChatAdult ? 'on' : ''}`}
                  onClick={() => setRandomChatAdult((current) => !current)}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
              {randomChatPartnerName && (
                <div className="meta-copy">
                  Connected with `{randomChatPartnerName}` {viewer ? `(${randomChatPartnerSignedIn ? 'signed in user' : 'guest'})` : ''}
                </div>
              )}
              <div className="chat-box large">
                {guestMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-bubble ${
                      message.sender === 'system' ? 'system' : message.sender === 'me' ? 'mine' : 'theirs'
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
              </div>
              {randomChatEnded && <p className="danger-copy">Chat ended.</p>}
              <div className="button-row">
                <input
                  className="chat-input"
                  value={randomChatDraft}
                  onChange={(event) => setRandomChatDraft(event.target.value.slice(0, 4000))}
                  placeholder="Say hello..."
                />
                <button type="button" className="primary-button" onClick={() => void handleSendRandomChatMessage()}>
                  <Send size={16} />
                  Send
                </button>
                <button type="button" className="secondary-button" onClick={() => void handleNewGuestChat()}>
                  <ArrowRight size={16} />
                  Start chat
                </button>
                <button type="button" className="secondary-button" onClick={() => void handleEndRandomChat()}>
                  End
                </button>
                <button type="button" className="secondary-button" onClick={() => void handleReportRandomChat()}>
                  Report
                </button>
              </div>
            </section>
          )}

          {page === 'messages' && (
            <div className="split-layout">
              <section className="surface-card">
                <div className="card-title-row">
                  <h2>Private messages</h2>
                  <span className="badge subtle">Signed in</span>
                </div>
                <div className="stack">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      className={`thread-item ${selectedThread?.id === thread.id ? 'active' : ''}`}
                      onClick={() => setSelectedThreadId(thread.id)}
                    >
                      <div className="avatar avatar-purple">{thread.avatar}</div>
                      <div>
                        <strong>{thread.name}</strong>
                        <div className="meta-copy">@{thread.username}</div>
                        <div className="meta-copy">
                          {thread.messages.at(-1)?.text?.slice(0, 42) ?? 'No messages yet'}
                        </div>
                      </div>
                      {thread.unreadCount > 0 && <span className="badge">{thread.unreadCount}</span>}
                    </button>
                  ))}
                </div>
              </section>

              <section className="surface-card">
                {selectedThread ? (
                  <>
                    <div className="card-title-row">
                      <button type="button" className="profile-inline button-reset" onClick={() => openProfile(selectedThread.username)}>
                        <div className="avatar avatar-purple">{selectedThread.avatar}</div>
                        <strong>{selectedThread.name}</strong>
                      </button>
                      <div className="button-row compact">
                        <button type="button" className="secondary-button">Voice</button>
                        <button type="button" className="secondary-button">Video</button>
                        <button type="button" className="secondary-button">Anon</button>
                      </div>
                    </div>
                    <div className="chat-box large">
                      {selectedThread.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`chat-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}`}
                        >
                          {message.text && <div>{message.text}</div>}
                          {message.mediaUrl && message.mediaType === 'image' && (
                            <img className="message-media" src={message.mediaUrl} alt="Shared media" />
                          )}
                          {message.mediaUrl && message.mediaType === 'video' && (
                            <video className="message-media" src={message.mediaUrl} controls />
                          )}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={sendMessage} className="stack">
                      <textarea
                        rows={3}
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value.slice(0, 4000))}
                        placeholder="Send a message..."
                      />
                      <div className="form-grid">
                        <label>
                          Media URL
                          <input
                            value={messageMediaUrl}
                            onChange={(event) => setMessageMediaUrl(event.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                        <label>
                          Media type
                          <select
                            value={messageMediaType}
                            onChange={(event) => setMessageMediaType(event.target.value as 'image' | 'video')}
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </label>
                      </div>
                      <div className="button-row">
                        <button type="submit" className="primary-button">
                          <Send size={16} />
                          Send
                        </button>
                        <button type="button" className="secondary-button" onClick={() => openInfo('Media messages', ['Paste an image or video URL to send shared media across devices.'])}>
                          Media
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            openInfo('Signed-in random chat', [
                              'Signed-in users can chat with fewer limits.',
                              'They can share profile if both sides agree.',
                              'They can keep better controls than guest mode.',
                            ])
                          }
                        >
                          Random chat rules
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <p className="meta-copy">Open a profile and tap Message to start a real conversation.</p>
                )}
              </section>
            </div>
          )}

          {page === 'groups' && (
            <div className="stack">
              <section className="surface-card">
                <div className="card-title-row">
                  <h2>Groups</h2>
                  <button type="button" className="primary-button" onClick={() => setGroupModalOpen(true)}>
                    <Users size={16} />
                    Make group
                  </button>
                </div>
                <p className="meta-copy">Public and private communities with a cleaner create flow.</p>
              </section>

              <div className="split-layout">
                <section className="surface-card">
                  <div className="stack">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        className={`thread-item ${selectedGroup.id === group.id ? 'active' : ''}`}
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <div className={`avatar avatar-${group.privacy === 'Private' ? 'purple' : 'green'}`}>
                          {group.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{group.name}</strong>
                          <div className="meta-copy">
                            @{group.handle} . {group.privacy}
                          </div>
                          <div className="meta-copy">{group.membersCount} members</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="surface-card">
                  <div className="card-title-row">
                    <h2>{selectedGroup.name}</h2>
                    <span className="badge subtle">{selectedGroup.privacy}</span>
                  </div>
                  <p>{selectedGroup.intro}</p>
                  <div className="meta-grid">
                    <span>Topic: {selectedGroup.topic}</span>
                    <span>Members: {selectedGroup.membersCount}</span>
                    <span>Text limit: {selectedGroup.charLimit}</span>
                    <span>Media: {selectedGroup.mediaRule}</span>
                  </div>
                  {viewerCanModerateGroup && (
                    <div className="form-grid">
                      <label>
                        Text limit
                        <select
                          value={String(selectedGroup.charLimit)}
                          onChange={(event) =>
                            void handleUpdateGroupRules(Number(event.target.value), selectedGroup.mediaRule)
                          }
                        >
                          {[500, 1000, 2000, 4000].map((value) => (
                            <option key={value} value={value}>
                              {value} chars
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Allowed media
                        <select
                          value={selectedGroup.mediaRule}
                          onChange={(event) =>
                            void handleUpdateGroupRules(selectedGroup.charLimit, event.target.value)
                          }
                        >
                          {['Text only', 'Text and images only', 'Text, images, video'].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  <div className="button-row">
                    {!viewerGroupMembership && (
                      <button type="button" className="primary-button" onClick={() => void handleJoinSelectedGroup()}>
                        {selectedGroup.privacy === 'Private' ? 'Request to join' : 'Join group'}
                      </button>
                    )}
                    {viewerGroupMembership?.status === 'requested' && (
                      <span className="badge subtle">Request pending</span>
                    )}
                    {viewerGroupMembership?.status === 'approved' && (
                      <span className="badge subtle">Joined</span>
                    )}
                  </div>
                  <div className="chip-row">
                    {selectedGroup.highlightedPosts.map((item) => (
                      <span key={item} className="chip static">
                        {item}
                      </span>
                    ))}
                  </div>
                  {(selectedGroup.privacy === 'Public' || viewerGroupMembership?.status === 'approved') && (
                    <form onSubmit={handleCreateGroupPost} className="stack">
                      <textarea
                        rows={3}
                        value={groupPostDraft}
                        onChange={(event) => setGroupPostDraft(event.target.value.slice(0, selectedGroup.charLimit))}
                        placeholder="Write in this group..."
                      />
                      <button type="submit" className="primary-button">
                        <Send size={16} />
                        Post to group
                      </button>
                    </form>
                  )}
                  <div className="stack">
                    {selectedGroupPosts.map((post) => (
                      <article key={post.id} className="notice-item">
                        {selectedGroup.privacy === 'Private' && viewerGroupMembership?.status !== 'approved' ? (
                          <strong>Member</strong>
                        ) : (
                          <button
                            type="button"
                            className="profile-inline"
                            onClick={() => openProfile(post.authorUsername)}
                          >
                            <div className={`avatar avatar-${bannerClass(profiles.find((item) => item.username === post.authorUsername)?.banner ?? 'yellow-gradient')}`}>
                              {post.authorAvatar}
                            </div>
                            <strong>{post.authorName}</strong>
                          </button>
                        )}
                        <p>{post.text}</p>
                        {viewerCanModerateGroup && (
                          <div className="button-row compact">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => void handleHighlightGroupPost(post.text)}
                            >
                              Highlight
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => void handleDeleteGroupPost(post.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  {viewer?.username === selectedGroup.creatorUsername && pendingGroupRequests.length > 0 && (
                    <div className="stack">
                      <h2>Pending requests</h2>
                      {pendingGroupRequests.map((request) => (
                        <div key={request.id} className="thread-item">
                          <div>
                            <strong>@{request.username}</strong>
                            <div className="meta-copy">Requested to join</div>
                          </div>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => void handleApproveGroupRequest(request.id)}
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewerCanModerateGroup && approvedGroupMembers.length > 0 && (
                    <div className="stack">
                      <h2>Members and admins</h2>
                      {approvedGroupMembers.map((member) => (
                        <div key={member.id} className="thread-item">
                          <div>
                            <strong>@{member.username}</strong>
                            <div className="meta-copy">{member.role}</div>
                          </div>
                          {member.username !== selectedGroup.creatorUsername && (
                            <div className="button-row compact">
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  void handlePromoteGroupMember(
                                    member.id,
                                    member.role === 'admin' ? 'member' : 'admin',
                                  )
                                }
                              >
                                {member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => void handleBanGroupMember(member.id)}
                              >
                                Ban
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {page === 'spaces' && (
            <div className="split-layout">
              <section className="surface-card">
                <div className="stack">
                  {spaces.map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      className={`thread-item ${selectedSpace.id === space.id ? 'active' : ''}`}
                      onClick={() => setSelectedSpaceId(space.id)}
                    >
                      <div className="avatar avatar-blue">SP</div>
                      <div>
                        <strong>{space.title}</strong>
                        <div className="meta-copy">{space.hostName}</div>
                        <div className="meta-copy">{space.listenersCount} listeners</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="surface-card">
                <div className="card-title-row">
                  <h2>{selectedSpace.title}</h2>
                  <span className="badge subtle">Live mock</span>
                </div>
                <button type="button" className="profile-inline button-reset" onClick={() => openProfile(selectedSpace.hostUsername)}>
                  <div className="avatar avatar-yellow">{selectedSpace.hostName.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{selectedSpace.hostName}</strong>
                    <div className="meta-copy">@{selectedSpace.hostUsername}</div>
                  </div>
                </button>
                <div className="chip-row">
                  <span className="chip static">{selectedSpace.recorded ? 'Recorded' : 'Unrecorded'}</span>
                  <span className="chip static">{selectedSpace.incognito ? 'Incognito' : 'Public'}</span>
                  <span className="chip static">
                    {selectedSpace.allowAnonymous ? 'Anonymous allowed' : 'Named only'}
                  </span>
                </div>
                <div className="space-stage">
                  <div className="space-circle">Host</div>
                  <div className="space-circle subtle-circle">Speaker</div>
                  <div className="space-circle subtle-circle">Speaker</div>
                  <div className="space-circle subtle-circle">Listener</div>
                </div>
                <div className="button-row">
                  <button type="button" className="primary-button">Join</button>
                  <button type="button" className="secondary-button">Request mic</button>
                  <button type="button" className="secondary-button">Share</button>
                </div>
              </section>
            </div>
          )}

          {page === 'notifications' && (
            <section className="surface-card stack">
              {notifications.map((item) => (
                <article key={item.id} className="notice-item">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                  <span className="meta-copy">{formatDate(item.createdAt)}</span>
                </article>
              ))}
            </section>
          )}

          {page === 'bookmarks' && (
            <div className="stack">
              <section className="surface-card">
                <h2>Saved posts</h2>
                <div className="stack">
                  {bookmarkedPosts.map((post) => (
                    <article key={post.id} className="notice-item">
                      <strong>{post.authorName}</strong>
                      <p>{post.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="surface-card">
                <h2>Saved profiles</h2>
                <div className="stack">
                  {bookmarkedProfiles.map((profile) => (
                    <div key={profile.id} className="thread-item">
                      <button
                        type="button"
                        className="profile-list-item button-reset"
                        onClick={() => openProfile(profile.username)}
                      >
                        <div className={`avatar avatar-${bannerClass(profile.banner)}`}>{profile.avatar}</div>
                        <div>
                          <strong>
                            {profile.firstName} {profile.lastName}
                          </strong>
                          <div className="meta-copy">@{profile.username}</div>
                        </div>
                      </button>
                      {viewer && viewer.username !== profile.username && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void openDirectMessageWithUser(profile.username)}
                        >
                          <MessagesSquare size={16} />
                          Message
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {page === 'profile' && selectedProfile && (
            <div className="stack">
              <section className={`surface-card profile-header-card ${bannerClass(selectedProfile.banner)}`}>
                <div className="profile-banner-content">
                  <div className={`avatar avatar-${bannerClass(selectedProfile.banner)} large`}>
                    {selectedProfile.avatar}
                  </div>
                  <div className="stack narrow">
                    <h2>
                      {selectedProfile.firstName} {selectedProfile.lastName}
                    </h2>
                    <div className="meta-copy">@{selectedProfile.username}</div>
                    <div className="meta-copy">
                      {selectedProfile.location} . Joined {joinedWeeksAgo(selectedProfile.createdAt)}
                    </div>
                    <p>{selectedProfile.bio}</p>
                    <div className="chip-row">
                      {selectedProfile.interests.map((interest) => (
                        <span key={interest} className="chip static">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="button-row">
                      {selectedProfile.username !== viewer.username && (
                        <>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => void toggleFollow(selectedProfile.username)}
                          >
                            {followingUsernames.includes(selectedProfile.username) ? <UserCheck size={16} /> : <UserPlus size={16} />}
                            {followingUsernames.includes(selectedProfile.username)
                              ? 'Following'
                              : follows.some(
                                    (item) =>
                                      item.followerUsername === viewer.username &&
                                      item.followingUsername === selectedProfile.username &&
                                      item.status === 'pending',
                                  )
                                ? 'Requested'
                                : 'Follow'}
                          </button>
                          {canMessageSelectedProfile ? (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => void openDirectMessageWithUser(selectedProfile.username)}
                            >
                              Message
                            </button>
                          ) : (
                            <button type="button" className="secondary-button" disabled>
                              {selectedProfile.isPrivate ? 'Private profile' : 'Follow to message'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setProfileActionModalUsername(selectedProfile.username)}
                          >
                            <Ellipsis size={16} />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => toggleProfileBookmark(selectedProfile.username)}
                      >
                        <Bookmark size={16} />
                        {profileBookmarks.includes(selectedProfile.username) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <div className="meta-grid">
                  <span>{selectedProfile.followersCount} followers</span>
                  <span>{selectedProfile.followingCount} following</span>
                  <span>{selectedProfile.isPrivate ? 'Private profile' : 'Public profile'}</span>
                  <span>{selectedProfile.allowOnlyFollowersToMessage ? 'Restricted messages' : 'Open messages'}</span>
                </div>
              </section>

              {canViewSelectedProfile ? (
                <>
                  <section className="surface-card">
                    <div className="split-layout">
                      <div className="stack">
                        <div className="card-title-row">
                          <h2>Public groups</h2>
                          <span className="badge subtle">{selectedProfilePublicGroups.length}</span>
                        </div>
                        {selectedProfilePublicGroups.length > 0 ? (
                          selectedProfilePublicGroups.map((group) => (
                            <button
                              key={group.id}
                              type="button"
                              className="thread-item"
                              onClick={() => {
                                setSelectedGroupId(group.id)
                                setPage('groups')
                              }}
                            >
                              <div>
                                <strong>{group.name}</strong>
                                <div className="meta-copy">@{group.handle}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="meta-copy">No public groups shared on this profile yet.</p>
                        )}
                      </div>
                      <div className="stack">
                        <div className="card-title-row">
                          <h2>Hosted spaces</h2>
                          <span className="badge subtle">{selectedProfileHostedSpaces.length}</span>
                        </div>
                        {selectedProfileHostedSpaces.length > 0 ? (
                          selectedProfileHostedSpaces.map((space) => (
                            <button
                              key={space.id}
                              type="button"
                              className="thread-item"
                              onClick={() => {
                                setSelectedSpaceId(space.id)
                                setPage('spaces')
                              }}
                            >
                              <div>
                                <strong>{space.title}</strong>
                                <div className="meta-copy">{space.listenersCount} listeners</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="meta-copy">No spaces hosted yet.</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="surface-card">
                    <div className="card-title-row">
                      <h2>Followers and following</h2>
                      <span className="badge subtle">Mutuals first</span>
                    </div>
                    <div className="split-layout">
                      <div className="stack">
                        <strong>Followers</strong>
                        {selectedProfileFollowers.map((profile) => (
                          <div key={profile.username} className="thread-item">
                            <button
                              type="button"
                              className="profile-list-item button-reset"
                              onClick={() => openProfile(profile.username)}
                            >
                              <div className={`avatar avatar-${bannerClass(profile.banner)}`}>{profile.avatar}</div>
                              <div>
                                <strong>{profile.firstName} {profile.lastName}</strong>
                                <div className="meta-copy">@{profile.username}</div>
                                {isMutualWithViewer(profile.username) && (
                                  <div className="meta-copy">Mutual connection</div>
                                )}
                              </div>
                            </button>
                            {viewer && viewer.username !== profile.username && (
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => void openDirectMessageWithUser(profile.username)}
                              >
                                <MessagesSquare size={16} />
                                Message
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="stack">
                        <strong>Following</strong>
                        {selectedProfileFollowing.map((profile) => (
                          <div key={profile.username} className="thread-item">
                            <button
                              type="button"
                              className="profile-list-item button-reset"
                              onClick={() => openProfile(profile.username)}
                            >
                              <div className={`avatar avatar-${bannerClass(profile.banner)}`}>{profile.avatar}</div>
                              <div>
                                <strong>{profile.firstName} {profile.lastName}</strong>
                                <div className="meta-copy">@{profile.username}</div>
                                {isMutualWithViewer(profile.username) && (
                                  <div className="meta-copy">Mutual connection</div>
                                )}
                              </div>
                            </button>
                            {viewer && viewer.username !== profile.username && (
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => void openDirectMessageWithUser(profile.username)}
                              >
                                <MessagesSquare size={16} />
                                Message
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="surface-card">
                    <div className="card-title-row">
                      <h2>Posts and replies</h2>
                      <select
                        value={profilePostSort}
                        onChange={(event) =>
                          setProfilePostSort(event.target.value as 'popular' | 'latest' | 'oldest')
                        }
                      >
                        <option value="latest">Latest</option>
                        <option value="oldest">Oldest</option>
                        <option value="popular">Popular</option>
                      </select>
                    </div>
                    <div className="stack">
                      {selectedProfilePosts.map((post) => (
                        <article key={post.id} className="notice-item clickable-card" onClick={() => openPostThread(post.id)}>
                          <strong>{post.authorName}</strong>
                          <p>{post.text}</p>
                          <span className="meta-copy">
                            {post.likesCount} likes . {post.repliesCount} replies . {formatDate(post.createdAt)}
                          </span>
                        </article>
                      ))}
                      {selectedProfileReplies.map((reply) => (
                        <article key={reply.id} className="notice-item">
                          <strong>Reply</strong>
                          <p>{reply.text}</p>
                          <span className="meta-copy">{formatDate(reply.createdAt)}</span>
                        </article>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <section className="surface-card">
                  <p className="meta-copy">
                    This profile is private. Its public posts may still appear in the home feed, but profile details stay hidden until the follow request is approved.
                  </p>
                </section>
              )}
            </div>
          )}

          {page === 'settings' && (
            <div className="stack">
              <section className="surface-card">
                <div className="card-title-row">
                  <h2>Settings</h2>
                  <span className="badge subtle">
                    {hasSupabaseConfig ? 'Supabase sync enabled' : 'Local mode'}
                  </span>
                </div>

                <div className="form-grid">
                  <label>
                    First name
                    <input
                      value={viewer.firstName}
                      onChange={(event) =>
                        replaceViewerEverywhere({ ...viewer, firstName: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      value={viewer.lastName}
                      onChange={(event) =>
                        replaceViewerEverywhere({ ...viewer, lastName: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Location
                    <input
                      value={viewer.location}
                      onChange={(event) =>
                        replaceViewerEverywhere({ ...viewer, location: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Website
                    <input
                      value={viewer.website}
                      onChange={(event) =>
                        replaceViewerEverywhere({ ...viewer, website: event.target.value })
                      }
                    />
                  </label>
                  <label className="full-span">
                    Bio
                    <textarea
                      rows={3}
                      value={viewer.bio}
                      onChange={(event) =>
                        replaceViewerEverywhere({
                          ...viewer,
                          bio: event.target.value.slice(0, 175),
                        })
                      }
                    />
                  </label>
                </div>

                <div className="settings-list">
                  <div className="switch-row">
                    <span>Private profile</span>
                    <button
                      type="button"
                      className={`switch ${viewer.isPrivate ? 'on' : ''}`}
                      onClick={() => replaceViewerEverywhere({ ...viewer, isPrivate: !viewer.isPrivate })}
                      aria-pressed={viewer.isPrivate}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                  <div className="switch-row">
                    <span>Only followers can message me</span>
                    <button
                      type="button"
                      className={`switch ${viewer.allowOnlyFollowersToMessage ? 'on' : ''}`}
                      onClick={() =>
                        replaceViewerEverywhere({
                          ...viewer,
                          allowOnlyFollowersToMessage: !viewer.allowOnlyFollowersToMessage,
                        })
                      }
                      aria-pressed={viewer.allowOnlyFollowersToMessage}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                  <div className="switch-row">
                    <span>Anonymous posting on by default</span>
                    <button
                      type="button"
                      className={`switch ${viewer.defaultAnonymousPosting ? 'on' : ''}`}
                      onClick={() =>
                        replaceViewerEverywhere({
                          ...viewer,
                          defaultAnonymousPosting: !viewer.defaultAnonymousPosting,
                        })
                      }
                      aria-pressed={viewer.defaultAnonymousPosting}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                </div>

                {pendingFollowRequests.length > 0 && (
                  <div className="stack">
                    <h2>Pending follow requests</h2>
                    {pendingFollowRequests.map((request) => (
                      <div key={request.id} className="thread-item">
                        <div>
                          <strong>@{request.followerUsername}</strong>
                          <div className="meta-copy">Requested to follow your private profile.</div>
                        </div>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void handleApproveFollowRequest(request.id)}
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="button-row">
                  <button type="button" className="primary-button" onClick={handleSaveProfileChanges}>
                    <Settings size={16} />
                    Save profile changes
                  </button>
                  <span className="meta-copy">
                    {profileSaveState === 'saving' && 'Saving to database...'}
                    {profileSaveState === 'saved' && 'Saved to database.'}
                    {profileSaveState === 'error' && 'Could not save right now.'}
                    {profileSaveState === 'idle' &&
                      (hasSupabaseConfig
                        ? 'Ready to save to Supabase.'
                        : 'Connect Supabase to make this save online.')}
                  </span>
                </div>
              </section>
            </div>
          )}
        </section>

        <aside className="rightbar">
          <section className="surface-card">
            <div className="card-title-row">
              <h2>Trending subjects</h2>
              <span className="badge subtle">Live from posts</span>
            </div>
            <div className="stack small-gap">
              {trendingTopics.map(([topic, count]) => (
                <button
                  key={topic}
                  type="button"
                  className="trend-row"
                  onClick={() => {
                    setPage('explore')
                    setSearchQuery(topic)
                  }}
                >
                  <div>
                    <strong>{topic}</strong>
                    <div className="meta-copy">{count} posts</div>
                  </div>
                  <TrendingUp size={16} />
                </button>
              ))}
            </div>
          </section>

          <section className="surface-card">
            <div className="card-title-row">
              <h2>Hot posts</h2>
              <span className="badge subtle">Sensational now</span>
            </div>
            <div className="stack">
              {hotPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="hot-post-row"
                  onClick={() => {
                    setPage('home')
                    openPostThread(post.id)
                  }}
                >
                  <div className="hot-post-icon">
                    <Flame size={16} />
                  </div>
                  <div>
                    <strong>{post.authorName}</strong>
                    <p className="meta-copy">{post.text.slice(0, 90)}...</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="surface-card">
            <div className="card-title-row">
              <h2>Live signals</h2>
              <span className="badge subtle">Status</span>
            </div>
            {infoPanel ? (
              <div className="stack">
                <strong>{infoPanel.title}</strong>
                {infoPanel.lines.map((line) => (
                  <p key={line} className="meta-copy">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="meta-copy">Privacy, reports, and random-chat status updates appear here.</p>
            )}
          </section>
        </aside>
      </div>

      <nav className="mobile-nav">
        {[
          { id: 'home' as const, icon: Home },
          { id: 'messages' as const, icon: MessagesSquare },
          { id: 'groups' as const, icon: Users },
          { id: 'spaces' as const, icon: Radio },
        ].map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-button ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={18} />
            </button>
          )
        })}
      </nav>

      {groupModalOpen && (
        <div className="modal-backdrop" onClick={() => setGroupModalOpen(false)}>
          <div className="auth-modal surface-card" onClick={(event) => event.stopPropagation()}>
            <div className="card-title-row">
              <h2>Make group</h2>
              <button type="button" className="icon-button" onClick={() => setGroupModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={async (event) => {
                await handleCreateGroup(event)
                setGroupModalOpen(false)
              }}
              className="stack"
            >
              <div className="form-grid">
                <label>
                  Group name
                  <input value={groupName} onChange={(event) => setGroupName(event.target.value)} />
                </label>
                <label>
                  Group handle
                  <input
                    value={groupHandle}
                    onChange={(event) => setGroupHandle(normalizeUsername(event.target.value))}
                  />
                </label>
                <label>
                  Topic
                  <select value={groupTopic} onChange={(event) => setGroupTopic(event.target.value)}>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="full-span stack narrow-gap">
                  <span>Privacy</span>
                  <div className="segmented-control">
                    {(['Public', 'Private'] as const).map((privacy) => (
                      <button
                        key={privacy}
                        type="button"
                        className={`segment ${groupPrivacy === privacy ? 'active' : ''}`}
                        onClick={() => setGroupPrivacy(privacy)}
                      >
                        {privacy}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="full-span">
                  Intro
                  <textarea
                    rows={3}
                    value={groupIntro}
                    onChange={(event) => setGroupIntro(event.target.value.slice(0, 175))}
                  />
                </label>
              </div>
              <button type="submit" className="primary-button">
                <Users size={16} />
                Create group
              </button>
            </form>
          </div>
        </div>
      )}

      {profileActionModalUsername && (
        <div className="modal-backdrop" onClick={closeProfileActionModal}>
          <div className="auth-modal surface-card" onClick={(event) => event.stopPropagation()}>
            <div className="card-title-row">
              <div>
                <h2>Profile actions</h2>
                <div className="meta-copy">@{profileActionModalUsername}</div>
              </div>
              <button type="button" className="icon-button" onClick={closeProfileActionModal}>
                <X size={16} />
              </button>
            </div>

            <div className="stack">
              <div className="button-row">
                <button
                  type="button"
                  className={blockedUsernames.includes(profileActionModalUsername) ? 'primary-button' : 'secondary-button'}
                  onClick={() => void handleToggleProfileAction(profileActionModalUsername, 'block')}
                >
                  {blockedUsernames.includes(profileActionModalUsername) ? 'Unblock' : 'Block'}
                </button>
                <button
                  type="button"
                  className={hiddenUsernames.includes(profileActionModalUsername) ? 'primary-button' : 'secondary-button'}
                  onClick={() => void handleToggleProfileAction(profileActionModalUsername, 'hide')}
                >
                  {hiddenUsernames.includes(profileActionModalUsername) ? 'Unhide' : 'Hide'}
                </button>
                <button
                  type="button"
                  className={notifiedUsernames.includes(profileActionModalUsername) ? 'primary-button' : 'secondary-button'}
                  onClick={() => void handleToggleProfileAction(profileActionModalUsername, 'notify')}
                >
                  {notifiedUsernames.includes(profileActionModalUsername) ? 'Notifications on' : 'Notify me'}
                </button>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleReportProfile(profileActionModalUsername)}
              >
                Report profile
              </button>

              <div className="stack narrow-gap">
                <strong>Tags</strong>
                <div className="button-row">
                  <input
                    value={profileTagDraft}
                    onChange={(event) => setProfileTagDraft(event.target.value)}
                    placeholder="Add a private tag"
                  />
                  <button type="button" className="primary-button" onClick={() => void handleAddProfileTag()}>
                    Save tag
                  </button>
                </div>
                <div className="chip-row">
                  {selectedProfileTags.length > 0 ? (
                    selectedProfileTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="chip"
                        onClick={() => void handleRemoveProfileTag(tag)}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <span className="meta-copy">No private tags yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {commentModalOpen && selectedPost && (
        <div className="modal-backdrop" onClick={closeCommentModal}>
          <div className="auth-modal surface-card comment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="card-title-row">
              <div>
                <h2>Comments and replies</h2>
                <div className="meta-copy">Thread for {selectedPost.authorName}</div>
              </div>
              <button type="button" className="icon-button" onClick={closeCommentModal}>
                <X size={16} />
              </button>
            </div>

            <article className="thread-post">
              <strong>{selectedPost.authorName}</strong>
              <p>{selectedPost.text}</p>
            </article>

            <form onSubmit={handleAddComment} className="stack">
              <textarea
                rows={3}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value.slice(0, 300))}
                placeholder="Write a comment..."
              />
              <button type="submit" className="primary-button">
                <MessageCircle size={16} />
                Comment
              </button>
            </form>

            <div className="stack">
              {comments
                .filter((comment) => comment.postId === selectedPost.id && comment.parentId === null)
                .map((comment) => renderCommentNode(comment))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
