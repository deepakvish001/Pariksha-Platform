import type { Database } from "@/integrations/supabase/types";
import {
  Briefcase,
  GraduationCap,
  Gauge,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type AssessmentType = Database["public"]["Enums"]["assessment_type"];
export type ParticipationMode = Database["public"]["Enums"]["participation_mode"];
export type ProctoringLevel = Database["public"]["Enums"]["proctoring_level"];

export type SectionPreset = { title: string; description?: string };

export type AssessmentTemplate = {
  type: AssessmentType;
  label: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind text color class for badges
  badgeClass: string; // full badge class (bg + text + border)
  defaultDurationMin: number;
  defaultParticipation: ParticipationMode;
  defaultProctoring: ProctoringLevel;
  defaultShowResults: boolean;
  sections: SectionPreset[];
  recommendedFor: string[];
};

export const ASSESSMENT_TEMPLATES: Record<AssessmentType, AssessmentTemplate> = {
  placement_mock: {
    type: "placement_mock",
    label: "Placement Mock",
    tagline: "Company-pattern + coding",
    description:
      "Simulate a real campus placement round — aptitude, CS core MCQs and coding problems with proctoring and ranking.",
    icon: Briefcase,
    accent: "text-amber-300",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    defaultDurationMin: 120,
    defaultParticipation: "invite",
    defaultProctoring: "standard",
    defaultShowResults: false,
    sections: [
      { title: "Quantitative Aptitude", description: "Numerical & quantitative reasoning" },
      { title: "Logical Reasoning", description: "Patterns, puzzles, deduction" },
      { title: "Verbal Ability", description: "Comprehension, grammar, vocabulary" },
      { title: "CS Fundamentals", description: "OS, DBMS, Networks, OOPs" },
      { title: "Coding", description: "1–4 DSA problems with auto-grading" },
    ],
    recommendedFor: ["TPOs", "Placement Cells", "Pre-placement training"],
  },
  academic: {
    type: "academic",
    label: "Academic Test",
    tagline: "Unit, mid-sem & end-sem",
    description:
      "Faculty-driven topic-wise tests for classroom assessment. One section per chapter, light proctoring, instant feedback.",
    icon: GraduationCap,
    accent: "text-sky-300",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    defaultDurationMin: 60,
    defaultParticipation: "roster",
    defaultProctoring: "light",
    defaultShowResults: true,
    sections: [
      { title: "Chapter 1", description: "Add questions from this chapter" },
    ],
    recommendedFor: ["Faculty", "Class teachers", "Course coordinators"],
  },
  benchmark: {
    type: "benchmark",
    label: "Skill Benchmark",
    tagline: "Diagnostic across DSA, Aptitude & CS",
    description:
      "Find weak areas across a batch. Curated diagnostic pool, instant strengths/weaknesses report, batch-level heatmap.",
    icon: Gauge,
    accent: "text-emerald-300",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    defaultDurationMin: 45,
    defaultParticipation: "open_org",
    defaultProctoring: "light",
    defaultShowResults: true,
    sections: [
      { title: "Data Structures & Algorithms" },
      { title: "Quantitative Aptitude" },
      { title: "CS Fundamentals" },
    ],
    recommendedFor: ["TPOs", "Heads of Department", "Training partners"],
  },
  contest: {
    type: "contest",
    label: "Coding Contest",
    tagline: "Live leaderboard, coding only",
    description:
      "Time-boxed coding contest with a live leaderboard. 2–6 problems, partial credit, plagiarism flags.",
    icon: Trophy,
    accent: "text-fuchsia-300",
    badgeClass: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
    defaultDurationMin: 90,
    defaultParticipation: "open_org",
    defaultProctoring: "light",
    defaultShowResults: true,
    sections: [
      { title: "Coding Problems", description: "Add 2–6 problems of mixed difficulty" },
    ],
    recommendedFor: ["Coding clubs", "Inter-department events", "Hackathons"],
  },
};

export const ASSESSMENT_TYPES: AssessmentType[] = [
  "placement_mock",
  "academic",
  "benchmark",
  "contest",
];

export function getTemplate(type: AssessmentType | null | undefined): AssessmentTemplate {
  return ASSESSMENT_TEMPLATES[type ?? "placement_mock"];
}

export const PARTICIPATION_LABELS: Record<ParticipationMode, { label: string; helper: string }> = {
  invite: { label: "Invite link", helper: "Share a tokenized link or 6-digit code" },
  roster: { label: "Roster (CSV)", helper: "Only pre-uploaded students can join" },
  open_org: { label: "Open within org", helper: "Any verified member can self-enroll" },
};

export const PROCTORING_LABELS: Record<ProctoringLevel, { label: string; helper: string }> = {
  off: { label: "Off", helper: "No monitoring" },
  light: { label: "Light", helper: "Tab-switch + fullscreen + copy-paste" },
  standard: { label: "Standard", helper: "Webcam snapshots + screen + AI flags" },
  strict: { label: "Strict", helper: "+ side-camera, ID photo, live monitor" },
};
