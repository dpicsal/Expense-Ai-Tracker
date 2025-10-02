import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const container = document.querySelector("main");
    if (!container) return;

    let touchStartY = 0;
    let touchMoveY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      touchMoveY = e.touches[0].clientY;
      currentY.current = touchMoveY;

      const distance = (touchMoveY - touchStartY) / resistance;

      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;

      isPulling = false;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, resistance, onRefresh, isRefreshing, pullDistance]);

  return {
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0,
  };
}
