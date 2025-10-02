import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const opacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 360;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none"
      style={{
        opacity: isRefreshing ? 1 : opacity,
        transform: `translateX(-50%) translateY(${isRefreshing ? 0 : Math.min(pullDistance, threshold)}px)`,
        transition: isRefreshing ? "transform 0.3s ease-out" : "none",
      }}
    >
      <div className="bg-background/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-border/40">
        <Loader2
          className={cn(
            "h-5 w-5 text-primary",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? "none" : `rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}
