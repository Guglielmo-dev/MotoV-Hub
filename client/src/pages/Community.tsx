import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Post, CATEGORIES } from "./community/types";
import { PostCard } from "./community/PostCard";
import { PostFormDialog } from "./community/PostFormDialog";
import { PostDetailDialog } from "./community/PostDetailDialog";

export function Community() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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
      {selectedPost && <PostDetailDialog post={selectedPost} onClose={() => setSelectedPost(null)} onEdit={() => setPostToEdit(selectedPost)} />}
    </div>
  );
}

export default Community;
