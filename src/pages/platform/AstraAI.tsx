import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Loader2, 
  Plus, 
  History, 
  ChevronLeft,
  MessageSquare
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAstraChat } from "@/hooks/useAstraChat";
import { cn } from "@/lib/utils";

const suggestedPrompts = [
  "Help me prepare for a Google interview",
  "Explain binary search with examples",
  "What are the SOLID principles?",
  "Create a study plan for DSA",
];

const AstraAI = () => {
  const [inputValue, setInputValue] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const { 
    messages, 
    conversations,
    currentConversationId,
    isLoading, 
    isLoadingHistory,
    sendMessage, 
    loadConversation,
    newChat,
    deleteConversation 
  } = useAstraChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleSuggestedPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    setHistoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Astra AI</h1>
                <p className="text-sm text-muted-foreground">Your AI career assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Chat History</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Button 
                    onClick={() => { newChat(); setHistoryOpen(false); }} 
                    className="w-full gap-2 mb-4"
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-2">
                      {conversations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No conversations yet
                        </p>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={cn(
                              "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                              currentConversationId === conv.id 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted"
                            )}
                            onClick={() => handleLoadConversation(conv.id)}
                          >
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span className="flex-1 text-sm truncate">
                              {conv.title || "New conversation"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" onClick={newChat} className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <Card className="flex-1 flex flex-col min-h-[500px]">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Welcome to Astra AI</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    I'm your personal career assistant. Ask me about interview prep, DSA problems, 
                    system design, or career guidance.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        className="text-left h-auto py-3 px-4 justify-start"
                        onClick={() => handleSuggestedPrompt(prompt)}
                        disabled={isLoading}
                      >
                        <span className="text-sm">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 max-w-[85%]",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                pre: ({ children }) => (
                                  <pre className="bg-background/50 rounded-lg p-3 overflow-x-auto my-2">
                                    {children}
                                  </pre>
                                ),
                                code: ({ className, children, ...props }) => {
                                  const isInline = !className;
                                  return isInline ? (
                                    <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
                                ),
                                p: ({ children }) => (
                                  <p className="my-2 leading-relaxed">{children}</p>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold">{children}</strong>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {isLoading && index === messages.length - 1 && (
                              <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
                            )}
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-2xl px-4 py-3 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            <CardContent className="border-t pt-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask Astra anything about your career..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AstraAI;
