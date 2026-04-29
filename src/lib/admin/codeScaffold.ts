// Best-effort utilities to scaffold starter code from a reference solution.
// We don't try to be perfect — if detection fails, we return the original.
import type { LangId } from "@/data/codingProblemsData";

const TODO_BY_LANG: Record<string, string> = {
  python: "        # TODO: implement",
  cpp: "        // TODO: implement",
  java: "        // TODO: implement",
  javascript: "    // TODO: implement",
  typescript: "    // TODO: implement",
  c: "    // TODO: implement",
  go: "    // TODO: implement",
};

export const scaffoldStarterFromReference = (lang: LangId, code: string): string => {
  if (!code?.trim()) return "";
  const todo = TODO_BY_LANG[lang] ?? "    // TODO: implement";

  try {
    if (lang === "python") {
      // Replace bodies of `def` blocks with `pass`
      return code.replace(
        /(^|\n)(\s*def\s+\w+\s*\([^)]*\)\s*(?:->\s*[^\n:]+)?\s*:\s*\n)([\s\S]*?)(?=\n(?:\s*def\s|\s*class\s|[^\s])|$)/g,
        (_m, pre, sig) => `${pre}${sig}${todo.trimEnd()}\n`,
      );
    }
    if (lang === "javascript" || lang === "typescript") {
      // Replace function/method bodies with TODO
      return code.replace(
        /(\)\s*(?::\s*[^{]+)?\{)([\s\S]*?)(\n\}\s*(?=\n|$))/g,
        (_m, head, _body, tail) => `${head}\n${todo}\n${tail.replace(/^\n/, "")}`,
      );
    }
    if (lang === "java" || lang === "cpp" || lang === "c" || lang === "go") {
      return code.replace(
        /(\)\s*(?:->[^\{]+)?\{)([\s\S]*?)(\n\}\s*(?=\n|$))/g,
        (_m, head, _body, tail) => `${head}\n${todo}\n${tail.replace(/^\n/, "")}`,
      );
    }
  } catch (_) {
    /* ignore */
  }
  return code;
};
