import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Pencil, 
  Check, 
  X, 
  Trash2, 
  Search 
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface AstraHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}

const AstraHistoryPanel = ({
  open,
  onOpenChange,
  conversations,
  currentConversationId,
  onLoadConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
}: AstraHistoryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title || "");
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleLoadConversation = (id: string) => {
    onLoadConversation(id);
    onOpenChange(false);
  };

  const filteredConversations = conversations.filter(c =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-80 bg-[#0a0a0f] border-l border-white/[0.05] p-0"
      >
        <SheetHeader className="p-6 pb-4 border-b border-white/[0.05]">
          <SheetTitle className="text-white text-lg">Chat History</SheetTitle>
        </SheetHeader>
        
        <div className="p-4">
          <Button 
            onClick={() => { onNewChat(); onOpenChange(false); }} 
            className="w-full gap-2 bg-gradient-to-br from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.05] text-white placeholder:text-white/40 focus-visible:ring-primary/30"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-220px)] px-4">
          <div className="space-y-2 pb-4">
            {conversations.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-12">
                No conversations yet
              </p>
            ) : filteredConversations.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-12">
                No matching conversations
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "group flex items-center gap-2 p-3 rounded-xl transition-all duration-200",
                    editingId === conv.id ? "" : "cursor-pointer",
                    currentConversationId === conv.id
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.05]"
                  )}
                  role={editingId === conv.id ? undefined : "button"}
                  tabIndex={editingId === conv.id ? undefined : 0}
                  onClick={() => editingId !== conv.id && handleLoadConversation(conv.id)}
                  onKeyDown={(e) => {
                    if (editingId !== conv.id && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleLoadConversation(conv.id);
                    }
                  }}
                >
                  {editingId === conv.id ? (
                    <>
                      <Input
                        ref={editInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename();
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        className="h-7 text-sm flex-1 bg-white/[0.05] border-white/[0.1] text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        aria-label="Save name"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRename();
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/[0.05]"
                        aria-label="Cancel rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRename();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="p-1.5 rounded-lg bg-white/[0.05]">
                        <MessageSquare className="h-3.5 w-3.5 text-white/60" />
                      </div>
                      <span className={cn(
                        "flex-1 text-sm truncate",
                        currentConversationId === conv.id ? "text-primary" : "text-white/70"
                      )}>
                        {conv.title || "New conversation"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white hover:bg-white/[0.05]"
                        aria-label="Rename conversation"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(conv);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        aria-label="Delete conversation"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AstraHistoryPanel;
