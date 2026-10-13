import { useEffect, useRef } from "react";

// Attach the returned ref to an element at the bottom of a list.
// When it scrolls into view, `onReach` loads the next page.
export function useInfiniteScroll(onReach, enabled) {
  const sentinel = useRef(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!enabled || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onReach(),
      { rootMargin: "200px" }, // begin loading a little before the user reaches the end
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, onReach]);
  return sentinel;
}
