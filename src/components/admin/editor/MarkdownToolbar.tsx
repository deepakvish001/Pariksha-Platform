import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Table,
  Quote,
  Minus,
  Image as ImageIcon,
  Strikethrough,
  Code2,
  Sigma,
  Link2,
  Ruler,
  Info,
  Lightbulb,
  AlertTriangle,
  OctagonAlert,
  CircleCheck,
  Workflow,
  Youtube,
} from "lucide-react";
import { RefObject } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  onInsertExamples?: () => void;
  /** Open the image file picker (uploads to storage). */
  onPickImageUpload?: () => void;
  /** Insert an image by URL (prompts for URL + alt). */
  onInsertImageUrl?: () => void;
  /** Insert an image with explicit width/size (prompts for URL + width). */
  onInsertImageWithSize?: () => void;
  uploading?: boolean;
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

const insertBlock = (
  el: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  block: string,
) => {
  const start = el.selectionStart ?? value.length;
  const before = value.slice(0, start);
  const after = value.slice(start);
  const lead =
    before.endsWith("\n\n") || before === "" ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail =
    after.startsWith("\n\n") || after === "" ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const inserted = lead + block + trail;
  onChange(before + inserted + after);
  requestAnimationFrame(() => {
    el.focus();
    const pos = before.length + inserted.length;
    el.selectionStart = el.selectionEnd = pos;
  });
};

const TABLE_TEMPLATE = `| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| value | value | value |
| value | value | value |`;

export const MarkdownToolbar = ({
  textareaRef,
  value,
  onChange,
  onInsertExamples,
  onPickImageUpload,
  onInsertImageUrl,
  onInsertImageWithSize,
  uploading,
}: Props) => {
  const cmd = (fn: (el: HTMLTextAreaElement) => void) => () => {
    const el = textareaRef.current;
    if (!el) return;
    fn(el);
  };

  return (
    <div
      className="mb-2 flex flex-wrap items-center gap-1 rounded-md border bg-muted/20 p-1"
      role="toolbar"
      aria-label="Markdown formatting"
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Bold"
        title="Bold (⌘B)"
        onClick={cmd((el) => wrap(el, value, onChange, "**", "**", "bold"))}
      >
        <Bold className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Italic"
        title="Italic (⌘I)"
        onClick={cmd((el) => wrap(el, value, onChange, "*", "*", "italic"))}
      >
        <Italic className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Strikethrough"
        title="Strikethrough"
        onClick={cmd((el) => wrap(el, value, onChange, "~~", "~~", "strike"))}
      >
        <Strikethrough className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Inline code"
        title="Inline code"
        onClick={cmd((el) => wrap(el, value, onChange, "`", "`", "code"))}
      >
        <Code className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Insert code block"
        title="Code block"
        onClick={cmd((el) => insertBlock(el, value, onChange, "```text\nyour code here\n```"))}
      >
        <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Insert heading"
            title="Heading"
          >
            <Heading2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={cmd((el) => insertLine(el, value, onChange, "# "))}>
            <Heading1 className="mr-2 h-3.5 w-3.5" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={cmd((el) => insertLine(el, value, onChange, "## "))}>
            <Heading2 className="mr-2 h-3.5 w-3.5" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={cmd((el) => insertLine(el, value, onChange, "### "))}>
            <Heading3 className="mr-2 h-3.5 w-3.5" /> Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Bulleted list"
        title="Bulleted list"
        onClick={cmd((el) => insertLine(el, value, onChange, "- "))}
      >
        <List className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Numbered list"
        title="Numbered list"
        onClick={cmd((el) => insertLine(el, value, onChange, "1. "))}
      >
        <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Task list"
        title="Task list"
        onClick={cmd((el) => insertLine(el, value, onChange, "- [ ] "))}
      >
        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Quote block"
        title="Quote"
        onClick={cmd((el) => insertLine(el, value, onChange, "> "))}
      >
        <Quote className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Horizontal rule"
        title="Horizontal rule"
        onClick={cmd((el) => insertBlock(el, value, onChange, "---"))}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Insert table"
        title="Insert table"
        onClick={cmd((el) => insertBlock(el, value, onChange, TABLE_TEMPLATE))}
      >
        <Table className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Insert link"
        title="Link (⌘K)"
        onClick={cmd((el) => wrap(el, value, onChange, "[", "](https://)", "link text"))}
      >
        <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      {onPickImageUpload && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Upload image from device"
          title="Upload image (⌘⇧I)"
          onClick={onPickImageUpload}
          disabled={uploading}
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {uploading ? <span className="ml-1 text-xs" aria-live="polite">…</span> : null}
        </Button>
      )}
      {onInsertImageUrl && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Insert image by URL"
          title="Insert image by URL"
          onClick={onInsertImageUrl}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
      {onInsertImageWithSize && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Insert image with width or size"
          title="Insert image with size"
          onClick={onInsertImageWithSize}
        >
          <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label="Inline math"
        title="Inline math"
        onClick={cmd((el) => wrap(el, value, onChange, "$", "$", "x^2"))}
      >
        <Sigma className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>

      {onInsertExamples && (
        <>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Insert examples markdown"
            onClick={onInsertExamples}
          >
            <Table className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Insert examples
          </Button>
        </>
      )}
    </div>
  );
};
