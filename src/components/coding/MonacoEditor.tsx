import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
type IStandaloneCodeEditor = Parameters<OnMount>[0];

interface MonacoEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string | number;
  fontSize?: number;
}

export interface MonacoEditorHandle {
  format: () => Promise<void>;
  focus: () => void;
  getValue: () => string;
  relayout: () => void;
}

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  (
    { value, onChange, language, readOnly = false, height = "100%", fontSize = 13 },
    ref,
  ) => {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const relayout = useCallback(() => {
      const ed = editorRef.current;
      const el = containerRef.current;
      if (!ed || !el) return;
      // Force monaco to use 0x0 first so it picks up the parent's actual size,
      // then snap to the real container box. This avoids the editor pinning a
      // stale width that starves adjacent grid columns.
      ed.layout({ width: 0, height: 0 });
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        ed.layout({ width: rect.width, height: rect.height });
      });
    }, []);

    const handleMount: OnMount = useCallback((ed) => {
      editorRef.current = ed;
      ed.updateOptions({
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        lineNumbers: "on",
        roundedSelection: true,
        padding: { top: 12, bottom: 12 },
      });
      // Initial layout once mounted into the live grid
      requestAnimationFrame(() => relayout());
    }, [relayout]);

    // ResizeObserver on the wrapper — covers the case where the parent grid
    // template changes (e.g. peer join → BattleRoom mounts → siblings appear).
    useEffect(() => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => relayout());
      ro.observe(el);
      const onWin = () => relayout();
      window.addEventListener("resize", onWin);
      return () => { ro.disconnect(); window.removeEventListener("resize", onWin); };
    }, [relayout]);

    useImperativeHandle(ref, () => ({
      format: async () => {
        const ed = editorRef.current;
        if (!ed) return;
        const action = ed.getAction("editor.action.formatDocument");
        if (action) await action.run();
      },
      focus: () => editorRef.current?.focus(),
      getValue: () => editorRef.current?.getValue() ?? "",
      relayout,
    }));

    return (
      <div ref={containerRef} className="w-full h-full min-w-0" data-testid="monaco-wrapper">
        <Editor
          height={height}
          width="100%"
          value={value}
          onChange={(v) => onChange(v ?? "")}
          language={language}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
          onMount={handleMount}
          options={{
            readOnly,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            fontSize,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Loading editor…
            </div>
          }
        />
      </div>
    );
  },
);

MonacoEditor.displayName = "MonacoEditor";
