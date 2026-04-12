import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Post } from "./types";
import { Avatar, CategoryBadge, timeAgo } from "./components";

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onEdit: () => void;
}

export function PostCard({ post, onClick, onEdit }: PostCardProps) {
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
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              title="View comments"
            >
              <MessageCircle className="w-4 h-4" /> {post.commentCount}
            </button>
            {user?.id === post.userId && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Edit post"
                  data-testid={`button-edit-post-${post.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePost(); }}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  data-testid={`button-delete-post-${post.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
