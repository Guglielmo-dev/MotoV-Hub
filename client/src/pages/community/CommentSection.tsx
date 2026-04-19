import { useState, useRef } from "react";
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
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { t } = useTranslation();

  const toggleReplies = (commentId: number) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const { mutate: addComment, isPending: commentPending } = useMutation({
    mutationFn: (data: { content: string; parentId?: number }) => 
      apiRequest('POST', `/api/community/posts/${post.id}/comments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts', post.id, 'comments'] });
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setCommentText('');
      setReplyTo(null);
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
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {comments.filter(c => !c.parentId).map((c, index) => (
              <div key={c.id} className="space-y-3">
                {/* Main Comment */}
                <motion.div 
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
                    <div className="flex items-center gap-3 mt-1">
                      <button 
                        onClick={() => {
                          setReplyTo({ id: c.id, username: c.authorUsername });
                          inputRef.current?.focus();
                        }}
                        className="text-[10px] font-bold text-primary/60 hover:text-primary uppercase tracking-wider transition-colors"
                      >
                        {t('common.reply')}
                      </button>
                      
                      {comments.some(reply => reply.parentId === c.id) && (
                        <button 
                          onClick={() => toggleReplies(c.id)}
                          className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          {expandedComments.has(c.id) ? t('common.hideReplies', { defaultValue: 'Nascondi' }) : `${t('common.viewReplies', { defaultValue: 'Vedi risposte' })} (${comments.filter(r => r.parentId === c.id).length})`}
                        </button>
                      )}
                    </div>
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

                {/* Replies */}
                <AnimatePresence>
                  {expandedComments.has(c.id) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-8 space-y-3 border-l border-white/5 pl-4 pb-2">
                        {comments.filter(reply => reply.parentId === c.id).map((reply) => (
                          <motion.div 
                            key={reply.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 group py-0.5"
                          >
                            <Avatar name={reply.authorUsername} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-display font-bold text-primary/80 uppercase tracking-tight">
                                  {reply.authorUsername}
                                </span>
                                <span className="text-[8px] uppercase font-medium text-muted-foreground/40 tracking-tighter">
                                  {timeAgo(reply.createdAt, t)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/80 leading-snug">
                                {reply.content}
                              </p>
                            </div>
                            {user?.id === reply.userId && (
                              <button 
                                onClick={() => deleteComment(reply.id)} 
                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="pt-2">
        {replyTo && (
          <div className="flex items-center justify-between px-3 py-1 bg-primary/5 border-x border-t border-white/5 rounded-t-xl">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
              {t('common.replyingTo', { defaultValue: 'Rispondi a' })} @{replyTo.username}
            </span>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <form 
          onSubmit={e => { 
            e.preventDefault(); 
            if (commentText.trim()) {
              addComment({ 
                content: commentText, 
                parentId: replyTo?.id 
              });
            }
          }} 
          className={`flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 focus-within:border-primary/30 transition-colors ${replyTo ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'}`}
        >
          <div className="pl-1">
            <Avatar name={user?.username || 'U'} size="md" />
          </div>
          <input
            ref={inputRef}
            value={commentText} onChange={e => setCommentText(e.target.value)}
            placeholder={replyTo ? `${t('community.writeComment')}...` : (t('community.writeComment') || "Write a comment...")}
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
