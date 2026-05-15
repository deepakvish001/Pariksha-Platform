import { Wrench } from "lucide-react";
import CodeTricksView from "@/components/dsa/CodeTricksView";
import { SectionCard, StudioPageShell } from "./_shared";

export default function TricksPage() {
  return (
    <StudioPageShell
      title="DSA Code Tricks"
      description="Battle-tested code idioms and shortcuts to ship cleaner solutions during interviews."
      canonicalPath="/learn/dsa-studio/tricks"
    >
      <SectionCard
        icon={Wrench}
        title="Code Tricks"
        subtitle="One-liners, idioms and language-specific shortcuts that save precious minutes."
        accent="text-amber-400"
        links={[
          { label: "Patterns", to: "/learn/dsa-studio/patterns" },
          { label: "Edge Cases", to: "/learn/dsa-studio/edge" },
        ]}
      >
        <CodeTricksView />
      </SectionCard>
    </StudioPageShell>
  );
}
