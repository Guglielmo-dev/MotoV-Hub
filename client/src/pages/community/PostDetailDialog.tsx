import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Post, Comment } from "./types";
import { Avatar, CategoryBadge, timeAgo } from "./components";
import { CommentSection } from "./CommentSection";

interface PostDetailDialogProps {
  post: Post;
  onClose: () => void;
  onEdit: () => void;
}

export function PostDetailDialog({ post, onClose, onEdit }: PostDetailDialogProps) {
  const { data: user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['/api/community/posts', post.id, 'comments'],
    queryFn: () => fetch(`/api/community/posts/${post.id}/comments`).then(r => r.json()),
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
        <DialogHeader className="pr-10">
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
              <div className="ml-auto flex items-center gap-2">
                <button 
                  onClick={() => { onEdit(); onClose(); }} 
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Edit post"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deletePost()} 
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <CommentSection post={post} comments={comments} isLoading={commentsLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
