import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/CodeBlock";
import { cn } from "@/lib/utils";

interface AnswerPanelProps {
  answer?: string;
  className?: string;
}

const AnswerPanel = ({ answer, className }: AnswerPanelProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!answer) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("overflow-hidden", className)}
      >
        <div className="mx-4 my-3 p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
          <p className="text-sm text-muted-foreground italic">
            No answer available yet
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("overflow-hidden", className)}
    >
      <div className="mx-4 my-3 p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Answer</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match;
                
                if (isInline) {
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock language={match[1]}>
                    {String(children).replace(/\n$/, "")}
                  </CodeBlock>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>;
              },
              ul({ children }) {
                return <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>;
              },
              li({ children }) {
                return <li className="text-sm">{children}</li>;
              },
              strong({ children }) {
                return <strong className="font-semibold text-foreground">{children}</strong>;
              },
              h1({ children }) {
                return <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {answer}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};

export default AnswerPanel;
