import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, useUpdateProfile, useUpdateAvatar } from "@/hooks/use-auth";
import { Camera, Loader2, User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_AVATARS = [
  { id: 'rider', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=200&auto=format&fit=crop', label: 'Rider Neon' },
  { id: 'helmet', url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=200&auto=format&fit=crop', label: 'Helmet Pro' },
  { id: 'engine', url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=200&auto=format&fit=crop', label: 'Engine' },
];

export function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const { t } = useTranslation();
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const updatePrefs = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateAvatar.mutate(file);
    }
  };

  const handleDefaultAvatarSelect = (url: string) => {
    updatePrefs.mutate({ username, email, avatarUrl: url } as any);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ username, email }, {
      onSuccess: () => onClose()
    });
  };

  const initials = user?.username?.substring(0, 2).toUpperCase() || "??";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 bg-[#0a0a0a]/95 backdrop-blur-3xl border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header Premium con Gradiente */}
        <div className="relative h-32 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-6 left-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-xl font-black tracking-tighter uppercase text-white">
                  {t('profile.title')}
                </DialogTitle>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 -mt-12 relative z-10">
          {/* Sezione Avatar */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-90 group-hover:scale-100 transition-transform" />
              <div
                className="relative group cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Avatar className="w-28 h-28 border-4 border-[#0a0a0a] ring-2 ring-white/10 transition-all group-hover:ring-primary/50 group-hover:scale-105">
                  <AvatarImage
                    key={user?.avatarUrl}
                    src={user?.avatarUrl || undefined}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 text-primary text-3xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Overlay Hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white">Upload</span>
                  </div>
                </div>

                {/* Loading State */}
                {updateAvatar.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
                {t('profile.defaultAvatars')}
              </span>
              <div className="flex gap-4 p-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
                {DEFAULT_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleDefaultAvatarSelect(av.url)}
                    className={cn(
                      "w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95",
                      user?.avatarUrl === av.url
                        ? "border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] scale-105"
                        : "border-transparent opacity-40 hover:opacity-100"
                    )}
                    title={av.label}
                  >
                    <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sezione Dati */}
          <div className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-[10px] font-black text-primary/70 uppercase tracking-widest pl-1">
                {t('profile.username')}
              </Label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus:border-primary/40 focus:ring-primary/20 h-11 text-sm font-medium transition-all"
                  placeholder={t('auth.usernamePlaceholder')}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[10px] font-black text-primary/70 uppercase tracking-widest pl-1">
                {t('profile.email')}
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus:border-primary/40 focus:ring-primary/20 h-11 text-sm font-medium transition-all"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary/60 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {t('profile.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-10">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-white transition-colors"
            >
              {t('profile.cancel')}
            </button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-8 h-12 bg-primary text-black font-black uppercase tracking-widest hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              {updateProfile.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t('profile.saveChanges')}
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
