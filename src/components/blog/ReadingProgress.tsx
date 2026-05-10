import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
