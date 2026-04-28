import { useEffect, useMemo, useState } from "react";
import { Plus, X, Play, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const KEY = "byteskill:coding-custom-tests:v1";

type CustomTest = { id: string; input: string };
type StoredMap = Record<string, CustomTest[]>;

const readMap = (): StoredMap => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as StoredMap) : {};
  } catch {
    return {};
  }
};

const writeMap = (map: StoredMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

interface SampleTest {
  input: string;
  output?: string;
}

interface Props {
  slug: string;
  sampleTests: SampleTest[];
  /** Currently active stdin (kept in sync with the parent for Run). */
  stdin: string;
  onStdinChange: (v: string) => void;
  onRun: () => void;
  isRunning: boolean;
}

type TabKey = `s-${number}` | `c-${string}`;

export const TestCaseWorkbench = ({
  slug,
  sampleTests,
  stdin,
  onStdinChange,
  onRun,
  isRunning,
}: Props) => {
  const [customs, setCustoms] = useState<CustomTest[]>(() => readMap()[slug] ?? []);
  const [active, setActive] = useState<TabKey>(sampleTests.length > 0 ? "s-0" : "c-new");

  // Reload custom tests + reset active tab when slug changes.
  useEffect(() => {
    const next = readMap()[slug] ?? [];
    setCustoms(next);
    setActive(sampleTests.length > 0 ? "s-0" : next[0] ? `c-${next[0].id}` : "c-new");
  }, [slug, sampleTests.length]);

  // Persist customs.
  useEffect(() => {
    const map = readMap();
    if (customs.length === 0) delete map[slug];
    else map[slug] = customs;
    writeMap(map);
  }, [slug, customs]);

  const activeInput = useMemo(() => {
    if (active.startsWith("s-")) {
      const i = Number(active.slice(2));
      return sampleTests[i]?.input ?? "";
    }
    if (active === "c-new") return "";
    const id = active.slice(2);
    return customs.find((c) => c.id === id)?.input ?? "";
  }, [active, sampleTests, customs]);

  // When the active tab changes, push its input into shared stdin.
  useEffect(() => {
    onStdinChange(activeInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const updateActiveInput = (v: string) => {
    onStdinChange(v);
    if (active.startsWith("c-") && active !== "c-new") {
      const id = active.slice(2);
      setCustoms((prev) => prev.map((c) => (c.id === id ? { ...c, input: v } : c)));
    } else if (active === "c-new" && v.length > 0) {
      // Promote scratch tab to a real custom tab on first edit.
      const id = `${Date.now()}`;
      setCustoms((prev) => [...prev, { id, input: v }]);
      setActive(`c-${id}` as TabKey);
    }
  };

  const addCustom = () => {
    const id = `${Date.now()}`;
    setCustoms((prev) => [...prev, { id, input: "" }]);
    setActive(`c-${id}` as TabKey);
    onStdinChange("");
  };

  const removeCustom = (id: string) => {
    setCustoms((prev) => prev.filter((c) => c.id !== id));
    if (active === `c-${id}`) {
      const remaining = customs.filter((c) => c.id !== id);
      const fallback: TabKey =
        sampleTests.length > 0
          ? "s-0"
          : remaining[0]
            ? (`c-${remaining[0].id}` as TabKey)
            : "c-new";
      setActive(fallback);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2">
        {/* Tab strip */}
        <div className="flex items-center gap-1 flex-wrap">
          {sampleTests.map((_, i) => {
            const key: TabKey = `s-${i}`;
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-xs font-medium border transition-colors",
                  isActive
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Case {i + 1}
              </button>
            );
          })}
          {customs.map((c, i) => {
            const key: TabKey = `c-${c.id}` as TabKey;
            const isActive = active === key;
            return (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-md text-xs font-medium border transition-colors",
                  isActive
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <button type="button" onClick={() => setActive(key)} className="flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  Custom {i + 1}
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustom(c.id);
                      }}
                      className="h-4 w-4 inline-flex items-center justify-center rounded hover:bg-muted-foreground/20"
                      aria-label={`Remove custom test ${i + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Remove</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={addCustom}>
                <Plus className="h-3 w-3" />
                Custom
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a custom test (saved per problem)</TooltipContent>
          </Tooltip>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={onRun}
              disabled={isRunning}
              title="Run only the active test"
            >
              {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Run this
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">stdin (input passed to your program)</p>
        <Textarea
          value={stdin}
          onChange={(e) => updateActiveInput(e.target.value)}
          className="font-mono text-xs min-h-[120px] resize-none"
          placeholder="Enter your test input..."
        />

        {active.startsWith("s-") && (() => {
          const i = Number(active.slice(2));
          const expected = sampleTests[i]?.output;
          if (!expected) return null;
          return (
            <div className="text-xs">
              <p className="text-muted-foreground mb-1">Expected output</p>
              <pre className="font-mono bg-muted/50 p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                {expected}
              </pre>
            </div>
          );
        })()}
      </div>
    </TooltipProvider>
  );
};
