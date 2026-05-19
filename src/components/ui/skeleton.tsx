import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-[hsl(var(--muted))]/40",
        // Shimmer sweep using semantic tokens so it adapts to theme
        "bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.06)_50%,transparent_100%)]",
        "bg-[length:200%_100%] bg-[hsl(var(--muted))]/40 animate-shimmer",
        "motion-reduce:animate-none motion-reduce:bg-none",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
