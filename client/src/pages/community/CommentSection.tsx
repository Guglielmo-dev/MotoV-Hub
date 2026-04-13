import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Comment, Post } from "./types";
import { Avatar, timeAgo } from "./components";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface CommentSectionProps {
  post: Post;
  comments: Comment[];
  isLoading: boolean;
}

export function CommentSection({ post, comments, isLoading }: CommentSectionProps) {
  const { data: user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const qc = useQueryClient();
  const { t } = useTranslation();

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
    <div className="border-t border-white/5 pt-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {t('community.comments')}
        </h3>
        <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 min-w-[20px] text-center">
          {comments.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground animate-pulse">{t('common.loading')}</p>
        </div>
      ) : comments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{t('community.noComments') || 'No comments yet.'}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-1">{t('community.beFirstComment') || 'Be the first to share your thoughts!'}</p>
        </motion.div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 comments-scrollbar">
          <AnimatePresence mode="popLayout">
            {comments.map((c, index) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 group border-l-2 border-primary/30 pl-4 py-1 hover:bg-white/[0.03] transition-all rounded-r-xl"
              >
                <Avatar name={c.authorUsername} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-display font-bold text-primary uppercase tracking-tight">
                      {c.authorUsername}
                    </span>
                    <span className="text-[9px] uppercase font-medium text-muted-foreground/60 tracking-tighter">
                      {timeAgo(c.createdAt, t)}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 text-foreground/90 leading-snug">
                    {c.content}
                  </p>
                </div>
                {user?.id === c.userId && (
                  <button 
                    onClick={() => deleteComment(c.id)} 
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all self-start"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="pt-2">
        <form 
          onSubmit={e => { e.preventDefault(); if (commentText.trim()) addComment(commentText); }} 
          className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-2xl focus-within:border-primary/30 transition-colors"
        >
          <div className="pl-1">
            <Avatar name={user?.username || 'U'} size="md" />
          </div>
          <input
            value={commentText} onChange={e => setCommentText(e.target.value)}
            placeholder={t('community.writeComment') || "Write a comment..."}
            className="flex-1 bg-transparent border-none rounded-xl px-2 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/40"
            data-testid="input-comment"
          />
          <button 
            type="submit" 
            disabled={commentPending || !commentText.trim()}
            title={t('community.sendComment') || "Send comment"}
            className="p-2.5 bg-primary text-black rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
