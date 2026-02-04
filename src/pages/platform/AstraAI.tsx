import { motion } from "framer-motion";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const sampleMessages = [
  { role: "assistant", content: "Hello! I'm Astra AI, your personal career assistant. How can I help you today?" },
  { role: "user", content: "Can you help me prepare for a Google interview?" },
  { role: "assistant", content: "Absolutely! I can help you prepare for a Google interview. Here's what I recommend:\n\n1. **DSA Practice**: Focus on arrays, trees, graphs, and dynamic programming\n2. **System Design**: Review distributed systems concepts\n3. **Behavioral**: Prepare STAR method stories\n\nWould you like me to create a personalized study plan?" },
];

const AstraAI = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
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
      </header>

      <main className="flex-1 flex flex-col p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          <Card className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {sampleMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            <CardContent className="border-t pt-4">
              <div className="flex gap-2">
                <Input placeholder="Ask Astra anything about your career..." className="flex-1" />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AstraAI;
