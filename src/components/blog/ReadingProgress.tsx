import { useEffect, useState } from "react";

interface Props {
  /** Total reading time in minutes — used to compute "X min left". */
  totalMinutes?: number;
}

export function ReadingProgress({ totalMinutes }: Props) {
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

  const minLeft =
    totalMinutes && progress < 98
      ? Math.max(1, Math.ceil(totalMinutes * (1 - progress / 100)))
      : 0;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none"
        aria-hidden
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {totalMinutes && minLeft > 0 && progress > 5 && (
        <div
          className="fixed top-2 right-3 z-50 hidden md:block rounded-full border border-border bg-card/90 backdrop-blur px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm pointer-events-none"
          aria-live="polite"
        >
          {minLeft} min left
        </div>
      )}
    </>
  );
}
