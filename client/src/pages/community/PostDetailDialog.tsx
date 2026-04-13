import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Post, Comment } from "./types";
import { Avatar, CategoryBadge, timeAgo } from "./components";
import { CommentSection } from "./CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface PostDetailDialogProps {
  postId: number;
  onClose: () => void;
  onEdit: (post: Post) => void;
}

export function PostDetailDialog({ postId, onClose, onEdit }: PostDetailDialogProps) {
  const { data: user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: post, isLoading: postLoading, isError } = useQuery<Post>({
    queryKey: ['/api/community/posts', postId],
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['/api/community/posts', postId, 'comments'],
    enabled: !!postId,
  });

  const { mutate: toggleLike } = useMutation({
    mutationFn: () => apiRequest('POST', `/api/community/posts/${postId}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts', postId] });
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/community/posts/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      toast({ title: t('community.postDeleted') });
      onClose();
    },
  });

  if (postLoading || !post || isError) {
    if (isError) onClose();
    return (
      <Dialog open onOpenChange={o => !o && onClose()}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[680px] min-h-[400px] flex items-center justify-center">
          <DialogTitle className="sr-only">{t('common.loading')}</DialogTitle>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[680px] max-h-[90vh] overflow-y-auto p-0 border-t-2 border-t-transparent bg-gradient-to-r from-primary/40 via-primary/5 to-transparent bg-[length:100%_2px] bg-no-repeat group/dialog">
        <DialogTitle className="sr-only">{t('community.postDetails')}: {post.title}</DialogTitle>
        <DialogDescription className="sr-only">{t('community.discussionDesc')} {post.title}</DialogDescription>
        
        <div className="p-6 space-y-6">
          <DialogHeader className="pr-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={post.authorUsername} size="md" />
                <div className="flex flex-col">
                  <p className="font-display font-bold text-sm uppercase tracking-wider text-primary leading-tight">
                    {post.authorUsername}
                  </p>
                  <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-tighter">
                    {timeAgo(post.createdAt, t)}
                  </p>
                </div>
              </div>
              <CategoryBadge category={post.category} />
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <h2 className="text-2xl font-black font-display uppercase tracking-tight text-gradient leading-none">
              {post.title}
            </h2>
            
            {post.imageUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl"
              >
                <img src={post.imageUrl} className="w-full object-cover max-h-[400px]" alt={post.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </motion.div>
            )}

            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base selection:bg-primary/30 selection:text-white">
              {post.content}
            </p>

            <div className="border-b border-white/5 pt-2" />

            <div className="flex items-center gap-6 pt-1">
              <button
                onClick={() => toggleLike()}
                className={`flex items-center gap-2 text-sm font-bold transition-all ${post.likedByMe ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <motion.div
                  animate={post.likedByMe ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={`w-5 h-5 transition-transform ${post.likedByMe ? 'fill-primary' : ''}`} />
                </motion.div>
                {post.likeCount}
              </button>
              
              <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                {post.commentCount}
              </span>

              {user?.id === post.userId && (
                <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover/dialog:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => { onEdit(post); onClose(); }} 
                    className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary transition-all text-muted-foreground"
                    title={t('common.edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deletePost()} 
                    className="p-2 rounded-lg bg-white/5 hover:bg-destructive/20 hover:text-destructive transition-all text-muted-foreground"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <CommentSection post={post} comments={comments} isLoading={commentsLoading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
