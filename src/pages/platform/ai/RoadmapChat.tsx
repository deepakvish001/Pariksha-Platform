import { useState, useRef, useEffect } from "react";
import { Route, Send, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRoadmapChat } from "@/hooks/useRoadmapChat";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const suggestedPrompts = [
  "What skills do I need to become a full-stack developer?",
  "Create a 6-month learning roadmap for React and Node.js",
  "How should I prepare for technical interviews at FAANG companies?",
  "What's the best path to transition from frontend to backend development?",
  "Suggest projects to build for my portfolio as a junior developer",
];

const RoadmapChat = () => {
  const { user } = useAuth();
  const { messages, isLoading, isStreaming, streamingContent, sendMessage, clearHistory } = useRoadmapChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Route className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to use Roadmap Chat</h2>
          <p className="text-muted-foreground">Get personalized career and learning guidance from AI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Roadmap Chat</h1>
            <p className="text-sm text-muted-foreground">Get personalized career & learning guidance</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearHistory()} className="text-muted-foreground">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Roadmap Chat</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ask me anything about your career path, learning roadmap, or skill development goals.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Route className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <Card
                className={cn(
                  "max-w-[80%] px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </Card>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Route className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="max-w-[80%] px-4 py-3 bg-muted">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                </div>
              </Card>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingContent && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Route className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your career path, learning roadmap, or skills..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon" className="flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapChat;
