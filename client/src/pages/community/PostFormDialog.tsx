import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Post, CATEGORIES } from "./types";
import { useTranslation } from "react-i18next";

interface PostFormDialogProps {
  open: boolean;
  onClose: () => void;
  postToEdit?: Post | null;
  onSuccessCallback: (category: string) => void;
}

export function PostFormDialog({ open, onClose, postToEdit, onSuccessCallback }: PostFormDialogProps) {
  const [title, setTitle] = useState(postToEdit?.title || '');
  const [content, setContent] = useState(postToEdit?.content || '');
  const [category, setCategory] = useState(postToEdit?.category || 'general');
  const [imageUrl, setImageUrl] = useState(postToEdit?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
      setCategory(postToEdit.category);
      setImageUrl(postToEdit.imageUrl || '');
    } else {
      setTitle(''); setContent(''); setCategory('general'); setImageUrl('');
    }
  }, [postToEdit]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: object) => {
      const res = await (postToEdit
        ? apiRequest('PATCH', `/api/community/posts/${postToEdit.id}`, data)
        : apiRequest('POST', '/api/community/posts', data));
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/community/posts'] });
      if (postToEdit) {
        qc.invalidateQueries({ queryKey: ['/api/community/posts', postToEdit.id] });
      }

      toast({ title: postToEdit ? t('community.postUpdated') : t('community.postPublished') });
      if (!postToEdit) {
        setTitle(''); setContent(''); setCategory('general'); setImageUrl('');
      }
      onSuccessCallback(category);
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
          <DialogTitle className="text-xl font-display uppercase text-primary">
            {postToEdit ? t('community.editPost') : t('community.newPost')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('community.postFormDesc') || 'Fill in the details for your post.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); mutate({ title, content, category, imageUrl: imageUrl || null }); }} className="space-y-4 pt-2">
          <input
            required value={title} onChange={e => setTitle(e.target.value)}
            placeholder={t('community.postTitlePlaceholder')}
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
                {cat.emoji} {t(`community.categories.${cat.id}`)}
              </button>
            ))}
          </div>
          <textarea
            required value={content} onChange={e => setContent(e.target.value)}
            placeholder={t('community.postContentPlaceholder')}
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
              {uploading ? t('common.uploading') : t('community.addImage')}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground transition-colors">{t('common.cancel')}</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50" data-testid="button-submit-post">
              {isPending ? (postToEdit ? t('common.updating') : t('common.publishing')) : (postToEdit ? t('community.updatePost') : t('community.publishPost'))}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
