import { Section } from "./dsaLevel1Types";
import { juniorTrainingSections } from "./juniorTrainingData";
import { juniorTrainingBSections } from "./juniorTrainingBData";
import { juniorTrainingC1Sections } from "./juniorTrainingC1Data";
import { juniorTrainingC2Sections } from "./juniorTrainingC2Data";
import { juniorTrainingD1Sections } from "./juniorTrainingD1Data";
import { juniorTrainingD2Sections } from "./juniorTrainingD2Data";
import { juniorTrainingD3Sections } from "./juniorTrainingD3Data";

const wrapSheet = (
  label: string,
  title: string,
  sections: Section[]
): Section => ({
  id: `acm-${label}-main`,
  title,
  subSections: sections.flatMap((s) => s.subSections),
});

export const acmIcpcSections: Section[] = [
  wrapSheet("a", "Sheet A — Beginner", juniorTrainingSections),
  wrapSheet("b", "Sheet B — Elementary", juniorTrainingBSections),
  wrapSheet("c1", "Sheet C1 — Intermediate I", juniorTrainingC1Sections),
  wrapSheet("c2", "Sheet C2 — Intermediate II", juniorTrainingC2Sections),
  wrapSheet("d1", "Sheet D1 — Advanced I", juniorTrainingD1Sections),
  wrapSheet("d2", "Sheet D2 — Advanced II", juniorTrainingD2Sections),
  wrapSheet("d3", "Sheet D3 — Advanced III", juniorTrainingD3Sections),
];

export const acmIcpcMeta = {
  id: "acm-icpc-training",
  title: "ACM-ICPC Competitive Programming Sheet",
  description: "1153 problems across 7 levels (A→D3) — Codeforces, UVA, SPOJ & more.",
  lastUpdated: "April 9, 2026",
  totalProblems: 1153,
  completed: 0,
  easy: 378,
  medium: 329,
  hard: 446,
};
