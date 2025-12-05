import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface VirtualListConfig {
  itemHeight: number;
  overscan?: number; // Number of items to render outside visible area
}

interface VirtualListReturn<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number) => void;
}

interface VirtualItem<T> {
  index: number;
  item: T;
  style: React.CSSProperties;
}

export function useVirtualList<T>(
  items: T[],
  config: VirtualListConfig
): VirtualListReturn<T> {
  const { itemHeight, overscan = 5 } = config;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Update container height on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate visible items
  const virtualItems = useMemo(() => {
    if (items.length === 0 || containerHeight === 0) {
      return [];
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems: VirtualItem<T>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: itemHeight,
          transform: `translateY(${i * itemHeight}px)`,
        },
      });
    }

    return visibleItems;
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);

  // Total height for scroll area
  const totalHeight = items.length * itemHeight;

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;

      const targetScrollTop = index * itemHeight;
      container.scrollTop = targetScrollTop;
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  };
}

// Helper hook for measuring item heights dynamically
export function useDynamicVirtualList<T>(
  items: T[],
  estimatedItemHeight: number,
  overscan: number = 5
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemHeights = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += itemHeights.current.get(i) ?? estimatedItemHeight;
      }
      return offset;
    },
    [estimatedItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += itemHeights.current.get(i) ?? estimatedItemHeight;
    }
    return height;
  }, [items.length, estimatedItemHeight]);

  const measureItem = useCallback((index: number, height: number) => {
    if (itemHeights.current.get(index) !== height) {
      itemHeights.current.set(index, height);
    }
  }, []);

  const virtualItems = useMemo(() => {
    if (items.length === 0 || containerHeight === 0) {
      return [];
    }

    // Find start index
    let startIndex = 0;
    let offset = 0;
    while (startIndex < items.length) {
      const height = itemHeights.current.get(startIndex) ?? estimatedItemHeight;
      if (offset + height >= scrollTop) break;
      offset += height;
      startIndex++;
    }

    startIndex = Math.max(0, startIndex - overscan);

    // Find end index
    let endIndex = startIndex;
    let currentOffset = getItemOffset(startIndex);
    while (endIndex < items.length && currentOffset < scrollTop + containerHeight) {
      currentOffset += itemHeights.current.get(endIndex) ?? estimatedItemHeight;
      endIndex++;
    }

    endIndex = Math.min(items.length - 1, endIndex + overscan);

    const visibleItems: VirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const itemOffset = getItemOffset(i);
      visibleItems.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${itemOffset}px)`,
        },
      });
    }

    return visibleItems;
  }, [items, scrollTop, containerHeight, estimatedItemHeight, overscan, getItemOffset]);

  return {
    virtualItems,
    totalHeight: getTotalHeight(),
    containerRef,
    measureItem,
  };
}
