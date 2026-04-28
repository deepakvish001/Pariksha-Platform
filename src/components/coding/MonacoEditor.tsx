import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
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
}

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  (
    { value, onChange, language, readOnly = false, height = "100%", fontSize = 13 },
    ref,
  ) => {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);

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
    }, []);

    useImperativeHandle(ref, () => ({
      format: async () => {
        const ed = editorRef.current;
        if (!ed) return;
        const action = ed.getAction("editor.action.formatDocument");
        if (action) await action.run();
      },
      focus: () => editorRef.current?.focus(),
    }));

    return (
      <Editor
        height={height}
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
    );
  },
);

MonacoEditor.displayName = "MonacoEditor";
