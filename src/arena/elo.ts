export function eloRank(elo: number): { name: string; color: string; min: number; next: number | null } {
  const tiers = [
    { name: "Bronze", min: 0, color: "#cd7f32" },
    { name: "Silver", min: 1100, color: "#c0c0c0" },
    { name: "Gold", min: 1300, color: "#ffd700" },
    { name: "Platinum", min: 1500, color: "#22d3ee" },
    { name: "Diamond", min: 1700, color: "#a78bfa" },
    { name: "Master", min: 1900, color: "#d946ef" },
    { name: "Grandmaster", min: 2200, color: "#ef4444" },
  ];
  let current = tiers[0];
  let next: typeof tiers[number] | null = null;
  for (let i = 0; i < tiers.length; i++) {
    if (elo >= tiers[i].min) {
      current = tiers[i];
      next = tiers[i + 1] ?? null;
    }
  }
  return { name: current.name, color: current.color, min: current.min, next: next?.min ?? null };
}

export function expectedScore(rA: number, rB: number) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}
