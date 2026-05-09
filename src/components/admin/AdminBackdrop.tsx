/**
 * Ambient backdrop for admin pages — animated amber orbs + subtle grid.
 * Pure presentational; sits behind page content with pointer-events-none.
 */
export const AdminBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* Radial amber glow top-left */}
    <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,hsl(24_95%_53%/0.18),transparent_60%)] blur-3xl animate-pulse [animation-duration:8s]" />
    {/* Radial amber glow bottom-right */}
    <div className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,hsl(38_92%_50%/0.14),transparent_65%)] blur-3xl animate-pulse [animation-duration:11s]" />
    {/* Subtle dot grid */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    />
    {/* Top fade for crisper hero */}
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/80 to-transparent" />
  </div>
);
