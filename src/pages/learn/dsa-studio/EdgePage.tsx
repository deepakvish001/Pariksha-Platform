import { AlertTriangle, ListChecks, Hash, Type, Layers, GitBranch } from "lucide-react";
import { SectionCard, StudioPageShell } from "./_shared";

const EDGE_LESSONS = [
  {
    icon: Hash,
    title: "Arrays & Numbers",
    accent: "text-sky-400",
    cases: [
      "Empty array → return early or default value",
      "Single element → loops with i+1 must be guarded",
      "Integer overflow → use long / BigInt for products and sums",
      "Negative numbers → abs(), modulo and bit ops behave differently",
      "Duplicates → set vs list semantics; stable sort matters",
    ],
  },
  {
    icon: Type,
    title: "Strings",
    accent: "text-emerald-400",
    cases: [
      "Empty string and single-char inputs",
      "Unicode / multi-byte characters — length ≠ byte length",
      "Case sensitivity and whitespace trimming",
      "Palindrome with odd vs even length",
      "All-same characters and all-distinct characters",
    ],
  },
  {
    icon: Layers,
    title: "Linked Lists & Stacks",
    accent: "text-violet-400",
    cases: [
      "Empty list (head = null)",
      "Single node — prev/next pointers undefined",
      "Cycle detection — Floyd's tortoise & hare",
      "Two-pointer off-by-one when finding middle",
      "Stack underflow on pop / peek",
    ],
  },
  {
    icon: GitBranch,
    title: "Trees & Graphs",
    accent: "text-amber-400",
    cases: [
      "Empty tree (root = null)",
      "Skewed tree → recursion depth / stack overflow",
      "Disconnected graph components",
      "Self-loops and parallel edges",
      "Negative weights → Dijkstra fails, use Bellman-Ford",
    ],
  },
  {
    icon: ListChecks,
    title: "Search, Sort & DP",
    accent: "text-rose-400",
    cases: [
      "Binary search: lo ≤ hi vs lo < hi termination",
      "Mid overflow: use lo + (hi - lo) / 2",
      "Sort stability when comparator returns 0",
      "DP base cases for n = 0 and n = 1",
      "Memo keys must be hashable & unique",
    ],
  },
];

export default function EdgePage() {
  return (
    <StudioPageShell
      title="DSA Edge Cases"
      description="A curated checklist of tricky inputs and boundary conditions interviewers love to test."
      canonicalPath="/learn/dsa-studio/edge"
    >
      <SectionCard
        icon={AlertTriangle}
        title="Edge Cases Checklist"
        subtitle="Run through these before you submit. Most rejections happen on these inputs, not the happy path."
        accent="text-orange-400"
        links={[
          { label: "Patterns", to: "/learn/dsa-studio/patterns" },
          { label: "Code Tricks", to: "/learn/dsa-studio/tricks" },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {EDGE_LESSONS.map((l) => {
            const Icon = l.icon;
            return (
              <article
                key={l.title}
                className="rounded-xl border border-border/40 bg-card/30 p-4 hover:border-border/70 transition"
              >
                <header className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 ${l.accent}`} />
                  <h3 className="font-semibold text-sm">{l.title}</h3>
                </header>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {l.cases.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-current shrink-0 opacity-60" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </StudioPageShell>
  );
}
