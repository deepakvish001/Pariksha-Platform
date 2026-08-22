import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AstraInputAreaProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
}

const AstraInputArea = ({ onSubmit, isLoading }: AstraInputAreaProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue("");
    await onSubmit(message);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-white/[0.05] bg-black/40 backdrop-blur-xl p-4 md:p-6">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <motion.div 
          className="relative group"
          whileFocus={{ scale: 1.01 }}
        >
          {/* Glow effect on focus */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-orange-500/20 to-primary/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-focus-within:border-white/[0.1] transition-colors">
            <Input
              ref={inputRef}
              placeholder="Ask Parikshaa AI anything about your career..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-3"
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
        
        <p className="text-center text-white/30 text-xs mt-3">
          Parikshaa AI can make mistakes. Consider checking important information.
        </p>
      </form>
    </div>
  );
};

export default AstraInputArea;
