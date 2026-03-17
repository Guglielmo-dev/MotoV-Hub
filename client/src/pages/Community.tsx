import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Trash2, Plus, Send, Image as ImageIcon, X, Users } from "lucide-react";

const CATEGORIES = [
  { id: 'all', label: 'All Posts', emoji: '🏍️' },
  { id: 'advice', label: 'Advice', emoji: '💡' },
  { id: 'rides', label: 'Rides', emoji: '🛣️' },
  { id: 'gear', label: 'Gear', emoji: '⚙️' },
  { id: 'meetup', label: 'Meetup', emoji: '📅' },
  { id: 'showoff', label: 'Show Off', emoji: '🏆' },
  { id: 'general', label: 'General', emoji: '💬' },
];

const CATEGORY_COLORS: Record<string, string> = {
  advice: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  rides: 'text-green-400 bg-green-400/10 border-green-400/20',
  gear: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  meetup: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  showoff: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  general: 'text-muted-foreground bg-white/5 border-white/10',
};

function timeAgo(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-10 h-10 text-base' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs';
  return (
    <div className={`${sizeClass} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1];
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {cat.emoji} {cat.label}
    </span>
  );
}

interface Post {
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

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string | null;
  authorUsername: string;
}

function NewPostDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: object) => apiRequest('POST', '/api/community/posts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      toast({ title: 'Post published!' });
      setTitle(''); setContent(''); setCategory('general'); setImageUrl('');
      onClose();
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setImageUrl(data.url);
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display uppercase text-primary">New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); mutate({ title, content, category, imageUrl: imageUrl || null }); }} className="space-y-4 pt-2">
          <input
            required value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-primary/50"
            data-testid="input-post-title"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button
                key={cat.id} type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === cat.id ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/25'}`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <textarea
            required value={content} onChange={e => setContent(e.target.value)}
            placeholder="Share your thoughts, experience, or question with the community..."
            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 h-36 resize-none focus:outline-none focus:border-primary/50"
            data-testid="input-post-content"
          />
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imageUrl} className="w-full h-48 object-cover" />
              <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/15 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-sm disabled:opacity-50">
              <ImageIcon className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Add an image (optional)'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50" data-testid="button-submit-post">
              {isPending ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PostDetailDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const { data: user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['/api/community/posts', post.id, 'comments'],
    queryFn: () => fetch(`/api/community/posts/${post.id}/comments`).then(r => r.json()),
  });

  const { mutate: addComment, isPending: commentPending } = useMutation({
    mutationFn: (content: string) => apiRequest('POST', `/api/community/posts/${post.id}/comments`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts', post.id, 'comments'] });
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setCommentText('');
    },
  });

  const { mutate: deleteComment } = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/community/comments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts', post.id, 'comments'] });
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  const { mutate: toggleLike } = useMutation({
    mutationFn: () => apiRequest('POST', `/api/community/posts/${post.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/community/posts'] }),
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/community/posts/${post.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      toast({ title: 'Post deleted' });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={post.authorUsername} size="md" />
              <div>
                <p className="font-semibold text-sm">{post.authorUsername}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
              </div>
            </div>
            <CategoryBadge category={post.category} />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">{post.title}</h2>
          {post.imageUrl && (
            <img src={post.imageUrl} className="w-full rounded-xl object-cover max-h-72" />
          )}
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

          <div className="flex items-center gap-4 pt-2 border-t border-white/5">
            <button
              onClick={() => toggleLike()}
              className={`flex items-center gap-1.5 text-sm transition-colors ${post.likedByMe ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-primary' : ''}`} />
              {post.likeCount}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" /> {comments.length}
            </span>
            {user?.id === post.userId && (
              <button onClick={() => deletePost()} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Comments ({comments.length})
            </h3>
            {commentsLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">Loading comments...</div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Be the first to comment!</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5 group">
                    <Avatar name={c.authorUsername} />
                    <div className="flex-1 bg-background rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">{c.authorUsername}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1 text-foreground/90">{c.content}</p>
                    </div>
                    {user?.id === c.userId && (
                      <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all self-start mt-2">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); if (commentText.trim()) addComment(commentText); }} className="flex gap-2 pt-1">
              <input
                value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                data-testid="input-comment"
              />
              <button type="submit" disabled={commentPending || !commentText.trim()}
                className="px-3 py-2 bg-primary text-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const { data: user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { mutate: toggleLike } = useMutation({
    mutationFn: () => apiRequest('POST', `/api/community/posts/${post.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/community/posts'] }),
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/community/posts/${post.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      toast({ title: 'Post deleted' });
    },
  });

  return (
    <div
      className="bg-card border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all cursor-pointer group"
      onClick={onClick}
      data-testid={`card-post-${post.id}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={post.authorUsername} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-primary">{post.authorUsername}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
            <CategoryBadge category={post.category} />
          </div>
          <h3 className="mt-2 font-bold text-base group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed">{post.content}</p>

          {post.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={post.imageUrl} className="w-full h-40 object-cover" />
            </div>
          )}

          <div className="mt-3 flex items-center gap-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => toggleLike()}
              className={`flex items-center gap-1.5 text-sm transition-colors ${post.likedByMe ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-primary' : ''}`} />
              {post.likeCount}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" /> {post.commentCount}
            </span>
            {user?.id === post.userId && (
              <button
                onClick={() => deletePost()}
                className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                data-testid={`button-delete-post-${post.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Community() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { data: user } = useAuth();

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/community/posts'],
  });

  const filtered = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display uppercase tracking-wide flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Share tips, rides, gear reviews and connect with fellow riders</p>
        </div>
        <button
          onClick={() => setNewPostOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          data-testid="button-new-post"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border
              ${activeCategory === cat.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'border-white/8 text-muted-foreground hover:text-foreground hover:border-white/20 bg-card'}`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-primary/50" />
          </div>
          <p className="text-muted-foreground">No posts yet in this category.</p>
          <button onClick={() => setNewPostOpen(true)} className="px-6 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium">
            Be the first to post!
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
          ))}
        </div>
      )}

      <NewPostDialog open={newPostOpen} onClose={() => setNewPostOpen(false)} />
      {selectedPost && <PostDetailDialog post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}
