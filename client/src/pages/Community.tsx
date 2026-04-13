import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Post, CATEGORIES } from "./community/types";
import { PostCard } from "./community/PostCard";
import { PostFormDialog } from "./community/PostFormDialog";
import { PostDetailDialog } from "./community/PostDetailDialog";
import { useTranslation } from "react-i18next";

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display uppercase tracking-wide flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            {t('community.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('community.subtitle')}</p>
        </div>
        <button
          onClick={() => setNewPostOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          data-testid="button-new-post"
        >
          <Plus className="w-4 h-4" />
          {t('community.newPost')}
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
            {cat.emoji} {t(`community.categories.${cat.id}`)}
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
