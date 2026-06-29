import { useEffect, useMemo, useRef, useState } from 'react';

export const DEFAULT_BATCH_SIZE = 12;

export const useInfiniteReveal = (items, batchSize = DEFAULT_BATCH_SIZE, resetKey = '') => {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, resetKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return undefined;
    }

    if (visibleCount >= items.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleCount((current) => Math.min(current + batchSize, items.length));
      },
      {
        rootMargin: '640px 0px',
        threshold: 0.05,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [batchSize, items.length, visibleCount]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  return {
    visibleItems,
    visibleCount,
    hasMore,
    sentinelRef,
  };
};
