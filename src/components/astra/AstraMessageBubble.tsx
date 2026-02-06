import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AstraMessageBubbleProps {
  message: Message;
  index: number;
  isLoading: boolean;
  isLastMessage: boolean;
}

const AstraMessageBubble = ({ message, index, isLoading, isLastMessage }: AstraMessageBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        delay: index * 0.05 
      }}
      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "")}
    >
      {/* Assistant avatar */}
      {message.role === "assistant" && (
        <div className="relative shrink-0 mt-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-500 rounded-full blur-md opacity-40" />
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 border border-white/[0.1] flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "rounded-2xl px-5 py-4 max-w-[85%]",
          message.role === "user"
            ? "bg-gradient-to-br from-primary via-primary to-orange-500 text-white shadow-lg shadow-primary/20"
            : "bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm"
        )}
      >
        {message.role === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:text-white/80 prose-headings:text-white prose-strong:text-white prose-code:text-primary/90">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => <>{children}</>,
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");
                  
                  if (match) {
                    return (
                      <CodeBlock language={match[1]}>
                        {codeString}
                      </CodeBlock>
                    );
                  }
                  
                  return (
                    <code className="bg-white/[0.08] px-1.5 py-0.5 rounded text-sm text-primary" {...props}>
                      {children}
                    </code>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-2 space-y-1 text-white/80">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside my-2 space-y-1 text-white/80">{children}</ol>
                ),
                p: ({ children }) => (
                  <p className="my-2 leading-relaxed text-white/80">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mt-4 mb-2 text-white">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mt-3 mb-2 text-white">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1 text-white">{children}</h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                a: ({ children, href }) => (
                  <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isLoading && isLastMessage && (
              <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1 rounded-sm" />
            )}
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        )}
      </div>

      {/* User avatar */}
      {message.role === "user" && (
        <div className="relative shrink-0 mt-1">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AstraMessageBubble;
