import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Comment, Post } from "./types";
import { Avatar, timeAgo } from "./components";

interface CommentSectionProps {
  post: Post;
  comments: Comment[];
  isLoading: boolean;
}

export function CommentSection({ post, comments, isLoading }: CommentSectionProps) {
  const { data: user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const qc = useQueryClient();

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

  return (
    <div className="border-t border-white/5 pt-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Comments ({comments.length})
      </h3>
      {isLoading ? (
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
  );
}
