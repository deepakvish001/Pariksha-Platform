import { motion } from "framer-motion";
import { Sparkles, Plus, History } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AstraHeaderProps {
  onNewChat: () => void;
  onOpenHistory: () => void;
}

const AstraHeader = ({ onNewChat, onOpenHistory }: AstraHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-3xl border-b border-border/50">
      <div className="flex h-18 items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/50" />
          <div className="flex items-center gap-4">
            {/* Logo with glow */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                <Sparkles className="h-6 w-6 text-white relative z-10" />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  Parikshaa AI
                </h1>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30"
                >
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wider">AI Powered</span>
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground">Your intelligent career companion</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            aria-label="History"
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            aria-label="New Chat"
            className="gap-2 bg-muted/30 text-foreground/80 hover:text-foreground hover:bg-muted/50 border border-border/50"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AstraHeader;
