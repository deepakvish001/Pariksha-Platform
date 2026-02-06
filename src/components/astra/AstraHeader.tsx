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
    <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-3xl border-b border-white/[0.05]">
      <div className="flex h-18 items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white/60 hover:text-white hover:bg-white/[0.05]" />
          <div className="flex items-center gap-4">
            {/* Logo with glow */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50" />
              <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </motion.div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Byteskill AI
                </h1>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30"
                >
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wider">AI Powered</span>
                </motion.div>
              </div>
              <p className="text-sm text-white/40">Your intelligent career companion</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onOpenHistory}
            className="gap-2 text-white/60 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05]"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNewChat} 
            className="gap-2 bg-white/[0.03] text-white/80 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]"
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
