import { useState } from "react";
import { Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface RatingSystemProps {
  targetType: string;
  targetId: string;
  showCount?: boolean;
  className?: string;
  starClassName?: string;
  readOnly?: boolean;
}

interface RatingStats {
  average: number;
  count: number;
  userRating: number | null;
}

export function RatingSystem({ 
  targetType, 
  targetId, 
  showCount = false, 
  className,
  starClassName,
  readOnly = false
}: RatingSystemProps) {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  const queryKey = [`/api/ratings/${targetType}/${targetId}`];
  
  const { data: stats, isLoading } = useQuery<RatingStats>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/ratings/${targetType}/${targetId}`);
      if (!res.ok) throw new Error("Failed to fetch ratings");
      return res.json();
    },
  });

  const { mutate: submitRating } = useMutation({
    mutationFn: (score: number) => 
      apiRequest('POST', '/api/ratings', { targetType, targetId, score }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  if (isLoading) {
    return (
      <div className="flex gap-1 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-3 h-3 bg-white/10 rounded-sm" />
        ))}
      </div>
    );
  }

  const average = stats?.average || 0;
  const count = stats?.count || 0;
  const userRating = stats?.userRating || 0;
  
  // Use userRating for the UI if present, otherwise average
  const displayScore = hoverScore !== null ? hoverScore : (userRating || average);

  const handleRate = (score: number) => {
    if (readOnly || !user) return;
    submitRating(score);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-0.5" onMouseLeave={() => setHoverScore(null)}>
        {[1, 2, 3, 4, 5].map((i) => {
          const isFilled = i <= displayScore;
          const isUserFilled = i <= userRating;
          
          return (
            <button
              key={i}
              type="button"
              disabled={readOnly || !user}
              onClick={() => handleRate(i)}
              onMouseEnter={() => !readOnly && user && setHoverScore(i)}
              className={cn(
                "relative transition-all duration-300",
                !readOnly && user && "hover:scale-125 active:scale-95 cursor-pointer",
                readOnly || !user ? "cursor-default" : ""
              )}
            >
              <Star 
                className={cn(
                  "w-3 h-3 transition-all duration-300",
                  starClassName,
                  isFilled 
                    ? "text-yellow-500 fill-yellow-500" 
                    : "text-white/20 fill-transparent",
                  isUserFilled && "text-primary fill-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                )} 
              />
              {/* Glow effect for filled stars */}
              {isFilled && (
                <div className={cn(
                  "absolute inset-0 blur-[4px] opacity-40 rounded-full",
                  isUserFilled ? "bg-primary" : "bg-yellow-500"
                )} />
              )}
            </button>
          );
        })}
      </div>
      
      {showCount && count > 0 && (
        <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground/60 tracking-wider">
          {average.toFixed(1)} <span className="opacity-40 italic ml-1">({count})</span>
        </span>
      )}
    </div>
  );
}
