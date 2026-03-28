export type Page =
  | 'home'
  | 'explore'
  | 'messages'
  | 'groups'
  | 'spaces'
  | 'randomChat'
  | 'notifications'
  | 'bookmarks'
  | 'profile'
  | 'settings'

export type UserProfile = {
  id: string
  username: string
  firstName: string
  lastName: string
  bio: string
  location: string
  birthday: string
  website: string
  interests: string[]
  avatar: string
  banner: string
  isPrivate: boolean
  allowOnlyFollowersToMessage: boolean
  defaultAnonymousPosting: boolean
  followersCount: number
  followingCount: number
  createdAt: string
}

export type Post = {
  id: string
  authorUsername: string
  authorName: string
  authorAvatar: string
  text: string
  topic: string
  hashtags: string[]
  createdAt: string
  likesCount: number
  repliesCount: number
  repostsCount: number
  viewsCount: number
  isAnonymous: boolean
  groupHandle?: string
  mediaLabel?: string
}

export type Group = {
  id: string
  name: string
  handle: string
  intro: string
  topic: string
  privacy: 'Public' | 'Private'
  membersCount: number
  charLimit: number
  creatorUsername: string
  mediaRule: string
  highlightedPosts: string[]
}

export type GroupMembership = {
  id: string
  groupId: string
  username: string
  role: 'creator' | 'admin' | 'member'
  status: 'requested' | 'approved' | 'banned'
  createdAt: string
  approvedAt?: string | null
}

export type GroupPost = {
  id: string
  groupId: string
  authorUsername: string
  authorName: string
  authorAvatar: string
  text: string
  topic: string
  createdAt: string
}

export type Space = {
  id: string
  title: string
  hostUsername: string
  hostName: string
  listenersCount: number
  speakersCount: number
  recorded: boolean
  incognito: boolean
  allowAnonymous: boolean
  groupHandle?: string
  createdAt: string
}

export type Message = {
  id: string
  sender: 'me' | 'them'
  senderUsername?: string
  text: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  createdAt: string
}

export type Thread = {
  id: string
  username: string
  name: string
  avatar: string
  anonymousReady: boolean
  pinned: boolean
  unreadCount: number
  updatedAt?: string
  messages: Message[]
}

export type NotificationItem = {
  id: string
  title: string
  text: string
  createdAt: string
}

export type GuestChatMessage = {
  id: string
  sender: 'me' | 'them' | 'system'
  text: string
}

export type FollowRelation = {
  id: string
  followerUsername: string
  followingUsername: string
  status: 'pending' | 'approved'
  createdAt: string
  approvedAt?: string | null
}

export type ProfileAction = {
  id: string
  actorUsername: string
  targetUsername: string
  actionType: 'block' | 'hide' | 'notify' | 'report' | 'tag'
  actionValue: string
  createdAt: string
}

export type CommentNode = {
  id: string
  postId: string
  parentId: string | null
  authorName: string
  authorUsername: string
  text: string
  createdAt: string
  replies: CommentNode[]
}

export type ProfileMenuTarget = 'profile' | 'bookmarks' | 'notifications' | 'settings'

export type InfoPanel = {
  title: string
  lines: string[]
} | null
