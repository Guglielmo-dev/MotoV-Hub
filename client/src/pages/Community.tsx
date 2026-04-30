import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Post, CATEGORIES } from "./community/types";
import { PostCard } from "./community/PostCard";
import { PostFormDialog } from "./community/PostFormDialog";
import { PostDetailDialog } from "./community/PostDetailDialog";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/layout/SEO";

export function Community() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { t } = useTranslation();

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/community/posts'],
  });

  const filtered = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-8">
      <SEO 
        title={t('community.title')}
        description="Unisciti alla community di MotoVault. Condividi foto, consigli tecnici e itinerari con altri motociclisti appassionati."
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {t('community.title')}
          </h1>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-md">{t('community.subtitle')}</p>
        </div>
        <button
          onClick={() => setNewPostOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/10 active:scale-95"
          data-testid="button-new-post"
        >
          <Plus className="w-5 h-5" />
          {t('community.newPost')}
        </button>
      </div>

      <div className="-mx-6 px-6 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border leading-none
                ${activeCategory === cat.id
                  ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20'
                  : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 bg-card/50 backdrop-blur-sm'}`}
            >
              <span className="text-sm transform translate-y-[0.5px] flex-shrink-0">{cat.emoji}</span>
              <span className="leading-none">{t(`community.categories.${cat.id}`)}</span>
            </button>
          ))}
        </div>
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
          <p className="text-muted-foreground">{t('community.noPost')}</p>
          <button onClick={() => setNewPostOpen(true)} className="px-6 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium">
            {t('community.beFirst') || 'Be the first to post!'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
              onEdit={() => setPostToEdit(post)}
            />
          ))}
        </div>
      )}

      <PostFormDialog
        open={newPostOpen || !!postToEdit}
        onClose={() => { setNewPostOpen(false); setPostToEdit(null); }}
        postToEdit={postToEdit}
        onSuccessCallback={(category) => setActiveCategory(category)}
      />
      {selectedPost && <PostDetailDialog postId={selectedPost.id} onClose={() => setSelectedPost(null)} onEdit={() => setPostToEdit(selectedPost)} />}
    </div>
  );
}

export default Community;
