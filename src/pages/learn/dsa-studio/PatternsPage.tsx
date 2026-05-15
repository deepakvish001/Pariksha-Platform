import { Puzzle } from "lucide-react";
import CommonPatternsView from "@/components/dsa/CommonPatternsView";
import { SectionCard, StudioPageShell } from "./_shared";

export default function PatternsPage() {
  return (
    <StudioPageShell
      title="DSA Common Patterns"
      description="43 reusable DSA patterns — sliding window, two pointers, backtracking, DP and more — with curated problem sets."
      canonicalPath="/learn/dsa-studio/patterns"
    >
      <SectionCard
        icon={Puzzle}
        title="Common Patterns"
        subtitle="Master the reusable patterns that unlock 80% of interview problems."
        accent="text-emerald-400"
        badge="43 patterns"
        links={[
          { label: "Problems", to: "/learn/dsa-studio/problems" },
          { label: "Code Tricks", to: "/learn/dsa-studio/tricks" },
        ]}
      >
        <CommonPatternsView />
      </SectionCard>
    </StudioPageShell>
  );
}
