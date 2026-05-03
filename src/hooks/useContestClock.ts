import { useEffect, useState } from "react";

export type ContestPhase = "upcoming" | "registration" | "live" | "ended";

export interface ContestClock {
  phase: ContestPhase;
  msUntilStart: number;
  msUntilEnd: number;
  label: string;
}

const fmt = (ms: number) => {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export const useContestClock = (startsAt?: string, endsAt?: string): ContestClock => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const s = startsAt ? new Date(startsAt).getTime() : 0;
  const e = endsAt ? new Date(endsAt).getTime() : 0;
  const msUntilStart = s - now;
  const msUntilEnd = e - now;

  let phase: ContestPhase = "upcoming";
  let label = "";
  if (now < s) {
    phase = "upcoming";
    label = `Starts in ${fmt(msUntilStart)}`;
  } else if (now >= s && now <= e) {
    phase = "live";
    label = `Ends in ${fmt(msUntilEnd)}`;
  } else {
    phase = "ended";
    label = "Ended";
  }
  return { phase, msUntilStart, msUntilEnd, label };
};
