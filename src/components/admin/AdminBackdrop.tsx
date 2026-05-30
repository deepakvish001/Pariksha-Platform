/**
 * Ambient backdrop for admin pages — premium glassmorphism layer.
 * Three animated amber/orange orbs, faint dot grid, scanline shimmer
 * and a top fade to anchor the page header. Pure presentational.
 */
export const AdminBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* Primary amber orb — top-left */}
    <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,hsl(24_95%_53%/0.22),transparent_60%)] blur-3xl animate-pulse [animation-duration:9s]" />
    {/* Secondary orange orb — bottom-right */}
    <div className="absolute -bottom-48 -right-40 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,hsl(38_92%_50%/0.18),transparent_65%)] blur-3xl animate-pulse [animation-duration:13s]" />
    {/* Tertiary deep ember — mid-right, slow drift */}
    <div className="absolute right-[15%] top-[40%] h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(18_90%_45%/0.12),transparent_70%)] blur-3xl animate-pulse [animation-duration:17s]" />

    {/* Fine dot grid */}
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    {/* Diagonal sheen */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(115deg, transparent 0%, hsl(var(--foreground) / 0.25) 50%, transparent 100%)",
        backgroundSize: "200% 200%",
      }}
    />

    {/* Top fade for hero crispness */}
    <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background/85 via-background/30 to-transparent" />
    {/* Bottom fade — anchors content */}
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/60 to-transparent" />
  </div>
);
