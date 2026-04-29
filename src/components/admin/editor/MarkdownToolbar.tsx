import { Button } from "@/components/ui/button";
import { Bold, Italic, Code, Link as LinkIcon, Heading2, List, Table } from "lucide-react";
import { RefObject } from "react";

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  onInsertExamples?: () => void;
}

const wrap = (
  el: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  before: string,
  after = before,
  placeholder = "",
) => {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.selectionStart = start + before.length;
    el.selectionEnd = start + before.length + selected.length;
  });
};

const insertLine = (
  el: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  prefix: string,
) => {
  const start = el.selectionStart ?? 0;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.selectionStart = el.selectionEnd = start + prefix.length;
  });
};

export const MarkdownToolbar = ({ textareaRef, value, onChange, onInsertExamples }: Props) => {
  const cmd = (fn: (el: HTMLTextAreaElement) => void) => () => {
    const el = textareaRef.current;
    if (!el) return;
    fn(el);
  };

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1">
      <Button type="button" size="sm" variant="ghost" onClick={cmd((el) => wrap(el, value, onChange, "**", "**", "bold"))}>
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={cmd((el) => wrap(el, value, onChange, "*", "*", "italic"))}>
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={cmd((el) => wrap(el, value, onChange, "`", "`", "code"))}>
        <Code className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={cmd((el) => wrap(el, value, onChange, "[", "](https://)", "link text"))}>
        <LinkIcon className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={cmd((el) => insertLine(el, value, onChange, "## "))}>
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={cmd((el) => insertLine(el, value, onChange, "- "))}>
        <List className="h-3.5 w-3.5" />
      </Button>
      {onInsertExamples && (
        <Button type="button" size="sm" variant="ghost" onClick={onInsertExamples}>
          <Table className="mr-1 h-3.5 w-3.5" /> Insert examples
        </Button>
      )}
    </div>
  );
};
