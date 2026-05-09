import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAstraChat } from "@/hooks/useAstraChat";

import AstraBackground from "@/components/astra/AstraBackground";
import AstraHeader from "@/components/astra/AstraHeader";
import AstraWelcome from "@/components/astra/AstraWelcome";
import AstraMessageBubble from "@/components/astra/AstraMessageBubble";
import AstraTypingIndicator from "@/components/astra/AstraTypingIndicator";
import AstraInputArea from "@/components/astra/AstraInputArea";
import AstraHistoryPanel from "@/components/astra/AstraHistoryPanel";

const AstraAI = () => {
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
    deleteConversation,
    renameConversation
  } = useAstraChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestedPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background layer */}
      <AstraBackground />
      
      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <AstraHeader 
          onNewChat={newChat}
          onOpenHistory={() => setHistoryOpen(true)}
        />

        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Chat area */}
            <ScrollArea 
              className="flex-1 p-4 md:p-6" 
              ref={scrollRef}
            >
              {isLoadingHistory ? (
                <div className="h-[60vh] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-white/40 text-sm"></p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <AstraWelcome 
                  onSelectPrompt={handleSuggestedPrompt}
                  isLoading={isLoading}
                />
              ) : (
                <div className="space-y-6 py-4">
                  {messages.map((message, index) => (
                    <AstraMessageBubble
                      key={index}
                      message={message}
                      index={index}
                      isLoading={isLoading}
                      isLastMessage={index === messages.length - 1}
                    />
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <AstraTypingIndicator />
                  )}
                </div>
              )}
            </ScrollArea>
            
            {/* Input area */}
            <AstraInputArea 
              onSubmit={sendMessage}
              isLoading={isLoading}
            />
          </motion.div>
        </main>

        {/* History panel */}
        <AstraHistoryPanel
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onNewChat={newChat}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
        />
      </div>
    </div>
  );
};

export default AstraAI;
