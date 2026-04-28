import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

interface MonacoEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string | number;
  fontSize?: number;
}

export const MonacoEditor = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = "100%",
  fontSize = 13,
}: MonacoEditorProps) => {
  const { resolvedTheme } = useTheme();

  const handleMount: OnMount = useCallback((editor) => {
    editor.updateOptions({
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
};
