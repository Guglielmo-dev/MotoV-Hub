export interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
  imageUrl: string | null;
  category: string;
  createdAt: string | null;
  authorUsername: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  createdAt: string | null;
  authorUsername: string;
}

export const CATEGORIES = [
  { id: 'all', label: 'All Posts', emoji: '🏍️' },
  { id: 'advice', label: 'Advice', emoji: '💡' },
  { id: 'rides', label: 'Rides', emoji: '🛣️' },
  { id: 'gear', label: 'Gear', emoji: '⚙️' },
  { id: 'meetup', label: 'Meetup', emoji: '📅' },
  { id: 'showoff', label: 'Show Off', emoji: '🏆' },
  { id: 'general', label: 'General', emoji: '💬' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  advice: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  rides: 'text-green-400 bg-green-400/10 border-green-400/20',
  gear: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  meetup: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  showoff: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  general: 'text-muted-foreground bg-white/5 border-white/10',
};
