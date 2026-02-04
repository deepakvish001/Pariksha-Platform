import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Bot, User, Trash2, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAstraChat } from "@/hooks/useAstraChat";

const suggestedPrompts = [
  "Help me prepare for a Google interview",
  "Explain binary search with examples",
  "What are the SOLID principles?",
  "Create a study plan for DSA",
];

const AstraAI = () => {
  const [inputValue, setInputValue] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = useAstraChat();
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
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Chat
            </Button>
          )}
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
              {messages.length === 0 ? (
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
                        className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                          {message.role === "assistant" && isLoading && index === messages.length - 1 && (
                            <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
                          )}
                        </div>
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
